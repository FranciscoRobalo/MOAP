import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

type DecisionInput = {
  obraId: string
  obraTitle?: string
  previousStatus?: string | null
  newStatus: string
  reason?: string | null
  reviewerId?: string | null
  reviewerName?: string | null
  authorName?: string | null
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const obraId = searchParams.get("obraId")

  let query = supabase
    .from("obra_decisions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (obraId) query = query.eq("obra_id", obraId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ decisions: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as Partial<DecisionInput>
  if (!body.obraId || !body.newStatus) {
    return NextResponse.json({ error: "Missing obraId or newStatus" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("obra_decisions")
    .insert({
      user_id: user.id,
      obra_id: body.obraId,
      obra_title: body.obraTitle ?? null,
      previous_status: body.previousStatus ?? null,
      new_status: body.newStatus,
      reason: body.reason ?? null,
      reviewer_id: body.reviewerId ?? null,
      reviewer_name: body.reviewerName ?? null,
      author_name: body.authorName ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ decision: data })
}
