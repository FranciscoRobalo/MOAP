import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/analise/negotiation
 *   body: {
 *     analysisId?: string           // if present + itemId, result is cached
 *     itemId?: string
 *     item: {
 *       name: string; unit?: string; quantity?: number;
 *       unitPrice: number; total?: number;
 *       referencePrice?: number; variance?: number;
 *       rating?: string; category?: string;
 *     }
 *     supplierName?: string
 *     region?: string
 *   }
 *   -> { script: string }
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.item?.name) {
    return NextResponse.json({ error: "Missing item payload" }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY não configurada." },
      { status: 500 },
    )
  }

  const { item, analysisId, itemId, supplierName, region } = body

  const variancePct =
    typeof item.variance === "number"
      ? item.variance
      : typeof item.referencePrice === "number" && item.referencePrice > 0
        ? ((item.unitPrice - item.referencePrice) / item.referencePrice) * 100
        : null

  const systemPrompt = [
    "És um consultor sénior de construção civil em Portugal.",
    "Escreves sempre em Português de Portugal (PT-PT), tom profissional e direto.",
    "O teu objetivo é dar scripts curtos e práticos que o gestor de obra possa enviar ao fornecedor por email ou WhatsApp.",
    "Baseias os argumentos nos dados fornecidos — nunca inventas números.",
  ].join(" ")

  const userPrompt = [
    `Preciso de um script de negociação curto para um item de orçamento que parece sobrevalorizado.`,
    ``,
    `Detalhes do item:`,
    `- Descrição: ${item.name}`,
    item.category ? `- Categoria: ${item.category}` : null,
    item.unit ? `- Unidade: ${item.unit}` : null,
    typeof item.quantity === "number" ? `- Quantidade: ${item.quantity}` : null,
    `- Preço unitário proposto: €${Number(item.unitPrice).toFixed(2)}`,
    typeof item.referencePrice === "number"
      ? `- Preço de referência de mercado: €${Number(item.referencePrice).toFixed(2)}`
      : null,
    typeof variancePct === "number"
      ? `- Variação vs. referência: ${variancePct > 0 ? "+" : ""}${variancePct.toFixed(1)}%`
      : null,
    item.rating ? `- Classificação: ${item.rating}` : null,
    supplierName ? `- Fornecedor: ${supplierName}` : null,
    region ? `- Região: ${region}` : null,
    ``,
    `Redige a resposta com exatamente esta estrutura, usando estes títulos em negrito:`,
    `**Abertura** — uma frase cordial para abrir a conversa.`,
    `**Argumentos** — 2 a 3 bullets com argumentos objetivos baseados nos dados acima.`,
    `**Pedido** — pedido concreto de revisão de preço com um valor-alvo razoável.`,
    `**Fecho** — uma frase para manter a relação (prazos, quantidades, futuro).`,
    ``,
    `Mantém o total abaixo de 150 palavras. Não uses listas numeradas. Não assines.`,
  ]
    .filter(Boolean)
    .join("\n")

  const openai = new OpenAI({ apiKey })

  try {
    let response
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 500,
      })
    } catch {
      response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 500,
      })
    }

    const text = response.choices[0]?.message?.content?.trim()
    if (!text) {
      return NextResponse.json({ error: "Resposta vazia do modelo." }, { status: 500 })
    }

    // Best-effort cache
    if (analysisId && itemId) {
      await supabase
        .from("analise_scripts")
        .insert({
          user_id: user.id,
          analysis_id: analysisId,
          item_id: String(itemId),
          script: text,
        })
        .then(({ error }) => {
          if (error) console.log("[v0] cache script error:", error.message)
        })
    }

    return NextResponse.json({ script: text })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error"
    console.log("[v0] negotiation script error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
