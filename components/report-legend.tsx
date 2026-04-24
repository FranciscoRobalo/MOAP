"use client"

import { TrendingDown, Minus, TrendingUp, AlertTriangle, HelpCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function ReportLegend() {
  const { t } = useLanguage()

  const priceIndicators = [
    {
      icon: TrendingDown,
      label: "< -10%",
      title: t("reportBelowAvg"),
      description: t("reportBelowAvgDesc"),
      colorVar: "--price-below",
    },
    {
      icon: Minus,
      label: "-9% a +10%",
      title: t("reportAvg"),
      description: t("reportAvgDesc"),
      colorVar: "--price-average",
    },
    {
      icon: TrendingUp,
      label: "+11% a +49%",
      title: t("reportAboveAvg"),
      description: t("reportAboveAvgDesc"),
      colorVar: "--price-above",
    },
    {
      icon: AlertTriangle,
      label: "> +50%",
      title: t("reportMuchAbove"),
      description: t("reportMuchAboveDesc"),
      colorVar: "--price-high",
    },
    {
      icon: HelpCircle,
      label: "N/A",
      title: t("reportNoData"),
      description: t("reportNoDataDesc"),
      colorVar: "--price-unknown",
    },
  ]

  return (
    <section id="relatorio" className="relative overflow-hidden border-t hairline py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-6 border-b hairline pb-10 md:flex-row md:items-end md:justify-between reveal-up">
          <div>
            <p className="eyebrow-strong">§ 05 — Relatório</p>
            <h2 className="mt-4 max-w-3xl text-balance font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {t("reportTitle")}{" "}
              <span className="font-display font-medium tracking-tight text-primary">leitura clara.</span>
            </h2>
          </div>
          <p className="max-w-md text-pretty text-base text-muted-foreground md:text-right">
            {t("reportSubtitle")}
          </p>
        </div>

        {/* Legend */}
        <div className="mt-12 reveal-up">
          <p className="eyebrow mb-4">Classificação — {t("reportVarianceTitle")}</p>
          <div className="grid gap-0 divide-y hairline overflow-hidden rounded-2xl border hairline bg-card sm:grid-cols-5 sm:divide-x sm:divide-y-0">
            {priceIndicators.map((indicator, i) => (
              <div
                key={indicator.label}
                className="group relative flex flex-col p-6 transition-colors hover:bg-secondary/20"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `color-mix(in srgb, var(${indicator.colorVar}) 15%, transparent)`,
                    color: `var(${indicator.colorVar})`,
                  }}
                >
                  <indicator.icon className="h-5 w-5" />
                </div>
                <span
                  className="font-mono text-xs uppercase tracking-wider"
                  style={{ color: `var(${indicator.colorVar})` }}
                >
                  {indicator.label}
                </span>
                <h3 className="mt-1 text-sm font-semibold text-foreground">{indicator.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {indicator.description}
                </p>
                <div
                  className="absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full"
                  style={{ backgroundColor: `var(${indicator.colorVar})` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Example Table */}
        <div className="mt-12 reveal-up">
          <div className="mb-4 flex items-end justify-between">
            <p className="eyebrow">{t("reportExampleTitle")}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              MOAP / relatório — exemplo
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border hairline bg-card">
            {/* Terminal-style top bar */}
            <div className="flex items-center justify-between border-b hairline bg-secondary/30 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                </div>
                <span className="ml-3 font-mono text-xs text-muted-foreground">relatorio-moap.pdf</span>
              </div>
              <span className="eyebrow">exemplo</span>
            </div>

            <div className="scan-sweep pointer-events-none absolute inset-x-0 top-12 bottom-0 overflow-hidden" />

            <div className="overflow-x-auto p-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b hairline">
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("reportTableNo")}
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("reportTableDesc")}
                    </th>
                    <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("reportTableQty")}
                    </th>
                    <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("reportTableUnit")}
                    </th>
                    <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("reportTablePrice")}
                    </th>
                    <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("reportTableAnalysis")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      n: 1,
                      desc: "Fornecimento e instalação de nova clarabóia em vidro temperado",
                      qty: 4,
                      unit: "UN.",
                      price: "€ 44,99",
                      Icon: TrendingDown,
                      color: "--price-below",
                    },
                    {
                      n: 2,
                      desc: "Aplicação de tinta de esmalte aquoso acetinado em paredes",
                      qty: 120,
                      unit: "m²",
                      price: "€ 8,50",
                      Icon: Minus,
                      color: "--price-average",
                    },
                    {
                      n: 3,
                      desc: "Fornecimento e montagem de tubagem multicamadas",
                      qty: 45,
                      unit: "ml",
                      price: "€ 28,00",
                      Icon: TrendingUp,
                      color: "--price-above",
                    },
                    {
                      n: 4,
                      desc: "Estrutura metálica para cobertura",
                      qty: 1,
                      unit: "VG",
                      price: "€ 15.000,00",
                      Icon: HelpCircle,
                      color: "--price-unknown",
                    },
                  ].map((row) => {
                    const RowIcon = row.Icon
                    return (
                      <tr key={row.n} className="border-b hairline transition-colors hover:bg-secondary/30 last:border-b-0">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {String(row.n).padStart(2, "0")}
                        </td>
                        <td className="px-4 py-3 text-foreground">{row.desc}</td>
                        <td className="px-4 py-3 text-center font-mono text-sm text-foreground">{row.qty}</td>
                        <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{row.unit}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-foreground">{row.price}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                            style={{
                              backgroundColor: `color-mix(in srgb, var(${row.color}) 18%, transparent)`,
                              color: `var(${row.color})`,
                            }}
                          >
                            <RowIcon className="h-4 w-4" />
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
