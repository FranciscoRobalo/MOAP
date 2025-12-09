"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useData } from "@/contexts/data-context"
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
              className={`bg-card/50 transition-colors ${!notification.read ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      !notification.read ? "bg-primary/20" : "bg-muted"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${!notification.read ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={`font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">{formatTime(notification.timestamp)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.read && <Badge className="bg-primary/20 text-primary text-xs">Nova</Badge>}
                        {notification.link && (
                          <Link href={notification.link}>
                            <Button variant="outline" size="sm" className="bg-transparent">
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
        <Card className="bg-card/50">
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Sem notificações</h3>
            <p className="text-muted-foreground">Não existem notificações nesta categoria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} notificações por ler` : "Todas as notificações lidas"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => markAllNotificationsAsRead()} disabled={unreadCount === 0}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como lidas
          </Button>
          <Button variant="destructive" onClick={() => clearNotifications()} disabled={notifications.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-card/50 flex-wrap h-auto gap-1 p-1">
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
