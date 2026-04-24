import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/admin/analise/queue
 *   Admin-only list of every non-draft analysis submission, joined with the
 *   owner's profile so the admin UI can show who submitted what.
 *
 *   Query params (all optional):
 *     status  — comma-separated list of submission_status values to include
 *     limit   — default 100
 *
 *   We fetch submissions and profiles separately rather than relying on the
 *   implicit FK relationship name, which makes the query resilient to any
 *   future constraint renames.
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const statusFilter = url.searchParams.get("status")
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100) || 100, 200)

  let query = supabase
    .from("analise_saved")
    .select(
      `id, user_id, obra_id, file_name, region, total_budget, total_reference,
       overall_variance, overall_rating, quality_score, match_rate,
       potential_savings, risk_items, stats, category_breakdown, recommendations,
       created_at, updated_at, submission_status, submitted_at, reviewer_id,
       reviewer_name, reviewed_at, admin_summary, admin_feedback,
       admin_revised_total, client_seen_at`,
    )
    .neq("submission_status", "draft")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(limit)

  if (statusFilter) {
    const statuses = statusFilter
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    if (statuses.length > 0) query = query.in("submission_status", statuses)
  }

  const { data: rows, error } = await query
  if (error) {
    console.log("[v0] admin queue error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const ownerIds = Array.from(new Set((rows ?? []).map((r) => r.user_id).filter(Boolean)))
  const owners = new Map<string, { full_name: string | null; email: string | null }>()
  if (ownerIds.length > 0) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ownerIds)
    for (const p of profileRows ?? []) {
      owners.set(p.id, { full_name: p.full_name ?? null, email: p.email ?? null })
    }
  }

  const items = (rows ?? []).map((row) => ({
    ...row,
    owner_name: owners.get(row.user_id)?.full_name ?? null,
    owner_email: owners.get(row.user_id)?.email ?? null,
  }))

  return NextResponse.json({ items })
}
