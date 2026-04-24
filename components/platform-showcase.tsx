"use client"

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  Info,
  MessageSquareWarning,
  Sparkles,
  X,
} from "lucide-react"

/**
 * Honest showcase of the MOAP platform.
 *
 * Each card is a scaled-down replica of a real workspace the user can
 * reach inside the dashboard:
 *   - AnaliseMini → /dashboard/analise (decision controls + KPI strip)
 *   - AprovacoesMini → /dashboard/obras/validacao (the 5 real KPIs + Kanban)
 *   - CopilotMini → the AI negotiation-script panel shown above the table
 *   - RelatoriosMini → the executive PDF/Excel export dialog
 *
 * Labels, colors, iconography and numbers use the SAME tokens and strings
 * as the real tool so nothing on the landing page is misleading.
 */
export function PlatformShowcase() {
  return (
    <section className="relative overflow-hidden border-t hairline py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-6 border-b hairline pb-10 md:flex-row md:items-end md:justify-between reveal-up">
          <div>
            <p className="eyebrow-strong">§ 04 — Plataforma</p>
            <h2 className="mt-4 max-w-3xl text-balance font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Quatro ecrãs,{" "}
              <span className="font-display font-medium tracking-tight text-primary">um fluxo.</span>
            </h2>
          </div>
          <p className="max-w-md text-pretty text-base text-muted-foreground md:text-right">
            Previews fiéis dos workspaces reais da MOAP. Mesmos rótulos, mesmas cores, mesma tipografia.
          </p>
        </div>

        {/* 4-card grid — mini mockups */}
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <ShowcaseCard
            index="A"
            eyebrow="Workspace · /dashboard/analise"
            title="Análise de Orçamentos"
            description="KPIs, decisão por linha (Aceitar · Negociar · Rejeitar) e Quality Index 0–100."
          >
            <AnaliseMini />
          </ShowcaseCard>

          <ShowcaseCard
            index="B"
            eyebrow="Workspace · /dashboard/obras/validacao"
            title="Aprovações"
            description="Kanban com SLA, checklist, comentários e auditoria exportável."
          >
            <AprovacoesMini />
          </ShowcaseCard>

          <ShowcaseCard
            index="C"
            eyebrow="IA · Copiloto de negociação"
            title="Script de Negociação"
            description="Argumentos, números e e-mail pronto a enviar para cada item acima da média."
          >
            <CopilotMini />
          </ShowcaseCard>

          <ShowcaseCard
            index="D"
            eyebrow="Exportar · Relatório Executivo"
            title="Relatórios & Exports"
            description="PDF executivo, Excel detalhado e exportação de auditoria — um clique."
          >
            <RelatoriosMini />
          </ShowcaseCard>
        </div>
      </div>
    </section>
  )
}

// ---------- Card shell -------------------------------------------------

interface ShowcaseCardProps {
  index: string
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}

function ShowcaseCard({ index, eyebrow, title, description, children }: ShowcaseCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border hairline bg-card transition-all duration-500 hover:border-primary/40 hover:bg-card/80 reveal-up">
      {/* hover accent */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-4 px-6 pt-6">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3 className="mt-1 font-sans text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <span className="shrink-0 font-display text-5xl font-medium tracking-tight text-primary/20 group-hover:text-primary/40">
          {index}
        </span>
      </div>

      {/* Mini mockup — bp-bracket matches the real workspace chrome */}
      <div className="relative mx-6 my-6 bp-bracket overflow-hidden rounded-xl border hairline bg-background/40">
        {children}
      </div>
    </article>
  )
}

// ---------- A · Análise mini -------------------------------------------

