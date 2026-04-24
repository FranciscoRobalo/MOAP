"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Info,
  Loader2,
  MessageSquareWarning,
  RefreshCw,
  Send,
  Sparkles,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { DashboardStatCard } from "@/components/dashboard/stat-card"
import type {
  AdminRevisedItem,
  BudgetItem,
  SavedAnalysisFull,
  SubmissionStatus,
} from "@/lib/analise/types"

/**
 * Client-side detail view for a submitted analysis.
 *
 * Shows:
 *  - Current status + reviewer
 *  - KPI strip mirroring /dashboard/analise (budget / reference / variance / quality)
 *  - Admin's written summary + feedback (once available)
 *  - Side-by-side client vs. admin revised items (highlights every change)
 *  - IA key findings the admin published
 *  - Recommendations from the original analysis
 *  - Timeline of important events
 *
 * Resubmit CTA is available when the admin requested changes.
 */

const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; className: string; dot: string; hint: string; icon: typeof Info }
> = {
  draft: {
    label: "Rascunho",
    className: "border-border/70 bg-muted/40 text-muted-foreground",
    dot: "bg-muted-foreground",
    hint: "Ainda não submetido. Volte à Análise para rever e enviar.",
    icon: FileText,
  },
  submitted: {
    label: "Submetido",
    className: "border-primary/40 bg-primary/10 text-primary",
    dot: "bg-primary",
    hint: "Na fila do administrador. Um revisor irá iniciar em breve.",
    icon: Clock,
  },
  in_review: {
    label: "Em revisão",
    className: "border-amber/40 bg-amber/10 text-amber",
    dot: "bg-amber",
    hint: "Um administrador está a rever este orçamento agora.",
    icon: Loader2,
  },
  approved: {
    label: "Aprovado",
    className: "border-price-below/40 bg-price-below/10 text-price-below",
    dot: "bg-price-below",
    hint: "Aprovado pela equipa MOAP.",
    icon: CheckCircle2,
  },
  changes_requested: {
    label: "Alterações pedidas",
    className: "border-price-above/40 bg-price-above/10 text-price-above",
    dot: "bg-price-above",
    hint: "O administrador pediu ajustes. Reveja o feedback abaixo e resubmeta.",
    icon: MessageSquareWarning,
  },
  rejected: {
    label: "Rejeitado",
    className: "border-price-critical/40 bg-price-critical/10 text-price-critical",
    dot: "bg-price-critical",
    hint: "A submissão foi rejeitada. Consulte a justificação detalhada.",
    icon: XCircle,
  },
}

const EUR = (n: number | null | undefined) =>
  `€ ${Number(n ?? 0).toLocaleString("pt-PT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`

