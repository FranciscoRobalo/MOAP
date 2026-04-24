import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/analise/saved/:id
 *   -> full snapshot (including items jsonb) for the current user.
 *   Also marks the row as "seen by client" when the admin has already
 *   responded, so unread badges clear naturally on open.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("analise_saved")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Auto-mark as seen when the client opens an admin-responded submission.
  const hasAdminResponse =
    data.submission_status === "approved" ||
    data.submission_status === "changes_requested" ||
    data.submission_status === "rejected"
  if (hasAdminResponse && !data.client_seen_at) {
    await supabase
      .from("analise_saved")
      .update({ client_seen_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
  }

  return NextResponse.json({ analysis: data })
}

/**
 * PATCH /api/analise/saved/:id
 *   body: { action: "submit" | "withdraw" | "resubmit" }
 *   Client-side lifecycle transitions — only the owner can call this and
 *   RLS also restricts the row to the owner:
 *     submit     : draft            -> submitted
 *     resubmit   : changes_requested -> submitted   (owner addressed feedback)
 *     withdraw   : submitted         -> draft        (pull it back)
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const action = body?.action as string | undefined
  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 })
  }

  const { data: current, error: readErr } = await supabase
    .from("analise_saved")
    .select("id, user_id, submission_status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (readErr || !current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const now = new Date().toISOString()
  let update: Record<string, unknown> | null = null
  let newStatus = current.submission_status

  if (action === "submit") {
    if (current.submission_status !== "draft") {
      return NextResponse.json({ error: "Apenas rascunhos podem ser submetidos" }, { status: 400 })
    }
    newStatus = "submitted"
    update = { submission_status: "submitted", submitted_at: now, client_seen_at: null }
  } else if (action === "resubmit") {
    if (current.submission_status !== "changes_requested") {
      return NextResponse.json(
        { error: "Só pode resubmeter após pedido de alterações" },
        { status: 400 },
      )
    }
    newStatus = "submitted"
    update = {
      submission_status: "submitted",
      submitted_at: now,
      reviewer_id: null,
      reviewer_name: null,
      reviewed_at: null,
      client_seen_at: null,
    }
  } else if (action === "withdraw") {
    if (current.submission_status !== "submitted") {
      return NextResponse.json(
        { error: "Só submissões pendentes podem ser retiradas" },
        { status: 400 },
      )
    }
    newStatus = "draft"
    update = { submission_status: "draft", submitted_at: null }
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const { error: updErr } = await supabase
    .from("analise_saved")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  const actorName = user.user_metadata?.full_name ?? user.email ?? null

  // Audit log — best effort.
  await supabase
    .from("analise_admin_events")
    .insert({
      analysis_id: id,
      owner_id: user.id,
      actor_id: user.id,
      actor_name: actorName,
      action,
      old_status: current.submission_status,
      new_status: newStatus,
    })
    .then(({ error: evErr }) => {
      if (evErr) console.log("[v0] audit insert error:", evErr.message)
    })

  // Notify admins when a client submits or resubmits — both transitions end
  // up in the admin review queue, so admins need to see them.
  if (action === "submit" || action === "resubmit") {
    const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin")
    if (admins && admins.length > 0) {
      await supabase
        .from("notifications")
        .insert(
          admins.map((a) => ({
            user_id: a.id,
            type: "budget" as const,
            title: action === "resubmit" ? "Orçamento resubmetido" : "Nova submissão para revisão",
            description: `${actorName ?? "Um cliente"} ${
              action === "resubmit" ? "resubmeteu" : "submeteu"
            } um orçamento para análise.`,
            link: `/dashboard/revisoes?focus=${id}`,
            read: false,
          })),
        )
        .then(({ error: nErr }) => {
          if (nErr) console.log("[v0] admin notifications insert error:", nErr.message)
        })
    }
  }

  return NextResponse.json({ ok: true, submissionStatus: newStatus })
}

/**
 * DELETE /api/analise/saved/:id
 *   Drafts can be deleted freely. Non-draft submissions are blocked so
 *   the admin audit trail stays intact — the user can `withdraw` instead.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: current } = await supabase
    .from("analise_saved")
    .select("submission_status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (current && current.submission_status !== "draft") {
    return NextResponse.json(
      { error: "Submissões em revisão não podem ser eliminadas. Retire a submissão primeiro." },
      { status: 400 },
    )
  }

  const { error } = await supabase.from("analise_saved").delete().eq("id", id).eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