function AnaliseMini() {
  const rows: {
    name: string
    delta: string
    tone: "below" | "above" | "high"
    decision: "accepted" | "negotiate" | "rejected"
  }[] = [
    { name: "Demolição de paredes", delta: "-10.7%", tone: "below", decision: "accepted" },
    { name: "Pintura interior", delta: "+7.7%", tone: "above", decision: "negotiate" },
    { name: "Caixilharia especial", delta: "+54.2%", tone: "high", decision: "rejected" },
  ]

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between border-b hairline bg-secondary/30 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          MOAP / análise
        </span>
        <span className="eyebrow">24 artigos</span>
      </div>

      {/* KPI strip — identical to DashboardStatCard eyebrows */}
      <div className="grid grid-cols-4 divide-x hairline border-b hairline">
        {[
          { eb: "§ 01", label: "Orçamento", value: "€ 48.2k" },
          { eb: "§ 02", label: "Referência", value: "€ 51.1k" },
          { eb: "§ 03", label: "Desvio", value: "−5.6%", tone: "text-price-below" },
          { eb: "§ 04", label: "Rating", value: "Abaixo", tone: "text-price-below" },
        ].map((k) => (
          <div key={k.label} className="p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              {k.eb} / {k.label}
            </p>
            <p className={`mt-1 font-display text-sm font-medium tabular-nums ${k.tone ?? "text-foreground"}`}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y hairline">
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-2.5">
            <span className="truncate text-xs text-foreground">{r.name}</span>
            <span
              className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[9px] ${
                r.tone === "below"
                  ? "text-price-below bg-price-below/10 border-price-below/30"
                  : r.tone === "above"
                    ? "text-price-above bg-price-above/10 border-price-above/30"
                    : "text-price-high bg-price-high/10 border-price-high/30"
              }`}
            >
              {r.delta}
            </span>
            <MiniDecision decision={r.decision} />
          </div>
        ))}
      </div>

      {/* Quality Index footer */}
      <div className="flex items-center justify-between border-t hairline px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            Quality Index 92
          </span>
          <div className="h-1 w-20 overflow-hidden rounded-full bg-border/60">
            <div className="h-full bg-primary" style={{ width: "92%" }} />
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase text-muted-foreground">exemplo</span>
      </div>
    </div>
  )
}

function MiniDecision({ decision }: { decision: "accepted" | "negotiate" | "rejected" }) {
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
    <div className="inline-flex items-center gap-px overflow-hidden rounded-full border hairline bg-background/40 p-0.5">
      {segments.map(({ key, Icon, active }) => {
        const isActive = key === decision
        return (
          <span
            key={key}
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-muted-foreground ${
              isActive ? active : "border-transparent"
            }`}
          >
            <Icon className="h-2.5 w-2.5" />
          </span>
        )
      })}
    </div>
  )
}

// ---------- B · Aprovações mini ---------------------------------------

