"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, FileUp, TrendingUp } from "lucide-react"
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
      <BlueprintBackdrop />

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
 * Honest preview of a MOAP analysis report.
 *
 * Everything mirrors the real tool at /dashboard/analise:
 * - Metric labels: "Total do Orçamento", "Total de Referência",
 *   "Variação Global", "Classificação Geral" are the exact same strings.
 * - Items ("Demolição de paredes", "Betão C25/30", "Pintura interior")
 *   come from the real CSV example shown in the upload dialog.
 * - Rating vocabulary uses the real labels (Abaixo / Na média / Acima / Muito acima)
 *   and the shared --price-* color tokens from the analysis UI.
 */
function ReportPreviewCard() {
  // Real CSV example items + realistic market deltas
  const items = [
    {
      name: "Demolição de paredes",
      unit: "m²",
      qty: 50,
      unitPrice: 12.5,
      refPrice: 14.0,
      variance: -10.7,
      rating: "below" as const,
    },
    {
      name: "Betão C25/30",
      unit: "m³",
      qty: 10,
      unitPrice: 95.0,
      refPrice: 98.0,
      variance: -3.1,
      rating: "average" as const,
    },
    {
      name: "Pintura interior",
      unit: "m²",
      qty: 200,
      unitPrice: 8.75,
      refPrice: 11.0,
      variance: -20.5,
      rating: "critical" as const,
    },
  ]

  // Totals match what the real tool computes
  const totalBudget = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const totalReference = items.reduce((s, i) => s + i.qty * i.refPrice, 0)
  const globalVariance = ((totalBudget - totalReference) / totalReference) * 100

  return (
    <div className="relative">
      {/* Floating label */}
      <div className="absolute -top-3 left-6 z-10 flex items-center gap-2 rounded-full border hairline bg-background px-3 py-1.5 shadow-lg">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
        <span className="eyebrow-strong">Relatório MOAP</span>
      </div>

      <div className="bp-bracket relative overflow-hidden rounded-2xl border hairline bg-card shadow-2xl">
        {/* Scan sweep */}
        <div className="scan-sweep pointer-events-none absolute inset-0 overflow-hidden" />

        {/* Header — clean editorial strip, no macOS chrome */}
        <div className="flex items-center justify-between border-b hairline bg-secondary/30 px-5 py-3">
          <span className="font-mono text-xs text-muted-foreground">orcamento.csv</span>
          <span className="eyebrow">3 itens</span>
        </div>

        {/* Top metrics — real labels */}
        <div className="grid grid-cols-2 divide-x hairline border-b hairline">
          <div className="p-4">
            <p className="eyebrow">Total do Orçamento</p>
            <p className="mt-1 font-display text-2xl font-medium tracking-tight text-foreground">
              € <AnimatedCounter value={Math.round(totalBudget)} decimals={0} duration={2000} />
            </p>
          </div>
          <div className="p-4">
            <p className="eyebrow">Total de Referência</p>
            <p className="mt-1 font-display text-2xl font-medium tracking-tight text-muted-foreground">
              € <AnimatedCounter value={Math.round(totalReference)} decimals={0} duration={2200} />
            </p>
          </div>
          <div className="border-t hairline p-4">
            <p className="eyebrow">Variação Global</p>
            <p className="mt-1 font-mono text-xl text-price-below">
              {globalVariance.toFixed(1)}%
            </p>
          </div>
          <div className="border-t hairline bg-price-below/5 p-4">
            <p className="eyebrow">Classificação Geral</p>
            <p className="mt-1 font-mono text-sm font-semibold text-price-below">
              Abaixo da Média
            </p>
          </div>
        </div>

        {/* Items table — real items from CSV example */}
        <div className="divide-y hairline">
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 bg-secondary/40 px-4 py-2">
            <span className="eyebrow">Artigo</span>
            <span className="eyebrow text-right">Δ vs. mercado</span>
          </div>
          {items.map((r, i) => (
            <div
              key={r.name}
              className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3"
              style={{ animation: `fade-in 0.6s ease-out ${0.6 + i * 0.15}s backwards` }}
            >
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {r.qty} {r.unit} · € {r.unitPrice.toFixed(2)}/{r.unit}
                </p>
                <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
              </div>
              <RatingChip variance={r.variance} rating={r.rating} />
            </div>
          ))}
        </div>

        {/* Footer progress */}
        <div className="flex items-center justify-between border-t hairline px-4 py-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Pontuação de qualidade 92/100
            </span>
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
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-xs ${colorClass}`}
    >
      {sign}
      {variance.toFixed(1)}%
    </span>
  )
}
