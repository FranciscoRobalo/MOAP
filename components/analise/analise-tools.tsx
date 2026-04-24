"use client"

import { useState } from "react"
import {
  Archive,
  BarChart3,
  FileDown,
  GitCompareArrows,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AnalysisResult, SavedAnalysisSummary, DecisionRecord } from "@/lib/analise/types"
import { SavingsSimulatorSheet } from "./savings-simulator-sheet"
import { ProposalComparisonDialog } from "./proposal-comparison-dialog"
import { HistorySheet } from "./history-sheet"
import { ExecutiveReportDialog } from "./executive-report-dialog"

interface AnaliseToolsProps {
  analysis: AnalysisResult | null
  analysisId: string | null
  isSaving: boolean
  saved: SavedAnalysisSummary[]
  isLoadingSaved: boolean
  decisions: Record<string, DecisionRecord>
  onSave: () => void
  onRefreshSaved: () => void
  onLoadSaved: (id: string) => void
  onDeleteSaved: (id: string) => void
}

export function AnaliseTools({
  analysis,
  analysisId,
  isSaving,
  saved,
  isLoadingSaved,
  decisions,
  onSave,
  onRefreshSaved,
  onLoadSaved,
  onDeleteSaved,
}: AnaliseToolsProps) {
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const pendingDecisions =
    analysis?.items.filter((i) => {
      if (i.rating !== "above" && i.rating !== "critical") return false
      return (decisions[i.id]?.decision ?? "pending") === "pending"
    }).length ?? 0

  return (
    <>
      <div className="bp-bracket relative overflow-hidden rounded-lg border border-border/60 bg-card/30 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Ferramentas · Análise
            </p>
            <h3 className="mt-1 font-display text-xl font-medium tracking-tight">
              Próximos passos
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Guarde a análise, simule poupanças, compare propostas e exporte o relatório executivo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pendingDecisions > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-price-above/40 bg-price-above/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-price-above">
                {pendingDecisions} por decidir
              </span>
            )}
            <Button
              size="sm"
              onClick={onSave}
              disabled={!analysis || isSaving}
              className="rounded-full"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {analysisId ? "Guardar como novo" : isSaving ? "A guardar…" : "Guardar análise"}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-px overflow-hidden rounded-md border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
          <ToolCard
            eyebrow="What-if"
            title="Simulador"
            description="Ajuste preços e veja o novo total e poupança."
            icon={Wand2}
            onClick={() => setSimulatorOpen(true)}
            disabled={!analysis}
          />
          <ToolCard
            eyebrow="Side-by-side"
            title="Comparar"
            description="Compare até 4 propostas, item a item."
            icon={GitCompareArrows}
            onClick={() => setCompareOpen(true)}
            disabled={!analysis}
          />
          <ToolCard
            eyebrow="Arquivo"
            title="Histórico"
            description="Abra ou elimine análises guardadas."
            icon={Archive}
            onClick={() => setHistoryOpen(true)}
          />
          <ToolCard
            eyebrow="Export"
            title="Relatório"
            description="Exporte em PDF ou Excel, pronto a enviar."
            icon={FileDown}
            onClick={() => setReportOpen(true)}
            disabled={!analysis}
          />
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <p>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">IA</span>{" "}
            Scripts de negociação por item estão disponíveis nas ações de cada linha{" "}
            <BarChart3 className="inline h-3 w-3" aria-hidden="true" />.
          </p>
        </div>
      </div>

      {/* Overlays */}
      <SavingsSimulatorSheet
        open={simulatorOpen}
        onOpenChange={setSimulatorOpen}
        analysis={analysis}
      />
      <ProposalComparisonDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        saved={saved}
        currentAnalysis={analysis}
        currentAnalysisId={analysisId}
      />
      <HistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        saved={saved}
        isLoading={isLoadingSaved}
        refresh={onRefreshSaved}
        onLoad={(id) => {
          setHistoryOpen(false)
          onLoadSaved(id)
        }}
        onDelete={onDeleteSaved}
      />
      <ExecutiveReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        analysis={analysis}
      />
    </>
  )
}

function ToolCard({
  eyebrow,
  title,
  description,
  icon: Icon,
  onClick,
  disabled,
}: {
  eyebrow: string
  title: string
  description: string
  icon: typeof Wand2
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex h-full flex-col items-start gap-2 bg-background/60 p-4 text-left transition-colors",
        !disabled && "hover:bg-accent/40",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </p>
      <p className="font-display text-base font-medium tracking-tight">{title}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
    </button>
  )
}
