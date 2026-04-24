"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  Loader2,
  MessageSquareWarning,
  RefreshCw,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { DashboardStatCard } from "@/components/dashboard/stat-card"
import type { SavedAnalysisSummary, SubmissionStatus } from "@/lib/analise/types"

/**
 * Client "My budgets" workspace.
 *
 * Mirrors the admin review queue visually, but scoped to the logged-in
 * user via `/api/analise/saved` (RLS-enforced). Each row links into a
 * dedicated feedback page (/dashboard/meus-orcamentos/[id]) where the
 * admin's revised items + written feedback are rendered in detail.
 */

type Filter = "all" | "pending" | "answered" | "drafts"

const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; className: string; dot: string }
> = {
  draft: {
    label: "Rascunho",
    className: "border-border/70 bg-muted/40 text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  submitted: {
    label: "Submetido",
    className: "border-primary/40 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  in_review: {
    label: "Em revisão",
    className: "border-amber/40 bg-amber/10 text-amber",
    dot: "bg-amber",
  },
  approved: {
    label: "Aprovado",
    className: "border-price-below/40 bg-price-below/10 text-price-below",
    dot: "bg-price-below",
  },
  changes_requested: {
    label: "Alterações pedidas",
    className: "border-price-above/40 bg-price-above/10 text-price-above",
    dot: "bg-price-above",
  },
  rejected: {
    label: "Rejeitado",
    className: "border-price-critical/40 bg-price-critical/10 text-price-critical",
    dot: "bg-price-critical",
  },
}

function isPending(status: SubmissionStatus) {
  return status === "submitted" || status === "in_review"
}
function isAnswered(status: SubmissionStatus) {
  return status === "approved" || status === "changes_requested" || status === "rejected"
}
function isUnread(s: SavedAnalysisSummary) {
  return isAnswered(s.submission_status) && !s.client_seen_at
}

