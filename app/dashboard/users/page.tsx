"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
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
  type: "cliente" | "construtor" | "empreiteiro"
}

const mockUsers: User[] = [
  {
    id: "2",
    name: "João Silva",
    email: "joao.silva@empresa.pt",
    avatar: "/professional-man-portrait.png",
    role: "Engenheiro Civil",
    company: "Construções Silva Lda",
    status: "online",
    projects: 12,
    type: "construtor",
  },
  {
    id: "3",
    name: "Maria Santos",
    email: "maria.santos@arquitetura.pt",
    avatar: "/professional-woman-portrait.png",
    role: "Arquiteta",
    company: "Santos Arquitetura",
    status: "away",
    projects: 8,
    type: "cliente",
  },
  {
    id: "4",
    name: "Pedro Costa",
    email: "pedro.costa@construcao.pt",
    avatar: "/man-construction-worker-portrait.jpg",
    role: "Diretor de Obra",
    company: "Costa & Filhos",
    status: "offline",
    projects: 15,
    type: "empreiteiro",
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
    type: "cliente",
  },
  {
    id: "6",
    name: "Ricardo Oliveira",
    email: "ricardo@orcamentos.pt",
    avatar: "/business-portrait-man.png",
    role: "Orçamentista",
    company: "Oliveira Orçamentos",
    status: "online",
    projects: 22,
    type: "construtor",
  },
  {
    id: "7",
    name: "Carla Mendes",
    email: "carla.mendes@engenharia.pt",
    avatar: "/woman-engineer-portrait.jpg",
    role: "Engenheira Estrutural",
    company: "Mendes Engenharia",
    status: "offline",
    projects: 9,
    type: "empreiteiro",
  },
]

function UsersContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const searchParams = useSearchParams()
  const { t, language } = useLanguage()
  const typeFilter = searchParams.get("type") as "cliente" | "construtor" | "empreiteiro" | null

  const getPageTitle = () => {
    if (typeFilter === "cliente") return t("clients")
    if (typeFilter === "construtor") return t("builders")
    if (typeFilter === "empreiteiro") return t("contractors")
    return language === "pt" ? "Utilizadores" : language === "es" ? "Usuarios" : "Users"
  }

  const getPageDescription = () => {
    if (typeFilter === "cliente") return language === "pt" ? "Lista de clientes registados na plataforma." : language === "es" ? "Lista de clientes registrados en la plataforma." : "List of clients registered on the platform."
    if (typeFilter === "construtor") return language === "pt" ? "Lista de construtores registados na plataforma." : language === "es" ? "Lista de constructores registrados en la plataforma." : "List of builders registered on the platform."
    if (typeFilter === "empreiteiro") return language === "pt" ? "Lista de empreiteiros registados na plataforma." : language === "es" ? "Lista de contratistas registrados en la plataforma." : "List of contractors registered on the platform."
    return language === "pt" ? "Encontre e contacte outros profissionais da construção." : language === "es" ? "Encuentre y contacte a otros profesionales de la construcción." : "Find and contact other construction professionals."
  }

  const getTypeBadgeLabel = (type: string) => {
    if (type === "cliente") return t("clients")
    if (type === "construtor") return t("builders")
    if (type === "empreiteiro") return t("contractors")
    return type
  }

  const filteredUsers = mockUsers.filter(
    (user) => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.company.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter ? user.type === typeFilter : true
      return matchesSearch && matchesType
    }
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getPageTitle()}</h1>
          <p className="text-muted-foreground">{getPageDescription()}</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          {language === "pt" ? "Convidar Utilizador" : language === "es" ? "Invitar Usuario" : "Invite User"}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={language === "pt" ? "Pesquisar por nome, email ou empresa..." : language === "es" ? "Buscar por nombre, email o empresa..." : "Search by name, email or company..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-input/50"
        />
      </div>

      {/* Users Grid */}
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
                    <DropdownMenuItem>{language === "pt" ? "Ver Perfil" : language === "es" ? "Ver Perfil" : "View Profile"}</DropdownMenuItem>
                    <DropdownMenuItem>{language === "pt" ? "Bloquear" : language === "es" ? "Bloquear" : "Block"}</DropdownMenuItem>
                    <DropdownMenuItem>{language === "pt" ? "Reportar" : language === "es" ? "Reportar" : "Report"}</DropdownMenuItem>
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
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {user.projects} {language === "pt" ? "projetos" : language === "es" ? "proyectos" : "projects"}
                  </Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    {getTypeBadgeLabel(user.type)}
                  </Badge>
                </div>
                <Link href="/dashboard/messages">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {language === "pt" ? "Mensagem" : language === "es" ? "Mensaje" : "Message"}
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

export default function UsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersContent />
    </Suspense>
  )
}
