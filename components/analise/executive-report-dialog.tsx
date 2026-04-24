"use client"

import { useMemo, useRef } from "react"
import * as XLSX from "xlsx"
import { FileDown, Printer, X } from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { AnalysisResult } from "@/lib/analise/types"

interface ExecutiveReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysis: AnalysisResult | null
}

const fmt = (n: number | null | undefined, digits = 0) =>
  n == null
    ? "—"
    : n.toLocaleString("pt-PT", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })

const ratingLabel: Record<string, string> = {
  below: "Abaixo da média",
  average: "Na média",
  above: "Acima da média",
  critical: "Muito acima",
  unknown: "Sem referência",
}

export function ExecutiveReportDialog({
  open,
  onOpenChange,
  analysis,
}: ExecutiveReportDialogProps) {
  const printRef = useRef<HTMLDivElement | null>(null)

  const topRisks = useMemo(() => {
    if (!analysis) return []
    return [...analysis.items]
      .filter((i) => (i.rating === "above" || i.rating === "critical") && i.variance != null)
      .sort((a, b) => {
        const aDelta = ((a.budgetPrice - (a.referenceAvgPrice ?? a.budgetPrice)) * a.quantity) || 0
        const bDelta = ((b.budgetPrice - (b.referenceAvgPrice ?? b.budgetPrice)) * b.quantity) || 0
        return bDelta - aDelta
      })
      .slice(0, 10)
  }, [analysis])

  const exportExcel = () => {
    if (!analysis) return
    try {
      const wb = XLSX.utils.book_new()

      // Sheet 1 — Summary
      const summary: (string | number)[][] = [
        ["Relatório Executivo"],
        [],
        ["Ficheiro", analysis.fileName],
        ["Região", analysis.region],
        ["Data", format(new Date(), "dd/MM/yyyy", { locale: pt })],
        [],
        ["KPI", "Valor"],
        ["Total orçamento", analysis.totalBudget],
        ["Total referência", analysis.totalReference],
        ["Variação global %", analysis.overallVariance],
        ["Classificação global", ratingLabel[analysis.overallRating] ?? analysis.overallRating],
        ["Itens", analysis.stats.totalItems],
        ["Correspondência %", analysis.stats.matchRate],
        ["Poupança potencial €", analysis.stats.potentialSavings],
        ["Itens de risco", analysis.stats.riskItems],
        ["Quality score", analysis.qualityScore ?? ""],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Sumário")

      // Sheet 2 — Items
      const itemsRows = [
        [
          "ID",
          "Descrição",
          "Categoria",
          "Unidade",
          "Qtd",
          "Preço unit.",
          "Ref. Média",
          "Variância %",
          "Total linha",
          "Classificação",
          "Confiança %",
        ],
        ...analysis.items.map((i) => [
          i.id,
          i.matchedName ?? i.originalName,
          i.category,
          i.unit,
          i.quantity,
          i.budgetPrice,
          i.referenceAvgPrice ?? "",
          i.variance ?? "",
          i.budgetPrice * i.quantity,
          ratingLabel[i.rating] ?? i.rating,
          i.matchConfidence,
        ]),
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(itemsRows), "Itens")

      // Sheet 3 — Categorias
      const catRows = [
        ["Categoria", "Nº itens", "Total", "Variação %"],
        ...analysis.categoryBreakdown.map((c) => [c.category, c.count, c.total, c.variance]),
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(catRows), "Categorias")

      // Sheet 4 — Recomendações
      const recRows = [["#", "Recomendação"], ...analysis.recommendations.map((r, i) => [i + 1, r])]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(recRows), "Recomendações")

      const safeName = (analysis.fileName || "relatorio").replace(/[^a-z0-9-_]+/gi, "_")
      XLSX.writeFile(wb, `${safeName}__relatorio.xlsx`)
      toast.success("Excel exportado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao exportar")
    }
  }

  const printPDF = () => {
    if (!printRef.current || !analysis) return
    const html = printRef.current.innerHTML
    const w = window.open("", "_blank", "width=960,height=1200")
    if (!w) {
      toast.error("Ative pop-ups para exportar em PDF")
      return
    }
    const title = `${analysis.fileName} — Relatório Executivo`
    w.document.write(`<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #111; }
  h1, h2, h3 { font-weight: 500; margin: 0 0 4px; }
  .eyebrow { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: #666; }
  .cover { border-bottom: 1px solid #ddd; padding-bottom: 24px; margin-bottom: 24px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
  .kpi { border: 1px solid #e5e5e5; padding: 12px 14px; border-radius: 6px; }
  .kpi .v { font-size: 22px; font-weight: 500; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0 28px; font-size: 12px; }
  th, td { text-align: left; border-bottom: 1px solid #eee; padding: 6px 8px; }
  th { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: #666; font-weight: 500; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; font-family: ui-monospace, "SF Mono", Menlo, monospace; }
  .section { margin-top: 28px; page-break-inside: avoid; }
  .badge { display: inline-block; border: 1px solid #ddd; border-radius: 999px; padding: 2px 8px; font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; }
  ol { padding-left: 18px; }
  ol li { margin: 4px 0; }
  @media print {
    body { margin: 12mm; }
  }
</style>
</head>
<body>${html}<script>window.addEventListener('load', () => { window.focus(); window.print(); });</script></body>
</html>`)
    w.document.close()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border/60 bg-card/30 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Relatório · Executivo
          </p>
          <DialogTitle className="font-display text-2xl font-medium tracking-tight">
            Pré-visualização do Relatório
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Exporte em Excel (XLSX) ou imprima em PDF.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div ref={printRef} className="px-6 py-6">
            {!analysis ? (
              <p className="text-sm text-muted-foreground">Sem análise ativa.</p>
            ) : (
              <>
                {/* Cover */}
                <div className="cover">
                  <p className="eyebrow">Relatório Executivo</p>
                  <h1 className="font-display text-3xl font-medium tracking-tight">
                    {analysis.fileName}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {analysis.region} · {format(new Date(), "dd MMM yyyy", { locale: pt })}
                  </p>
                </div>

                {/* KPIs */}
                <div className="kpis grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Kpi label="Total" value={fmt(analysis.totalBudget)} />
                  <Kpi label="Referência" value={fmt(analysis.totalReference)} />
                  <Kpi
                    label="Variação"
                    value={`${analysis.overallVariance > 0 ? "+" : ""}${analysis.overallVariance.toFixed(1)}%`}
                    tone={
                      analysis.overallRating === "below"
                        ? "below"
                        : analysis.overallRating === "critical" || analysis.overallRating === "above"
                          ? "critical"
                          : "muted"
                    }
                  />
                  <Kpi
                    label="Poupança"
                    value={fmt(analysis.stats.potentialSavings)}
                    tone="below"
                  />
                </div>

                {/* Sumário executivo */}
                <div className="section">
                  <p className="eyebrow">Sumário executivo</p>
                  <h2 className="mt-1 font-display text-xl font-medium tracking-tight">
                    Avaliação geral
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    O orçamento foi classificado como{" "}
                    <span className="badge">{ratingLabel[analysis.overallRating]}</span> com{" "}
                    <strong>{analysis.stats.matchRate.toFixed(0)}%</strong> de correspondência e{" "}
                    <strong>{analysis.stats.riskItems}</strong> itens de risco elevado.
                  </p>
                </div>

                {/* Top 10 risks */}
                {topRisks.length > 0 && (
                  <div className="section">
                    <p className="eyebrow">Top 10 · itens de maior impacto</p>
                    <table>
                      <thead>
                        <tr>
                          <th>Descrição</th>
                          <th>Qtd</th>
                          <th>Preço unit.</th>
                          <th>Ref.</th>
                          <th>Δ €</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topRisks.map((i) => {
                          const ref = i.referenceAvgPrice ?? i.budgetPrice
                          const delta = (i.budgetPrice - ref) * i.quantity
                          return (
                            <tr key={i.id}>
                              <td>{i.matchedName ?? i.originalName}</td>
                              <td className="num">
                                {i.quantity} {i.unit}
                              </td>
                              <td className="num">€{i.budgetPrice.toFixed(2)}</td>
                              <td className="num">{ref ? `€${ref.toFixed(2)}` : "—"}</td>
                              <td className="num">{fmt(delta)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Categorias */}
                {analysis.categoryBreakdown.length > 0 && (
                  <div className="section">
                    <p className="eyebrow">Distribuição por categoria</p>
                    <table>
                      <thead>
                        <tr>
                          <th>Categoria</th>
                          <th>Itens</th>
                          <th>Total</th>
                          <th>Variação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.categoryBreakdown.map((c) => (
                          <tr key={c.category}>
                            <td>{c.category}</td>
                            <td className="num">{c.count}</td>
                            <td className="num">{fmt(c.total)}</td>
                            <td className="num">
                              {c.variance > 0 ? "+" : ""}
                              {c.variance.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Recomendações */}
                {analysis.recommendations.length > 0 && (
                  <div className="section">
                    <p className="eyebrow">Recomendações</p>
                    <ol>
                      {analysis.recommendations.map((r, i) => (
                        <li key={i} className="text-sm">
                          {r}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 bg-card/30 px-6 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            <X className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Fechar
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel} className="rounded-full">
            <FileDown className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Excel (XLSX)
          </Button>
          <Button size="sm" onClick={printPDF} className="rounded-full">
            <Printer className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Imprimir PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Kpi({
  label,
  value,
  tone = "muted",
}: {
  label: string
  value: string
  tone?: "muted" | "below" | "critical"
}) {
  const toneClass =
    tone === "below" ? "text-price-below" : tone === "critical" ? "text-price-critical" : "text-foreground"
  return (
    <div className="kpi rounded-md border border-border/60 bg-background/40 p-3">
      <p className="eyebrow font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("v mt-1 font-display text-xl font-medium tabular-nums tracking-tight", toneClass)}>
        {value}
      </p>
    </div>
  )
}
