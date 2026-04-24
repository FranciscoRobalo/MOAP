"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/contexts/data-context"
import { useLanguage } from "@/contexts/language-context"
import {
  AlertTriangle,
  Building2,
  Calculator,
  MessageSquare,
  ArrowRight,
  Settings2,
  Check,
  BarChart3,
  DollarSign,
  Users,
  FileText,
  ArrowUpRight,
} from "lucide-react"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// Available card types for customization
type CardType = "obras" | "budgets" | "messages" | "analytics" | "prices" | "users" | "documents"

const STORAGE_KEY = "dashboard-visible-cards"
const DEFAULT_CARDS: CardType[] = ["obras", "budgets", "messages"]

export default function DashboardPage() {
  const { obras, budgets, conversations, notifications, materials } = useData()
  const { t, language } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)
  const [visibleCards, setVisibleCards] = useState<CardType[]>(DEFAULT_CARDS)
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false)
  const [tempVisibleCards, setTempVisibleCards] = useState<CardType[]>(DEFAULT_CARDS)

  useEffect(() => {
    setIsVisible(true)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setVisibleCards(parsed)
        setTempVisibleCards(parsed)
      } catch {
        // Use defaults
      }
    }
  }, [])

  const saveCardPreferences = () => {
    setVisibleCards(tempVisibleCards)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tempVisibleCards))
    setShowCustomizeDialog(false)
  }

  const toggleCard = (card: CardType) => {
    setTempVisibleCards((prev) =>
      prev.includes(card) ? prev.filter((c) => c !== card) : [...prev, card],
    )
  }

  const statusConfig = {
    pendente: { label: t("pending"), color: "bg-secondary text-muted-foreground border-hairline" },
    em_analise: { label: t("inAnalysis"), color: "bg-primary/10 text-primary border-primary/20" },
    info_adicional: {
      label: t("additionalInfo"),
      color: "bg-amber/10 text-amber border-amber/30",
    },
    aprovado: {
      label: t("approved"),
      color: "bg-price-below/10 text-price-below border-price-below/30",
    },
    rejeitado: {
      label: t("rejected"),
      color: "bg-price-high/10 text-price-high border-price-high/30",
    },
  }

  const approvedObras = obras.filter((o) => o.status === "aprovado").length
  const pendingObras = obras.filter((o) => o.status === "pendente" || o.status === "em_analise").length
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unread, 0)
  const unreadNotifications = notifications.filter((n) => !n.read).length

  const totalBudgetValue = budgets.reduce(
    (sum, b) =>
      sum + b.items.reduce((itemSum, item) => itemSum + item.quantity * item.unitPrice, 0),
    0,
  )

  // Stat card configs — editorial: eyebrow label + display number + mono footnote
  const allCardConfigs: Record<
    CardType,
    { title: string; value: string; description: string; icon: any; trend: string; link: string }
  > = {
    obras: {
      title: t("projects"),
      value: obras.length.toString(),
      description: `${approvedObras} ${t("approved").toLowerCase()}`,
      icon: Building2,
      trend: `+${pendingObras} ${t("pending").toLowerCase()}`,
      link: "/dashboard/obras",
    },
    budgets: {
      title: t("budgets"),
      value: budgets.length.toString(),
      description: `€${(totalBudgetValue / 1000).toFixed(0)}k total`,
      icon: Calculator,
      trend: `${budgets.filter((b) => b.status === "pendente").length} ${
        language === "pt" ? "pendentes" : language === "es" ? "pendientes" : "pending"
      }`,
      link: "/dashboard/registos",
    },
    messages: {
      title: t("messages"),
      value: unreadMessages.toString(),
      description:
        language === "pt" ? "Por ler" : language === "es" ? "Sin leer" : "Unread",
      icon: MessageSquare,
      trend: `${conversations.length} ${
        language === "pt" ? "conversas" : language === "es" ? "conversaciones" : "conversations"
      }`,
      link: "/dashboard/messages",
    },
    analytics: {
      title: language === "pt" ? "Análises" : language === "es" ? "Análisis" : "Analytics",
      value: budgets.filter((b) => b.analysisVariance !== undefined).length.toString(),
      description: language === "pt" ? "Orçamentos analisados" : "Analyzed budgets",
      icon: BarChart3,
      trend: language === "pt" ? "Ver relatórios" : "View reports",
      link: "/dashboard/analytics",
    },
    prices: {
      title: language === "pt" ? "Preços" : language === "es" ? "Precios" : "Prices",
      value: materials.length.toString(),
      description: language === "pt" ? "Materiais na base de dados" : "Materials in database",
      icon: DollarSign,
      trend: language === "pt" ? "Base de dados" : "Database",
      link: "/dashboard/prices",
    },
    users: {
      title: language === "pt" ? "Utilizadores" : language === "es" ? "Usuarios" : "Users",
      value: "3",
      description: language === "pt" ? "Tipos de conta" : "Account types",
      icon: Users,
      trend: language === "pt" ? "Gerir utilizadores" : "Manage users",
      link: "/dashboard/users",
    },
    documents: {
      title: language === "pt" ? "Documentos" : language === "es" ? "Documentos" : "Documents",
      value: obras.length.toString(),
      description: language === "pt" ? "Ficheiros submetidos" : "Submitted files",
      icon: FileText,
      trend: language === "pt" ? "Ver documentos" : "View documents",
      link: "/dashboard/obras",
    },
  }

  const cardLabels: Record<CardType, string> = {
    obras: language === "pt" ? "Obras" : language === "es" ? "Obras" : "Projects",
    budgets:
      language === "pt" ? "Orçamentos" : language === "es" ? "Presupuestos" : "Budgets",
    messages:
      language === "pt" ? "Mensagens" : language === "es" ? "Mensajes" : "Messages",
    analytics:
      language === "pt" ? "Análises" : language === "es" ? "Análisis" : "Analytics",
    prices: language === "pt" ? "Preços" : language === "es" ? "Precios" : "Prices",
    users:
      language === "pt"
        ? "Utilizadores"
        : language === "es"
          ? "Usuarios"
          : "Users",
    documents:
      language === "pt" ? "Documentos" : language === "es" ? "Documentos" : "Documents",
  }

  const stats = visibleCards.map((cardType) => allCardConfigs[cardType]).filter(Boolean)
  const recentObras = obras.slice(0, 4)
  const overviewEyebrow =
    language === "pt"
      ? "Espaço de trabalho / 01"
      : language === "es"
        ? "Área de trabajo / 01"
        : "Workspace / 01"

  return (
    <div className="space-y-8 page-transition">
      {/* Editorial page header — consistent with landing / auth */}
      <div
        className={`transition-all duration-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <DashboardPageHeader
          eyebrow={overviewEyebrow}
          title={t("overview")}
          description={`${t("welcomeBack")} ${t("dashboardSubtitle").toLowerCase()}.`}
          actions={
            <>
              <Dialog
                open={showCustomizeDialog}
                onOpenChange={(open) => {
                  setShowCustomizeDialog(open)
                  if (open) setTempVisibleCards(visibleCards)
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full gap-2">
                    <Settings2 className="h-4 w-4" />
                    {language === "pt" ? "Personalizar" : language === "es" ? "Personalizar" : "Customize"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {language === "pt"
                        ? "Personalizar Visão Geral"
                        : language === "es"
                          ? "Personalizar Vista General"
                          : "Customize Overview"}
                    </DialogTitle>
                    <DialogDescription>
                      {language === "pt"
                        ? "Selecione os cartões que deseja ver no painel principal."
                        : "Select the cards you want to see on the main dashboard."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3 py-4">
                    {(Object.keys(cardLabels) as CardType[]).map((cardType) => (
                      <div
                        key={cardType}
                        className={`flex items-center gap-3 rounded-md border p-3 transition-colors cursor-pointer ${
                          tempVisibleCards.includes(cardType)
                            ? "border-primary bg-primary/5"
                            : "border-hairline hover:border-primary/50"
                        }`}
                        onClick={() => toggleCard(cardType)}
                      >
                        <Checkbox
                          checked={tempVisibleCards.includes(cardType)}
                          onCheckedChange={() => toggleCard(cardType)}
                        />
                        <Label className="flex-1 cursor-pointer">{cardLabels[cardType]}</Label>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCustomizeDialog(false)}>
                      {language === "pt" ? "Cancelar" : "Cancel"}
                    </Button>
                    <Button onClick={saveCardPreferences} className="gap-2">
                      <Check className="h-4 w-4" />
                      {language === "pt" ? "Guardar" : "Save"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {unreadNotifications > 0 && (
                <Link href="/dashboard/notificacoes">
                  <Button variant="outline" size="sm" className="rounded-full gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber" />
                    <span>{unreadNotifications}</span>{" "}
                    <span className="hidden sm:inline">{t("notifications").toLowerCase()}</span>
                  </Button>
                </Link>
              )}
            </>
          }
        />
      </div>

      {/* Stats — hairline cards with display numbers + bp-brackets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-tutorial="stats">
        {stats.map((stat, index) => (
          <Link key={stat.title} href={stat.link} className="group">
            <Card
              className={`h-full rounded-lg border border-hairline bg-background/40 bp-bracket transition-all duration-500 hover:border-primary/40 hover:bg-background/70 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${100 + index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <p className="eyebrow">{stat.title}</p>
                <stat.icon className="h-4 w-4 text-muted-foreground/70 transition-colors group-hover:text-primary" />
              </CardHeader>
              <CardContent>
                <div className="font-display text-4xl font-medium tracking-tight text-foreground">
                  {stat.value}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] uppercase tracking-wider">
                  <span className="text-primary">{stat.trend}</span>
                  <span className="text-muted-foreground/70">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions — editorial amber accent (no pulse), hairline borders */}
      <div className="grid gap-4 md:grid-cols-3" data-tutorial="quick-actions">
        <Link href="/dashboard/registos" className="group md:col-span-2">
          <Card
            className={`relative h-full overflow-hidden rounded-lg border border-amber/30 bg-amber/5 transition-all duration-500 hover:border-amber/60 hover:bg-amber/10 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            <div className="absolute right-4 top-4">
              <span className="inline-flex items-center rounded-full border border-amber/40 bg-amber/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-amber">
                {language === "pt" ? "Destaque" : language === "es" ? "Destacado" : "Featured"}
              </span>
            </div>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-amber/30 bg-amber/10">
                  <Calculator className="h-5 w-5 text-amber" />
                </div>
                <div className="flex-1 pr-16 sm:pr-24">
                  <p className="eyebrow mb-1.5">
                    {language === "pt"
                      ? "Acesso rápido"
                      : language === "es"
                        ? "Acceso rápido"
                        : "Quick access"}
                  </p>
                  <h3 className="font-display text-2xl font-medium tracking-tight text-foreground">
                    {t("budgetApproval")}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {language === "pt"
                      ? "Aprovar orçamentos pendentes e gerir propostas submetidas pela equipa."
                      : language === "es"
                        ? "Aprobar presupuestos pendientes y gestionar propuestas enviadas."
                        : "Approve pending budgets and manage proposals submitted by the team."}
                  </p>
                </div>
                <ArrowUpRight className="hidden h-5 w-5 shrink-0 text-amber transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/analise" className="group">
          <Card
            className={`h-full rounded-lg border border-hairline bg-background/40 transition-all duration-500 hover:border-primary/40 hover:bg-background/70 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="eyebrow mb-1.5">
                    {language === "pt"
                      ? "Ferramenta"
                      : language === "es"
                        ? "Herramienta"
                        : "Tool"}
                  </p>
                  <h3 className="font-display text-lg font-medium tracking-tight text-foreground">
                    {t("budgetAnalysis")}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {language === "pt"
                      ? "Analisar novo orçamento"
                      : language === "es"
                        ? "Analizar nuevo presupuesto"
                        : "Analyze new budget"}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground/60 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent obras + activity feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          className={`rounded-lg border border-hairline bg-background/40 transition-all duration-500 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <div>
              <p className="eyebrow mb-1.5">
                {language === "pt" ? "Recentes" : language === "es" ? "Recientes" : "Recent"}
              </p>
              <CardTitle className="font-display text-xl font-medium tracking-tight">
                {t("recentDocuments")}
              </CardTitle>
              <CardDescription className="mt-1">
                {language === "pt"
                  ? "As suas últimas obras submetidas"
                  : language === "es"
                    ? "Sus últimas obras enviadas"
                    : "Your latest submitted projects"}
              </CardDescription>
            </div>
            <Link href="/dashboard/obras">
              <Button variant="ghost" size="sm" className="group -mr-2 gap-1.5 rounded-full text-muted-foreground hover:text-foreground">
                {language === "pt" ? "Ver todas" : language === "es" ? "Ver todas" : "View all"}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentObras.map((obra, index) => {
                const status =
                  statusConfig[obra.status as keyof typeof statusConfig] || {
                    label: obra.status || "Unknown",
                    color: "bg-secondary text-muted-foreground border-hairline",
                  }
                return (
                  <Link key={obra.id} href={`/dashboard/obras/${obra.id}`}>
                    <div
                      className={`group flex items-center justify-between gap-3 rounded-md border border-hairline/60 bg-background/40 p-3.5 transition-colors hover:border-primary/30 hover:bg-background/70 ${
                        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                      }`}
                      style={{ transitionDelay: `${900 + index * 80}ms` }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{obra.name}</p>
                          <p className="truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                            {obra.region}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p className="font-mono text-sm tabular-nums text-foreground">
                            €{(obra.estimatedBudget / 1000).toFixed(0)}k
                          </p>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {obra.progress}%{" "}
                            {language === "pt"
                              ? "completo"
                              : language === "es"
                                ? "completo"
                                : "complete"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`rounded-full border font-mono text-[10px] uppercase tracking-wider ${status.color}`}
                        >
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                )
              })}
              {recentObras.length === 0 && (
                <div className="animate-fade-in py-12 text-center">
                  <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-muted-foreground">
                    {language === "pt"
                      ? "Nenhuma obra encontrada"
                      : language === "es"
                        ? "No se encontraron obras"
                        : "No projects found"}
                  </p>
                  <Link href="/dashboard/obras/nova">
                    <Button className="mt-4 rounded-full" size="sm">
                      {t("createProject")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity feed */}
        <div
          className={`transition-all duration-500 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          }`}
          style={{ transitionDelay: "900ms" }}
        >
          <ActivityFeed limit={8} />
        </div>
      </div>
    </div>
  )
}

