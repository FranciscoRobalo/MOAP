"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import {
  Building2,
  Calculator,
  Calendar,
  FileText,
  Home,
  MessageSquare,
  Settings,
  Users,
  Bell,
  BarChart3,
  Upload,
  UserPlus,
  HelpCircle,
  LogOut,
} from "lucide-react"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { language } = useLanguage()
  const { user, logout } = useAuth()
  const { obras, budgets } = useData()

  const labels = {
    searchPlaceholder:
      language === "pt"
        ? "Pesquisar na plataforma..."
        : language === "es"
          ? "Buscar en la plataforma..."
          : "Search the platform...",
    noResults:
      language === "pt"
        ? "Nenhum resultado encontrado."
        : language === "es"
          ? "No se encontraron resultados."
          : "No results found.",
    navigation: language === "pt" ? "Navegação" : language === "es" ? "Navegación" : "Navigation",
    quickActions: language === "pt" ? "Ações Rápidas" : language === "es" ? "Acciones Rápidas" : "Quick Actions",
    recentProjects:
      language === "pt" ? "Projetos Recentes" : language === "es" ? "Proyectos Recientes" : "Recent Projects",
    recentBudgets:
      language === "pt" ? "Orçamentos Recentes" : language === "es" ? "Presupuestos Recientes" : "Recent Budgets",
    overview: language === "pt" ? "Visão Geral" : language === "es" ? "Visión General" : "Overview",
    projects: language === "pt" ? "Obras" : language === "es" ? "Obras" : "Projects",
    newProject: language === "pt" ? "Nova Obra" : language === "es" ? "Nueva Obra" : "New Project",
    budgets: language === "pt" ? "Orçamentos" : language === "es" ? "Presupuestos" : "Budgets",
    analysis:
      language === "pt" ? "Análise de Orçamentos" : language === "es" ? "Análisis de Presupuestos" : "Budget Analysis",
    visits: language === "pt" ? "Visitas" : language === "es" ? "Visitas" : "Visits",
    messages: language === "pt" ? "Mensagens" : language === "es" ? "Mensajes" : "Messages",
    users: language === "pt" ? "Utilizadores" : language === "es" ? "Usuarios" : "Users",
    notifications: language === "pt" ? "Notificações" : language === "es" ? "Notificaciones" : "Notifications",
    settings: language === "pt" ? "Definições" : language === "es" ? "Configuración" : "Settings",
    prices: language === "pt" ? "Preços de Materiais" : language === "es" ? "Precios de Materiales" : "Material Prices",
    uploadDocument:
      language === "pt" ? "Carregar Documento" : language === "es" ? "Subir Documento" : "Upload Document",
    inviteUser: language === "pt" ? "Convidar Utilizador" : language === "es" ? "Invitar Usuario" : "Invite User",
    help: language === "pt" ? "Ajuda" : language === "es" ? "Ayuda" : "Help",
    logout: language === "pt" ? "Sair" : language === "es" ? "Cerrar Sesión" : "Logout",
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  if (!user) return null

  const navigationItems = [
    { icon: Home, label: labels.overview, href: "/dashboard" },
    { icon: Building2, label: labels.projects, href: "/dashboard/obras" },
    { icon: Calculator, label: labels.budgets, href: "/dashboard/orcamentos" },
    { icon: BarChart3, label: labels.analysis, href: "/dashboard/analise" },
    { icon: Calendar, label: labels.visits, href: "/dashboard/visitas" },
    { icon: FileText, label: labels.prices, href: "/dashboard/prices" },
    { icon: MessageSquare, label: labels.messages, href: "/dashboard/messages" },
    { icon: Users, label: labels.users, href: "/dashboard/users" },
    { icon: Bell, label: labels.notifications, href: "/dashboard/notificacoes" },
    { icon: Settings, label: labels.settings, href: "/dashboard/definicoes" },
  ]

  const quickActions = [
    { icon: Building2, label: labels.newProject, href: "/dashboard/obras/nova" },
    { icon: Upload, label: labels.uploadDocument, href: "/dashboard/upload" },
    { icon: UserPlus, label: labels.inviteUser, href: "/dashboard/convidar" },
    { icon: HelpCircle, label: labels.help, href: "/dashboard/ajuda" },
  ]

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={labels.searchPlaceholder} />
      <CommandList>
        <CommandEmpty>{labels.noResults}</CommandEmpty>

        <CommandGroup heading={labels.navigation}>
          {navigationItems.map((item) => (
            <CommandItem key={item.href} onSelect={() => runCommand(() => router.push(item.href))} className="gap-2">
              <item.icon className="h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={labels.quickActions}>
          {quickActions.map((item) => (
            <CommandItem key={item.href} onSelect={() => runCommand(() => router.push(item.href))} className="gap-2">
              <item.icon className="h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                logout()
                router.push("/")
              })
            }
            className="gap-2 text-destructive"
          >
            <LogOut className="h-4 w-4" />
            {labels.logout}
          </CommandItem>
        </CommandGroup>

        {obras.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={labels.recentProjects}>
              {obras.slice(0, 5).map((obra) => (
                <CommandItem
                  key={obra.id}
                  onSelect={() => runCommand(() => router.push(`/dashboard/obras/${obra.id}`))}
                  className="gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  {obra.name}
                  <span className="ml-auto text-xs text-muted-foreground">{obra.region}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {budgets.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={labels.recentBudgets}>
              {budgets.slice(0, 5).map((budget) => (
                <CommandItem
                  key={budget.id}
                  onSelect={() => runCommand(() => router.push("/dashboard/orcamentos"))}
                  className="gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  {budget.name}
                  <span className="ml-auto text-xs text-muted-foreground">
                    €{budget.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toLocaleString()}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
