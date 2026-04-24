import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ALLOWED = new Set(["pending", "accepted", "negotiate", "rejected"])

/**
 * GET /api/analise/decisions?analysisId=...
 *   -> map keyed by item_id with decision + target_price
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const analysisId = url.searchParams.get("analysisId")
  if (!analysisId) return NextResponse.json({ error: "Missing analysisId" }, { status: 400 })

  const { data, error } = await supabase
    .from("analise_decisions")
    .select("item_id, decision, target_price, updated_at")
    .eq("analysis_id", analysisId)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const map: Record<string, { decision: string; targetPrice: number | null; updatedAt: string }> = {}
  for (const r of data ?? []) {
    map[r.item_id] = {
      decision: r.decision,
      targetPrice: r.target_price,
      updatedAt: r.updated_at,
    }
  }
  return NextResponse.json({ decisions: map })
}

/**
 * POST /api/analise/decisions
 *   body: { analysisId, itemId, decision, targetPrice? }
 *   -> upserts a single decision
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.analysisId || !body?.itemId || !body?.decision) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  if (!ALLOWED.has(body.decision)) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 })
  }

  const { error } = await supabase.from("analise_decisions").upsert(
    {
      user_id: user.id,
      analysis_id: body.analysisId,
      item_id: String(body.itemId),
      decision: body.decision,
      target_price: body.targetPrice ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "analysis_id,item_id" },
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
