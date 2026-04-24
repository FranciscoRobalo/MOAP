"use client"

import { useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { pt } from "date-fns/locale"
import { Archive, Loader2, Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SavedAnalysisSummary } from "@/lib/analise/types"

interface HistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saved: SavedAnalysisSummary[]
  isLoading: boolean
  refresh: () => void
  onLoad: (id: string) => void
  onDelete: (id: string) => void
}

const fmt = (n: number | null | undefined) =>
  n == null
    ? "—"
    : n.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })

const ratingTone: Record<string, string> = {
  below: "text-price-below border-price-below/40 bg-price-below/10",
  average: "text-price-average border-price-average/40 bg-price-average/10",
  above: "text-price-above border-price-above/40 bg-price-above/10",
  critical: "text-price-critical border-price-critical/40 bg-price-critical/10",
}

export function HistorySheet({
  open,
  onOpenChange,
  saved,
  isLoading,
  refresh,
  onLoad,
  onDelete,
}: HistorySheetProps) {
  useEffect(() => {
    if (open) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border/60 bg-card/30 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Arquivo · análises guardadas
          </p>
          <SheetTitle className="font-display text-2xl font-medium tracking-tight">
            Histórico
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Recupere análises anteriores, compare-as ou elimine as que já não precisa.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 px-6 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">A carregar…</span>
            </div>
          )}
          {!isLoading && saved.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Archive className="mx-auto h-5 w-5 text-muted-foreground/60" aria-hidden="true" />
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Sem análises guardadas
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Guarde a análise atual para a encontrar aqui mais tarde.
              </p>
            </div>
          )}
          <ul className="divide-y divide-border/40">
            {saved.map((s) => (
              <li key={s.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.file_name}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: pt })}
                      {s.region ? ` · ${s.region}` : ""}
                    </p>
                  </div>
                  {s.overall_rating && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em]",
                        ratingTone[s.overall_rating] ?? "text-muted-foreground border-border/60",
                      )}
                    >
                      {s.overall_rating}
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border/60 bg-border/60">
                  <Mini label="Total" value={fmt(s.total_budget)} />
                  <Mini label="Poupança" value={fmt(s.potential_savings)} />
                  <Mini
                    label="Match"
                    value={s.match_rate != null ? `${s.match_rate.toFixed(0)}%` : "—"}
                  />
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(s.id)}
                    className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    Eliminar
                  </Button>
                  <Button size="sm" onClick={() => onLoad(s.id)} className="rounded-full">
                    Abrir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background/60 px-3 py-2">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm tabular-nums">{value}</p>
    </div>
  )
}
