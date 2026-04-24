"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  MessageSquareWarning,
  Pencil,
  Send,
  Sparkles,
  User as UserIcon,
  X,
  XCircle,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type {
  AdminAuditEvent,
  AdminQueueEntry,
  AdminRevisedItem,
  BudgetItem,
  SavedAnalysisFull,
  SubmissionStatus,
} from "@/lib/analise/types"

interface AdminReviewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary: AdminQueueEntry | null
  onRefresh: () => void
}

type LoadedAnalysis = SavedAnalysisFull & {
  owner?: { full_name: string | null; email: string | null; avatar_url: string | null } | null
}

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  draft: "Rascunho",
  submitted: "Submetido",
  in_review: "Em revisão",
  approved: "Aprovado",
  changes_requested: "Alterações pedidas",
  rejected: "Rejeitado",
}

/**
 * AdminReviewSheet
 *   The workhorse of the admin workflow. Shown as a right-hand sheet when
 *   the admin clicks a row in the review queue. It loads the full snapshot,
 *   lets the admin run an AI review (which drafts summary + per-item
 *   revisions grounded in the materials DB), edit the draft, and then
 *   approve / request changes / reject. Every transition writes an audit
 *   event on the server side.
 */
export function AdminReviewSheet({
  open,
  onOpenChange,
  summary,
  onRefresh,
}: AdminReviewSheetProps) {
  const [analysis, setAnalysis] = useState<LoadedAnalysis | null>(null)
  const [events, setEvents] = useState<AdminAuditEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [adminSummary, setAdminSummary] = useState("")
  const [adminFeedback, setAdminFeedback] = useState("")
  const [revisions, setRevisions] = useState<Record<string, { unitPrice: number; note: string }>>({})

  const id = summary?.id ?? null

  // Load the full snapshot whenever the sheet opens with a new row.
  useEffect(() => {
    if (!open || !id) {
      setAnalysis(null)
      setEvents([])
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/analise/${id}`, { cache: "no-store" })
        const json = (await res.json().catch(() => ({}))) as {
          analysis?: LoadedAnalysis
          events?: AdminAuditEvent[]
          error?: string
        }
        if (cancelled) return
        if (!res.ok || !json.analysis) {
          toast.error(json.error ?? "Erro ao carregar submissão")
          onOpenChange(false)
          return
        }
        setAnalysis(json.analysis)
        setEvents(json.events ?? [])
        setAdminSummary(json.analysis.admin_summary ?? "")
        setAdminFeedback(json.analysis.admin_feedback ?? "")
        const revMap: Record<string, { unitPrice: number; note: string }> = {}
        for (const r of json.analysis.admin_revised_items ?? []) {
          if (r?.id && typeof r.unitPrice === "number") {
            revMap[String(r.id)] = { unitPrice: r.unitPrice, note: r.note ?? "" }
          }
        }
        setRevisions(revMap)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, open, onOpenChange])

  const buildRevisions = useCallback((): AdminRevisedItem[] => {
    return Object.entries(revisions)
      .filter(([, v]) => Number.isFinite(v.unitPrice))
      .map(([itemId, v]) => ({ id: itemId, unitPrice: v.unitPrice, note: v.note }))
  }, [revisions])

  const revisedTotal = useMemo(() => {
    if (!analysis) return 0
    let total = 0
    for (const it of analysis.items ?? []) {
      const r = revisions[it.id]
      const price = r ? r.unitPrice : it.budgetPrice
      total += price * (it.quantity ?? 0)
    }
    return total
  }, [analysis, revisions])

  const originalTotal = Number(analysis?.total_budget ?? 0)
  const savingsDelta = originalTotal - revisedTotal

  const runAiReview = useCallback(async () => {
    if (!id) return
    setAiLoading(true)
    try {
      const res = await fetch(`/api/admin/analise/${id}/ai-review`, { method: "POST" })
      const json = (await res.json().catch(() => ({}))) as {
        aiNotes?: {
          summary?: string
          feedback?: string
          suggestedRevisions?: AdminRevisedItem[]
        }
        error?: string
      }
      if (!res.ok) {
        toast.error(json.error ?? "A IA não conseguiu gerar o relatório. Tente de novo.")
        return
      }
      const ai = json.aiNotes ?? {}
      if (typeof ai.summary === "string") setAdminSummary(ai.summary)
      if (typeof ai.feedback === "string") setAdminFeedback(ai.feedback)
      const revMap: Record<string, { unitPrice: number; note: string }> = {}
      for (const r of ai.suggestedRevisions ?? []) {
        if (r?.id && typeof r.unitPrice === "number") {
          revMap[String(r.id)] = { unitPrice: r.unitPrice, note: r.note ?? "" }
        }
      }
      setRevisions(revMap)
      toast.success("Draft gerado pela IA — reveja antes de enviar.")
    } finally {
      setAiLoading(false)
    }
  }, [id])

  const doAction = useCallback(
    async (action: "claim" | "save_draft" | "approve" | "request_changes" | "reject") => {
      if (!id) return
      setActionLoading(action)
      try {
        const res = await fetch(`/api/admin/analise/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            adminSummary: adminSummary || null,
            adminFeedback: adminFeedback || null,
            adminRevisedItems: buildRevisions(),
            adminRevisedTotal: revisedTotal,
          }),
        })
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        if (!res.ok) {
          toast.error(json.error ?? "Erro na ação")
          return
        }
        const toastLabel: Record<typeof action, string> = {
          claim: "Começou a rever este orçamento",
          save_draft: "Rascunho guardado",
          approve: "Orçamento aprovado — cliente notificado",
          request_changes: "Alterações pedidas ao cliente",
          reject: "Orçamento rejeitado",
        }
        toast.success(toastLabel[action])
        onRefresh()
        if (action !== "save_draft" && action !== "claim") {
          onOpenChange(false)
        }
      } finally {
        setActionLoading(null)
      }
    },
    [adminFeedback, adminSummary, buildRevisions, id, onOpenChange, onRefresh, revisedTotal],
  )

  if (!summary) return null

  const currentStatus = (analysis?.submission_status ?? summary.submission_status) as SubmissionStatus
  const ownerLabel = summary.owner_name ?? summary.owner_email ?? "Cliente"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-3xl lg:max-w-4xl"
      >
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Revisão · {STATUS_LABEL[currentStatus] ?? currentStatus}
              </p>
              <SheetTitle className="mt-1 truncate font-display text-2xl font-medium tracking-tight">
                {summary.file_name}
              </SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <span className="inline-flex items-center gap-1">
                  <UserIcon className="h-3 w-3" />
                  {ownerLabel}
                </span>
                {summary.region && <span>· {summary.region}</span>}
                {summary.submitted_at && (
                  <span>· Submetido {new Date(summary.submitted_at).toLocaleString("pt-PT")}</span>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {loading || !analysis ? (
          <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A carregar submissão…
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Claim banner — admin must pick it up to unblock actions */}
            {currentStatus === "submitted" && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Pronto para rever</p>
                    <p className="text-xs text-muted-foreground">
                      Reclame a revisão para se auto-atribuir e desbloquear as ações de decisão.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => doAction("claim")}
                  disabled={actionLoading !== null}
                  className="rounded-full"
                >
                  {actionLoading === "claim" ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Reclamar revisão
                </Button>
              </div>
            )}

            {/* Budget KPIs */}
            <div className="grid gap-4 sm:grid-cols-3">
              <KpiTile
                label="Total orçamentado"
                value={Number(analysis.total_budget ?? 0).toLocaleString("pt-PT", {
                  style: "currency",
                  currency: "EUR",
                })}
              />
              <KpiTile
                label="Total com revisões"
                value={revisedTotal.toLocaleString("pt-PT", {
                  style: "currency",
                  currency: "EUR",
                })}
                tone={revisedTotal < originalTotal ? "good" : "neutral"}
                delta={
                  savingsDelta !== 0
                    ? `${savingsDelta > 0 ? "−" : "+"}${Math.abs(savingsDelta).toLocaleString(
                        "pt-PT",
                        { style: "currency", currency: "EUR" },
                      )}`
                    : undefined
                }
              />
              <KpiTile
                label="Variação vs referência"
                value={
                  typeof analysis.overall_variance === "number"
                    ? `${analysis.overall_variance > 0 ? "+" : ""}${analysis.overall_variance.toFixed(1)}%`
                    : "—"
                }
                tone={
                  (analysis.overall_variance ?? 0) > 10
                    ? "bad"
                    : (analysis.overall_variance ?? 0) < -10
                      ? "good"
                      : "neutral"
                }
              />
            </div>

            <Tabs defaultValue="review">
              <TabsList>
                <TabsTrigger value="review">Feedback</TabsTrigger>
                <TabsTrigger value="items">
                  Itens ({analysis.items?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              {/* -------- FEEDBACK TAB -------- */}
              <TabsContent value="review" className="space-y-5 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background/60 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Revisão assistida por IA</p>
                      <p className="text-xs text-muted-foreground">
                        Gera um resumo, feedback em markdown e preços sugeridos, com base na base de dados de materiais e na variação do orçamento.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={runAiReview}
                    disabled={aiLoading}
                    size="sm"
                    className="rounded-full gap-2"
                  >
                    {aiLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {aiLoading ? "A gerar…" : "Analisar com IA"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-summary">Resumo executivo</Label>
                  <Textarea
                    id="admin-summary"
                    value={adminSummary}
                    onChange={(e) => setAdminSummary(e.target.value)}
                    rows={4}
                    placeholder="3 a 6 frases — a primeira coisa que o cliente lerá."
                    className="border-border/60 bg-background/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-feedback">Feedback detalhado (Markdown)</Label>
                  <Textarea
                    id="admin-feedback"
                    value={adminFeedback}
                    onChange={(e) => setAdminFeedback(e.target.value)}
                    rows={14}
                    placeholder="## Resumo&#10;## Pontos fortes&#10;## Riscos e itens a rever&#10;## Próximos passos"
                    className="font-mono border-border/60 bg-background/60 text-[13px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este texto é mostrado ao cliente na página de detalhe. Aceita Markdown.
                  </p>
                </div>
              </TabsContent>

              {/* -------- ITEMS TAB -------- */}
              <TabsContent value="items" className="pt-4">
                <div className="rounded-lg border border-border/60 bg-card/30">
                  <ItemsTable
                    items={analysis.items ?? []}
                    revisions={revisions}
                    onRevise={(itemId, unitPrice, note) => {
                      setRevisions((prev) => {
                        const next = { ...prev }
                        if (unitPrice === null) {
                          delete next[itemId]
                        } else {
                          next[itemId] = { unitPrice, note: note ?? prev[itemId]?.note ?? "" }
                        }
                        return next
                      })
                    }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Altere o preço unitário para registar uma revisão. Campo vazio repõe o preço original.
                </p>
              </TabsContent>

              {/* -------- HISTORY TAB -------- */}
              <TabsContent value="history" className="pt-4">
                <ul className="space-y-3">
                  {events.length === 0 && (
                    <li className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                      Sem eventos registados ainda.
                    </li>
                  )}
                  {events.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex items-start gap-3 rounded-md border border-border/60 bg-card/30 p-3"
                    >
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground">
                        <AuditIcon action={ev.action} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {humanAction(ev.action)}
                          {ev.actor_name ? (
                            <span className="ml-2 font-normal text-muted-foreground">
                              por {ev.actor_name}
                            </span>
                          ) : null}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {new Date(ev.created_at).toLocaleString("pt-PT")}
                          {ev.old_status && ev.new_status && (
                            <>
                              {" · "}
                              {STATUS_LABEL[ev.old_status as SubmissionStatus] ?? ev.old_status}
                              {" → "}
                              {STATUS_LABEL[ev.new_status as SubmissionStatus] ?? ev.new_status}
                            </>
                          )}
                        </p>
                        {ev.note && <p className="mt-1 text-xs text-muted-foreground">{ev.note}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>

            {/* Sticky-ish action footer */}
            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={actionLoading !== null}
                onClick={() => doAction("save_draft")}
              >
                {actionLoading === "save_draft" ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                )}
                Guardar rascunho
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-full"
                  disabled={actionLoading !== null || currentStatus === "submitted"}
                  onClick={() => doAction("reject")}
                >
                  {actionLoading === "reject" ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Rejeitar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-price-above/40 bg-price-above/10 text-price-above hover:bg-price-above/20"
                  disabled={actionLoading !== null || currentStatus === "submitted"}
                  onClick={() => doAction("request_changes")}
                >
                  {actionLoading === "request_changes" ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MessageSquareWarning className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Pedir alterações
                </Button>
                <Button
                  size="sm"
                  className="rounded-full bg-price-below text-white hover:bg-price-below/90"
                  disabled={actionLoading !== null || currentStatus === "submitted"}
                  onClick={() => doAction("approve")}
                >
                  {actionLoading === "approve" ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Aprovar e enviar
                </Button>
              </div>
            </div>
            {currentStatus === "submitted" && (
              <p className="text-right text-xs text-muted-foreground">
                Reclame a revisão primeiro para desbloquear as decisões.
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function KpiTile({
  label,
  value,
  tone = "neutral",
  delta,
}: {
  label: string
  value: string
  tone?: "neutral" | "good" | "bad"
  delta?: string
}) {
  const toneClass =
    tone === "good"
      ? "text-price-below"
      : tone === "bad"
        ? "text-price-above"
        : "text-foreground"
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-2 font-display text-2xl font-medium tracking-tight tabular-nums", toneClass)}>
        {value}
      </p>
      {delta && (
        <p className={cn("mt-1 font-mono text-[11px] uppercase tracking-wider", toneClass)}>{delta}</p>
      )}
    </div>
  )
}

function ItemsTable({
  items,
  revisions,
  onRevise,
}: {
  items: BudgetItem[]
  revisions: Record<string, { unitPrice: number; note: string }>
  onRevise: (itemId: string, unitPrice: number | null, note?: string) => void
}) {
  return (
    <div className="max-h-[520px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 border-b border-border/60 bg-card/80 backdrop-blur-sm">
          <tr className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <th className="px-3 py-2">Item</th>
            <th className="px-3 py-2 text-right">Qtd</th>
            <th className="px-3 py-2 text-right">Orçado</th>
            <th className="px-3 py-2 text-right">Referência</th>
            <th className="px-3 py-2 text-right">Revisão</th>
            <th className="px-3 py-2">Nota</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {items.map((it) => {
            const r = revisions[it.id]
            const budgetedTotal = it.budgetPrice * (it.quantity ?? 0)
            const ref = it.referenceAvgPrice
            const rowTone =
              it.rating === "critical"
                ? "bg-price-critical/5"
                : it.rating === "above"
                  ? "bg-price-above/5"
                  : ""
            return (
              <tr key={it.id} className={cn("align-top", rowTone)}>
                <td className="px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{it.originalName}</p>
                    <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {it.category ?? "—"}
                      {it.rating && it.rating !== "unknown" ? ` · ${it.rating}` : ""}
                      {typeof it.variance === "number"
                        ? ` · ${it.variance > 0 ? "+" : ""}${it.variance.toFixed(1)}%`
                        : ""}
                    </p>
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {it.quantity} {it.unit}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {it.budgetPrice.toLocaleString("pt-PT", {
                    style: "currency",
                    currency: "EUR",
                  })}
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {budgetedTotal.toLocaleString("pt-PT", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {ref !== null && ref !== undefined
                    ? ref.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })
                    : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={r?.unitPrice ?? ""}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === "") onRevise(it.id, null)
                      else {
                        const num = Number(v)
                        if (Number.isFinite(num)) onRevise(it.id, num, r?.note)
                      }
                    }}
                    placeholder={it.budgetPrice.toFixed(2)}
                    className="h-8 w-28 rounded border-border/60 bg-background/60 font-mono text-[12px] tabular-nums"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={r?.note ?? ""}
                    onChange={(e) =>
                      onRevise(
                        it.id,
                        r?.unitPrice ?? null,
                        e.target.value,
                      )
                    }
                    placeholder="Razão da revisão"
                    disabled={!r}
                    className="h-8 rounded border-border/60 bg-background/60 text-xs"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AuditIcon({ action }: { action: string }) {
  switch (action) {
    case "submitted":
    case "resubmit":
      return <Send className="h-3 w-3" />
    case "approve":
    case "approved":
      return <CheckCircle2 className="h-3 w-3 text-price-below" />
    case "reject":
    case "rejected":
      return <XCircle className="h-3 w-3 text-price-critical" />
    case "request_changes":
      return <MessageSquareWarning className="h-3 w-3 text-price-above" />
    case "claim":
      return <ArrowRight className="h-3 w-3" />
    case "ai_review_generated":
      return <Sparkles className="h-3 w-3 text-primary" />
    case "withdraw":
      return <X className="h-3 w-3" />
    default:
      return <FileText className="h-3 w-3" />
  }
}

function humanAction(action: string) {
  switch (action) {
    case "submitted":
      return "Submetido"
    case "resubmit":
      return "Resubmetido"
    case "withdraw":
      return "Retirado pelo cliente"
    case "claim":
      return "Admin reclamou revisão"
    case "save_draft":
      return "Rascunho guardado"
    case "approve":
      return "Aprovado"
    case "reject":
      return "Rejeitado"
    case "request_changes":
      return "Alterações pedidas"
    case "ai_review_generated":
      return "IA gerou draft"
    default:
      return action
  }
}
