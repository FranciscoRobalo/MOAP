import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/admin/analise/:id/ai-review
 *
 *   Generates an admin-facing review draft for the target analysis, using:
 *     - the full budget snapshot (items + variances vs. market reference)
 *     - the platform's live materials database as a second opinion
 *
 *   Returns a structured JSON object with suggested admin_summary,
 *   admin_feedback, key findings and per-line revisions. The admin can
 *   then edit those fields before approving — this endpoint never mutates
 *   the submission status by itself, it just caches the AI draft in
 *   admin_ai_notes for later review.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: row, error } = await supabase
    .from("analise_saved")
    .select(
      "id, user_id, file_name, region, total_budget, total_reference, overall_variance, overall_rating, quality_score, stats, category_breakdown, recommendations, items",
    )
    .eq("id", id)
    .neq("submission_status", "draft")
    .maybeSingle()
  if (error || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY não configurada no projeto." },
      { status: 500 },
    )
  }

  type SnapshotItem = {
    id: string
    originalName: string
    matchedName?: string | null
    unit?: string
    quantity: number
    budgetPrice: number
    referenceMinPrice?: number | null
    referenceMaxPrice?: number | null
    referenceAvgPrice?: number | null
    variance?: number | null
    rating?: string
    category?: string
    matchConfidence?: number
    type?: string
  }

  const items = (row.items as SnapshotItem[]) ?? []
  // Focus the model on the items that matter: critical, above market, or unmatched.
  const flagged = items.filter(
    (it) => it.rating === "critical" || it.rating === "above" || it.rating === "unknown",
  )
  const priorityItems = flagged.slice(0, 40)

  // Pull a relevant slice of the materials DB so the model can cross-reference.
  const itemNames = priorityItems.map((i) => i.originalName).filter(Boolean)
  let marketReference: Array<{
    name: string
    unit: string | null
    price_min: number | null
    price_max: number | null
    category: string | null
  }> = []
  if (itemNames.length > 0) {
    const { data: mats } = await supabase
      .from("materials")
      .select("name, unit, price_min, price_max, category")
      .limit(400)
    marketReference = mats ?? []
  }

  const systemPrompt = [
    "És o revisor sénior de orçamentos da MOAP, uma plataforma portuguesa de análise de preços de construção.",
    "Escreves sempre em Português de Portugal (PT-PT) num tom profissional, direto e claro.",
    "O teu papel é preparar o feedback que o administrador enviará ao cliente após rever o orçamento.",
    "Usas os dados do orçamento e a base de dados de materiais da plataforma como referência.",
    "Nunca inventas números — se não tens referência, dizes explicitamente.",
    'Devolves SEMPRE um único objeto JSON válido, sem prefácios, sem "```json", só JSON.',
  ].join(" ")

  const schema = `
{
  "summary": "string (3-6 frases, visão executiva para o cliente)",
  "feedback": "string em Markdown com 4 secções: ## Resumo, ## Pontos fortes, ## Riscos e itens a rever, ## Próximos passos",
  "keyFindings": ["string (4-8 bullets objetivos, com números)"],
  "suggestedRevisions": [
    { "id": "string (item id)", "unitPrice": number, "note": "string (razão)" }
  ],
  "recommendedAction": "approve" | "request_changes" | "reject"
}`.trim()

  const userPrompt = [
    `Analisa este orçamento e prepara o feedback detalhado para o cliente.`,
    ``,
    `Ficheiro: ${row.file_name}`,
    `Região: ${row.region ?? "—"}`,
    `Total orçamentado: €${Number(row.total_budget ?? 0).toFixed(2)}`,
    `Total referência: €${Number(row.total_reference ?? 0).toFixed(2)}`,
    `Variação global: ${row.overall_variance != null ? `${(row.overall_variance as number).toFixed(1)}%` : "—"}`,
    `Classificação: ${row.overall_rating ?? "—"}`,
    `Quality Score: ${row.quality_score ?? "—"} / 100`,
    ``,
    `Estatísticas:`,
    JSON.stringify(row.stats ?? {}, null, 2),
    ``,
    `Breakdown por categoria:`,
    JSON.stringify(row.category_breakdown ?? [], null, 2),
    ``,
    `Itens prioritários para revisão (críticos / acima da média / sem match):`,
    JSON.stringify(
      priorityItems.map((it) => ({
        id: it.id,
        name: it.originalName,
        unit: it.unit,
        qty: it.quantity,
        budgetPrice: it.budgetPrice,
        referenceAvg: it.referenceAvgPrice,
        variance: it.variance,
        rating: it.rating,
        category: it.category,
      })),
      null,
      2,
    ),
    ``,
    `Base de dados de materiais da plataforma (referência adicional):`,
    JSON.stringify(marketReference.slice(0, 120), null, 2),
    ``,
    `Devolve a tua análise estritamente neste schema JSON:`,
    schema,
  ].join("\n")

  const openai = new OpenAI({ apiKey })

  let text: string | null = null
  let modelUsed = "gpt-4o-mini"
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    })
    text = response.choices[0]?.message?.content ?? null
  } catch (err) {
    // Fallback to a smaller model if mini isn't available
    try {
      modelUsed = "gpt-3.5-turbo"
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      })
      text = response.choices[0]?.message?.content ?? null
    } catch (err2) {
      const message = err2 instanceof Error ? err2.message : "Unknown AI error"
      console.log("[v0] admin ai-review error:", message)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  if (!text) {
    return NextResponse.json({ error: "Resposta vazia do modelo." }, { status: 500 })
  }

  // Defensive JSON parse — some models wrap in ``` despite response_format
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleaned)
  } catch (err) {
    console.log("[v0] admin ai-review parse error:", err)
    return NextResponse.json(
      { error: "Resposta do modelo não era JSON válido.", raw: cleaned.slice(0, 500) },
      { status: 500 },
    )
  }

  // Compute the revised total based on suggestedRevisions (so the admin
  // sees the projected impact without doing the math by hand).
  const suggestedRevisions = Array.isArray(parsed.suggestedRevisions)
    ? (parsed.suggestedRevisions as Array<{ id?: string; unitPrice?: number; note?: string }>)
    : []
  const revisionMap = new Map<string, number>()
  for (const r of suggestedRevisions) {
    if (r?.id && typeof r.unitPrice === "number") revisionMap.set(String(r.id), r.unitPrice)
  }
  let revisedTotal = 0
  for (const it of items) {
    const unit = revisionMap.get(String(it.id)) ?? it.budgetPrice
    revisedTotal += unit * (it.quantity ?? 0)
  }

  const aiNotes = {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    feedback: typeof parsed.feedback === "string" ? parsed.feedback : "",
    keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
    suggestedRevisions,
    recommendedAction:
      typeof parsed.recommendedAction === "string" ? parsed.recommendedAction : "request_changes",
    revisedTotal,
    modelUsed,
    generatedAt: new Date().toISOString(),
  }

  // Cache the draft on the row. The admin can still tweak every field
  // before approving — this is purely a starting point.
  await supabase
    .from("analise_saved")
    .update({
      admin_ai_notes: aiNotes,
      admin_summary: aiNotes.summary,
      admin_feedback: aiNotes.feedback,
      admin_revised_items: suggestedRevisions,
      admin_revised_total: revisedTotal,
    })
    .eq("id", id)

  await supabase
    .from("analise_admin_events")
    .insert({
      analysis_id: id,
      owner_id: row.user_id,
      actor_id: user.id,
      action: "ai_review_generated",
      note: `Draft IA gerado (${modelUsed})`,
      metadata: { model: modelUsed, revisionCount: suggestedRevisions.length },
    })
    .then(({ error: evErr }) => {
      if (evErr) console.log("[v0] admin ai audit insert error:", evErr.message)
    })

  return NextResponse.json({ ok: true, aiNotes })
}
