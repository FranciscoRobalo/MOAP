"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  UserPlus,
  XCircle,
  History as HistoryIcon,
  ListChecks,
  Calendar,
  Building2,
  MapPin,
  Euro,
} from "lucide-react"
import type { Obra } from "@/contexts/data-context"
import { toast } from "sonner"
import type {
  AssignmentRow,
  ChecklistRow,
  CommentRow,
  DecisionRow,
  ObraStatus,
} from "@/lib/aprovacoes/types"
import { STATUS_META, daysSince, isOverdue } from "@/lib/aprovacoes/types"

const DEFAULT_CHECKLIST = [
  "Documento de identificação do cliente",
  "Morada e confirmação da localização",
  "Área e tipologia validadas",
  "Orçamento preliminar revisto",
  "Datas de início/fim realistas",
  "Licenciamento ou pareceres necessários",
]

type Props = {
  obra: Obra | null
  open: boolean
  onOpenChange: (open: boolean) => void
  decisionsForObra: DecisionRow[]
  assignment: AssignmentRow | null
  authorName?: string | null
  onDecision: (input: {
    obraId: string
    obraTitle: string
    previousStatus: string
    newStatus: ObraStatus
    reason?: string
  }) => Promise<void>
  onAssign: (obraId: string, reviewerName: string | null) => Promise<void>
  onClearAssignment: (obraId: string) => Promise<void>
  onLocalStatusChange: (obraId: string, status: ObraStatus) => void
}

