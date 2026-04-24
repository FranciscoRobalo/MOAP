export type ObraStatus = "pending" | "approved" | "in-analysis" | "info-needed" | "rejected"

export type DecisionRow = {
  id: string
  user_id: string
  obra_id: string
  obra_title: string | null
  previous_status: string | null
  new_status: ObraStatus | string
  reason: string | null
  reviewer_id: string | null
  reviewer_name: string | null
  author_name: string | null
  created_at: string
}

export type CommentRow = {
  id: string
  user_id: string
  obra_id: string
  author_name: string | null
  body: string
  created_at: string
}

export type ChecklistRow = {
  id: string
  user_id: string
  obra_id: string
  label: string
  is_done: boolean
  position: number
  created_at: string
  updated_at: string
}

export type AssignmentRow = {
  obra_id: string
  user_id: string
  reviewer_id: string | null
  reviewer_name: string | null
  created_at: string
  updated_at: string
}

export const STATUS_META: Record<
  ObraStatus,
  { label: string; chip: string; kanban: string; tone: "below" | "average" | "above" | "high" | "primary" }
> = {
  pending:       { label: "Pendente",       chip: "border-border/60 bg-muted/40 text-foreground",                   kanban: "border-border/60",                  tone: "average" },
  "in-analysis": { label: "Em Análise",     chip: "border-primary/40 bg-primary/10 text-primary",                   kanban: "border-primary/40",                 tone: "primary" },
  "info-needed": { label: "Info Adicional", chip: "border-price-above/40 bg-price-above/10 text-price-above",        kanban: "border-price-above/40",             tone: "above" },
  approved:      { label: "Aprovado",       chip: "border-price-below/40 bg-price-below/10 text-price-below",        kanban: "border-price-below/40",             tone: "below" },
  rejected:      { label: "Rejeitado",      chip: "border-price-high/40 bg-price-high/10 text-price-high",           kanban: "border-price-high/40",              tone: "high" },
}

export const STATUS_ORDER: ObraStatus[] = ["pending", "in-analysis", "info-needed", "approved", "rejected"]

export const SLA_DAYS = 7

export function isOverdue(createdAt: string, status: string) {
  if (status === "approved" || status === "rejected") return false
  const ms = Date.now() - new Date(createdAt).getTime()
  return ms / (1000 * 60 * 60 * 24) > SLA_DAYS
}

export function daysSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}
