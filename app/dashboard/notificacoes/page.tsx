"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useData } from "@/contexts/data-context"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import Link from "next/link"
import {
  Bell,
  Building2,
  MessageSquare,
  Calculator,
  CalendarCheck,
  Briefcase,
  Settings,
  Check,
  Trash2,
  CheckCheck,
} from "lucide-react"

const typeIcons = {
  obra: Building2,
  message: MessageSquare,
  budget: Calculator,
  visit: CalendarCheck,
  concurso: Briefcase,
  system: Settings,
}

const typeLabels = {
  obra: "Obras",
  message: "Mensagens",
  budget: "Orçamentos",
  visit: "Visitas",
  concurso: "Concursos",
  system: "Sistema",
}

export default function NotificacoesPage() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, clearNotifications } = useData()

  const unreadCount = notifications.filter((n) => !n.read).length

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Agora mesmo"
    if (diffMins < 60) return `Há ${diffMins} minutos`
    if (diffHours < 24) return `Há ${diffHours} horas`
    if (diffDays < 7) return `Há ${diffDays} dias`
    return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })
  }

  const notificationTypes = [...new Set(notifications.map((n) => n.type))]

  const renderNotificationList = (filteredNotifications: typeof notifications) => (
    <div className="space-y-3">
      {filteredNotifications.length > 0 ? (
        filteredNotifications.map((notification) => {
          const Icon = typeIcons[notification.type]
          return (
            <Card
              key={notification.id}
              className={`bp-bracket relative overflow-hidden transition-colors ${
                !notification.read
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/60 bg-card/30"
              }`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                      !notification.read ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-background/60 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {typeLabels[notification.type]} · {formatTime(notification.timestamp)}
                        </p>
                        <p className={`mt-1 font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{notification.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Badge variant="outline" className="border-primary/40 bg-primary/10 font-mono text-[10px] uppercase tracking-wider text-primary">
                            Nova
                          </Badge>
                        )}
                        {notification.link && (
                          <Link href={notification.link}>
                            <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                              Ver
                            </Button>
                          </Link>
                        )}
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      ) : (
        <Card className="bp-bracket relative overflow-hidden border-border/60 bg-card/30">
          <CardContent className="py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-border/60 bg-background/60 text-muted-foreground">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Vazio</p>
            <h3 className="mt-2 font-display text-2xl font-medium tracking-tight">Sem notificações</h3>
            <p className="mt-1 text-sm text-muted-foreground">Não existem notificações nesta categoria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Conta / Alertas"
        title="Notificações"
        description={unreadCount > 0 ? `${unreadCount} notificações por ler` : "Todas as notificações lidas"}
        actions={
          <>
            <Button variant="outline" className="rounded-full gap-2" onClick={() => markAllNotificationsAsRead()} disabled={unreadCount === 0}>
              <CheckCheck className="h-4 w-4" />
              Marcar todas como lidas
            </Button>
            <Button variant="destructive" className="rounded-full gap-2" onClick={() => clearNotifications()} disabled={notifications.length === 0}>
              <Trash2 className="h-4 w-4" />
              Limpar
            </Button>
          </>
        }
      />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1 p-1 border border-border/60 bg-card/30">
          <TabsTrigger value="all" className="gap-2">
            Todas
            {notifications.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          {notificationTypes.map((type) => {
            const count = notifications.filter((n) => n.type === type).length
            const Icon = typeIcons[type]
            return (
              <TabsTrigger key={type} value={type} className="gap-2">
                <Icon className="h-4 w-4" />
                {typeLabels[type]}
                {count > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="all">{renderNotificationList(notifications)}</TabsContent>

        {notificationTypes.map((type) => (
          <TabsContent key={type} value={type}>
            {renderNotificationList(notifications.filter((n) => n.type === type))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
