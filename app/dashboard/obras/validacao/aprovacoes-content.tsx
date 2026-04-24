"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { useData, type Obra } from "@/contexts/data-context"
import { useAuth } from "@/contexts/auth-context"
import { useAprovacoesWorkspace } from "@/hooks/use-aprovacoes-workspace"
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Euro,
  Eye,
  Info,
  KanbanSquare,
  List,
  MapPin,
  Search,
  UserPlus,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { ReviewDrawer } from "@/components/aprovacoes/review-drawer"
import {
  STATUS_META,
  STATUS_ORDER,
  daysSince,
  isOverdue,
  type ObraStatus,
} from "@/lib/aprovacoes/types"

type ViewMode = "list" | "board"

export function AprovacoesContent() {
  const { obras, updateObra } = useData()
  const { user } = useAuth()
  const authorName = user?.name || user?.email || null
  const workspace = useAprovacoesWorkspace()

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | ObraStatus>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterReviewer, setFilterReviewer] = useState<string>("all")
  const [onlyMine, setOnlyMine] = useState(false)
  const [onlyOverdue, setOnlyOverdue] = useState(false)
  const [view, setView] = useState<ViewMode>("list")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [drawerObraId, setDrawerObraId] = useState<string | null>(null)

  const drawerObra = useMemo(
    () => obras.find((o) => o.id === drawerObraId) ?? null,
    [obras, drawerObraId],
  )

  // --- KPIs ---
  const kpis = useMemo(() => {
    const pending = obras.filter((o) => o.status === "pending").length
    const analysis = obras.filter((o) => o.status === "in-analysis").length
    const infoNeeded = obras.filter((o) => o.status === "info-needed").length
    const overdue = obras.filter((o) => isOverdue(o.createdAt, o.status)).length

    const now = Date.now()
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
    const recent = workspace.decisions.filter(
      (d) => now - new Date(d.created_at).getTime() < THIRTY_DAYS,
    )
    const decided = recent.filter(
      (d) => d.new_status === "approved" || d.new_status === "rejected",
    )
    const approvalRate = decided.length
      ? Math.round(
          (recent.filter((d) => d.new_status === "approved").length / decided.length) * 100,
        )
      : 0
    return { pending, analysis, infoNeeded, overdue, approvalRate, decided30d: decided.length }
  }, [obras, workspace.decisions])

  // --- Derived options ---
  const categories = useMemo(() => {
    const set = new Set<string>()
    obras.forEach((o) => o.category && set.add(o.category))
    return Array.from(set).sort()
  }, [obras])

  const reviewers = useMemo(() => {
    const set = new Set<string>()
    Object.values(workspace.assignments).forEach(
      (a) => a.reviewer_name && set.add(a.reviewer_name),
    )
    return Array.from(set).sort()
  }, [workspace.assignments])

  // --- Filtering ---
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return obras.filter((o) => {
      if (filterStatus !== "all" && o.status !== filterStatus) return false
      if (filterCategory !== "all" && o.category !== filterCategory) return false
      if (filterReviewer !== "all") {
        const a = workspace.assignments[o.id]
        if (filterReviewer === "__unassigned__") {
          if (a?.reviewer_name) return false
        } else if (a?.reviewer_name !== filterReviewer) {
          return false
        }
      }
      if (onlyMine && authorName) {
        const a = workspace.assignments[o.id]
        if (a?.reviewer_name !== authorName) return false
      }
      if (onlyOverdue && !isOverdue(o.createdAt, o.status)) return false
      if (term) {
        const hay = `${o.title} ${o.client} ${o.location} ${o.category}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [obras, search, filterStatus, filterCategory, filterReviewer, onlyMine, onlyOverdue, authorName, workspace.assignments])

  const filteredIds = useMemo(() => new Set(filtered.map((o) => o.id)), [filtered])

  useEffect(() => {
    // drop selection that no longer matches filters
    setSelected((prev) => {
      const next = new Set<string>()
      prev.forEach((id) => filteredIds.has(id) && next.add(id))
      return next
    })
  }, [filteredIds])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) setSelected(new Set())
    else setSelected(new Set(filtered.map((o) => o.id)))
  }

  // --- Status change (persists to local context + logs to Supabase) ---
  const applyStatus = useCallback(
    async (obraId: string, newStatus: ObraStatus, reason?: string) => {
      const obra = obras.find((o) => o.id === obraId)
      if (!obra) return
      if (obra.status === newStatus) return
      updateObra(obraId, { status: newStatus })
      await workspace.logDecision({
        obraId,
        obraTitle: obra.title,
        previousStatus: obra.status,
        newStatus,
        reason,
        authorName,
      })
    },
    [obras, updateObra, workspace, authorName],
  )

  const runBulk = useCallback(
    async (newStatus: ObraStatus) => {
      if (selected.size === 0) return
      const ids = Array.from(selected)
      for (const id of ids) await applyStatus(id, newStatus)
      toast.success(`${ids.length} ${ids.length === 1 ? "obra atualizada" : "obras atualizadas"}`)
      setSelected(new Set())
    },
    [applyStatus, selected],
  )

  // --- Keyboard shortcuts when drawer is open ---
  useEffect(() => {
    if (!drawerObra) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return
      const k = e.key.toLowerCase()
      if (k === "a") {
        e.preventDefault()
        applyStatus(drawerObra.id, "approved")
      } else if (k === "r") {
        e.preventDefault()
        applyStatus(drawerObra.id, "rejected")
      } else if (k === "i") {
        e.preventDefault()
        applyStatus(drawerObra.id, "info-needed")
      } else if (k === "n") {
        e.preventDefault()
        applyStatus(drawerObra.id, "in-analysis")
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [drawerObra, applyStatus])

  // --- Drag and drop (Kanban) ---
  const [dragOver, setDragOver] = useState<ObraStatus | null>(null)

  const onDragStart = (e: React.DragEvent, obraId: string) => {
    e.dataTransfer.setData("text/obra-id", obraId)
    e.dataTransfer.effectAllowed = "move"
  }

  const onDrop = async (e: React.DragEvent, newStatus: ObraStatus) => {
    e.preventDefault()
    setDragOver(null)
    const id = e.dataTransfer.getData("text/obra-id")
    if (!id) return
    await applyStatus(id, newStatus)
  }

  // --- Export audit ---
  const exportAudit = () => {
    const wb = XLSX.utils.book_new()

    const obraRows = filtered.map((o) => ({
      ID: o.id,
      Obra: o.title,
      Cliente: o.client,
      Localização: o.location,
      Categoria: o.category,
      Orçamento: o.budget,
      Estado: STATUS_META[o.status as ObraStatus]?.label || o.status,
      Revisor: workspace.assignments[o.id]?.reviewer_name || "—",
      "Idade (dias)": daysSince(o.createdAt),
      "Atrasado SLA": isOverdue(o.createdAt, o.status) ? "Sim" : "Não",
      Criada: new Date(o.createdAt).toLocaleString("pt-PT"),
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(obraRows), "Obras")

    const decisionRows = workspace.decisions.map((d) => ({
      Data: new Date(d.created_at).toLocaleString("pt-PT"),
      Obra: d.obra_title || d.obra_id,
      "Estado Anterior": d.previous_status || "—",
      "Novo Estado": STATUS_META[d.new_status as ObraStatus]?.label || d.new_status,
      Motivo: d.reason || "—",
      Autor: d.author_name || "—",
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(decisionRows), "Decisões")

    const kpiRows = [
      { KPI: "Pendentes", Valor: kpis.pending },
      { KPI: "Em análise", Valor: kpis.analysis },
      { KPI: "Info adicional", Valor: kpis.infoNeeded },
      { KPI: "Atrasadas SLA", Valor: kpis.overdue },
      { KPI: "Taxa de aprovação 30d (%)", Valor: kpis.approvalRate },
      { KPI: "Decisões 30d", Valor: kpis.decided30d },
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiRows), "KPIs")

    XLSX.writeFile(wb, `auditoria-aprovacoes-${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast.success("Auditoria exportada")
  }

  // --- Render ---
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Projetos / Validação"
        title="Aprovações"
        description="Pipeline de pré-validação de obras: KPIs, filtros avançados, quadro Kanban, ficha de revisão e registo auditável de decisões."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportAudit}>
              <Download className="mr-1.5 h-4 w-4" />
              Exportar Auditoria
            </Button>
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Pendentes"
          value={kpis.pending}
          icon={Clock}
          active={filterStatus === "pending"}
          onClick={() => setFilterStatus(filterStatus === "pending" ? "all" : "pending")}
        />
        <KpiCard
          label="Em Análise"
          value={kpis.analysis}
          icon={Eye}
          active={filterStatus === "in-analysis"}
          onClick={() => setFilterStatus(filterStatus === "in-analysis" ? "all" : "in-analysis")}
        />
        <KpiCard
          label="Info Adicional"
          value={kpis.infoNeeded}
          icon={Info}
          active={filterStatus === "info-needed"}
          onClick={() => setFilterStatus(filterStatus === "info-needed" ? "all" : "info-needed")}
        />
        <KpiCard
          label="Atrasadas SLA"
          value={kpis.overdue}
          icon={AlertTriangle}
          tone="high"
          active={onlyOverdue}
          onClick={() => setOnlyOverdue((v) => !v)}
        />
        <KpiCard
          label="Aprovação 30d"
          value={`${kpis.approvalRate}%`}
          sub={`${kpis.decided30d} decisões`}
          icon={CheckCircle2}
          tone="below"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card/30 p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar obra, cliente, localização..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-border/60 bg-background/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 border-border/60 bg-background/60">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterReviewer} onValueChange={setFilterReviewer}>
            <SelectTrigger className="w-44 border-border/60 bg-background/60">
              <SelectValue placeholder="Revisor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os revisores</SelectItem>
              <SelectItem value="__unassigned__">Sem atribuição</SelectItem>
              {reviewers.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-1.5">
            <Switch id="only-mine" checked={onlyMine} onCheckedChange={setOnlyMine} />
            <Label htmlFor="only-mine" className="cursor-pointer text-xs">
              Só minhas
            </Label>
          </div>

          <div className="flex overflow-hidden rounded-md border border-border/60">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                view === "list" ? "bg-primary text-primary-foreground" : "bg-background/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setView("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                view === "board" ? "bg-primary text-primary-foreground" : "bg-background/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <KanbanSquare className="h-3.5 w-3.5" />
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selected.size === filtered.length && filtered.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm">
              {selected.size} {selected.size === 1 ? "obra selecionada" : "obras selecionadas"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="bg-price-below text-white hover:bg-price-below/90"
              onClick={() => runBulk("approved")}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-price-above/40 bg-price-above/5 text-price-above hover:bg-price-above/10"
              onClick={() => runBulk("info-needed")}
            >
              <Info className="mr-1.5 h-4 w-4" />
              Pedir Info
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-price-high/40 bg-price-high/5 text-price-high hover:bg-price-high/10"
              onClick={() => runBulk("rejected")}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Rejeitar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Limpar
            </Button>
          </div>
        </div>
      )}

      {/* Body */}
      {view === "list" ? (
        <ListView
          obras={filtered}
          selected={selected}
          onToggleSelect={toggleSelect}
          onOpenDrawer={setDrawerObraId}
          assignments={workspace.assignments}
          onQuickAction={applyStatus}
        />
      ) : (
        <BoardView
          obras={filtered}
          assignments={workspace.assignments}
          dragOver={dragOver}
          setDragOver={setDragOver}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onOpenDrawer={setDrawerObraId}
        />
      )}

      <ReviewDrawer
        obra={drawerObra}
        open={Boolean(drawerObra)}
        onOpenChange={(o) => !o && setDrawerObraId(null)}
        decisionsForObra={drawerObra ? workspace.decisionsByObra.get(drawerObra.id) ?? [] : []}
        assignment={drawerObra ? workspace.assignments[drawerObra.id] ?? null : null}
        authorName={authorName}
        onDecision={async (input) => {
          updateObra(input.obraId, { status: input.newStatus })
          await workspace.logDecision({ ...input, authorName })
        }}
        onAssign={(obraId, name) => workspace.assignReviewer(obraId, name)}
        onClearAssignment={(obraId) => workspace.clearReviewer(obraId)}
        onLocalStatusChange={(obraId, status) => updateObra(obraId, { status })}
      />
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  active,
  onClick,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  tone?: "default" | "below" | "high"
  active?: boolean
  onClick?: () => void
}) {
  const clickable = Boolean(onClick)
  const toneClass =
    tone === "below"
      ? "text-price-below"
      : tone === "high"
      ? "text-price-high"
      : "text-foreground"

  const Wrapper: any = clickable ? "button" : "div"
  return (
    <Wrapper
      type={clickable ? "button" : undefined}
      onClick={onClick}
      className={`bp-bracket relative overflow-hidden rounded-lg border bg-card/30 p-5 text-left transition-colors ${
        active ? "border-primary/60 ring-1 ring-primary/50" : "border-border/60 hover:border-border"
      }`}
      aria-pressed={clickable ? active : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p className={`mt-3 font-display text-4xl font-medium tracking-tight tabular-nums ${toneClass}`}>
            {value}
          </p>
          {sub && <p className="mt-1 text-[10px] text-muted-foreground">{sub}</p>}
        </div>
        <div className="rounded-md border border-border/60 bg-background/60 p-2 text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </Wrapper>
  )
}

function ListView({
  obras,
  selected,
  onToggleSelect,
  onOpenDrawer,
  assignments,
  onQuickAction,
}: {
  obras: Obra[]
  selected: Set<string>
  onToggleSelect: (id: string) => void
  onOpenDrawer: (id: string) => void
  assignments: Record<string, { reviewer_name: string | null }>
  onQuickAction: (id: string, status: ObraStatus) => void
}) {
  if (obras.length === 0) {
    return (
      <Card className="border-border/60 bg-card/30">
        <CardContent className="py-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhuma obra encontrada com os filtros selecionados.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <ul className="space-y-3">
      {obras.map((obra) => {
        const meta = STATUS_META[obra.status as ObraStatus]
        const overdue = isOverdue(obra.createdAt, obra.status)
        const age = daysSince(obra.createdAt)
        const assignment = assignments[obra.id]
        const checked = selected.has(obra.id)

        return (
          <li key={obra.id}>
            <Card
              className={`border-border/60 bg-card/30 transition-colors ${
                checked ? "ring-1 ring-primary/50 border-primary/40" : ""
              }`}
            >
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggleSelect(obra.id)}
                      aria-label="Selecionar obra"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onOpenDrawer(obra.id)}
                          className="text-left font-semibold text-base hover:text-primary transition-colors"
                        >
                          {obra.title}
                        </button>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {obra.category || "—"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {obra.location || "—"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Euro className="h-3 w-3" />
                            {(obra.budget || 0).toLocaleString("pt-PT")} €
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {age}d
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {overdue && (
                          <Badge
                            variant="outline"
                            className="border-price-high/40 bg-price-high/10 text-price-high font-mono text-[10px]"
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            SLA
                          </Badge>
                        )}
                        {assignment?.reviewer_name && (
                          <Badge
                            variant="outline"
                            className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px]"
                          >
                            <UserPlus className="mr-1 h-3 w-3" />
                            {assignment.reviewer_name}
                          </Badge>
                        )}
                        {meta && (
                          <Badge variant="outline" className={meta.chip}>
                            {meta.label}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {obra.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{obra.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => onOpenDrawer(obra.id)}>
                        <Eye className="mr-1.5 h-4 w-4" />
                        Rever
                      </Button>
                      <Link href={`/dashboard/obras/${obra.id}`}>
                        <Button size="sm" variant="ghost">
                          Ficha completa
                        </Button>
                      </Link>
                      <div className="flex-1" />
                      {obra.status !== "approved" && (
                        <Button
                          size="sm"
                          className="bg-price-below text-white hover:bg-price-below/90"
                          onClick={() => onQuickAction(obra.id, "approved")}
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          Aprovar
                        </Button>
                      )}
                      {obra.status !== "info-needed" && obra.status !== "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-price-above/40 bg-price-above/5 text-price-above hover:bg-price-above/10"
                          onClick={() => onQuickAction(obra.id, "info-needed")}
                        >
                          <Info className="mr-1.5 h-4 w-4" />
                          Pedir Info
                        </Button>
                      )}
                      {obra.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-price-high/40 bg-price-high/5 text-price-high hover:bg-price-high/10"
                          onClick={() => onQuickAction(obra.id, "rejected")}
                        >
                          <XCircle className="mr-1.5 h-4 w-4" />
                          Rejeitar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}

function BoardView({
  obras,
  assignments,
  dragOver,
  setDragOver,
  onDragStart,
  onDrop,
  onOpenDrawer,
}: {
  obras: Obra[]
  assignments: Record<string, { reviewer_name: string | null }>
  dragOver: ObraStatus | null
  setDragOver: (s: ObraStatus | null) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDrop: (e: React.DragEvent, status: ObraStatus) => void
  onOpenDrawer: (id: string) => void
}) {
  const columns = STATUS_ORDER.map((status) => ({
    status,
    meta: STATUS_META[status],
    items: obras.filter((o) => o.status === status),
  }))

  return (
    <div className="grid gap-3 lg:grid-cols-5">
      {columns.map(({ status, meta, items }) => {
        const highlighted = dragOver === status
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = "move"
              if (dragOver !== status) setDragOver(status)
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => onDrop(e, status)}
            className={`rounded-lg border bg-card/30 p-3 transition-colors ${
              highlighted ? "border-primary/60 bg-primary/5" : meta.kanban
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {meta.label}
              </p>
              <span className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 font-mono text-[10px] tabular-nums">
                {items.length}
              </span>
            </div>

            <ul className="space-y-2">
              {items.map((obra) => {
                const overdue = isOverdue(obra.createdAt, obra.status)
                const assignment = assignments[obra.id]
                return (
                  <li
                    key={obra.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, obra.id)}
                    onClick={() => onOpenDrawer(obra.id)}
                    className="cursor-grab rounded-md border border-border/60 bg-background/60 p-3 transition-colors hover:border-primary/40 hover:shadow-sm active:cursor-grabbing"
                  >
                    <p className="line-clamp-2 text-sm font-medium">{obra.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {obra.client} · {obra.location}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {obra.budget > 0 && (
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                          {obra.budget.toLocaleString("pt-PT")} €
                        </span>
                      )}
                      {overdue && (
                        <Badge
                          variant="outline"
                          className="border-price-high/40 bg-price-high/10 text-price-high font-mono text-[10px] px-1.5 py-0"
                        >
                          SLA
                        </Badge>
                      )}
                      {assignment?.reviewer_name && (
                        <Badge
                          variant="outline"
                          className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] px-1.5 py-0"
                        >
                          {assignment.reviewer_name.split(" ")[0]}
                        </Badge>
                      )}
                    </div>
                  </li>
                )
              })}
              {items.length === 0 && (
                <li className="rounded-md border border-dashed border-border/60 bg-muted/10 px-3 py-6 text-center text-[11px] text-muted-foreground">
                  Largar aqui
                </li>
              )}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
