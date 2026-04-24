"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Copy, Loader2, RotateCw, Sparkles, MessageSquare } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { BudgetItem } from "@/lib/analise/types"

interface NegotiationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysisId: string | null
  item: BudgetItem | null
  region?: string
}

export function NegotiationDialog({
  open,
  onOpenChange,
  analysisId,
  item,
  region,
}: NegotiationDialogProps) {
  const [script, setScript] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    if (!item) return
    setLoading(true)
    setError(null)
    setScript("")
    try {
      const res = await fetch("/api/analise/negotiation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          itemId: item.id,
          region,
          item: {
            name: item.matchedName ?? item.originalName,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.budgetPrice,
            referencePrice: item.referenceAvgPrice ?? undefined,
            variance: item.variance ?? undefined,
            rating: item.rating,
            category: item.category,
            total: item.quantity * item.budgetPrice,
          },
        }),
      })
      const json = (await res.json()) as { script?: string; error?: string }
      if (!res.ok || !json.script) {
        setError(json.error ?? "Erro ao gerar script.")
        return
      }
      setScript(json.script)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate on open
  useEffect(() => {
    if (open && item && !script && !loading) generate()
    if (!open) {
      // reset when closed so next opening regenerates fresh
      setScript("")
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script)
      toast.success("Script copiado")
    } catch {
      toast.error("Não foi possível copiar")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Assistente · Negociação IA
          </p>
          <DialogTitle className="flex items-center gap-2 font-display text-xl font-medium tracking-tight">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            Script de Negociação
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {item ? item.matchedName ?? item.originalName : "—"}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-md border border-border/60 bg-background/40">
          <div className="flex items-center justify-between border-b border-border/40 px-3 py-1.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              pt-pt · email / whatsapp
            </p>
            <span className="font-mono text-[10px] text-muted-foreground/70">openai · gpt-4o-mini</span>
          </div>
          <div className="min-h-[220px] px-4 py-3 text-sm leading-relaxed text-foreground/90">
            {loading && (
              <div className="flex h-full min-h-[200px] items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
                  A gerar script…
                </span>
              </div>
            )}
            {!loading && error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {!loading && !error && script && (
              <div className="whitespace-pre-wrap">{script}</div>
            )}
            {!loading && !error && !script && (
              <div className="flex h-full min-h-[200px] items-center justify-center">
                <MessageSquare className="h-6 w-6 text-muted-foreground/50" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Usa os dados do item (preço, referência, variância).
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generate}
              disabled={loading || !item}
              className="rounded-full"
            >
              <RotateCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Regenerar
            </Button>
            <Button
              size="sm"
              onClick={copy}
              disabled={!script}
              className="rounded-full"
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Copiar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