export function MeuOrcamentoDetail({ id }: { id: string }) {
  const [data, setData] = useState<SavedAnalysisFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [resubmitting, setResubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analise/saved/${id}`, { cache: "no-store" })
      const json = (await res.json()) as { analysis?: SavedAnalysisFull; error?: string }
      if (!res.ok) {
        setError(json.error ?? "Erro ao carregar orçamento")
        setData(null)
        return
      }
      setError(null)
      setData(json.analysis ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const resubmit = useCallback(async () => {
    if (!data) return
    setResubmitting(true)
    try {
      const res = await fetch(`/api/analise/saved/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resubmit" }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao resubmeter")
        return
      }
      toast.success("Orçamento resubmetido para revisão")
      fetchDetail()
    } finally {
      setResubmitting(false)
    }
  }, [data, fetchDetail, id])

  // Map admin revisions by the original item id so we can render diffs inline.
  const revisionsById = useMemo<Map<string, AdminRevisedItem>>(() => {
    const map = new Map<string, AdminRevisedItem>()
    for (const rev of data?.admin_revised_items ?? []) {
      map.set(rev.id, rev)
    }
    return map
  }, [data])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="self-start gap-1.5">
          <Link href="/dashboard/meus-orcamentos">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Voltar aos meus orçamentos
          </Link>
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <XCircle className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <p className="font-display text-lg">Orçamento não encontrado</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {error ??
                "Este orçamento pode ter sido removido ou o link já não é válido. Volte para a lista para ver os seus orçamentos atuais."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[data.submission_status]
  const StatusIcon = cfg.icon
  const answered =
    data.submission_status === "approved" ||
    data.submission_status === "changes_requested" ||
    data.submission_status === "rejected"

  const items: BudgetItem[] = Array.isArray(data.items) ? data.items : []
  const revisedTotal = data.admin_revised_total
  const variance = data.overall_variance ?? 0
  const varianceTone =
    variance <= -3 ? "text-price-below" : variance >= 3 ? "text-price-above" : "text-foreground"

  // Delta vs. client budget — only meaningful once admin revised the total.
  const revisedDeltaPct =
    typeof revisedTotal === "number" && Number(data.total_budget ?? 0) > 0
      ? ((Number(revisedTotal) - Number(data.total_budget)) / Number(data.total_budget)) * 100
      : null

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3 gap-1.5">
          <Link href="/dashboard/meus-orcamentos">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Voltar aos meus orçamentos
          </Link>
        </Button>
      </div>

      <DashboardPageHeader
        eyebrow={`§ Orçamento · ${data.file_name}`}
        title="Feedback detalhado"
        description={
          data.region
            ? `Submissão para a região ${data.region}. O feedback combina análise automatizada com revisão humana da equipa MOAP.`
            : "O feedback combina análise automatizada com revisão humana da equipa MOAP."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchDetail} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Atualizar
            </Button>
            {data.submission_status === "changes_requested" && (
              <Button
                size="sm"
                onClick={resubmit}
                disabled={resubmitting}
                className="rounded-full gap-1.5"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                {resubmitting ? "A resubmeter…" : "Resubmeter"}
              </Button>
            )}
            {data.submission_status === "approved" && (
              <Button asChild size="sm" className="rounded-full gap-1.5">
                <Link href={`/dashboard/analise?load=${data.id}`}>
                  Abrir na Análise
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Status banner */}
      <div
        className={cn(
          "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
          cfg.className,
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border hairline bg-background/40",
            )}
          >
            <StatusIcon
              className={cn(
                "h-4 w-4",
                data.submission_status === "in_review" && "animate-spin",
              )}
              aria-hidden="true"
            />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em]">Estado atual</p>
            <p className="font-display text-lg tracking-tight">{cfg.label}</p>
            <p className="mt-0.5 text-sm opacity-80">{cfg.hint}</p>
          </div>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] opacity-80">
          {data.submitted_at && <>Submetido a {new Date(data.submitted_at).toLocaleString("pt-PT")}</>}
          {data.reviewed_at && (
            <>
              <span className="mx-2">·</span>
              Revisto a {new Date(data.reviewed_at).toLocaleString("pt-PT")}
            </>
          )}
          {data.reviewer_name && (
            <>
              <span className="mx-2">·</span>
              {data.reviewer_name}
            </>
          )}
        </div>
      </div>

      {/* KPI strip — mirrors /dashboard/analise */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStatCard
          eyebrow="§ 01 / Orçamento submetido"
          value={EUR(data.total_budget)}
          description="Total cliente"
          icon={FileText}
        />
        <DashboardStatCard
          eyebrow="§ 02 / Referência de mercado"
          value={EUR(data.total_reference)}
          description="Base de dados MOAP"
          icon={ClipboardList}
          tone="muted"
        />
        <DashboardStatCard
          eyebrow="§ 03 / Variação global"
          value={`${variance > 0 ? "+" : ""}${variance.toFixed(1)}%`}
          description={data.overall_rating ?? "—"}
          icon={variance < 0 ? TrendingDown : TrendingUp}
          tone={variance <= -3 ? "primary" : variance >= 3 ? "amber" : "default"}
        />
        <DashboardStatCard
          eyebrow="§ 04 / Quality index"
          value={`${data.quality_score ?? 0} / 100`}
          description={`Taxa de correspondência ${(data.match_rate ?? 0).toFixed?.(0) ?? 0}%`}
          icon={Sparkles}
          tone="primary"
        />
      </div>

      {/* Admin revised total (when admin produced revisions) */}
      {typeof revisedTotal === "number" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-background">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                  Proposta revista pela equipa MOAP
                </p>
                <p className="font-display text-2xl font-medium tabular-nums text-primary">
                  {EUR(revisedTotal)}
                </p>
              </div>
            </div>
            {revisedDeltaPct !== null && (
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  vs. submetido
                </p>
                <p
                  className={cn(
                    "font-mono text-lg tabular-nums",
                    revisedDeltaPct < 0 ? "text-price-below" : "text-price-above",
                  )}
                >
                  {revisedDeltaPct > 0 ? "+" : ""}
                  {revisedDeltaPct.toFixed(1)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin narrative feedback */}
      {answered && (data.admin_summary || data.admin_feedback) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl tracking-tight">
              <MessageSquareWarning className="h-4 w-4 text-primary" aria-hidden="true" />
              Feedback da equipa MOAP
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.admin_summary && (
              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                  Resumo executivo
                </p>
                <p className="mt-1 text-pretty text-sm leading-relaxed text-foreground">
                  {data.admin_summary}
                </p>
              </section>
            )}
            {data.admin_feedback && (
              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                  Feedback detalhado
                </p>
                <p className="mt-1 whitespace-pre-wrap text-pretty text-sm leading-relaxed text-foreground">
                  {data.admin_feedback}
                </p>
              </section>
            )}
          </CardContent>
        </Card>
      )}

      {/* IA key findings from the admin's AI review draft */}
      {Array.isArray(data.admin_ai_notes?.keyFindings) &&
        data.admin_ai_notes!.keyFindings!.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-xl tracking-tight">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                Principais observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {data.admin_ai_notes!.keyFindings!.map((finding, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-lg border hairline bg-secondary/20 p-3 text-sm"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-foreground">{finding}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      {/* Items table with admin revisions highlighted */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl tracking-tight">
              <ClipboardList className="h-4 w-4 text-primary" aria-hidden="true" />
              Artigos submetidos
              {revisionsById.size > 0 && (
                <span className="ml-2 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                  {revisionsById.size} revisão{revisionsById.size === 1 ? "" : "ões"}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y hairline bg-secondary/40 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="px-4 py-2">Artigo</th>
                    <th className="px-4 py-2 text-right">Qtd.</th>
                    <th className="px-4 py-2 text-right">€ / un. submetido</th>
                    <th className="px-4 py-2 text-right">€ / un. revisto</th>
                    <th className="px-4 py-2 text-right">Total revisto</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => {
                    const rev = revisionsById.get(row.id)
                    const originalUnit = row.budgetPrice
                    const qty = rev?.quantity ?? row.quantity
                    const unit = rev?.unitPrice ?? originalUnit
                    const total = qty * unit
                    const hasChange =
                      rev &&
                      (rev.quantity !== undefined || rev.unitPrice !== undefined || !!rev.note)
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b hairline align-top",
                          hasChange && "bg-primary/5",
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {row.matchedName ?? row.originalName}
                          </p>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {row.category ?? "—"} {row.unit ? `· ${row.unit}` : ""}
                          </p>
                          {rev?.note && (
                            <p className="mt-2 rounded border border-primary/20 bg-background/60 px-2 py-1 text-xs text-foreground">
                              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                                Nota do revisor ·{" "}
                              </span>
                              {rev.note}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {row.quantity}
                          {rev?.quantity !== undefined && rev.quantity !== row.quantity && (
                            <span className="ml-1 text-primary">→ {rev.quantity}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {EUR(originalUnit)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {rev?.unitPrice !== undefined && rev.unitPrice !== originalUnit ? (
                            <span className="text-primary">{EUR(rev.unitPrice)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {hasChange ? EUR(total) : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Original recommendations — shown regardless of admin response */}
      {data.recommendations && data.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl tracking-tight">
              <Info className="h-4 w-4 text-primary" aria-hidden="true" />
              Recomendações automáticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {data.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Separator />
      <div className="text-center text-xs text-muted-foreground">
        ID · {data.id}
      </div>
    </div>
  )
}
