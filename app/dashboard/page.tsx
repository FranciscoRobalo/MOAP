"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/contexts/data-context"
import { useLanguage } from "@/contexts/language-context"
import { AlertTriangle, Building2, Calendar, Calculator, MessageSquare, ArrowRight, Clock } from "lucide-react"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const { obras, budgets, visitas, conversations, notifications } = useData()
  const { t, language } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const statusConfig = {
    pendente: { label: t("pending"), color: "bg-muted text-muted-foreground" },
    em_analise: { label: t("inAnalysis"), color: "bg-primary/20 text-primary" },
    info_adicional: { label: t("additionalInfo"), color: "bg-price-above/20 text-price-above" },
    aprovado: { label: t("approved"), color: "bg-price-below/20 text-price-below" },
    rejeitado: { label: t("rejected"), color: "bg-price-high/20 text-price-high" },
  }

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
      title: t("projects"),
      value: obras.length.toString(),
      description: `${approvedObras} ${t("approved").toLowerCase()}`,
      icon: Building2,
      trend: `+${pendingObras} ${t("pending").toLowerCase()}`,
      link: "/dashboard/obras",
    },
    {
      title: t("budgets"),
      value: budgets.length.toString(),
      description: `€${(totalBudgetValue / 1000).toFixed(0)}k total`,
      icon: Calculator,
      trend: `${budgets.filter((b) => b.status === "finalizado").length} ${language === "pt" ? "finalizados" : language === "es" ? "finalizados" : "completed"}`,
      link: "/dashboard/orcamentos",
    },
    {
      title: t("upcomingVisits"),
      value: upcomingVisits.toString(),
      description: language === "pt" ? "Próximas visitas" : language === "es" ? "Próximas visitas" : "Upcoming visits",
      icon: Calendar,
      trend: `${visitas.filter((v) => v.status === "realizada").length} ${language === "pt" ? "realizadas" : language === "es" ? "realizadas" : "completed"}`,
      link: "/dashboard/visitas",
    },
    {
      title: t("messages"),
      value: unreadMessages.toString(),
      description: language === "pt" ? "Por ler" : language === "es" ? "Sin leer" : "Unread",
      icon: MessageSquare,
      trend: `${conversations.length} ${language === "pt" ? "conversas" : language === "es" ? "conversaciones" : "conversations"}`,
      link: "/dashboard/messages",
    },
  ]

  const recentObras = obras.slice(0, 4)

  return (
    <div className="space-y-6 page-transition">
      <div
        className={`flex items-center justify-between transition-all duration-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("overview")}</h1>
          <p className="text-muted-foreground">
            {t("welcomeBack")} {t("dashboardSubtitle").toLowerCase()}.
          </p>
        </div>
        {unreadNotifications > 0 && (
          <Link href="/dashboard/notificacoes">
            <Button variant="outline" size="sm" className="hover-lift bg-transparent">
              <AlertTriangle className="mr-2 h-4 w-4 text-price-above animate-bounce-subtle" />
              <span className="badge-pulse">{unreadNotifications}</span> {t("notifications").toLowerCase()}
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-tutorial="stats">
        {stats.map((stat, index) => (
          <Link key={stat.title} href={stat.link}>
            <Card
              className={`bg-card/50 hover:bg-card/80 cursor-pointer h-full card-hover transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${100 + index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold stat-number">{stat.value}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-price-below">{stat.trend}</span>
                  <span>{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3" data-tutorial="quick-actions">
        <Link href="/dashboard/obras/nova">
          <Card
            className={`bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:from-primary/20 hover:to-primary/10 cursor-pointer card-hover transition-all duration-500 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/20 transition-transform duration-300 group-hover:scale-110">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{t("newProject")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "pt"
                      ? "Submeter um novo projeto"
                      : language === "es"
                        ? "Enviar un nuevo proyecto"
                        : "Submit a new project"}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/orcamentos">
          <Card
            className={`bg-gradient-to-br from-price-below/10 to-price-below/5 border-price-below/20 hover:from-price-below/20 hover:to-price-below/10 cursor-pointer card-hover transition-all duration-500 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-price-below/20">
                  <Calculator className="h-6 w-6 text-price-below" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{t("newBudget")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "pt"
                      ? "Novo orçamento de materiais"
                      : language === "es"
                        ? "Nuevo presupuesto de materiales"
                        : "New materials budget"}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/visitas">
          <Card
            className={`bg-gradient-to-br from-price-average/10 to-price-average/5 border-price-average/20 hover:from-price-average/20 hover:to-price-average/10 cursor-pointer card-hover transition-all duration-500 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "700ms" }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-price-average/20">
                  <Calendar className="h-6 w-6 text-price-average" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{t("scheduleVisit")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "pt"
                      ? "Marcar visita técnica"
                      : language === "es"
                        ? "Programar visita técnica"
                        : "Schedule technical visit"}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Obras */}
        <Card
          className={`bg-card/50 transition-all duration-500 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("recentDocuments")}</CardTitle>
              <CardDescription>
                {language === "pt"
                  ? "As suas últimas obras submetidas"
                  : language === "es"
                    ? "Sus últimas obras enviadas"
                    : "Your latest submitted projects"}
              </CardDescription>
            </div>
            <Link href="/dashboard/obras">
              <Button variant="ghost" size="sm" className="group">
                {language === "pt" ? "Ver todas" : language === "es" ? "Ver todas" : "View all"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentObras.map((obra, index) => {
                const status = statusConfig[obra.status]
                return (
                  <Link key={obra.id} href={`/dashboard/obras/${obra.id}`}>
                    <div
                      className={`flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4 hover:bg-muted/50 transition-all duration-300 cursor-pointer hover-scale ${
                        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                      }`}
                      style={{ transitionDelay: `${900 + index * 100}ms` }}
                    >
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
                          <p className="text-xs text-muted-foreground">
                            {obra.progress}%{" "}
                            {language === "pt" ? "completo" : language === "es" ? "completo" : "complete"}
                          </p>
                        </div>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                    </div>
                  </Link>
                )
              })}
              {recentObras.length === 0 && (
                <div className="text-center py-8 animate-fade-in">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">
                    {language === "pt"
                      ? "Nenhuma obra encontrada"
                      : language === "es"
                        ? "No se encontraron obras"
                        : "No projects found"}
                  </p>
                  <Link href="/dashboard/obras/nova">
                    <Button className="mt-4 btn-ripple" size="sm">
                      {t("createProject")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Visits */}
        <Card
          className={`bg-card/50 transition-all duration-500 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("upcomingVisits")}</CardTitle>
              <CardDescription>
                {language === "pt"
                  ? "Visitas agendadas"
                  : language === "es"
                    ? "Visitas programadas"
                    : "Scheduled visits"}
              </CardDescription>
            </div>
            <Link href="/dashboard/visitas">
              <Button variant="ghost" size="sm" className="group">
                {language === "pt" ? "Ver todas" : language === "es" ? "Ver todas" : "View all"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {visitas
                .filter((v) => v.status === "agendada")
                .slice(0, 4)
                .map((visita, index) => (
                  <div
                    key={visita.id}
                    className={`flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4 transition-all duration-300 hover-scale ${
                      isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                    }`}
                    style={{ transitionDelay: `${900 + index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-price-average/10">
                        <Calendar className="h-5 w-5 text-price-average" />
                      </div>
                      <div>
                        <p className="font-medium">{visita.obraName}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(visita.date).toLocaleDateString(
                            language === "pt" ? "pt-PT" : language === "es" ? "es-ES" : "en-GB",
                          )}{" "}
                          {language === "pt" ? "às" : language === "es" ? "a las" : "at"} {visita.time}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary">
                      {language === "pt" ? "Agendada" : language === "es" ? "Programada" : "Scheduled"}
                    </Badge>
                  </div>
                ))}
              {visitas.filter((v) => v.status === "agendada").length === 0 && (
                <div className="text-center py-8 animate-fade-in">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">
                    {language === "pt"
                      ? "Nenhuma visita agendada"
                      : language === "es"
                        ? "No hay visitas programadas"
                        : "No scheduled visits"}
                  </p>
                  <Link href="/dashboard/visitas">
                    <Button className="mt-4 btn-ripple" size="sm">
                      {t("scheduleVisit")}
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