export function ReviewDrawer({
  obra,
  open,
  onOpenChange,
  decisionsForObra,
  assignment,
  authorName,
  onDecision,
  onAssign,
  onClearAssignment,
  onLocalStatusChange,
}: Props) {
  const [tab, setTab] = useState("detalhes")
  const [comments, setComments] = useState<CommentRow[]>([])
  const [checklist, setChecklist] = useState<ChecklistRow[]>([])
  const [newComment, setNewComment] = useState("")
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [reason, setReason] = useState("")
  const [isSubmitting, setSubmitting] = useState(false)
  const [reviewerInput, setReviewerInput] = useState("")

  useEffect(() => {
    if (!obra || !open) return
    setTab("detalhes")
    setReason("")
    setReviewerInput(assignment?.reviewer_name ?? "")

    fetch(`/api/aprovacoes/comments?obraId=${encodeURIComponent(obra.id)}`)
      .then((r) => (r.ok ? r.json() : { comments: [] }))
      .then((d) => setComments(d.comments ?? []))
      .catch(() => setComments([]))

    fetch(`/api/aprovacoes/checklist?obraId=${encodeURIComponent(obra.id)}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then(async (d) => {
        const items = (d.items ?? []) as ChecklistRow[]
        if (items.length === 0) {
          // Seed default checklist the first time an obra is opened
          const seeded: ChecklistRow[] = []
          for (let i = 0; i < DEFAULT_CHECKLIST.length; i++) {
            const res = await fetch("/api/aprovacoes/checklist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ obraId: obra.id, label: DEFAULT_CHECKLIST[i], position: i }),
            })
            if (res.ok) {
              const { item } = await res.json()
              seeded.push(item)
            }
          }
          setChecklist(seeded)
        } else {
          setChecklist(items)
        }
      })
      .catch(() => setChecklist([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obra?.id, open])

  const addComment = useCallback(async () => {
    if (!obra || !newComment.trim()) return
    const body = newComment.trim()
    setNewComment("")
    try {
      const res = await fetch("/api/aprovacoes/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ obraId: obra.id, body, authorName }),
      })
      if (!res.ok) throw new Error()
      const { comment } = (await res.json()) as { comment: CommentRow }
      setComments((prev) => [...prev, comment])
    } catch {
      toast.error("Erro a adicionar comentário")
    }
  }, [obra, newComment, authorName])

  const deleteComment = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/aprovacoes/comments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch {
      toast.error("Erro a remover comentário")
    }
  }, [])

  const addChecklistItem = useCallback(async () => {
    if (!obra || !newChecklistItem.trim()) return
    const label = newChecklistItem.trim()
    setNewChecklistItem("")
    try {
      const res = await fetch("/api/aprovacoes/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ obraId: obra.id, label, position: checklist.length }),
      })
      if (!res.ok) throw new Error()
      const { item } = (await res.json()) as { item: ChecklistRow }
      setChecklist((prev) => [...prev, item])
    } catch {
      toast.error("Erro a adicionar item")
    }
  }, [obra, newChecklistItem, checklist.length])

  const toggleChecklistItem = useCallback(async (id: string, isDone: boolean) => {
    setChecklist((prev) => prev.map((it) => (it.id === id ? { ...it, is_done: isDone } : it)))
    try {
      const res = await fetch("/api/aprovacoes/checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDone }),
      })
      if (!res.ok) throw new Error()
    } catch {
      toast.error("Erro a atualizar item")
      setChecklist((prev) => prev.map((it) => (it.id === id ? { ...it, is_done: !isDone } : it)))
    }
  }, [])

  const deleteChecklistItem = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/aprovacoes/checklist?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      setChecklist((prev) => prev.filter((it) => it.id !== id))
    } catch {
      toast.error("Erro a remover item")
    }
  }, [])

  const checklistDone = checklist.filter((c) => c.is_done).length
  const checklistTotal = checklist.length
  const checklistPct = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0

  const applyDecision = useCallback(
    async (newStatus: ObraStatus) => {
      if (!obra || isSubmitting) return
      setSubmitting(true)
      try {
        await onDecision({
          obraId: obra.id,
          obraTitle: obra.title,
          previousStatus: obra.status,
          newStatus,
          reason: reason.trim() || undefined,
        })
        onLocalStatusChange(obra.id, newStatus)
        setReason("")
        toast.success(`Estado atualizado: ${STATUS_META[newStatus].label}`)
      } finally {
        setSubmitting(false)
      }
    },
    [obra, isSubmitting, onDecision, onLocalStatusChange, reason],
  )

  const applyAssignment = useCallback(async () => {
    if (!obra) return
    const next = reviewerInput.trim()
    if (!next) {
      await onClearAssignment(obra.id)
      toast.success("Atribuição removida")
      return
    }
    await onAssign(obra.id, next)
    toast.success(`Atribuído a ${next}`)
  }, [obra, reviewerInput, onAssign, onClearAssignment])

  const statusMeta = useMemo(
    () => (obra ? STATUS_META[obra.status as ObraStatus] : null),
    [obra],
  )

  if (!obra) return null

  const overdue = isOverdue(obra.createdAt, obra.status)
  const age = daysSince(obra.createdAt)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden p-0 flex flex-col">
        <SheetHeader className="border-b border-border/60 bg-muted/20 p-6 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Ficha de aprovação · #{obra.id.slice(0, 8)}
              </p>
              <SheetTitle className="mt-2 font-display text-2xl leading-tight tracking-tight">
                {obra.title}
              </SheetTitle>
              <SheetDescription className="mt-1 text-sm text-muted-foreground">
                {obra.client} · {obra.location}
              </SheetDescription>
            </div>
            {statusMeta && (
              <Badge variant="outline" className={statusMeta.chip}>
                {statusMeta.label}
              </Badge>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-border/60 bg-background/60 font-mono text-[10px]">
              <Clock className="mr-1 h-3 w-3" />
              {age}d em fila
            </Badge>
            {overdue && (
              <Badge variant="outline" className="border-price-high/40 bg-price-high/10 text-price-high font-mono text-[10px]">
                Atrasado SLA
              </Badge>
            )}
            {assignment?.reviewer_name && (
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px]">
                <UserPlus className="mr-1 h-3 w-3" />
                {assignment.reviewer_name}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 grid grid-cols-5 gap-1">
            <TabsTrigger value="detalhes" className="text-xs">
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs">
              <ListChecks className="mr-1 h-3.5 w-3.5" />
              {checklistDone}/{checklistTotal}
            </TabsTrigger>
            <TabsTrigger value="comentarios" className="text-xs">
              <MessageSquare className="mr-1 h-3.5 w-3.5" />
              {comments.length}
            </TabsTrigger>
            <TabsTrigger value="historico" className="text-xs">
              <HistoryIcon className="mr-1 h-3.5 w-3.5" />
              {decisionsForObra.length}
            </TabsTrigger>
            <TabsTrigger value="decisao" className="text-xs">
              Decisão
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6 py-4">
            <TabsContent value="detalhes" className="space-y-4 outline-none">
              <div className="grid grid-cols-2 gap-3">
                <Field icon={Building2} label="Categoria" value={obra.category || "—"} />
                <Field icon={MapPin} label="Localização" value={obra.location || "—"} />
                <Field icon={Euro} label="Orçamento" value={`${(obra.budget || 0).toLocaleString("pt-PT")} €`} />
                <Field icon={Calendar} label="Criada" value={new Date(obra.createdAt).toLocaleDateString("pt-PT")} />
                {obra.type && <Field label="Tipo" value={obra.type} />}
                {obra.area && <Field label="Área" value={obra.area} />}
              </div>
              {obra.description && (
                <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm leading-relaxed text-foreground/90">
                  {obra.description}
                </div>
              )}
              {obra.contact && (obra.contact.email || obra.contact.phone) && (
                <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Contacto</p>
                  <p className="mt-1 text-foreground">{obra.contact.name}</p>
                  {obra.contact.email && <p className="text-muted-foreground">{obra.contact.email}</p>}
                  {obra.contact.phone && <p className="text-muted-foreground">{obra.contact.phone}</p>}
                </div>
              )}
            </TabsContent>

            <TabsContent value="checklist" className="space-y-3 outline-none">
              <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Progresso
                  </p>
                  <p className="font-mono text-xs tabular-nums">
                    {checklistDone} / {checklistTotal} · {checklistPct}%
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${checklistPct}%` }}
                  />
                </div>
              </div>
              <ul className="space-y-1">
                {checklist.map((it) => (
                  <li
                    key={it.id}
                    className="group flex items-center gap-3 rounded-md border border-transparent px-2 py-2 hover:border-border/60 hover:bg-muted/20"
                  >
                    <Checkbox
                      checked={it.is_done}
                      onCheckedChange={(v) => toggleChecklistItem(it.id, Boolean(v))}
                    />
                    <span
                      className={`flex-1 text-sm ${
                        it.is_done ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {it.label}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground opacity-0 group-hover:opacity-100"
                      onClick={() => deleteChecklistItem(it.id)}
                      title="Remover item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Adicionar requisito..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                  className="border-border/60 bg-background/60"
                />
                <Button size="sm" variant="outline" onClick={addChecklistItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="comentarios" className="space-y-3 outline-none">
              <ul className="space-y-3">
                {comments.length === 0 && (
                  <li className="rounded-md border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
                    Ainda sem comentários internos.
                  </li>
                )}
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className="group rounded-md border border-border/60 bg-muted/20 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {c.author_name || "Anónimo"} · {new Date(c.created_at).toLocaleString("pt-PT")}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground opacity-0 group-hover:opacity-100"
                        onClick={() => deleteComment(c.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Escrever comentário interno..."
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addComment()
                  }}
                  className="border-border/60 bg-background/60"
                />
                <Button size="sm" onClick={addComment} disabled={!newComment.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Cmd/Ctrl + Enter para submeter</p>
            </TabsContent>

            <TabsContent value="historico" className="space-y-3 outline-none">
              {decisionsForObra.length === 0 ? (
                <div className="rounded-md border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
                  Sem decisões registadas.
                </div>
              ) : (
                <ol className="relative space-y-3 border-l border-border/60 pl-4">
                  {decisionsForObra.map((d) => {
                    const meta = STATUS_META[(d.new_status as ObraStatus) ?? "pending"]
                    return (
                      <li key={d.id} className="relative">
                        <span className="absolute -left-[21px] top-2 h-2.5 w-2.5 rounded-full border border-border bg-background" />
                        <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline" className={meta?.chip || ""}>
                              {meta?.label || d.new_status}
                            </Badge>
                            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                              {new Date(d.created_at).toLocaleString("pt-PT")}
                            </p>
                          </div>
                          {d.previous_status && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              de <span className="font-mono">{d.previous_status}</span> →{" "}
                              <span className="font-mono">{d.new_status}</span>
                            </p>
                          )}
                          {d.reason && <p className="mt-2 text-sm">{d.reason}</p>}
                          {d.author_name && (
                            <p className="mt-2 text-[10px] text-muted-foreground">por {d.author_name}</p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </TabsContent>

            <TabsContent value="decisao" className="space-y-5 outline-none">
              <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Atribuir técnico revisor
                </p>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Nome do técnico responsável"
                    value={reviewerInput}
                    onChange={(e) => setReviewerInput(e.target.value)}
                    className="border-border/60 bg-background/60"
                  />
                  <Button variant="outline" size="sm" onClick={applyAssignment}>
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Atribuir
                  </Button>
                </div>
              </div>

              <div className="h-px w-full bg-border/60" role="separator" />

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Justificação (opcional)
                </p>
                <Textarea
                  placeholder="Motivo ou notas da decisão..."
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2 border-border/60 bg-background/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  className="bg-price-below text-white hover:bg-price-below/90"
                  onClick={() => applyDecision("approved")}
                  disabled={isSubmitting || obra.status === "approved"}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  )}
                  Aprovar <Kbd>A</Kbd>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-price-high/40 bg-price-high/5 text-price-high hover:bg-price-high/10"
                  onClick={() => applyDecision("rejected")}
                  disabled={isSubmitting || obra.status === "rejected"}
                >
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Rejeitar <Kbd>R</Kbd>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-price-above/40 bg-price-above/5 text-price-above hover:bg-price-above/10"
                  onClick={() => applyDecision("info-needed")}
                  disabled={isSubmitting || obra.status === "info-needed"}
                >
                  <Info className="mr-1.5 h-4 w-4" />
                  Pedir Info <Kbd>I</Kbd>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyDecision("in-analysis")}
                  disabled={isSubmitting || obra.status === "in-analysis"}
                >
                  <Clock className="mr-1.5 h-4 w-4" />
                  Em Análise <Kbd>N</Kbd>
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground">
                Atalhos: <Kbd>A</Kbd> aprovar · <Kbd>R</Kbd> rejeitar · <Kbd>I</Kbd> pedir info ·{" "}
                <Kbd>N</Kbd> análise · <Kbd>Esc</Kbd> fechar
              </p>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 p-3">
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="ml-1.5 inline-flex h-4 items-center rounded border border-border/60 bg-background/60 px-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
      {children}
    </kbd>
  )
}
