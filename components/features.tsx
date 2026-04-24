"use client"

import type React from "react"
import {
  Brain,
  Database,
  Layers,
  Scale,
  FileSearch,
  BarChart3,
  Shield,
  ArrowUpRight,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { AnimatedCounter } from "@/components/landing/animated-counter"

export function Features() {
  const { t } = useLanguage()

  return (
    <section
      id="funcionalidades"
      className="relative overflow-hidden border-t hairline py-24 lg:py-32"
    >
      {/* Section header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 border-b hairline pb-10 md:flex-row md:items-end md:justify-between reveal-up">
          <div>
            <p className="eyebrow-strong">§ 02 — Capacidades</p>
            <h2 className="mt-4 max-w-2xl text-balance font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {t("features")}{" "}
              <span className="font-display italic text-primary">com método.</span>
            </h2>
          </div>
          <p className="max-w-md text-pretty text-base text-muted-foreground md:text-right">
            {t("featuresSubtitle")}
          </p>
        </div>

        {/* Bento grid */}
        <div className="mt-12 grid gap-4 md:grid-cols-6 md:gap-5 lg:grid-cols-12">
          {/* WIDE card — extraction */}
          <BentoCard
            className="md:col-span-6 lg:col-span-7"
            eyebrow="01 · Extração"
            title={t("feature5Title")}
            description={t("feature5Desc")}
            Icon={FileSearch}
            accent
          >
            <ExtractionVisual />
          </BentoCard>

          {/* TALL card — database */}
          <BentoCard
            className="md:col-span-6 lg:col-span-5 lg:row-span-2"
            eyebrow="02 · Base de dados"
            title={t("feature6Title")}
            description={t("feature6Desc")}
            Icon={Database}
          >
            <DatabaseVisual />
          </BentoCard>

          {/* SQUARE — intelligence */}
          <BentoCard
            className="md:col-span-3 lg:col-span-4"
            eyebrow="03 · Correspondência"
            title={t("feature1Title")}
            description={t("feature1Desc")}
            Icon={Brain}
          />

          {/* SQUARE — comparison */}
          <BentoCard
            className="md:col-span-3 lg:col-span-3"
            eyebrow="04 · Análise"
            title="Análise de preços"
            description="Comparação detalhada com base de dados de mercado regional."
            Icon={BarChart3}
          >
            <SparkBars />
          </BentoCard>

          {/* WIDE — multi-format */}
          <BentoCard
            className="md:col-span-6 lg:col-span-7"
            eyebrow="05 · Multi-formato"
            title={t("feature2Title")}
            description={t("feature2Desc")}
            Icon={Layers}
          >
            <FormatPills />
          </BentoCard>

          {/* SQUARE — scale / regions */}
          <BentoCard
            className="md:col-span-3 lg:col-span-5"
            eyebrow="06 · Cobertura"
            title={t("feature3Title")}
            description={t("feature3Desc")}
            Icon={Scale}
          />

          {/* SQUARE — security */}
          <BentoCard
            className="md:col-span-3 lg:col-span-4"
            eyebrow="07 · Segurança"
            title="Segurança empresarial"
            description="Criptografia end-to-end e conformidade GDPR completa."
            Icon={Shield}
          >
            <div className="mt-5 flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">GDPR</span>
              <span className="h-px flex-1 bg-hairline" />
              <span className="font-mono text-xs text-muted-foreground">AES-256</span>
              <span className="h-px flex-1 bg-hairline" />
              <span className="font-mono text-xs text-muted-foreground">TLS 1.3</span>
            </div>
          </BentoCard>

          {/* WIDE — scale counter */}
          <BentoCard
            className="md:col-span-6 lg:col-span-8"
            eyebrow="08 · Escala"
            title="Materiais indexados"
            description="Base contínua, alimentada com dados de mercado atualizados."
            Icon={Scale}
            accent
          >
            <p className="mt-4 font-display text-6xl italic text-foreground lg:text-7xl">
              <AnimatedCounter value={50000} suffix="+" />
            </p>
          </BentoCard>
        </div>
      </div>
    </section>
  )
}

// ---------- Bento primitives ----------

interface BentoCardProps {
  className?: string
  eyebrow: string
  title: string
  description: string
  Icon: React.ComponentType<{ className?: string }>
  accent?: boolean
  children?: React.ReactNode
}

function BentoCard({ className, eyebrow, title, description, Icon, accent, children }: BentoCardProps) {
  return (
    <article
      className={`group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl border hairline bg-card p-6 transition-all duration-500 hover:border-primary/40 hover:bg-card/80 hover:-translate-y-0.5 reveal-up ${
        className ?? ""
      }`}
    >
      {/* Hover glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      {accent && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}

      <div className="relative">
        <div className="flex items-start justify-between">
          <span className="eyebrow-strong">{eyebrow}</span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>

        <div className="mt-5 flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border hairline bg-background">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-tight text-foreground">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      {children && <div className="relative mt-6">{children}</div>}
    </article>
  )
}

// ---------- Tiny visuals ----------

function ExtractionVisual() {
  return (
    <div className="relative mt-2 overflow-hidden rounded-lg border hairline bg-background/60 p-4">
      <div className="space-y-2 font-mono text-xs">
        {[
          { k: "artigo", v: "Betão C25/30" },
          { k: "unidade", v: "m³" },
          { k: "quantidade", v: "42.8" },
          { k: "preço_un", v: "€ 98.40" },
        ].map((row, i) => (
          <div
            key={row.k}
            className="flex items-center justify-between border-b hairline py-1.5 last:border-b-0"
            style={{ animation: `fade-in 0.5s ease-out ${0.2 + i * 0.12}s backwards` }}
          >
            <span className="text-muted-foreground">{row.k}</span>
            <span className="text-foreground">{row.v}</span>
          </div>
        ))}
      </div>
      <div className="scan-sweep pointer-events-none absolute inset-0" />
    </div>
  )
}

function DatabaseVisual() {
  const categories = [
    { name: "Betão e Argamassas", pct: 92 },
    { name: "Aço e Estruturas", pct: 84 },
    { name: "Alvenaria", pct: 78 },
    { name: "Caixilharia", pct: 65 },
    { name: "Isolamento", pct: 58 },
    { name: "Acabamentos", pct: 72 },
  ]

  return (
    <div className="mt-4 space-y-3">
      {categories.map((c, i) => (
        <div
          key={c.name}
          style={{ animation: `fade-in 0.5s ease-out ${0.15 + i * 0.08}s backwards` }}
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{c.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{c.pct}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-amber"
              style={{ width: `${c.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function SparkBars() {
  const values = [30, 55, 42, 68, 52, 78, 64, 82, 70, 90, 76, 88]
  return (
    <div className="mt-4 flex h-16 items-end gap-1">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-gradient-to-t from-primary/20 to-primary"
          style={{
            height: `${v}%`,
            animation: `reveal-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${0.1 + i * 0.04}s backwards`,
          }}
        />
      ))}
    </div>
  )
}

function FormatPills() {
  const formats = ["PDF", "XLSX", "CSV", "XLS"]
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {formats.map((f) => (
        <span
          key={f}
          className="inline-flex items-center gap-1.5 rounded-full border hairline bg-background px-3 py-1 font-mono text-xs text-foreground"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {f}
        </span>
      ))}
    </div>
  )
}
