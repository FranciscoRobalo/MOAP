"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, FileUp, BarChart3, Database } from "lucide-react"

export function PlatformShowcase() {
  const capabilities = [
    {
      category: "Extração de Dados",
      icon: FileUp,
      items: [
        "Extração precisa de items e quantidades",
        "Correspondência com base de dados de 50k+ materiais",
        "Processamento de múltiplos formatos",
        "Validação automática de dados",
      ],
      color: "from-blue-500 to-cyan-500",
    },
    {
      category: "Análise de Preços",
      icon: BarChart3,
      items: [
        "Comparação com preços de mercado regional",
        "Histórico de preços por material",
        "Análise de variações por região",
        "Relatórios detalhados por categoria",
      ],
      color: "from-emerald-500 to-teal-500",
    },
    {
      category: "Base de Dados Completa",
      icon: Database,
      items: [
        "50.000+ materiais de construção",
        "Preços atualizados regularmente",
        "7 regiões do país cobertas",
        "Categorias bem organizadas",
      ],
      color: "from-amber-500 to-orange-500",
    },
    {
      category: "Segurança Empresarial",
      icon: Shield,
      items: [
        "Criptografia end-to-end",
        "Conformidade GDPR completa",
        "Autenticação segura",
        "Auditoria de operações",
      ],
      color: "from-rose-500 to-pink-500",
    },
  ]

  const metrics = [
    { label: "Materiais Base de Dados", value: "50k+", icon: Database },
    { label: "Taxa de Correspondência", value: "Elevada", icon: FileUp },
    { label: "Regiões Cobertas", value: "7", icon: BarChart3 },
    { label: "Conformidade", value: "GDPR", icon: Shield },
  ]

  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge className="mb-4">Plataforma Completa de Análise</Badge>
          <h2 className="text-4xl font-bold tracking-tight">Tudo que Precisa para Orçamentos</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Ferramentas integradas para analisar, comparar e otimizar seus orçamentos de construção
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
          {capabilities.map((capability) => {
            const Icon = capability.icon
            return (
              <Card key={capability.category} className="border-border/40 bg-card/50 hover-lift">
                <CardHeader>
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${capability.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{capability.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {capability.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mb-16">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <Card key={metric.label} className="border-border/40 bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="text-2xl font-bold text-primary mt-2">{metric.value}</p>
                    </div>
                    <Icon className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Features Summary */}
        <Card className="border-border/40 bg-gradient-to-r from-card/50 to-card/30">
          <CardHeader>
            <CardTitle>25+ Funcionalidades Incluídas</CardTitle>
            <CardDescription>Tudo que precisa para gerir orçamentos de forma inteligente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h4 className="font-semibold mb-3">Análise de Dados</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Extração inteligente de PDFs</li>
                  <li>✓ Parsing de Excel e CSV</li>
                  <li>✓ Reconhecimento de padrões</li>
                  <li>✓ Normalização automática</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Inteligência</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Comparação de preços</li>
                  <li>✓ Análise de mercado regional</li>
                  <li>✓ Previsões com IA</li>
                  <li>✓ Detecção de anomalias</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Gestão</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Aprovações de admin</li>
                  <li>✓ Chat em tempo real</li>
                  <li>✓ Relatórios detalhados</li>
                  <li>✓ Multi-utilizador</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
