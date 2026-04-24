import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/analise/saved
 *   -> list saved analyses for the current user (most recent first)
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
    .select(
      "id, obra_id, file_name, region, total_budget, total_reference, overall_variance, overall_rating, quality_score, match_rate, potential_savings, risk_items, stats, category_breakdown, recommendations, created_at, updated_at",
    )
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
 *   body: { snapshot: AnalysisResult, obraId?: string }
 *   -> persists a full analysis snapshot and returns the new row id
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
  }

  const { data, error } = await supabase
    .from("analise_saved")
    .insert(insert)
    .select("id, created_at")
    .single()

  if (error) {
    console.log("[v0] analise_saved insert error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, createdAt: data.created_at })
}