export function MeusOrcamentosContent() {
  const [rows, setRows] = useState<SavedAnalysisSummary[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  const fetchRows = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch("/api/analise/saved", { cache: "no-store" })
      const json = (await res.json()) as { items?: SavedAnalysisSummary[]; error?: string }
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao carregar orçamentos")
        return
      }
      setRows(json.items ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchRows("initial")
  }, [fetchRows])

  const counts = useMemo(() => {
    const list = rows ?? []
    return {
      total: list.length,
      drafts: list.filter((r) => r.submission_status === "draft").length,
      pending: list.filter((r) => isPending(r.submission_status)).length,
      approved: list.filter((r) => r.submission_status === "approved").length,
      unread: list.filter(isUnread).length,
    }
  }, [rows])

  const visible = useMemo(() => {
    const list = rows ?? []
    const base =
      filter === "all"
        ? list
        : filter === "drafts"
          ? list.filter((r) => r.submission_status === "draft")
          : filter === "pending"
            ? list.filter((r) => isPending(r.submission_status))
            : list.filter((r) => isAnswered(r.submission_status))
    const q = query.trim().toLowerCase()
    if (!q) return base
    return base.filter((r) =>
      [r.file_name, r.region, r.admin_summary ?? ""]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [rows, filter, query])

  return (
    <div className="flex flex-col gap-8">
      <DashboardPageHeader
        eyebrow="§ Orçamentos · Cliente"
        title="Os meus orçamentos"
        description="Acompanhe o estado das análises que submeteu para revisão da equipa MOAP e consulte o feedback detalhado quando estiver pronto."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchRows("refresh")}
              disabled={refreshing}
              className="gap-1.5"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                aria-hidden="true"
              />
              Atualizar
            </Button>
            <Button asChild size="sm" className="gap-1.5 rounded-full">
              <Link href="/dashboard/analise">
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                Nova análise
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStatCard
          eyebrow="§ 01 / Total submetidos"
          value={counts.total}
          description="Orçamentos enviados"
          icon={Inbox}
          tone="primary"
        />
        <DashboardStatCard
          eyebrow="§ 02 / A aguardar"
          value={counts.pending}
          description="Em revisão pela equipa"
          icon={Clock}
          tone="amber"
        />
        <DashboardStatCard
          eyebrow="§ 03 / Aprovados"
          value={counts.approved}
          description="Prontos a usar"
          icon={CheckCircle2}
        />
        <DashboardStatCard
          eyebrow="§ 04 / Por ler"
          value={counts.unread}
          description="Respostas novas"
          icon={Sparkles}
          tone="muted"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">Todos ({counts.total})</TabsTrigger>
            <TabsTrigger value="pending">Em revisão ({counts.pending})</TabsTrigger>
            <TabsTrigger value="answered">
              Com resposta ({(rows ?? []).filter((r) => isAnswered(r.submission_status)).length})
            </TabsTrigger>
            <TabsTrigger value="drafts">Rascunhos ({counts.drafts})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="w-full lg:w-80">
          <Input
            placeholder="Procurar por ficheiro, região, feedback…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border hairline bg-muted/40">
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-lg tracking-tight">Sem orçamentos nesta vista</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === "drafts"
                  ? "Nenhum rascunho guardado."
                  : filter === "pending"
                    ? "Não tem orçamentos à espera de resposta."
                    : filter === "answered"
                      ? "Ainda nenhum orçamento foi revisto pela equipa MOAP."
                      : "Submeta o primeiro orçamento na Análise."}
              </p>
            </div>
            <Button asChild size="sm" className="gap-1.5 rounded-full">
              <Link href="/dashboard/analise">
                Ir para Análise
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((row) => (
            <OrcamentoRow key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  )
}

function OrcamentoRow({ row }: { row: SavedAnalysisSummary }) {
  const cfg = STATUS_CONFIG[row.submission_status]
  const unread = isUnread(row)
  const variance = row.overall_variance ?? 0
  const varianceTone =
    variance <= -3 ? "text-price-below" : variance >= 3 ? "text-price-above" : "text-foreground"
  const date = row.submitted_at ?? row.updated_at ?? row.created_at
  const answered = isAnswered(row.submission_status)

  return (
    <Card className={cn("relative overflow-hidden transition-colors", unread && "border-primary/40")}>
      {unread && (
        <span
          className="absolute left-0 top-0 h-full w-[3px] bg-primary"
          aria-label="Resposta nova"
        />
      )}
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
                cfg.className,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
              {cfg.label}
            </span>
            {row.overall_rating && (
              <span className="inline-flex items-center gap-1 rounded-full border hairline bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {row.overall_rating}
              </span>
            )}
            {unread && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-primary-foreground">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Nova resposta
              </span>
            )}
          </div>
          <p className="mt-2 truncate font-display text-lg tracking-tight">{row.file_name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <span>{new Date(date).toLocaleString("pt-PT")}</span>
            {row.region && <span>Região · {row.region}</span>}
            {row.reviewer_name && <span>Revisor · {row.reviewer_name}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:justify-end">
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Total submetido
            </p>
            <p className="font-display text-lg font-medium tabular-nums">
              €{" "}
              {Number(row.total_budget ?? 0).toLocaleString("pt-PT", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
          {row.admin_revised_total != null && (
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                Total revisto
              </p>
              <p className="font-display text-lg font-medium tabular-nums text-primary">
                €{" "}
                {Number(row.admin_revised_total).toLocaleString("pt-PT", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          )}
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Variação
            </p>
            <p className={cn("font-mono text-sm tabular-nums", varianceTone)}>
              {variance > 0 ? "+" : ""}
              {variance.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        {/* Preview of admin summary/feedback when answered */}
        {answered && (row.admin_summary || row.admin_feedback) && (
          <div className="rounded-lg border hairline bg-secondary/30 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
              Resumo da equipa MOAP
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-foreground">
              {row.admin_summary || row.admin_feedback}
            </p>
          </div>
        )}
        {row.submission_status === "submitted" && (
          <div className="flex items-center gap-2 rounded-lg border hairline bg-primary/5 p-3 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>A sua submissão está na fila. Um administrador irá começar a revisão em breve.</span>
          </div>
        )}
        {row.submission_status === "in_review" && (
          <div className="flex items-center gap-2 rounded-lg border border-amber/30 bg-amber/5 p-3 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber" aria-hidden="true" />
            <span>
              Em revisão {row.reviewer_name ? `por ${row.reviewer_name}` : ""}. Receberá notificação
              quando houver feedback.
            </span>
          </div>
        )}
        {row.submission_status === "changes_requested" && (
          <div className="flex items-center gap-2 rounded-lg border border-price-above/30 bg-price-above/5 p-3 text-sm text-muted-foreground">
            <MessageSquareWarning
              className="h-3.5 w-3.5 text-price-above"
              aria-hidden="true"
            />
            <span>
              A equipa pediu alterações. Consulte o feedback detalhado e resubmeta quando estiver
              pronto.
            </span>
          </div>
        )}
        {row.submission_status === "rejected" && (
          <div className="flex items-center gap-2 rounded-lg border border-price-critical/30 bg-price-critical/5 p-3 text-sm text-muted-foreground">
            <XCircle className="h-3.5 w-3.5 text-price-critical" aria-hidden="true" />
            <span>Submissão rejeitada. Consulte a justificação detalhada.</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            ID · {row.id.slice(0, 8)}
          </div>
          <div className="flex items-center gap-2">
            {row.submission_status === "draft" && (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link href={`/dashboard/analise?load=${row.id}`}>
                  Continuar
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
            )}
            <Button asChild size="sm" className="rounded-full">
              <Link href={`/dashboard/meus-orcamentos/${row.id}`}>
                {answered ? "Ver feedback" : "Ver estado"}
                <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
