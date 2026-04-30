"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MessageSquare, UserPlus, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  company: string
  status: "online" | "offline" | "away"
  projects: number
}

const mockClientes: User[] = [
  {
    id: "3",
    name: "Maria Santos",
    email: "maria.santos@arquitetura.pt",
    avatar: "/professional-woman-portrait.png",
    role: "Arquiteta",
    company: "Santos Arquitetura",
    status: "away",
    projects: 8,
  },
  {
    id: "5",
    name: "Ana Ferreira",
    email: "ana.ferreira@design.pt",
    avatar: "/woman-architect-portrait.png",
    role: "Designer de Interiores",
    company: "Ferreira Design",
    status: "online",
    projects: 6,
  },
]

export default function ClientesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { t, language } = useLanguage()

  const filteredUsers = mockClientes.filter(
    (user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("clients")}</h1>
          <p className="text-muted-foreground">
            {language === "pt" ? "Lista de clientes registados na plataforma." : "List of clients registered on the platform."}
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          {language === "pt" ? "Convidar Cliente" : "Invite Client"}
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={language === "pt" ? "Pesquisar por nome, email ou empresa..." : "Search by name, email or company..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-input/50"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="bg-card/50 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={user.avatar || "/placeholder.svg"}
                      alt={user.name}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card ${
                        user.status === "online"
                          ? "bg-price-below"
                          : user.status === "away"
                            ? "bg-price-average"
                            : "bg-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-base">{user.name}</CardTitle>
                    <CardDescription className="text-sm">{user.role}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>{language === "pt" ? "Ver Perfil" : "View Profile"}</DropdownMenuItem>
                    <DropdownMenuItem>{language === "pt" ? "Bloquear" : "Block"}</DropdownMenuItem>
                    <DropdownMenuItem>{language === "pt" ? "Reportar" : "Report"}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">{user.email}</p>
                <p className="font-medium">{user.company}</p>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {user.projects} {language === "pt" ? "projetos" : "projects"}
                </Badge>
                <Link href="/dashboard/messages">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {language === "pt" ? "Mensagem" : "Message"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
