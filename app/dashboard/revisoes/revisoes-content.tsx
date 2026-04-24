"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Inbox,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { DashboardStatCard } from "@/components/dashboard/stat-card"
import { useAuth } from "@/contexts/auth-context"
import type { AdminQueueEntry, SubmissionStatus } from "@/lib/analise/types"
import { AdminReviewSheet } from "@/components/admin/admin-review-sheet"

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

type TabKey = "inbox" | "in_review" | "resolved" | "all"

const TAB_CONFIG: Record<TabKey, { label: string; statuses: SubmissionStatus[] | null }> = {
  inbox: { label: "Por atribuir", statuses: ["submitted"] },
  in_review: { label: "Em revisão", statuses: ["in_review"] },
  resolved: { label: "Resolvidos", statuses: ["approved", "changes_requested", "rejected"] },
  all: { label: "Todos", statuses: null },
}

export function RevisoesContent() {
  const { user } = useAuth()
  const [items, setItems] = useState<AdminQueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>("inbox")
  const [search, setSearch] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)

  const isAdmin = user?.role === "admin"

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/analise/queue?limit=150", { cache: "no-store" })
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(json.error ?? "Erro ao carregar fila de revisões")
        return
      }
      const json = (await res.json()) as { items: AdminQueueEntry[] }
      setItems(json.items ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) fetchQueue()
  }, [fetchQueue, isAdmin])

  // Deep-link support: when the admin arrives via a notification like
  // `/dashboard/revisoes?focus=<id>`, auto-open that submission's sheet.
  const searchParams = useSearchParams()
  useEffect(() => {
    const focus = searchParams.get("focus")
    if (focus && items.some((it) => it.id === focus)) {
      setOpenId(focus)
    }
  }, [items, searchParams])

  const counts = useMemo(() => {
    const by = { submitted: 0, in_review: 0, approved: 0, changes_requested: 0, rejected: 0 }
    for (const it of items) {
      const key = it.submission_status as keyof typeof by
      if (key in by) by[key]++
    }
    return by
  }, [items])

  const filtered = useMemo(() => {
    const statuses = TAB_CONFIG[tab].statuses
    const needle = search.trim().toLowerCase()
    return items.filter((it) => {
      if (statuses && !statuses.includes(it.submission_status)) return false
      if (!needle) return true
      return (
        it.file_name?.toLowerCase().includes(needle) ||
        it.owner_name?.toLowerCase().includes(needle) ||
        it.owner_email?.toLowerCase().includes(needle) ||
        it.region?.toLowerCase().includes(needle)
      )
    })
  }, [items, tab, search])

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-20 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h1 className="font-display text-2xl font-medium tracking-tight">Acesso restrito</h1>
        <p className="text-muted-foreground">
          Esta área é apenas para administradores. Se acreditas que isto é um erro, contacta a equipa.
        </p>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/dashboard">Voltar ao painel</Link>
        </Button>
      </div>
    )
  }

  const openItem = openId ? items.find((it) => it.id === openId) ?? null : null

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Administração / Revisões"
        title="Revisão de Orçamentos"
        description="Fila de orçamentos submetidos pelos clientes. Revise com apoio da IA, ajuste preços a partir da base de dados e envie feedback detalhado."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-2"
            onClick={fetchQueue}
            disabled={loading}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Atualizar
          </Button>
        }
      />

      {/* KPI strip — a quick sense of the pipeline */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          eyebrow="Pendentes"
          value={counts.submitted}
          icon={Inbox}
          tone="amber"
        />
        <DashboardStatCard
          eyebrow="Em revisão"
          value={counts.in_review}
          icon={Clock}
        />
        <DashboardStatCard
          eyebrow="Aprovados"
          value={counts.approved}
          icon={CheckCircle2}
        />
        <DashboardStatCard
          eyebrow="Alterações pedidas"
          value={counts.changes_requested}
          icon={AlertTriangle}
          tone="muted"
        />
      </div>

      <Card className="bp-bracket relative overflow-hidden border-border/60 bg-card/30">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Fila
              </p>
              <CardTitle className="font-display text-xl font-medium tracking-tight">
                Submissões
              </CardTitle>
              <CardDescription>
                {items.length} submissões · {filtered.length} visíveis com os filtros atuais
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Procurar por ficheiro, cliente ou região…"
                className="sm:w-72 rounded-full border-border/60 bg-background/60"
              />
            </div>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mt-2">
            <TabsList>
              {(Object.keys(TAB_CONFIG) as TabKey[]).map((key) => {
                const cfg = TAB_CONFIG[key]
                const countForTab =
                  cfg.statuses === null
                    ? items.length
                    : cfg.statuses.reduce(
                        (n, s) => n + (counts[s as keyof typeof counts] ?? 0),
                        0,
                      )
                return (
                  <TabsTrigger key={key} value={key} className="gap-2">
                    {cfg.label}
                    <Badge
                      variant="outline"
                      className="h-5 min-w-5 rounded-full border-border/60 px-1.5 font-mono text-[10px]"
                    >
                      {countForTab}
                    </Badge>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />A carregar fila…
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <ul className="divide-y divide-border/60">
              {filtered.map((it) => (
                <QueueRow
                  key={it.id}
                  item={it}
                  onOpen={() => setOpenId(it.id)}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AdminReviewSheet
        open={!!openId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null)
        }}
        summary={openItem}
        onRefresh={fetchQueue}
      />
    </div>
  )
}

function QueueRow({ item, onOpen }: { item: AdminQueueEntry; onOpen: () => void }) {
  const cfg = STATUS_CONFIG[item.submission_status as SubmissionStatus] ?? STATUS_CONFIG.submitted
  const submittedAt = item.submitted_at ? new Date(item.submitted_at) : null
  const ownerLabel = item.owner_name ?? item.owner_email ?? "Cliente"
  const total = Number(item.total_budget ?? 0)
  const variance = item.overall_variance
  const riskCount = item.risk_items ?? 0

  const isNew = item.submission_status === "submitted"

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center justify-between gap-4 px-1 py-4 text-left transition-colors hover:bg-accent/30"
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border",
              cfg.className,
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", cfg.dot)} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium text-foreground">{item.file_name}</p>
              {isNew && (
                <Badge
                  variant="outline"
                  className="h-5 rounded-full border-primary/40 bg-primary/10 px-2 font-mono text-[9px] uppercase tracking-[0.14em] text-primary"
                >
                  Novo
                </Badge>
              )}
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
                  cfg.className,
                )}
              >
                {cfg.label}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {ownerLabel}
              </span>
              {item.region && <span>{item.region}</span>}
              {submittedAt && (
                <span>Submetido {submittedAt.toLocaleDateString("pt-PT")}</span>
              )}
              {riskCount > 0 && (
                <span className="inline-flex items-center gap-1 text-price-above">
                  <AlertTriangle className="h-3 w-3" />
                  {riskCount} {riskCount === 1 ? "item em risco" : "itens em risco"}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="hidden shrink-0 text-right md:block">
          <p className="font-mono text-sm tabular-nums text-foreground">
            {total.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
          </p>
          {typeof variance === "number" && (
            <p
              className={cn(
                "mt-0.5 font-mono text-[10px] uppercase tracking-wider",
                variance > 10
                  ? "text-price-above"
                  : variance < -10
                    ? "text-price-below"
                    : "text-muted-foreground",
              )}
            >
              {variance > 0 ? "+" : ""}
              {variance.toFixed(1)}% vs mercado
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </button>
    </li>
  )
}

function EmptyState({ tab }: { tab: TabKey }) {
  const copy =
    tab === "inbox"
      ? "Nenhum orçamento pendente. Boa — estás em dia com a fila."
      : tab === "in_review"
        ? "Sem orçamentos em revisão ativa."
        : tab === "resolved"
          ? "Sem decisões arquivadas nesta janela."
          : "Sem submissões para os filtros atuais."
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="max-w-sm text-balance text-sm text-muted-foreground">{copy}</p>
    </div>
  )
}
