import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/admin/analise/:id
 *   Full submission including items + audit log. Admin-only.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle()
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("analise_saved")
    .select("*")
    .eq("id", id)
    .neq("submission_status", "draft")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { data: owner } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", data.user_id)
    .maybeSingle()

  const { data: events } = await supabase
    .from("analise_admin_events")
    .select("*")
    .eq("analysis_id", id)
    .order("created_at", { ascending: false })
    .limit(50)

  return NextResponse.json({ analysis: { ...data, owner }, events: events ?? [] })
}

/**
 * PATCH /api/admin/analise/:id
 *   Admin lifecycle actions. Body:
 *     { action: "claim" | "save_draft" | "approve" | "request_changes" | "reject",
 *       adminSummary?: string,
 *       adminFeedback?: string,
 *       adminRevisedItems?: AdminRevisedItem[],
 *       adminRevisedTotal?: number }
 *
 *     claim            : submitted        -> in_review (self-assign)
 *     save_draft       : in_review        -> in_review  (save fields without flipping status)
 *     approve          : submitted/in_review -> approved
 *     request_changes  : submitted/in_review -> changes_requested
 *     reject           : submitted/in_review -> rejected
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle()
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const action = body?.action as string | undefined
  if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 })

  const { data: current } = await supabase
    .from("analise_saved")
    .select("id, user_id, submission_status, reviewer_id")
    .eq("id", id)
    .maybeSingle()

  if (!current || current.submission_status === "draft") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const reviewerName = profile?.full_name ?? user.email ?? null
  const now = new Date().toISOString()
  const oldStatus = current.submission_status

  // Shared payload fields present across most actions
  const sharedFields: Record<string, unknown> = {}
  if (typeof body.adminSummary === "string") sharedFields.admin_summary = body.adminSummary
  if (typeof body.adminFeedback === "string") sharedFields.admin_feedback = body.adminFeedback
  if (Array.isArray(body.adminRevisedItems))
    sharedFields.admin_revised_items = body.adminRevisedItems
  if (typeof body.adminRevisedTotal === "number")
    sharedFields.admin_revised_total = body.adminRevisedTotal

  let update: Record<string, unknown>
  let newStatus = oldStatus
  let eventNote: string | null = null

  switch (action) {
    case "claim":
      if (oldStatus !== "submitted") {
        return NextResponse.json(
          { error: "Só submissões pendentes podem ser reclamadas" },
          { status: 400 },
        )
      }
      newStatus = "in_review"
      update = {
        ...sharedFields,
        submission_status: "in_review",
        reviewer_id: user.id,
        reviewer_name: reviewerName,
      }
      break

    case "save_draft":
      if (oldStatus !== "in_review" && oldStatus !== "submitted") {
        return NextResponse.json(
          { error: "Só pode guardar rascunho durante a revisão" },
          { status: 400 },
        )
      }
      newStatus = "in_review"
      update = {
        ...sharedFields,
        submission_status: "in_review",
        reviewer_id: user.id,
        reviewer_name: reviewerName,
      }
      break

    case "approve":
    case "request_changes":
    case "reject": {
      const map = {
        approve: "approved",
        request_changes: "changes_requested",
        reject: "rejected",
      } as const
      newStatus = map[action as keyof typeof map]
      eventNote =
        action === "approve"
          ? "Orçamento aprovado"
          : action === "request_changes"
            ? "Alterações solicitadas"
            : "Orçamento rejeitado"
      update = {
        ...sharedFields,
        submission_status: newStatus,
        reviewer_id: user.id,
        reviewer_name: reviewerName,
        reviewed_at: now,
      }
      break
    }

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const { error: updErr } = await supabase.from("analise_saved").update(update).eq("id", id)
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  await supabase
    .from("analise_admin_events")
    .insert({
      analysis_id: id,
      owner_id: current.user_id,
      actor_id: user.id,
      actor_name: reviewerName,
      action,
      old_status: oldStatus,
      new_status: newStatus,
      note: eventNote,
    })
    .then(({ error: evErr }) => {
      if (evErr) console.log("[v0] admin audit insert error:", evErr.message)
    })

  // Notify the owning client whenever the submission reaches a terminal
  // state (approved / changes_requested / rejected). The notification links
  // straight to the detail page so the client can read the feedback.
  if (
    newStatus === "approved" ||
    newStatus === "changes_requested" ||
    newStatus === "rejected"
  ) {
    const notifTitle =
      newStatus === "approved"
        ? "Orçamento aprovado"
        : newStatus === "changes_requested"
          ? "Alterações pedidas no orçamento"
          : "Orçamento rejeitado"
    const notifDescription =
      newStatus === "approved"
        ? "A equipa MOAP aprovou o seu orçamento. Consulte o feedback detalhado."
        : newStatus === "changes_requested"
          ? "A equipa MOAP pediu ajustes. Reveja os comentários e resubmeta quando estiver pronto."
          : "A equipa MOAP rejeitou a submissão. Consulte a justificação detalhada."

    await supabase
      .from("notifications")
      .insert({
        user_id: current.user_id,
        type: "budget",
        title: notifTitle,
        description: notifDescription,
        link: `/dashboard/meus-orcamentos/${id}`,
        read: false,
      })
      .then(({ error: nErr }) => {
        if (nErr) console.log("[v0] client notification insert error:", nErr.message)
      })
  }

  return NextResponse.json({ ok: true, submissionStatus: newStatus })
}
