"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MessageSquare, UserPlus, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

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
  {
    id: "6",
    name: "Ricardo Oliveira",
    email: "ricardo@orcamentos.pt",
    avatar: "/business-portrait-man.png",
    role: "Orçamentista",
    company: "Oliveira Orçamentos",
    status: "online",
    projects: 22,
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
  },
]

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilizadores</h1>
          <p className="text-muted-foreground">Encontre e contacte outros profissionais da construção.</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Utilizador
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome, email ou empresa..."
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
                    <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                    <DropdownMenuItem>Bloquear</DropdownMenuItem>
                    <DropdownMenuItem>Reportar</DropdownMenuItem>
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
                  {user.projects} projetos
                </Badge>
                <Link href="/dashboard/messages">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Mensagem
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
