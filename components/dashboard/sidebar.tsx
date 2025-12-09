"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  FileText,
  Upload,
  DollarSign,
  MessageSquare,
  Users,
  Star,
  LogOut,
  Menu,
  X,
  Building2,
  ClipboardCheck,
  Calendar,
  Briefcase,
  UserPlus,
  Calculator,
  FileSpreadsheet,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const navigation = [
  { name: "Visão Geral", href: "/dashboard", icon: FileText },
  { name: "Nova Obra", href: "/dashboard/obras/nova", icon: Building2 },
  { name: "Pré-Validação", href: "/dashboard/obras/validacao", icon: ClipboardCheck },
  { name: "Agendar Visita", href: "/dashboard/visitas", icon: Calendar },
  { name: "Concursos", href: "/dashboard/concursos", icon: Briefcase },
  { name: "Orçamentos", href: "/dashboard/orcamentos", icon: Calculator },
  { name: "Importar Documentos", href: "/dashboard/importar", icon: FileSpreadsheet },
  { name: "Preços de Materiais", href: "/dashboard/prices", icon: DollarSign },
  { name: "Carregar Documentos", href: "/dashboard/upload", icon: Upload },
  { name: "Mensagens", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Utilizadores", href: "/dashboard/users", icon: Users },
  { name: "Convidar", href: "/dashboard/convidar", icon: UserPlus },
  { name: "Propostas", href: "/dashboard/proposals", icon: Star },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <FileText className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-sidebar-foreground">MOAP</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-sidebar-accent overflow-hidden">
                <img
                  src={user?.avatar || "/placeholder.svg?height=40&width=40&query=avatar"}
                  alt={user?.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
              onClick={() => {
                logout()
                window.location.href = "/"
              }}
            >
              <LogOut className="h-4 w-4" />
              Terminar Sessão
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
