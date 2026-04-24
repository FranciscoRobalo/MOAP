import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("obra_assignments")
    .select("*")
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ assignments: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as {
    obraId?: string
    reviewerId?: string | null
    reviewerName?: string | null
  }
  if (!body.obraId) return NextResponse.json({ error: "Missing obraId" }, { status: 400 })

  const { data, error } = await supabase
    .from("obra_assignments")
    .upsert(
      {
        obra_id: body.obraId,
        user_id: user.id,
        reviewer_id: body.reviewerId ?? null,
        reviewer_name: body.reviewerName ?? null,
      },
      { onConflict: "obra_id" },
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ assignment: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const obraId = searchParams.get("obraId")
  if (!obraId) return NextResponse.json({ error: "Missing obraId" }, { status: 400 })

  const { error } = await supabase
    .from("obra_assignments")
    .delete()
    .eq("user_id", user.id)
    .eq("obra_id", obraId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
