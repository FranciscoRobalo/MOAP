"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/contexts/data-context"
import { AlertTriangle, Building2, Calendar, Calculator, MessageSquare, ArrowRight, Clock } from "lucide-react"

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-muted text-muted-foreground" },
  em_analise: { label: "Em Análise", color: "bg-primary/20 text-primary" },
  info_adicional: { label: "Info Adicional", color: "bg-price-above/20 text-price-above" },
  aprovado: { label: "Aprovado", color: "bg-price-below/20 text-price-below" },
  rejeitado: { label: "Rejeitado", color: "bg-price-high/20 text-price-high" },
}

export default function DashboardPage() {
  const { obras, budgets, visitas, conversations, notifications } = useData()

  const approvedObras = obras.filter((o) => o.status === "aprovado").length
  const pendingObras = obras.filter((o) => o.status === "pendente" || o.status === "em_analise").length
  const upcomingVisits = visitas.filter((v) => v.status === "agendada").length
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unread, 0)
  const unreadNotifications = notifications.filter((n) => !n.read).length

  const totalBudgetValue = budgets.reduce(
    (sum, b) => sum + b.items.reduce((itemSum, item) => itemSum + item.quantity * item.unitPrice, 0),
    0,
  )

  const stats = [
    {
      title: "Total de Obras",
      value: obras.length.toString(),
      description: `${approvedObras} aprovadas`,
      icon: Building2,
      trend: `+${pendingObras} pendentes`,
      link: "/dashboard/obras",
    },
    {
      title: "Orçamentos",
      value: budgets.length.toString(),
      description: `€${(totalBudgetValue / 1000).toFixed(0)}k total`,
      icon: Calculator,
      trend: `${budgets.filter((b) => b.status === "finalizado").length} finalizados`,
      link: "/dashboard/orcamentos",
    },
    {
      title: "Visitas Agendadas",
      value: upcomingVisits.toString(),
      description: "Próximas visitas",
      icon: Calendar,
      trend: `${visitas.filter((v) => v.status === "realizada").length} realizadas`,
      link: "/dashboard/visitas",
    },
    {
      title: "Mensagens",
      value: unreadMessages.toString(),
      description: "Por ler",
      icon: MessageSquare,
      trend: `${conversations.length} conversas`,
      link: "/dashboard/messages",
    },
  ]

  const recentObras = obras.slice(0, 4)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground">Bem-vindo de volta ao seu painel de controlo.</p>
        </div>
        {unreadNotifications > 0 && (
          <Link href="/dashboard/notificacoes">
            <Button variant="outline" size="sm">
              <AlertTriangle className="mr-2 h-4 w-4 text-price-above" />
              {unreadNotifications} notificações por ler
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.link}>
            <Card className="bg-card/50 hover:bg-card/80 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-price-below">{stat.trend}</span>
                  <span>{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/obras/nova">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:from-primary/20 hover:to-primary/10 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/20">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Nova Obra</h3>
                  <p className="text-sm text-muted-foreground">Submeter um novo projeto</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/orcamentos">
          <Card className="bg-gradient-to-br from-price-below/10 to-price-below/5 border-price-below/20 hover:from-price-below/20 hover:to-price-below/10 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-price-below/20">
                  <Calculator className="h-6 w-6 text-price-below" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Criar Orçamento</h3>
                  <p className="text-sm text-muted-foreground">Novo orçamento de materiais</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/visitas">
          <Card className="bg-gradient-to-br from-price-average/10 to-price-average/5 border-price-average/20 hover:from-price-average/20 hover:to-price-average/10 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-price-average/20">
                  <Calendar className="h-6 w-6 text-price-average" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Agendar Visita</h3>
                  <p className="text-sm text-muted-foreground">Marcar visita técnica</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Obras */}
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Obras Recentes</CardTitle>
              <CardDescription>As suas últimas obras submetidas</CardDescription>
            </div>
            <Link href="/dashboard/obras">
              <Button variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentObras.map((obra) => {
                const status = statusConfig[obra.status]
                return (
                  <Link key={obra.id} href={`/dashboard/obras/${obra.id}`}>
                    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{obra.name}</p>
                          <p className="text-sm text-muted-foreground">{obra.region}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">€{(obra.estimatedBudget / 1000).toFixed(0)}k</p>
                          <p className="text-xs text-muted-foreground">{obra.progress}% completo</p>
                        </div>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                    </div>
                  </Link>
                )
              })}
              {recentObras.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">Nenhuma obra encontrada</p>
                  <Link href="/dashboard/obras/nova">
                    <Button className="mt-4" size="sm">
                      Criar Nova Obra
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Visits */}
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Próximas Visitas</CardTitle>
              <CardDescription>Visitas agendadas</CardDescription>
            </div>
            <Link href="/dashboard/visitas">
              <Button variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {visitas
                .filter((v) => v.status === "agendada")
                .slice(0, 4)
                .map((visita) => (
                  <div
                    key={visita.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-price-average/10">
                        <Calendar className="h-5 w-5 text-price-average" />
                      </div>
                      <div>
                        <p className="font-medium">{visita.obraName}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(visita.date).toLocaleDateString("pt-PT")} às {visita.time}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary">Agendada</Badge>
                  </div>
                ))}
              {visitas.filter((v) => v.status === "agendada").length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">Nenhuma visita agendada</p>
                  <Link href="/dashboard/visitas">
                    <Button className="mt-4" size="sm">
                      Agendar Visita
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
