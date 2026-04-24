"use client"

import type React from "react"
import { FileUp, Cpu, FileBarChart, ArrowDown } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { BlueprintBackdrop } from "@/components/landing/blueprint-backdrop"

export function HowItWorks() {
  const { t } = useLanguage()

  const steps: {
    number: string
    label: string
    title: string
    description: string
    Icon: React.ComponentType<{ className?: string }>
    visual: React.ReactNode
  }[] = [
    {
      number: t("step1Number"),
      label: "Upload",
      title: t("step1Title"),
      description: t("step1Desc"),
      Icon: FileUp,
      visual: <UploadVisual />,
    },
    {
      number: "02",
      label: "Processamento",
      title: "Extração de dados",
      description:
        "Extração automática e precisa de todos os itens, quantidades e unidades do documento.",
      Icon: Cpu,
      visual: <ExtractVisual />,
    },
    {
      number: t("step3Number"),
      label: "Relatório",
      title: t("step3Title"),
      description: t("step3Desc"),
      Icon: FileBarChart,
      visual: <ReportVisual />,
    },
  ]

  return (
    <section id="como-funciona" className="relative overflow-hidden border-t hairline py-24 lg:py-32">
      <BlueprintBackdrop variant="minimal" auroras={false} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col gap-6 border-b hairline pb-10 md:flex-row md:items-end md:justify-between reveal-up">
          <div>
            <p className="eyebrow-strong">§ 03 — Fluxo</p>
            <h2 className="mt-4 max-w-2xl text-balance font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {t("howItWorksTitle")}{" "}
              <span className="font-display italic text-primary">três passos.</span>
            </h2>
          </div>
          <p className="max-w-md text-pretty text-base text-muted-foreground md:text-right">
            {t("howItWorksSubtitle")}
          </p>
        </div>

        {/* Rail */}
        <div className="relative mt-16">
          {/* vertical connector */}
          <div
            className="pointer-events-none absolute left-6 top-0 bottom-0 hidden w-px md:block"
            aria-hidden="true"
          >
            <div className="relative h-full w-full">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-hairline to-transparent" />
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary/60 via-primary/20 to-transparent" />
            </div>
          </div>

          <ol className="space-y-16 md:space-y-24">
            {steps.map((step, i) => (
              <li
                key={step.number}
                className="relative grid gap-8 md:grid-cols-12 md:gap-10 reveal-up"
              >
                {/* Step marker */}
                <div className="relative md:col-span-1 md:flex md:justify-start">
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border hairline bg-background shadow-lg">
                    <step.Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>

                {/* Text */}
                <div className="md:col-span-5">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-6xl italic leading-none text-primary/80">
                      {step.number}
                    </span>
                    <span className="eyebrow-strong">{step.label}</span>
                  </div>
                  <h3 className="mt-4 font-sans text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {/* Visual */}
                <div className="md:col-span-6">
                  <div className="bp-bracket relative overflow-hidden rounded-2xl border hairline bg-card p-5 shadow-xl">
                    {step.visual}
                  </div>
                </div>

                {/* Between-step arrow */}
                {i < steps.length - 1 && (
                  <div className="md:col-span-12 md:flex md:items-center md:gap-4 md:pl-16">
                    <span className="hidden h-px flex-1 bg-gradient-to-r from-hairline to-transparent md:block" />
                    <ArrowDown className="h-4 w-4 text-primary/60" />
                    <span className="eyebrow">Depois</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

// ---------- Visuals ----------

function UploadVisual() {
  return (
    <div className="relative">
      <div className="flex items-center justify-between border-b hairline pb-3">
        <div className="flex items-center gap-2">
          <span className="eyebrow">Dropzone</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          PDF · XLSX · CSV
        </span>
      </div>
      <div className="mt-4 grid gap-2">
        {["orcamento-obra-lisboa.pdf", "medicoes_v3.xlsx", "itens_estrutura.csv"].map((f, i) => (
          <div
            key={f}
            className="flex items-center justify-between rounded-lg border hairline bg-background px-4 py-2.5"
            style={{ animation: `fade-in 0.5s ease-out ${0.15 + i * 0.15}s backwards` }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded border hairline bg-secondary">
                <FileUp className="h-3 w-3 text-primary" />
              </div>
              <span className="font-mono text-xs text-foreground">{f}</span>
            </div>
            <span className="font-mono text-[10px] uppercase text-primary">OK</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExtractVisual() {
  return (
    <div className="relative">
      <div className="flex items-center justify-between border-b hairline pb-3">
        <span className="eyebrow">Itens extraídos</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-primary">Em tempo real</span>
      </div>
      <div className="mt-4 space-y-2 font-mono text-xs">
        {[
          ["A.01.02", "Betão C25/30", "m³", "42.8"],
          ["A.03.11", "Aço A500 NR", "kg", "1,240"],
          ["B.02.04", "Alvenaria 15 cm", "m²", "318.5"],
          ["C.01.07", "Caixilharia AL", "un", "24"],
          ["D.04.02", "Isolamento XPS", "m²", "412.0"],
        ].map((row, i) => (
          <div
            key={row[0]}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-b hairline py-1.5 last:border-b-0"
            style={{ animation: `fade-in 0.45s ease-out ${0.1 + i * 0.1}s backwards` }}
          >
            <span className="text-muted-foreground">{row[0]}</span>
            <span className="text-foreground">{row[1]}</span>
            <span className="text-muted-foreground">{row[2]}</span>
            <span className="text-foreground">{row[3]}</span>
          </div>
        ))}
      </div>
      <div className="scan-sweep pointer-events-none absolute inset-0" />
    </div>
  )
}

function ReportVisual() {
  const rows = [
    { label: "Abaixo da média", count: 6, cls: "bg-price-below", pct: 45 },
    { label: "Na média", count: 12, cls: "bg-price-average", pct: 80 },
    { label: "Acima da média", count: 4, cls: "bg-price-above", pct: 32 },
    { label: "Crítico", count: 2, cls: "bg-price-high", pct: 18 },
  ]
  return (
    <div>
      <div className="flex items-center justify-between border-b hairline pb-3">
        <span className="eyebrow">Relatório — Classificação</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          24 artigos
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {rows.map((r, i) => (
          <div key={r.label} style={{ animation: `fade-in 0.5s ease-out ${0.1 + i * 0.1}s backwards` }}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm text-foreground">{r.label}</span>
              <span className="font-mono text-xs text-muted-foreground">{r.count} itens</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className={`h-full ${r.cls}`} style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
