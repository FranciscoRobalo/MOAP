"use client"

import { useMemo, useState } from "react"
import { RotateCcw, Wand2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { AnalysisResult } from "@/lib/analise/types"

interface SavingsSimulatorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysis: AnalysisResult | null
}

const fmt = (n: number) =>
  n.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })

export function SavingsSimulatorSheet({
  open,
  onOpenChange,
  analysis,
}: SavingsSimulatorSheetProps) {
  // key = item.id, value = simulated unit price
  const [overrides, setOverrides] = useState<Record<string, number>>({})

  const candidates = useMemo(
    () =>
      (analysis?.items ?? []).filter(
        (i) => (i.rating === "above" || i.rating === "critical") && i.referenceAvgPrice != null,
      ),
    [analysis],
  )

  const baseTotal = analysis?.totalBudget ?? 0
  const simulatedTotal = useMemo(() => {
    if (!analysis) return 0
    return analysis.items.reduce((acc, item) => {
      const unit = overrides[item.id] ?? item.budgetPrice
      return acc + unit * item.quantity
    }, 0)
  }, [analysis, overrides])

  const savings = baseTotal - simulatedTotal
  const savingsPct = baseTotal > 0 ? (savings / baseTotal) * 100 : 0

  const applyAllToReference = () => {
    const next: Record<string, number> = {}
    for (const item of candidates) {
      if (item.referenceAvgPrice != null) next[item.id] = item.referenceAvgPrice
    }
    setOverrides(next)
  }

  const resetAll = () => setOverrides({})

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border/60 bg-card/30 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Simulador · What-if
          </p>
          <SheetTitle className="font-display text-2xl font-medium tracking-tight">
            Simulador de Poupança
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Ajuste preços dos itens sinalizados e veja o impacto total em tempo real.
          </SheetDescription>
        </SheetHeader>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-px border-b border-border/60 bg-border/60">
          <Stat label="Total atual" value={fmt(baseTotal)} />
          <Stat label="Total simulado" value={fmt(simulatedTotal)} />
          <Stat
            label="Poupança"
            value={fmt(Math.max(savings, 0))}
            detail={`${savings >= 0 ? "−" : "+"}${Math.abs(savingsPct).toFixed(1)}%`}
            tone={savings > 0 ? "below" : savings < 0 ? "critical" : "muted"}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-b border-border/60 bg-background/40 px-6 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {candidates.length} itens sinalizados
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetAll}
              className="rounded-full"
              disabled={Object.keys(overrides).length === 0}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Reiniciar
            </Button>
            <Button
              size="sm"
              onClick={applyAllToReference}
              disabled={candidates.length === 0}
              className="rounded-full"
            >
              <Wand2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Alinhar pela referência
            </Button>
          </div>
        </div>

        {/* List */}
        <ScrollArea className="flex-1">
          <ul className="divide-y divide-border/40">
            {candidates.length === 0 && (
              <li className="px-6 py-10 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Sem itens sinalizados
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Não há itens acima da média para simular.
                </p>
              </li>
            )}
            {candidates.map((item) => {
              const unit = overrides[item.id] ?? item.budgetPrice
              const lineTotal = unit * item.quantity
              const baseLine = item.budgetPrice * item.quantity
              const delta = lineTotal - baseLine
              const refPct =
                item.referenceAvgPrice != null && item.referenceAvgPrice > 0
                  ? ((unit - item.referenceAvgPrice) / item.referenceAvgPrice) * 100
                  : null
              return (
                <li key={item.id} className="grid gap-3 px-6 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.matchedName ?? item.originalName}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {item.quantity} {item.unit} · ref. €
                      {item.referenceAvgPrice?.toFixed(2) ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        €
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        value={unit}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          if (Number.isNaN(v)) return
                          setOverrides((prev) => ({ ...prev, [item.id]: v }))
                        }}
                        className="h-7 w-24 border-0 bg-transparent p-0 text-right font-mono text-sm shadow-none focus-visible:ring-0"
                      />
                    </div>
                    <div className="min-w-[90px] text-right">
                      <p className="font-mono text-sm tabular-nums">{fmt(lineTotal)}</p>
                      <p
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-[0.18em]",
                          delta < 0 ? "text-price-below" : delta > 0 ? "text-price-critical" : "text-muted-foreground",
                        )}
                      >
                        {delta === 0 ? "=" : delta < 0 ? "−" : "+"}
                        {fmt(Math.abs(delta))}
                        {refPct != null ? ` · ${refPct > 0 ? "+" : ""}${refPct.toFixed(0)}%` : ""}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function Stat({
  label,
  value,
  detail,
  tone = "muted",
}: {
  label: string
  value: string
  detail?: string
  tone?: "muted" | "below" | "critical"
}) {
  const toneClass =
    tone === "below" ? "text-price-below" : tone === "critical" ? "text-price-critical" : "text-foreground"
  return (
    <div className="bg-background/60 px-4 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-display text-xl font-medium tabular-nums tracking-tight", toneClass)}>
        {value}
      </p>
      {detail && (
        <p className={cn("mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em]", toneClass)}>
          {detail}
        </p>
      )}
    </div>
  )
}