function AprovacoesMini() {
  // Exact KPI strip from /dashboard/obras/validacao
  const kpis: {
    label: string
    value: string
    Icon: typeof Clock
    tone?: string
    active?: boolean
  }[] = [
    { label: "Pendentes", value: "8", Icon: Clock, active: true },
    { label: "Em Análise", value: "5", Icon: Eye },
    { label: "Info Adicional", value: "2", Icon: Info },
    { label: "Atrasadas SLA", value: "1", Icon: AlertTriangle, tone: "text-price-high" },
    { label: "Aprovação 30d", value: "87%", Icon: CheckCircle2, tone: "text-price-below" },
  ]

  const columns = [
    {
      title: "Pendentes",
      count: 8,
      cards: [
        { title: "Requalificação Edifício Aurora", client: "Câmara de Lisboa", sla: "2d" },
        { title: "Ampliação Fábrica Norte", client: "Industrial Porto SA", sla: "—" },
      ],
    },
    {
      title: "Em Análise",
      count: 5,
      cards: [{ title: "Escola EB2/3 Oeiras", client: "Ministério Educação", sla: "5d" }],
    },
  ]

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between border-b hairline bg-secondary/30 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          MOAP / aprovações
        </span>
        <span className="eyebrow">Kanban · SLA</span>
      </div>

      {/* KPI strip (exact labels + icons from the real KpiCard) */}
      <div className="grid grid-cols-5 divide-x hairline border-b hairline">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`flex flex-col gap-1 p-2.5 ${
              k.active ? "bg-primary/8" : ""
            }`}
          >
            <div className="flex items-center gap-1.5">
              <k.Icon className={`h-3 w-3 ${k.tone ?? (k.active ? "text-primary" : "text-muted-foreground")}`} />
              <span className="truncate font-mono text-[8.5px] uppercase tracking-wider text-muted-foreground">
                {k.label}
              </span>
            </div>
            <span className={`font-display text-base font-medium tabular-nums ${k.tone ?? "text-foreground"}`}>
              {k.value}
            </span>
          </div>
        ))}
      </div>

      {/* Kanban preview */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {columns.map((col) => (
          <div key={col.title} className="rounded-lg border hairline bg-background/40 p-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                {col.title}
              </span>
              <span className="rounded-full bg-secondary px-1.5 font-mono text-[9px] text-muted-foreground">
                {col.count}
              </span>
            </div>
            <div className="space-y-1.5">
              {col.cards.map((c) => (
                <div key={c.title} className="rounded-md border hairline bg-card p-2">
                  <p className="truncate text-[11px] font-medium text-foreground">{c.title}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="truncate font-mono text-[9px] text-muted-foreground">{c.client}</p>
                    <span
                      className={`font-mono text-[9px] ${
                        c.sla === "—"
                          ? "text-muted-foreground"
                          : parseInt(c.sla) <= 2
                            ? "text-price-above"
                            : "text-muted-foreground"
                      }`}
                    >
                      SLA {c.sla}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- C · Copilot mini -------------------------------------------

function CopilotMini() {
  return (
    <div>
      <div className="flex items-center justify-between border-b hairline bg-secondary/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            Copiloto · script gerado
          </span>
        </div>
        <span className="eyebrow">Caixilharia · +54%</span>
      </div>

      <div className="space-y-3 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
        <p>
          <span className="text-foreground">Argumento 1.</span> O valor de mercado para esta
          referência situa-se em{" "}
          <span className="text-primary">€ 312/un</span>, 34% abaixo da vossa proposta.
        </p>
        <p>
          <span className="text-foreground">Argumento 2.</span> Três fornecedores na vossa
          região praticam até <span className="text-primary">€ 320/un</span> em volumes
          equivalentes.
        </p>
        <div className="rounded-md border hairline bg-card p-3">
          <p className="text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
            E-mail sugerido
          </p>
          <p className="mt-1 text-[11px] text-foreground">
            &quot;Agradecemos a proposta. Antes de avançar, gostaríamos de rever a rubrica
            <span className="text-primary"> Caixilharia especial</span> face ao mercado regional…&quot;
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t hairline px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase text-muted-foreground">
          Poupança potencial
        </span>
        <span className="font-display text-sm font-medium tabular-nums text-primary">
          € 8 640
        </span>
      </div>
    </div>
  )
}

// ---------- D · Relatórios mini ---------------------------------------

function RelatoriosMini() {
  const exports = [
    {
      name: "relatorio-executivo.pdf",
      hint: "Resumo de 1 página — KPIs, rating, top-3 itens críticos",
      Icon: Download,
      tone: "text-primary",
    },
    {
      name: "analise-detalhada.xlsx",
      hint: "Todas as linhas com decisão, variação e referência",
      Icon: FileSpreadsheet,
      tone: "text-foreground",
    },
    {
      name: "auditoria.csv",
      hint: "Log de decisões, comentários e mudanças de estado",
      Icon: Download,
      tone: "text-foreground",
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between border-b hairline bg-secondary/30 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          MOAP / exportar
        </span>
        <span className="eyebrow">3 formatos</span>
      </div>

      <div className="divide-y hairline">
        {exports.map((e) => (
          <div key={e.name} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border hairline bg-card">
                <e.Icon className={`h-4 w-4 ${e.tone}`} />
              </div>
              <div className="min-w-0">
                <p className="truncate font-mono text-[11px] text-foreground">{e.name}</p>
                <p className="truncate text-[10px] leading-tight text-muted-foreground">
                  {e.hint}
                </p>
              </div>
            </div>
            <span className="rounded-full border hairline px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Exportar
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t hairline bg-primary/5 px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          Assinado · GDPR
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          carimbo · hash SHA-256
        </span>
      </div>
    </div>
  )
}
