"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useData } from "@/contexts/data-context"
import { useLanguage } from "@/contexts/language-context"
import { formatRelativeTime } from "@/lib/relative-time"
import {
  Activity,
  Building2,
  Calculator,
  MessageSquare,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react"

type ActivityItem = {
  id: string
  type: "obra" | "budget" | "message" | "notification"
  title: string
  subtitle: string
  timestamp: string
  link: string
  tone: "default" | "success" | "warning" | "danger" | "info"
}

const TONE_STYLES: Record<ActivityItem["tone"], { dot: string; icon: string }> = {
  default: { dot: "bg-muted-foreground/50", icon: "text-muted-foreground" },
  success: { dot: "bg-price-below", icon: "text-price-below" },
  warning: { dot: "bg-price-above", icon: "text-price-above" },
  danger: { dot: "bg-price-high", icon: "text-price-high" },
  info: { dot: "bg-primary", icon: "text-primary" },
}

const ICON_MAP = {
  obra: Building2,
  budget: Calculator,
  message: MessageSquare,
  notification: Bell,
} as const

const STATUS_TONE: Record<string, ActivityItem["tone"]> = {
  approved: "success",
  aprovado: "success",
  rejected: "danger",
  rejeitado: "danger",
  pending: "warning",
  pendente: "warning",
  "in-analysis": "info",
  em_analise: "info",
  "info-needed": "warning",
  info_adicional: "warning",
  finalizado: "success",
  enviado: "info",
  rascunho: "default",
}

export function ActivityFeed({ limit = 8 }: { limit?: number }) {
  const { obras, budgets, conversations, notifications } = useData()
  const { language } = useLanguage()

  const items = useMemo<ActivityItem[]>(() => {
    const feed: ActivityItem[] = []

    // Obras: recent updates
    for (const o of obras) {
      feed.push({
        id: `obra-${o.id}`,
        type: "obra",
        title: o.title || o.client || "Obra",
        subtitle:
          language === "pt"
            ? `Estado: ${o.status} · ${o.location ?? "—"}`
            : language === "es"
              ? `Estado: ${o.status} · ${o.location ?? "—"}`
              : `Status: ${o.status} · ${o.location ?? "—"}`,
        timestamp: o.updatedAt || o.createdAt,
        link: `/dashboard/obras/${o.id}`,
        tone: STATUS_TONE[o.status] ?? "default",
      })
    }

    // Budgets: submissions + approvals
    for (const b of budgets) {
      if (b.approvedAt) {
        feed.push({
          id: `budget-approved-${b.id}`,
          type: "budget",
          title: b.name,
          subtitle:
            language === "pt"
              ? `Orçamento aprovado · ${b.obraName}`
              : language === "es"
                ? `Presupuesto aprobado · ${b.obraName}`
                : `Budget approved · ${b.obraName}`,
          timestamp: b.approvedAt,
          link: `/dashboard/registos`,
          tone: "success",
        })
      }
      if (b.createdDate) {
        feed.push({
          id: `budget-created-${b.id}`,
          type: "budget",
          title: b.name,
          subtitle:
            language === "pt"
              ? `Orçamento criado · ${b.obraName}`
              : language === "es"
                ? `Presupuesto creado · ${b.obraName}`
                : `Budget created · ${b.obraName}`,
          timestamp: b.createdDate,
          link: `/dashboard/registos`,
          tone: STATUS_TONE[b.status] ?? "default",
        })
      }
    }

    // Conversations: latest message
    for (const c of conversations) {
      if (!c.lastMessage || !c.lastMessageTime) continue
      feed.push({
        id: `conv-${c.id}`,
        type: "message",
        title: c.participantName,
        subtitle: c.lastMessage.length > 80 ? c.lastMessage.slice(0, 80) + "…" : c.lastMessage,
        timestamp: c.lastMessageTime,
        link: `/dashboard/messages`,
        tone: c.unread > 0 ? "info" : "default",
      })
    }

    // Notifications (unread only to avoid noise)
    for (const n of notifications) {
      if (n.read) continue
      feed.push({
        id: `notif-${n.id}`,
        type: "notification",
        title: n.title,
        subtitle: n.description,
        timestamp: n.timestamp,
        link: n.link ?? "/dashboard/notificacoes",
        tone: n.type === "budget" ? "info" : n.type === "obra" ? "warning" : "default",
      })
    }

    // Sort by most recent
    feed.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime()
      const tb = new Date(b.timestamp).getTime()
      return tb - ta
    })

    return feed.slice(0, limit)
  }, [obras, budgets, conversations, notifications, limit, language])

  return (
    <Card className="bg-card/50 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {language === "pt" ? "Atividade Recente" : language === "es" ? "Actividad Reciente" : "Recent Activity"}
          </CardTitle>
          <CardDescription>
            {language === "pt"
              ? "Eventos em todas as suas obras e orçamentos"
              : language === "es"
                ? "Eventos en todas sus obras y presupuestos"
                : "Events across all your projects and budgets"}
          </CardDescription>
        </div>
        <Link href="/dashboard/notificacoes">
          <Button variant="ghost" size="sm" className="group">
            {language === "pt" ? "Ver tudo" : language === "es" ? "Ver todo" : "View all"}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
            <Clock className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              {language === "pt"
                ? "Sem atividade recente"
                : language === "es"
                  ? "Sin actividad reciente"
                  : "No recent activity"}
            </p>
          </div>
        ) : (
          <ol className="relative space-y-4">
            {/* vertical rail */}
            <div
              aria-hidden
              className="absolute left-[11px] top-2 bottom-2 w-px bg-border/60"
            />
            {items.map((item) => {
              const Icon = ICON_MAP[item.type]
              const tone = TONE_STYLES[item.tone]
              const StatusIcon =
                item.tone === "success"
                  ? CheckCircle2
                  : item.tone === "danger" || item.tone === "warning"
                    ? AlertCircle
                    : null
              return (
                <li key={item.id} className="relative pl-8">
                  <span
                    className={`absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-background ${tone.icon}`}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <Link
                    href={item.link}
                    className="group flex items-start justify-between gap-3 rounded-md -mx-2 px-2 py-1.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-medium truncate">
                        {item.title}
                        {StatusIcon && (
                          <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${tone.icon}`} />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                    <time
                      dateTime={item.timestamp}
                      className="shrink-0 whitespace-nowrap text-xs text-muted-foreground tabular-nums pt-0.5"
                    >
                      {formatRelativeTime(item.timestamp)}
                    </time>
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
