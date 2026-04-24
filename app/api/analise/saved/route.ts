import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const SUMMARY_FIELDS =
  "id, obra_id, file_name, region, total_budget, total_reference, overall_variance, overall_rating, quality_score, match_rate, potential_savings, risk_items, stats, category_breakdown, recommendations, created_at, updated_at, submission_status, submitted_at, reviewer_id, reviewer_name, reviewed_at, admin_summary, admin_feedback, admin_revised_total, client_seen_at"

/**
 * GET /api/analise/saved
 *   -> list saved analyses for the current user (most recent first)
 *   Includes the submission workflow columns so the UI can show status
 *   badges (draft / submitted / in review / approved / …).
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("analise_saved")
    .select(SUMMARY_FIELDS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.log("[v0] analise_saved list error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [] })
}

/**
 * POST /api/analise/saved
 *   body: { snapshot: AnalysisResult, obraId?: string, submit?: boolean }
 *   -> persists a full analysis snapshot and returns the new row id.
 *   When `submit` is true, the row is created directly in `submitted` state
 *   so the admin queue picks it up immediately.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.snapshot) {
    return NextResponse.json({ error: "Missing snapshot" }, { status: 400 })
  }

  const s = body.snapshot as Record<string, unknown> & {
    items: unknown[]
    stats?: Record<string, unknown>
    categoryBreakdown?: unknown
    recommendations?: unknown
    fileName?: string
    region?: string
    totalBudget?: number
    totalReference?: number
    overallVariance?: number
    overallRating?: string
    qualityScore?: number
  }

  const shouldSubmit = body.submit === true
  const now = new Date().toISOString()

  const insert = {
    user_id: user.id,
    obra_id: body.obraId ?? null,
    file_name: s.fileName ?? "Orçamento sem nome",
    region: s.region ?? null,
    total_budget: s.totalBudget ?? null,
    total_reference: s.totalReference ?? null,
    overall_variance: s.overallVariance ?? null,
    overall_rating: s.overallRating ?? null,
    quality_score: s.qualityScore ?? null,
    match_rate: (s.stats as { matchRate?: number } | undefined)?.matchRate ?? null,
    potential_savings: (s.stats as { potentialSavings?: number } | undefined)?.potentialSavings ?? null,
    risk_items: (s.stats as { riskItems?: number } | undefined)?.riskItems ?? null,
    stats: s.stats ?? {},
    category_breakdown: s.categoryBreakdown ?? [],
    recommendations: s.recommendations ?? [],
    items: s.items ?? [],
    submission_status: shouldSubmit ? "submitted" : "draft",
    submitted_at: shouldSubmit ? now : null,
  }

  const { data, error } = await supabase
    .from("analise_saved")
    .insert(insert)
    .select("id, created_at, submission_status")
    .single()

  if (error) {
    console.log("[v0] analise_saved insert error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Best-effort audit log — failure to log should never break the save.
  if (shouldSubmit) {
    const actorName = user.user_metadata?.full_name ?? user.email ?? null

    await supabase
      .from("analise_admin_events")
      .insert({
        analysis_id: data.id,
        owner_id: user.id,
        actor_id: user.id,
        actor_name: actorName,
        action: "submitted",
        old_status: "draft",
        new_status: "submitted",
        note: "Submetido para revisão",
      })
      .then(({ error: evErr }) => {
        if (evErr) console.log("[v0] audit insert error:", evErr.message)
      })

    // Fan-out notification to every admin so the queue is visible instantly.
    // We only include admins with completed profiles.
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
    if (admins && admins.length > 0) {
      const fileLabel = s.fileName ?? "Orçamento sem nome"
      await supabase
        .from("notifications")
        .insert(
          admins.map((a) => ({
            user_id: a.id,
            type: "budget" as const,
            title: "Nova submissão para revisão",
            description: `${actorName ?? "Um cliente"} submeteu “${fileLabel}” para análise.`,
            link: `/dashboard/revisoes?focus=${data.id}`,
            read: false,
          })),
        )
        .then(({ error: nErr }) => {
          if (nErr) console.log("[v0] admin notifications insert error:", nErr.message)
        })
    }
  }

  return NextResponse.json({
    id: data.id,
    createdAt: data.created_at,
    submissionStatus: data.submission_status,
  })
}
