"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, Check, FileUp, MessageSquareWarning, TrendingUp, X } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { BlueprintBackdrop } from "@/components/landing/blueprint-backdrop"
import { Marquee } from "@/components/landing/marquee"
import { AnimatedCounter } from "@/components/landing/animated-counter"
import Link from "next/link"

export function Hero() {
  const { t } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const scrollToUpload = () => {
    const el = document.getElementById("carregar")
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const tickerItems = [
    "ORÇAMENTOS",
    "INTELIGÊNCIA DE MERCADO",
    "DOCUMENTOS PDF",
    "EXCEL / CSV",
    "RELATÓRIOS",
    "COMPARAÇÃO DE PREÇOS",
    "CONSTRUÇÃO CIVIL",
    "ANÁLISE DE CUSTOS",
  ]

  return (
    <section className="relative overflow-hidden pt-32 pb-24 lg:pt-40 lg:pb-32">
      <BlueprintBackdrop interactive />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main editorial split */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Headline block */}
          <div className="lg:col-span-7">
            <h1
              className={`text-balance transition-all duration-700 delay-100 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <span className="block font-sans text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl xl:text-[5.5rem] xl:leading-[0.95]">
                {t("heroTitle")}
              </span>
              <span className="mt-2 block font-display text-5xl font-medium tracking-tight text-primary sm:text-6xl lg:text-7xl xl:text-[5.5rem] xl:leading-[0.95]">
                {t("heroTitleHighlight")}
              </span>
            </h1>

            <p
              className={`mt-8 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground lg:text-xl transition-all duration-700 delay-200 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {t("heroSubtitle")}
            </p>

            <div
              className={`mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center transition-all duration-700 delay-300 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Button
                size="lg"
                onClick={scrollToUpload}
                className="group h-14 gap-3 rounded-full px-8 text-base font-semibold shadow-[0_0_0_1px_hsl(166_76%_47%/0.4),0_20px_40px_-20px_hsl(166_76%_47%/0.6)] hover:shadow-[0_0_0_1px_hsl(166_76%_47%/0.6),0_30px_60px_-20px_hsl(166_76%_47%/0.8)]"
              >
                <FileUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                {t("heroUploadButton")}
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
              <Link
                href="/#como-funciona"
                className="group inline-flex items-center gap-2 rounded-full border hairline px-5 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50"
              >
                {t("howItWorks")}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          {/* Report preview card */}
          <div
            className={`lg:col-span-5 transition-all duration-1000 delay-300 ${
              mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-[0.98]"
            }`}
          >
            <ReportPreviewCard />
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border hairline bg-hairline lg:grid-cols-4">
          <StatCell label="Precisão de extração" value="Alta" />
          <StatCell label="Materiais indexados" counter={{ value: 50000, suffix: "+" }} />
          <StatCell label="Formatos suportados" value="PDF · XLS · CSV" mono />
          <StatCell label="Conformidade" value="GDPR" />
        </div>

        {/* Ticker band */}
        <div className="mt-16 border-y hairline bg-gradient-to-r from-transparent via-secondary/40 to-transparent py-5">
          <Marquee speed="slow" pauseOnHover>
            {tickerItems.map((item, i) => (
              <div key={`${item}-${i}`} className="flex items-center gap-6 px-6">
                <span className="eyebrow-strong whitespace-nowrap">{item}</span>
                <span className="text-primary/60">◆</span>
              </div>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  )
}

function StatCell({
  label,
  value,
  counter,
  mono,
}: {
  label: string
  value?: string
  counter?: { value: number; suffix?: string }
  mono?: boolean
}) {
  return (
    <div className="group relative bg-background p-6 transition-colors hover:bg-secondary/30 sm:p-8">
      <p className="eyebrow">{label}</p>
      <div className="mt-3 flex items-end gap-2">
        {counter ? (
          <AnimatedCounter
            value={counter.value}
            suffix={counter.suffix}
            className="font-display text-4xl font-medium tracking-tight text-foreground lg:text-5xl"
          />
        ) : (
          <span
            className={`text-foreground ${
              mono ? "font-mono text-xl lg:text-2xl tracking-tight" : "font-display text-4xl font-medium tracking-tight lg:text-5xl"
            }`}
          >
            {value}
          </span>
        )}
      </div>
      <div className="absolute bottom-0 left-0 h-px w-0 bg-primary transition-all duration-500 group-hover:w-full" />
    </div>
  )
}

/**
 * Honest preview of the MOAP analysis workspace.
 *
 * Everything mirrors the real tool at /dashboard/analise:
 * - The four KPI cards use the exact same eyebrows and labels
 *   ("§ 01 / Orçamento · Total do Orçamento", etc.) as DashboardStatCard.
 * - Items come from the CSV example shown in the upload dialog.
 * - Each row exposes the real three-way decision control
 *   (Aceitar / Negociar / Rejeitar) implemented by DecisionControls.
 * - The footer strip mirrors the real Quality Index card (x/100 + bar)
 *   and the Potencial de poupança summary shown above the table.
 * - Colors come from the shared --price-* tokens.
 */
function ReportPreviewCard() {
  // Real CSV example items + realistic market deltas + pre-made decisions
  type Decision = "accepted" | "negotiate" | "rejected"
  const items: {
    name: string
    unit: string
    qty: number
    unitPrice: number
    refPrice: number
    variance: number
    rating: "below" | "average" | "above" | "critical"
    decision: Decision
  }[] = [
    {
      name: "Demolição de paredes",
      unit: "m²",
      qty: 50,
      unitPrice: 12.5,
      refPrice: 14.0,
      variance: -10.7,
      rating: "below",
      decision: "accepted",
    },
    {
      name: "Betão C25/30",
      unit: "m³",
      qty: 10,
      unitPrice: 95.0,
      refPrice: 98.0,
      variance: -3.1,
      rating: "average",
      decision: "accepted",
    },
    {
      name: "Pintura interior",
      unit: "m²",
      qty: 200,
      unitPrice: 11.85,
      refPrice: 11.0,
      variance: 7.7,
      rating: "above",
      decision: "negotiate",
    },
  ]

  // Totals match what the real tool computes
  const totalBudget = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const totalReference = items.reduce((s, i) => s + i.qty * i.refPrice, 0)
  const globalVariance = ((totalBudget - totalReference) / totalReference) * 100
  const potentialSavings = items
    .filter((i) => i.variance > 0)
    .reduce((s, i) => s + (i.unitPrice - i.refPrice) * i.qty, 0)

  const varianceTone =
    globalVariance <= -3
      ? "text-price-below"
      : globalVariance >= 3
        ? "text-price-above"
        : "text-foreground"

  return (
    <div className="relative">
      {/* Floating label */}
      <div className="absolute -top-3 left-6 z-10 flex items-center gap-2 rounded-full border hairline bg-background px-3 py-1.5 shadow-lg">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
        <span className="eyebrow-strong">Workspace MOAP · Análise</span>
      </div>

      <div className="bp-bracket relative overflow-hidden rounded-2xl border hairline bg-card shadow-2xl">
        {/* Scan sweep */}
        <div className="scan-sweep pointer-events-none absolute inset-0 overflow-hidden" />

        {/* Header — editorial strip with file + item count */}
        <div className="flex items-center justify-between border-b hairline bg-secondary/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              MOAP / análise
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className="font-mono text-xs text-muted-foreground">orcamento.csv</span>
          </div>
          <span className="eyebrow">3 itens · 1 região</span>
        </div>

        {/* KPI strip — identical structure to DashboardStatCard in /dashboard/analise */}
        <div className="grid grid-cols-2 divide-x hairline border-b hairline">
          <div className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              § 01 / Orçamento
            </p>
            <p className="mt-1 font-display text-2xl font-medium tracking-tight tabular-nums text-foreground">
              € <AnimatedCounter value={Math.round(totalBudget)} decimals={0} duration={2000} />
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Total do Orçamento</p>
          </div>
          <div className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              § 02 / Referência
            </p>
            <p className="mt-1 font-display text-2xl font-medium tracking-tight tabular-nums text-muted-foreground">
              € <AnimatedCounter value={Math.round(totalReference)} decimals={0} duration={2200} />
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Total de Referência</p>
          </div>
          <div className="border-t hairline p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              § 03 / Desvio
            </p>
            <p className={`mt-1 font-display text-2xl font-medium tracking-tight tabular-nums ${varianceTone}`}>
              {globalVariance > 0 ? "+" : ""}
              {globalVariance.toFixed(1)}%
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Variação Global</p>
          </div>
          <div className="border-t hairline bg-price-below/5 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">§ 04 / Rating</p>
            <p className="mt-1 font-display text-2xl font-medium tracking-tight text-price-below">
              Abaixo
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Classificação Geral</p>
          </div>
        </div>

        {/* Potencial de poupança — matches the real callout in analise */}
        <div className="flex items-center justify-between gap-4 border-b hairline bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border hairline bg-background">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="eyebrow">Potencial de poupança</p>
              <p className="font-display text-lg font-medium tabular-nums text-primary">
                € {potentialSavings.toLocaleString("pt-PT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary sm:inline-flex">
            IA · script pronto
          </span>
        </div>

        {/* Items — each row shows the real decision control from /dashboard/analise */}
        <div className="divide-y hairline">
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 bg-secondary/40 px-4 py-2">
            <span className="eyebrow">Artigo · Δ vs. mercado</span>
            <span className="eyebrow text-right">Decisão</span>
          </div>
          {items.map((r, i) => (
            <div
              key={r.name}
              className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3"
              style={{ animation: `fade-in 0.6s ease-out ${0.6 + i * 0.15}s backwards` }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                  <RatingChip variance={r.variance} rating={r.rating} />
                </div>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {r.qty} {r.unit} · € {r.unitPrice.toFixed(2)}/{r.unit} · ref. € {r.refPrice.toFixed(2)}
                </p>
              </div>
              <DecisionPillStatic decision={r.decision} />
            </div>
          ))}
        </div>

        {/* Footer — mirrors the real Quality Index card */}
        <div className="flex items-center justify-between gap-4 border-t hairline px-4 py-3">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Quality Index</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-lg font-medium tabular-nums text-primary">92</span>
                <span className="font-mono text-[10px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="h-1 w-28 overflow-hidden rounded-full bg-border/60">
              <div className="h-full bg-primary" style={{ width: "92%" }} />
            </div>
          </div>
          <span className="eyebrow-strong">EXEMPLO</span>
        </div>
      </div>
    </div>
  )
}

function RatingChip({
  variance,
  rating,
}: {
  variance: number
  rating: "below" | "average" | "above" | "critical"
}) {
  const colorClass =
    rating === "below"
      ? "text-price-below bg-price-below/10 border-price-below/30"
      : rating === "average"
        ? "text-price-average bg-price-average/10 border-price-average/30"
        : rating === "above"
          ? "text-price-above bg-price-above/10 border-price-above/30"
          : "text-price-high bg-price-high/10 border-price-high/30"

  const sign = variance > 0 ? "+" : ""
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] ${colorClass}`}
    >
      {sign}
      {variance.toFixed(1)}%
    </span>
  )
}

/**
 * Visual replica of the real <DecisionControls /> group used per-row in
 * /dashboard/analise. Static (non-interactive) because it lives on the
 * landing page — but the geometry, colors, and icons all match 1:1.
 */
function DecisionPillStatic({ decision }: { decision: "accepted" | "negotiate" | "rejected" }) {
  const segments: {
    key: "accepted" | "negotiate" | "rejected"
    Icon: typeof Check
    active: string
  }[] = [
    { key: "accepted", Icon: Check, active: "border-price-below/60 bg-price-below/10 text-price-below" },
    { key: "negotiate", Icon: MessageSquareWarning, active: "border-price-above/60 bg-price-above/10 text-price-above" },
    { key: "rejected", Icon: X, active: "border-price-critical/60 bg-price-critical/10 text-price-critical" },
  ]
  return (
    <div
      className="inline-flex items-center gap-px overflow-hidden rounded-full border hairline bg-background/40 p-0.5"
      aria-label="Decisão sobre o item"
    >
      {segments.map(({ key, Icon, active }) => {
        const isActive = key === decision
        return (
          <span
            key={key}
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-muted-foreground ${
              isActive ? active : "border-transparent"
            }`}
          >
            <Icon className="h-3 w-3" />
          </span>
        )
      })}
    </div>
  )
}
