"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

const stats = [
  {
    title: "Documentos Analisados",
    value: "24",
    description: "Este mês",
    icon: FileText,
    trend: "+12%",
  },
  {
    title: "Propostas Aprovadas",
    value: "18",
    description: "Taxa de 75%",
    icon: CheckCircle,
    trend: "+8%",
  },
  {
    title: "Alertas de Preço",
    value: "6",
    description: "Acima da média",
    icon: AlertTriangle,
    trend: "-3%",
  },
  {
    title: "Poupança Estimada",
    value: "€12.4k",
    description: "Este trimestre",
    icon: TrendingUp,
    trend: "+22%",
  },
]

const recentDocuments = [
  { name: "Orçamento Obra Lisboa.pdf", date: "Hoje", status: "Analisado" },
  { name: "Proposta Renovação Porto.xlsx", date: "Ontem", status: "Pendente" },
  { name: "Materiais Construção Faro.pdf", date: "2 dias", status: "Analisado" },
  { name: "Orçamento Ampliação.pdf", date: "3 dias", status: "Analisado" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground">Bem-vindo de volta ao seu painel de controlo.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={stat.trend.startsWith("+") ? "text-price-below" : "text-price-high"}>
                  {stat.trend}
                </span>
                <span>{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Documents */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Documentos Recentes</CardTitle>
          <CardDescription>Os seus últimos documentos analisados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentDocuments.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">{doc.date}</p>
                  </div>
                </div>
                <span
                  className={`text-sm px-2 py-1 rounded-full ${
                    doc.status === "Analisado"
                      ? "bg-price-below/20 text-price-below"
                      : "bg-price-average/20 text-price-average"
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
