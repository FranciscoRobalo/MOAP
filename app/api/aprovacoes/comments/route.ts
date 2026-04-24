import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const obraId = searchParams.get("obraId")
  if (!obraId) return NextResponse.json({ error: "Missing obraId" }, { status: 400 })

  const { data, error } = await supabase
    .from("obra_comments")
    .select("*")
    .eq("user_id", user.id)
    .eq("obra_id", obraId)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { obraId?: string; body?: string; authorName?: string }
  if (!body.obraId || !body.body?.trim()) {
    return NextResponse.json({ error: "Missing obraId or body" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("obra_comments")
    .insert({
      user_id: user.id,
      obra_id: body.obraId,
      author_name: body.authorName ?? null,
      body: body.body.trim(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { error } = await supabase.from("obra_comments").delete().eq("user_id", user.id).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
