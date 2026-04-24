"use client"

import { createClient } from "@/lib/supabase/client"
import type {
  Budget,
  BudgetItem,
  Material,
  Notification,
  Obra,
  Visita,
} from "@/contexts/data-context"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUuid = (id: string | null | undefined): id is string =>
  typeof id === "string" && UUID_RE.test(id)

/* --------------------------------------------------------------------------
 * Status + type maps (memory <-> DB)
 * ------------------------------------------------------------------------ */

const BUDGET_STATUS_TO_DB: Record<Budget["status"], string> = {
  rascunho: "rascunho",
  pendente: "em_analise",
  enviado: "em_analise",
  aprovado: "aprovado",
  rejeitado: "rejeitado",
  finalizado: "analisado",
}

const BUDGET_STATUS_FROM_DB: Record<string, Budget["status"]> = {
  rascunho: "rascunho",
  em_analise: "pendente",
  analisado: "finalizado",
  aprovado: "aprovado",
  rejeitado: "rejeitado",
}

const NOTIFICATION_TYPE_TO_DB: Record<Notification["type"], string> = {
  obra: "obra",
  budget: "budget",
  message: "message",
  concurso: "concurso",
  system: "system",
  visit: "obra", // DB has no "visit" variant — collapse to "obra"
}

/* --------------------------------------------------------------------------
 * Row <-> model mappers
 * ------------------------------------------------------------------------ */

type ObraRow = {
  id: string
  title: string
  client_name: string | null
  location: string | null
  category: string | null
  description: string | null
  area: string | null
  type: string | null
  budget: number | null
  start_date: string | null
  end_date: string | null
  timeline: string | null
  status: string | null
  progress: number | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  created_at: string | null
  updated_at: string | null
}

const obraFromRow = (r: ObraRow): Obra => ({
  id: r.id,
  title: r.title ?? "",
  client: r.client_name ?? "",
  location: r.location ?? "",
  category: r.category ?? "",
  budget: Number(r.budget ?? 0),
  startDate: r.start_date ?? "",
  endDate: r.end_date ?? "",
  status: (r.status as Obra["status"]) ?? "pending",
  description: r.description ?? "",
  area: r.area ?? undefined,
  type: r.type ?? undefined,
  timeline: r.timeline ?? undefined,
  contact:
    r.contact_name || r.contact_email || r.contact_phone
      ? {
          name: r.contact_name ?? "",
          email: r.contact_email ?? "",
          phone: r.contact_phone ?? "",
        }
      : undefined,
  progress: r.progress ?? 0,
  createdAt: r.created_at ?? new Date().toISOString(),
  updatedAt: r.updated_at ?? new Date().toISOString(),
})

const obraToRow = (o: Obra, userId: string) => ({
  id: o.id,
  title: o.title,
  client_name: o.client,
  location: o.location,
  category: o.category,
  description: o.description,
  area: o.area ?? null,
  type: o.type ?? null,
  budget: o.budget ?? 0,
  start_date: o.startDate || null,
  end_date: o.endDate || null,
  timeline: o.timeline ?? null,
  status: o.status,
  progress: o.progress ?? 0,
  contact_name: o.contact?.name ?? null,
  contact_email: o.contact?.email ?? null,
  contact_phone: o.contact?.phone ?? null,
  created_by: userId,
  updated_at: new Date().toISOString(),
})

type VisitaRow = {
  id: string
  obra_id: string | null
  obra_name: string | null
  visit_date: string
  visit_time: string | null
  type: string | null
  contact_name: string | null
  contact_phone: string | null
  notes: string | null
  status: Visita["status"]
}

const visitaFromRow = (r: VisitaRow): Visita => ({
  id: r.id,
  obraId: r.obra_id ?? "",
  obraName: r.obra_name ?? "",
  date: r.visit_date,
  time: r.visit_time ?? "",
  type: r.type ?? "",
  contactName: r.contact_name ?? "",
  contactPhone: r.contact_phone ?? "",
  notes: r.notes ?? "",
  status: r.status,
})

const visitaToRow = (v: Visita, userId: string) => ({
  id: v.id,
  user_id: userId,
  obra_id: isUuid(v.obraId) ? v.obraId : null,
  obra_name: v.obraName,
  visit_date: v.date,
  visit_time: v.time || null,
  type: v.type || null,
  contact_name: v.contactName || null,
  contact_phone: v.contactPhone || null,
  notes: v.notes || null,
  status: v.status,
})

