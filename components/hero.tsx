"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, FileUp, TrendingDown, Minus, TrendingUp } from "lucide-react"
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
    <section className="relative overflow-hidden pt-28 pb-24 lg:pt-36 lg:pb-32">
      <BlueprintBackdrop />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top eyebrow row */}
        <div
          className={`mb-10 flex items-center justify-between gap-4 border-b hairline pb-4 transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="eyebrow-strong">Nº 001 / MOAP</span>
            <span className="hidden sm:inline eyebrow">—</span>
            <span className="hidden sm:inline eyebrow">Edição 2026</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="eyebrow hidden md:inline">Mercado PT</span>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="eyebrow">Ao vivo</span>
          </div>
        </div>

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
              <span className="mt-2 block font-display text-5xl italic tracking-tight text-primary sm:text-6xl lg:text-7xl xl:text-[5.5rem] xl:leading-[0.95]">
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
            className="font-display text-4xl italic text-foreground lg:text-5xl"
          />
        ) : (
          <span
            className={`text-foreground ${
              mono ? "font-mono text-xl lg:text-2xl tracking-tight" : "font-display text-4xl italic lg:text-5xl"
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

function ReportPreviewCard() {
  const rows = [
    { code: "A.01.02", name: "Betão C25/30", unit: "m³", price: "€ 98.40", delta: -12, status: "below" as const },
    { code: "A.03.11", name: "Aço A500 NR", unit: "kg", price: "€ 1.24", delta: 3, status: "avg" as const },
    { code: "B.02.04", name: "Alvenaria 15cm", unit: "m²", price: "€ 22.80", delta: 18, status: "above" as const },
    { code: "C.01.07", name: "Caixilharia AL", unit: "un", price: "€ 340.00", delta: 34, status: "high" as const },
  ]

  return (
    <div className="relative">
      {/* Floating corner badge */}
      <div className="absolute -top-3 -left-3 z-10 flex items-center gap-2 rounded-full border hairline bg-background px-3 py-1.5 shadow-lg">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
        <span className="eyebrow-strong">Relatório MOAP</span>
      </div>

      <div className="bp-bracket relative overflow-hidden rounded-2xl border hairline bg-card shadow-2xl">
        {/* Scan sweep */}
        <div className="scan-sweep pointer-events-none absolute inset-0 overflow-hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b hairline bg-secondary/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
            </div>
            <span className="ml-3 font-mono text-xs text-muted-foreground">obra_lisboa_2026.pdf</span>
          </div>
          <span className="eyebrow">v1.2</span>
        </div>

        {/* Report body */}
        <div className="space-y-4 p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="eyebrow">Total analisado</p>
              <p className="mt-1 font-display text-3xl italic text-foreground">
                € <AnimatedCounter value={248320} decimals={0} duration={2200} />
              </p>
            </div>
            <div className="text-right">
              <p className="eyebrow">Poupança potencial</p>
              <p className="mt-1 font-mono text-xl text-primary">
                − € <AnimatedCounter value={37240} decimals={0} duration={2400} />
              </p>
            </div>
          </div>

          <div className="divide-y hairline overflow-hidden rounded-lg border hairline">
            <div className="grid grid-cols-[1fr_auto] items-center gap-4 bg-secondary/40 px-4 py-2">
              <span className="eyebrow">Artigo</span>
              <span className="eyebrow text-right">Δ Mercado</span>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.code}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3"
                style={{ animation: `fade-in 0.6s ease-out ${0.6 + i * 0.15}s backwards` }}
              >
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {r.code} · {r.unit}
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                </div>
                <DeltaChip delta={r.delta} status={r.status} />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-amber" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                74% processado
              </span>
            </div>
            <span className="eyebrow-strong">TEMPO REAL</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeltaChip({
  delta,
  status,
}: {
  delta: number
  status: "below" | "avg" | "above" | "high"
}) {
  const Icon = delta < -2 ? TrendingDown : Math.abs(delta) <= 10 ? Minus : TrendingUp
  const colorClass =
    status === "below"
      ? "text-price-below bg-price-below/10 border-price-below/30"
      : status === "avg"
        ? "text-price-average bg-price-average/10 border-price-average/30"
        : status === "above"
          ? "text-price-above bg-price-above/10 border-price-above/30"
          : "text-price-high bg-price-high/10 border-price-high/30"

  const sign = delta > 0 ? "+" : ""
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-xs ${colorClass}`}
    >
      <Icon className="h-3 w-3" />
      {sign}
      {delta}%
    </span>
  )
}
