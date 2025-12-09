"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useData } from "@/contexts/data-context"
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
} from "lucide-react"

const typeIcons = {
  obra: Building2,
  message: MessageSquare,
  budget: Calculator,
  visit: CalendarCheck,
  concurso: Briefcase,
  system: Settings,
}

export function NotificationsDropdown() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, clearNotifications } = useData()
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Agora"
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-price-high text-[10px] font-bold flex items-center justify-center text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {notifications.length > 0 && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => markAllNotificationsAsRead()}
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar lidas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-destructive"
                onClick={() => clearNotifications()}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            notifications.slice(0, 10).map((notification) => {
              const Icon = typeIcons[notification.type]
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 cursor-pointer ${!notification.read ? "bg-primary/5" : ""}`}
                  onClick={() => {
                    markNotificationAsRead(notification.id)
                    if (notification.link) {
                      setOpen(false)
                    }
                  }}
                  asChild={!!notification.link}
                >
                  {notification.link ? (
                    <Link href={notification.link}>
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          !notification.read ? "bg-primary/20" : "bg-muted"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${!notification.read ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>{notification.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{notification.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatTime(notification.timestamp)}</p>
                      </div>
                      {!notification.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </Link>
                  ) : (
                    <>
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          !notification.read ? "bg-primary/20" : "bg-muted"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${!notification.read ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>{notification.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{notification.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatTime(notification.timestamp)}</p>
                      </div>
                      {!notification.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </>
                  )}
                </DropdownMenuItem>
              )
            })
          ) : (
            <div className="py-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Sem notificações</p>
            </div>
          )}
        </ScrollArea>
        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/notificacoes" className="w-full text-center text-sm text-primary">
                Ver todas as notificações
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