type MaterialRow = {
  id: string
  name: string
  category: string
  subcategory: string | null
  unit: string
  min_price: number | null
  avg_price: number
  max_price: number | null
  supplier: string | null
  region: string | null
  description: string | null
  keywords: string[] | null
  last_updated: string | null
}

const materialFromRow = (r: MaterialRow): Material => ({
  id: r.id,
  name: r.name,
  unit: r.unit,
  price: Number(r.avg_price ?? 0),
  priceMax: r.max_price != null ? Number(r.max_price) : undefined,
  category: r.category,
  type: r.keywords?.includes("__work__") ? "work" : "material",
  region: r.region ?? undefined,
  lastUpdated: r.last_updated ?? undefined,
})

const materialToRow = (m: Material, userId: string) => ({
  id: m.id,
  name: m.name,
  category: m.category,
  subcategory: null,
  unit: m.unit,
  min_price: m.price,
  avg_price: m.price,
  max_price: m.priceMax ?? null,
  supplier: null,
  region: m.region ?? "Portugal",
  description: null,
  keywords: m.type === "work" ? ["__work__"] : null,
  last_updated: m.lastUpdated ?? new Date().toISOString(),
  created_by: userId,
})

type BudgetRow = {
  id: string
  name: string
  obra_id: string | null
  status: string | null
  total_value: number | null
  total_items: number | null
  notes: string | null
  created_at: string | null
}

type BudgetItemRow = {
  id: string
  budget_id: string
  description: string | null
  category: string | null
  unit: string | null
  quantity: number | null
  unit_price: number | null
}

const budgetFromRows = (
  row: BudgetRow,
  items: BudgetItemRow[],
  obrasById: Record<string, Obra>
): Budget => ({
  id: row.id,
  name: row.name,
  obraId: row.obra_id ?? "",
  obraName: row.obra_id ? obrasById[row.obra_id]?.title ?? "" : "",
  createdDate: row.created_at ?? new Date().toISOString(),
  status: BUDGET_STATUS_FROM_DB[row.status ?? "rascunho"] ?? "rascunho",
  items: items.map((i) => ({
    id: i.id,
    materialId: "",
    materialName: i.description ?? "",
    unit: i.unit ?? "un",
    quantity: Number(i.quantity ?? 0),
    unitPrice: Number(i.unit_price ?? 0),
    category: i.category ?? "",
  })),
  totalValue: Number(row.total_value ?? 0),
})

const budgetToRow = (b: Budget, userId: string) => ({
  id: b.id,
  name: b.name,
  obra_id: isUuid(b.obraId) ? b.obraId : null,
  uploaded_by: userId,
  status: BUDGET_STATUS_TO_DB[b.status] ?? "rascunho",
  total_value: b.totalValue ?? 0,
  total_items: b.items?.length ?? 0,
  notes: null,
  updated_at: new Date().toISOString(),
})

const budgetItemToRow = (it: BudgetItem, budgetId: string) => ({
  id: it.id,
  budget_id: budgetId,
  description: it.materialName,
  category: it.category,
  unit: it.unit,
  quantity: it.quantity,
  unit_price: it.unitPrice,
  total_price: it.quantity * it.unitPrice,
  matched_material_id: isUuid(it.materialId) ? it.materialId : null,
})

type NotificationRow = {
  id: string
  type: string
  title: string
  description: string | null
  link: string | null
  read: boolean | null
  created_at: string | null
}

const notificationFromRow = (r: NotificationRow): Notification => ({
  id: r.id,
  type: (r.type as Notification["type"]) ?? "system",
  title: r.title,
  description: r.description ?? "",
  timestamp: r.created_at ?? new Date().toISOString(),
  read: !!r.read,
  link: r.link ?? undefined,
})

const notificationToRow = (n: Notification, userId: string) => ({
  id: n.id,
  user_id: userId,
  type: NOTIFICATION_TYPE_TO_DB[n.type] ?? "system",
  title: n.title,
  description: n.description || null,
  link: n.link ?? null,
  read: n.read,
})

/* --------------------------------------------------------------------------
 * Hydrate — bulk load for a Supabase user
 * ------------------------------------------------------------------------ */

