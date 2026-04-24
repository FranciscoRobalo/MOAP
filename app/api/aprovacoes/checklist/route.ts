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
    .from("obra_checklist")
    .select("*")
    .eq("user_id", user.id)
    .eq("obra_id", obraId)
    .order("position", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { obraId?: string; label?: string; position?: number }
  if (!body.obraId || !body.label?.trim()) {
    return NextResponse.json({ error: "Missing obraId or label" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("obra_checklist")
    .insert({
      user_id: user.id,
      obra_id: body.obraId,
      label: body.label.trim(),
      position: body.position ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as {
    id?: string
    isDone?: boolean
    label?: string
  }
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (typeof body.isDone === "boolean") updates.is_done = body.isDone
  if (typeof body.label === "string") updates.label = body.label.trim()
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })

  const { data, error } = await supabase
    .from("obra_checklist")
    .update(updates)
    .eq("user_id", user.id)
    .eq("id", body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { error } = await supabase.from("obra_checklist").delete().eq("user_id", user.id).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
