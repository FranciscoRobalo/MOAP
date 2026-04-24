import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/analise/notes?analysisId=...&itemId=...
 *   -> list notes for a given item. itemId optional to get all notes.
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const analysisId = url.searchParams.get("analysisId")
  const itemId = url.searchParams.get("itemId")
  if (!analysisId) return NextResponse.json({ error: "Missing analysisId" }, { status: 400 })

  let q = supabase
    .from("analise_notes")
    .select("id, item_id, body, created_at")
    .eq("analysis_id", analysisId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)

  if (itemId) q = q.eq("item_id", itemId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notes: data ?? [] })
}

/**
 * POST /api/analise/notes
 *   body: { analysisId, itemId, body }
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.analysisId || !body?.itemId || !body?.body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("analise_notes")
    .insert({
      user_id: user.id,
      analysis_id: body.analysisId,
      item_id: String(body.itemId),
      body: String(body.body).slice(0, 2000),
    })
    .select("id, item_id, body, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data })
}

/**
 * DELETE /api/analise/notes?id=...
 */
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { error } = await supabase.from("analise_notes").delete().eq("id", id).eq("user_id", user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