export async function hydrateFromSupabase(userId: string) {
  const supabase = createClient()

  const [
    { data: obrasRows },
    { data: materialRows },
    { data: visitaRows },
    { data: notificationRows },
    { data: budgetRows },
  ] = await Promise.all([
    supabase
      .from("obras")
      .select("*")
      .or(`created_by.eq.${userId},client_id.eq.${userId},assigned_to.eq.${userId}`)
      .order("updated_at", { ascending: false }),
    supabase.from("materials").select("*").order("name", { ascending: true }),
    supabase
      .from("visitas")
      .select("*")
      .eq("user_id", userId)
      .order("visit_date", { ascending: false }),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("budgets")
      .select("*")
      .eq("uploaded_by", userId)
      .order("updated_at", { ascending: false }),
  ])

  const obras = (obrasRows ?? []).map((r) => obraFromRow(r as ObraRow))
  const obrasById = Object.fromEntries(obras.map((o) => [o.id, o]))
  const materials = (materialRows ?? []).map((r) => materialFromRow(r as MaterialRow))
  const visitas = (visitaRows ?? []).map((r) => visitaFromRow(r as VisitaRow))
  const notifications = (notificationRows ?? []).map((r) =>
    notificationFromRow(r as NotificationRow)
  )

  let budgets: Budget[] = []
  const budgetIds = (budgetRows ?? []).map((b: any) => b.id as string)
  if (budgetIds.length > 0) {
    const { data: itemRows } = await supabase
      .from("budget_items")
      .select("*")
      .in("budget_id", budgetIds)
    const itemsByBudget: Record<string, BudgetItemRow[]> = {}
    for (const it of (itemRows ?? []) as BudgetItemRow[]) {
      ;(itemsByBudget[it.budget_id] ||= []).push(it)
    }
    budgets = (budgetRows ?? []).map((b: any) =>
      budgetFromRows(b as BudgetRow, itemsByBudget[b.id] ?? [], obrasById)
    )
  }

  return { obras, materials, visitas, notifications, budgets }
}

/* --------------------------------------------------------------------------
 * Upserts / deletes — one per entity
 * ------------------------------------------------------------------------ */

export async function upsertObra(obra: Obra, userId: string) {
  const supabase = createClient()
  const { error } = await supabase.from("obras").upsert(obraToRow(obra, userId))
  if (error) console.error("[v0] upsertObra", error.message)
}

export async function deleteObra(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from("obras").delete().eq("id", id)
  if (error) console.error("[v0] deleteObra", error.message)
}

export async function upsertVisita(visita: Visita, userId: string) {
  const supabase = createClient()
  const { error } = await supabase.from("visitas").upsert(visitaToRow(visita, userId))
  if (error) console.error("[v0] upsertVisita", error.message)
}

export async function deleteVisita(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from("visitas").delete().eq("id", id)
  if (error) console.error("[v0] deleteVisita", error.message)
}

export async function upsertMaterial(material: Material, userId: string) {
  const supabase = createClient()
  const { error } = await supabase.from("materials").upsert(materialToRow(material, userId))
  if (error) console.error("[v0] upsertMaterial", error.message)
}

export async function deleteMaterial(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from("materials").delete().eq("id", id)
  if (error) console.error("[v0] deleteMaterial", error.message)
}

export async function upsertBudget(budget: Budget, userId: string) {
  const supabase = createClient()
  const { error: bErr } = await supabase.from("budgets").upsert(budgetToRow(budget, userId))
  if (bErr) {
    console.error("[v0] upsertBudget", bErr.message)
    return
  }
  // Replace items — simple + correct
  await supabase.from("budget_items").delete().eq("budget_id", budget.id)
  if (budget.items?.length) {
    const rows = budget.items.map((it) => budgetItemToRow(it, budget.id))
    const { error: itErr } = await supabase.from("budget_items").insert(rows)
    if (itErr) console.error("[v0] upsertBudget.items", itErr.message)
  }
}

export async function deleteBudget(id: string) {
  const supabase = createClient()
  await supabase.from("budget_items").delete().eq("budget_id", id)
  const { error } = await supabase.from("budgets").delete().eq("id", id)
  if (error) console.error("[v0] deleteBudget", error.message)
}

export async function upsertNotification(n: Notification, userId: string) {
  const supabase = createClient()
  const { error } = await supabase.from("notifications").upsert(notificationToRow(n, userId))
  if (error) console.error("[v0] upsertNotification", error.message)
}

export async function markNotificationRead(id: string, read = true) {
  const supabase = createClient()
  const { error } = await supabase.from("notifications").update({ read }).eq("id", id)
  if (error) console.error("[v0] markNotificationRead", error.message)
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
  if (error) console.error("[v0] markAllNotificationsRead", error.message)
}

export async function deleteNotification(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from("notifications").delete().eq("id", id)
  if (error) console.error("[v0] deleteNotification", error.message)
}

export async function clearAllNotifications(userId: string) {
  const supabase = createClient()
  const { error } = await supabase.from("notifications").delete().eq("user_id", userId)
  if (error) console.error("[v0] clearAllNotifications", error.message)
}
