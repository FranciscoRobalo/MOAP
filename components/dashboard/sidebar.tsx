"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  FileText,
  DollarSign,
  MessageSquare,
  Users,
  LogOut,
  Menu,
  X,
  LayoutGrid,
  Settings,
  Bell,
  BarChart3,
  TrendingUp,
  HelpCircle,
  UserPlus,
  ExternalLink,
  ClipboardCheck,
  Inbox,
} from "lucide-react"
import { useAuth, type UserRole } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface NavItem {
  nameKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  external?: boolean
}

interface NavSection {
  labelKey: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    labelKey: "navWorkspace",
    items: [
      { nameKey: "overview", href: "/dashboard", icon: LayoutGrid, roles: ["admin", "cliente", "tecnico"] },
      { nameKey: "budgetAnalysis", href: "/dashboard/analise", icon: BarChart3, roles: ["admin", "cliente", "tecnico"] },
      // Client-side view of budgets they submitted for admin review
      { nameKey: "mySubmissions", href: "/dashboard/meus-orcamentos", icon: Inbox, roles: ["cliente", "tecnico"] },
      { nameKey: "messages", href: "/dashboard/messages", icon: MessageSquare, roles: ["admin", "cliente", "tecnico"] },
    ],
  },
  {
    labelKey: "navAdmin",
    items: [
      // Admin queue for reviewing submitted analyses
      { nameKey: "budgetReviews", href: "/dashboard/revisoes", icon: ClipboardCheck, roles: ["admin"] },
      { nameKey: "analytics", href: "/dashboard/analytics", icon: TrendingUp, roles: ["admin"] },
      { nameKey: "materialPrices", href: "/dashboard/prices", icon: DollarSign, roles: ["admin"] },
      { nameKey: "budgetApproval", href: "/dashboard/registos", icon: UserPlus, roles: ["admin"] },
      { nameKey: "clients", href: "/dashboard/users?type=cliente", icon: Users, roles: ["admin"] },
      { nameKey: "builders", href: "/dashboard/users?type=construtor", icon: Users, roles: ["admin"] },
      { nameKey: "contractors", href: "/dashboard/users?type=empreiteiro", icon: Users, roles: ["admin"] },
    ],
  },
  {
    labelKey: "navAccount",
    items: [
      { nameKey: "notifications", href: "/dashboard/notificacoes", icon: Bell, roles: ["admin", "cliente", "tecnico"] },
      { nameKey: "help", href: "/dashboard/ajuda", icon: HelpCircle, roles: ["admin", "cliente", "tecnico"] },
      { nameKey: "settings", href: "/dashboard/definicoes", icon: Settings, roles: ["admin", "cliente", "tecnico"] },
    ],
  },
  {
    labelKey: "navTools",
    items: [
      {
        nameKey: "LAT",
        href: "https://limarestas.vercel.app",
        icon: ExternalLink,
        roles: ["admin", "cliente", "tecnico"],
        external: true,
      },
    ],
  },
]

const SECTION_LABELS: Record<string, { pt: string; en: string; es: string }> = {
  navWorkspace: { pt: "Espaço de trabalho", en: "Workspace", es: "Área de trabajo" },
  navAdmin: { pt: "Administração", en: "Administration", es: "Administración" },
  navAccount: { pt: "Conta", en: "Account", es: "Cuenta" },
  navTools: { pt: "Ferramentas", en: "Tools", es: "Herramientas" },
}

const ROLE_LABELS: Record<string, { pt: string; en: string; es: string }> = {
  admin: { pt: "Administrador", en: "Administrator", es: "Administrador" },
  cliente: { pt: "Cliente", en: "Client", es: "Cliente" },
  tecnico: { pt: "Técnico", en: "Technician", es: "Técnico" },
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, logout, pendingRegistrations } = useAuth()
  const { notifications } = useData()
  const { t, language } = useLanguage()
  const [mobileOpen, setMobileOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length
  const pendingRegCount = pendingRegistrations.filter((r) => r.status === "pending").length

  const sections = navSections
    .map((s) => ({
      ...s,
      items: s.items.filter((item) => user?.role && item.roles.includes(user.role)),
    }))
    .filter((s) => s.items.length > 0)

  const roleLabel = user?.role
    ? ROLE_LABELS[user.role]?.[language as "pt" | "en" | "es"] ?? user.role
    : ""

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        data-tutorial="sidebar"
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-sidebar border-r border-hairline/80 transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo — editorial wordmark with mono product label */}
          <div className="flex h-16 items-center gap-2.5 border-b border-hairline/80 px-6">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary transition-transform group-hover:scale-105">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-sans text-base font-semibold tracking-tight text-sidebar-foreground">
                  MOAP
                </span>
                <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Orçamentos
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
            {sections.map((section) => (
              <div key={section.labelKey}>
                <p className="eyebrow mb-2 px-3">
                  {SECTION_LABELS[section.labelKey]?.[language as "pt" | "en" | "es"] ?? section.labelKey}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    // For links with query params (e.g. /dashboard/users?type=cliente),
                    // we must compare the full href including the query string to avoid
                    // multiple items lighting up at once.
                    const currentSearch = searchParams.toString()
                    const fullUrl = pathname + (currentSearch ? `?${currentSearch}` : "")
                    const isActive =
                      !item.external &&
                      (item.href.includes("?")
                        ? fullUrl === item.href
                        : pathname === item.href ||
                          (item.href !== "/dashboard" && pathname.startsWith(item.href.split("?")[0])))
                    const showNotificationBadge =
                      item.href === "/dashboard/notificacoes" && unreadCount > 0
                    const showRegBadge = item.href === "/dashboard/registos" && pendingRegCount > 0

                    const linkClasses = cn(
                      "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                    )

                    const linkContent = (
                      <>
                        {/* Active indicator rule */}
                        {isActive && (
                          <span
                            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-sm bg-primary"
                            aria-hidden="true"
                          />
                        )}
                        <item.icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        <span className="flex-1 truncate">
                          {item.external ? item.nameKey : t(item.nameKey as any)}
                        </span>
                        {item.external && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground/60" aria-hidden="true" />
                        )}
                        {showNotificationBadge && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[10px] font-semibold text-primary-foreground">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                        {showRegBadge && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1.5 font-mono text-[10px] font-semibold text-amber-foreground">
                            {pendingRegCount > 9 ? "9+" : pendingRegCount}
                          </span>
                        )}
                      </>
                    )

                    if (item.external) {
                      return (
                        <a
                          key={item.nameKey}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setMobileOpen(false)}
                          className={linkClasses}
                        >
                          {linkContent}
                        </a>
                      )
                    }

                    return (
                      <Link
                        key={item.nameKey}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={linkClasses}
                      >
                        {linkContent}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section — editorial profile card */}
          <div className="border-t border-hairline/80 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-md border border-hairline/60 bg-background/40 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {user?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user?.name ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{user?.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
                <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {roleLabel}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              onClick={() => {
                logout()
                window.location.href = "/"
              }}
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
