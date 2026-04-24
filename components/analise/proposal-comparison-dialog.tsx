"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, Minus, Trophy, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { AnalysisResult, BudgetItem, SavedAnalysisFull, SavedAnalysisSummary } from "@/lib/analise/types"

interface ProposalComparisonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saved: SavedAnalysisSummary[]
  currentAnalysis: AnalysisResult | null
  currentAnalysisId: string | null
}

type Participant = {
  id: string
  label: string
  source: "current" | "saved"
  data: AnalysisResult | SavedAnalysisFull
  items: BudgetItem[]
  total: number
}

const fmt = (n: number) =>
  n.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })

function normaliseKey(item: BudgetItem) {
  return (item.matchedName ?? item.originalName ?? "").trim().toLowerCase()
}

export function ProposalComparisonDialog({
  open,
  onOpenChange,
  saved,
  currentAnalysis,
  currentAnalysisId,
}: ProposalComparisonDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadedById, setLoadedById] = useState<Record<string, SavedAnalysisFull>>({})
  const [loading, setLoading] = useState(false)

  // Reset on open
  useEffect(() => {
    if (!open) return
    const initial: string[] = []
    if (currentAnalysisId) initial.push(`current:${currentAnalysisId}`)
    else if (currentAnalysis) initial.push("current:live")
    setSelectedIds(initial)
  }, [open, currentAnalysis, currentAnalysisId])

  const toggle = (key: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key)
      if (prev.length >= 4) return prev
      return [...prev, key]
    })
  }

  // Fetch saved analyses selected
  useEffect(() => {
    if (!open) return
    const missing = selectedIds
      .filter((k) => !k.startsWith("current:"))
      .filter((id) => !loadedById[id])
    if (missing.length === 0) return
    setLoading(true)
    ;(async () => {
      const results: Record<string, SavedAnalysisFull> = {}
      for (const id of missing) {
        try {
          const res = await fetch(`/api/analise/saved/${id}`)
          if (res.ok) {
            const json = (await res.json()) as { analysis: SavedAnalysisFull }
            results[id] = json.analysis
          }
        } catch (err) {
          console.log("[v0] comparison fetch error:", err)
        }
      }
      setLoadedById((prev) => ({ ...prev, ...results }))
      setLoading(false)
    })()
  }, [selectedIds, loadedById, open])

  const participants: Participant[] = useMemo(() => {
    const out: Participant[] = []
    for (const key of selectedIds) {
      if (key.startsWith("current:") && currentAnalysis) {
        out.push({
          id: key,
          label: `Atual · ${currentAnalysis.fileName}`,
          source: "current",
          data: currentAnalysis,
          items: currentAnalysis.items,
          total: currentAnalysis.totalBudget,
        })
      } else {
        const full = loadedById[key]
        if (full) {
          out.push({
            id: key,
            label: full.file_name,
            source: "saved",
            data: full,
            items: full.items ?? [],
            total: full.total_budget ?? 0,
          })
        }
      }
    }
    return out
  }, [selectedIds, currentAnalysis, loadedById])

  // Build union of item keys
  const rows = useMemo(() => {
    if (participants.length === 0) return []
    const keyMap = new Map<string, { label: string; perParticipant: Record<string, BudgetItem | null> }>()
    for (const p of participants) {
      for (const item of p.items) {
        const key = normaliseKey(item)
        if (!key) continue
        if (!keyMap.has(key)) {
          keyMap.set(key, {
            label: item.matchedName ?? item.originalName,
            perParticipant: Object.fromEntries(participants.map((pp) => [pp.id, null])),
          })
        }
        const row = keyMap.get(key)!
        const existing = row.perParticipant[p.id]
        // Keep cheaper one if duplicates in a single participant
        if (!existing || item.budgetPrice * item.quantity < existing.budgetPrice * existing.quantity) {
          row.perParticipant[p.id] = item
        }
      }
    }
    return Array.from(keyMap.values())
      .map((row) => {
        const entries = participants.map((p) => {
          const item = row.perParticipant[p.id]
          return {
            participantId: p.id,
            item,
            unit: item?.budgetPrice ?? null,
          }
        })
        const available = entries.filter((e) => e.unit != null).map((e) => e.unit as number)
        const min = available.length ? Math.min(...available) : null
        return { label: row.label, entries, min }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [participants])

  const totalsWinner = participants.length
    ? participants.reduce((best, p) => (p.total < best.total ? p : best), participants[0])
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-border/60 bg-card/30 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Comparação · Propostas
          </p>
          <DialogTitle className="font-display text-2xl font-medium tracking-tight">
            Comparar Propostas
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Selecione até 4 análises guardadas para comparar lado-a-lado.
          </DialogDescription>
        </DialogHeader>

        {/* Participant picker */}
        <div className="border-b border-border/60 bg-background/40 px-6 py-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Participantes · {selectedIds.length}/4
          </p>
          <div className="flex flex-wrap gap-2">
            {currentAnalysis && (
              <Chip
                active={selectedIds.some((k) => k.startsWith("current:"))}
                label={`Atual · ${currentAnalysis.fileName}`}
                onClick={() =>
                  toggle(currentAnalysisId ? `current:${currentAnalysisId}` : "current:live")
                }
              />
            )}
            {saved.map((s) => (
              <Chip
                key={s.id}
                active={selectedIds.includes(s.id)}
                label={s.file_name}
                sub={fmt(s.total_budget ?? 0)}
                onClick={() => toggle(s.id)}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="max-h-[65vh]">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">A carregar…</span>
            </div>
          )}

          {!loading && participants.length < 2 && (
            <div className="px-6 py-12 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Selecione pelo menos 2 propostas
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                A comparação aparece assim que escolher propostas suficientes.
              </p>
            </div>
          )}

          {!loading && participants.length >= 2 && (
            <div className="px-6 py-4">
              {/* Totals band */}
              <div
                className="grid gap-px overflow-hidden rounded-md border border-border/60 bg-border/60"
                style={{ gridTemplateColumns: `repeat(${participants.length}, minmax(0, 1fr))` }}
              >
                {participants.map((p) => {
                  const isWinner = totalsWinner?.id === p.id
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "bg-background/60 px-4 py-4",
                        isWinner && "bg-price-below/5",
                      )}
                    >
                      <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {p.label}
                      </p>
                      <p
                        className={cn(
                          "mt-1 font-display text-xl font-medium tabular-nums tracking-tight",
                          isWinner && "text-price-below",
                        )}
                      >
                        {fmt(p.total)}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em]",
                          isWinner ? "text-price-below" : "text-muted-foreground",
                        )}
                      >
                        {isWinner ? (
                          <>
                            <Trophy className="h-3 w-3" aria-hidden="true" />
                            Mais barato
                          </>
                        ) : (
                          <>+ {fmt(p.total - (totalsWinner?.total ?? 0))}</>
                        )}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Item-by-item table */}
              <div className="mt-6 overflow-hidden rounded-md border border-border/60">
                <div
                  className="grid gap-px border-b border-border/60 bg-border/60"
                  style={{
                    gridTemplateColumns: `minmax(0,2fr) repeat(${participants.length}, minmax(0, 1fr))`,
                  }}
                >
                  <div className="bg-card/40 px-3 py-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Item
                    </p>
                  </div>
                  {participants.map((p) => (
                    <div key={p.id} className="truncate bg-card/40 px-3 py-2">
                      <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {p.label}
                      </p>
                    </div>
                  ))}
                </div>

                <ul className="divide-y divide-border/40">
                  {rows.slice(0, 200).map((row) => (
                    <li
                      key={row.label}
                      className="grid items-center gap-px bg-border/30"
                      style={{
                        gridTemplateColumns: `minmax(0,2fr) repeat(${participants.length}, minmax(0, 1fr))`,
                      }}
                    >
                      <div className="bg-background/80 px-3 py-2">
                        <p className="truncate text-sm">{row.label}</p>
                      </div>
                      {row.entries.map((e) => {
                        const item = e.item
                        const isWinner =
                          item != null && row.min != null && item.budgetPrice === row.min
                        return (
                          <div
                            key={e.participantId}
                            className={cn(
                              "bg-background/80 px-3 py-2 text-right font-mono text-xs tabular-nums",
                              item == null && "text-muted-foreground/60",
                              isWinner && item != null && "text-price-below",
                            )}
                          >
                            {item == null ? (
                              <span className="inline-flex items-center gap-1">
                                <Minus className="h-3 w-3" aria-hidden="true" />
                                n/a
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-end gap-1">
                                {isWinner && <Check className="h-3 w-3" aria-hidden="true" />}
                                €{item.budgetPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </li>
                  ))}
                </ul>

                {rows.length > 200 && (
                  <div className="border-t border-border/60 bg-card/30 px-3 py-2 text-center">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      A mostrar 200 de {rows.length} itens
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-end border-t border-border/60 bg-card/30 px-6 py-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-full">
            <X className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Chip({
  active,
  label,
  sub,
  onClick,
}: {
  active: boolean
  label: string
  sub?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex max-w-[240px] items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
        active
          ? "border-primary/60 bg-primary/10 text-foreground"
          : "border-border/60 bg-background/40 text-muted-foreground hover:border-border hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border",
          active ? "border-primary bg-primary text-primary-foreground" : "border-border/60 bg-background",
        )}
        aria-hidden="true"
      >
        {active && <Check className="h-2.5 w-2.5" />}
      </span>
      <span className="truncate text-sm">{label}</span>
      {sub && <span className="font-mono text-[10px] text-muted-foreground">{sub}</span>}
    </button>
  )
}
