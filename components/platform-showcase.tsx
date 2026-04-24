"use client"

import { Shield, FileUp, BarChart3, Database, Check } from "lucide-react"

export function PlatformShowcase() {
  const capabilities = [
    {
      index: "A",
      category: "Extração de dados",
      icon: FileUp,
      items: [
        "Extração precisa de itens e quantidades",
        "Correspondência com base de 50k+ materiais",
        "Processamento de múltiplos formatos",
        "Validação automática de dados",
      ],
    },
    {
      index: "B",
      category: "Análise de preços",
      icon: BarChart3,
      items: [
        "Comparação com preços de mercado regional",
        "Histórico de preços por material",
        "Análise de variações por região",
        "Relatórios detalhados por categoria",
      ],
    },
    {
      index: "C",
      category: "Base de dados",
      icon: Database,
      items: [
        "50.000+ materiais de construção",
        "Preços atualizados regularmente",
        "Categorias bem organizadas",
        "Busca rápida e intuitiva",
      ],
    },
    {
      index: "D",
      category: "Segurança",
      icon: Shield,
      items: [
        "Criptografia end-to-end",
        "Conformidade GDPR completa",
        "Autenticação segura",
        "Auditoria de operações",
      ],
    },
  ]

  return (
    <section className="relative overflow-hidden border-t hairline py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-6 border-b hairline pb-10 md:flex-row md:items-end md:justify-between reveal-up">
          <div>
            <p className="eyebrow-strong">§ 04 — Plataforma</p>
            <h2 className="mt-4 max-w-3xl text-balance font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Tudo que precisa para{" "}
              <span className="font-display font-medium tracking-tight text-primary">orçamentos precisos.</span>
            </h2>
          </div>
          <p className="max-w-md text-pretty text-base text-muted-foreground md:text-right">
            Ferramentas integradas para analisar, comparar e otimizar os seus orçamentos de construção.
          </p>
        </div>

        {/* Capabilities — horizontal scroll-snap track on mobile, grid on desktop */}
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {capabilities.map((cap, i) => (
            <article
              key={cap.category}
              className="group relative overflow-hidden rounded-2xl border hairline bg-card p-8 transition-all duration-500 hover:border-primary/40 hover:bg-card/80 reveal-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* hover accent */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border hairline bg-background">
                    <cap.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="eyebrow">Capacidade · {cap.index}</p>
                    <h3 className="mt-1 font-sans text-xl font-semibold tracking-tight text-foreground">
                      {cap.category}
                    </h3>
                  </div>
                </div>
                <span className="font-display text-5xl font-medium tracking-tight text-primary/20 group-hover:text-primary/40">
                  {cap.index}
                </span>
              </div>

              <ul className="mt-6 space-y-2.5 border-t hairline pt-6">
                {cap.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
