"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useData } from "@/contexts/data-context"
import {
  Building2,
  MapPin,
  Calendar,
  Euro,
  ArrowLeft,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Calculator,
  CalendarCheck,
  Users,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react"

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-muted text-muted-foreground", icon: Clock },
  em_analise: { label: "Em Análise", color: "bg-primary/20 text-primary", icon: Clock },
  info_adicional: { label: "Info Adicional", color: "bg-price-above/20 text-price-above", icon: AlertCircle },
  aprovado: { label: "Aprovado", color: "bg-price-below/20 text-price-below", icon: Calendar },
  rejeitado: { label: "Rejeitado", color: "bg-price-high/20 text-price-high", icon: AlertCircle },
}

const urgencyConfig = {
  baixa: { label: "Baixa", color: "text-muted-foreground" },
  media: { label: "Média", color: "text-price-average" },
  alta: { label: "Alta", color: "text-price-above" },
  urgente: { label: "Urgente", color: "text-price-high" },
}

export default function ObraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { obras, budgets, visitas, users, deleteObra } = useData()

  const obra = obras.find((o) => o.id === id)
  const obraBudgets = budgets.filter((b) => b.obraId === id)
  const obraVisitas = visitas.filter((v) => v.obraId === id)
  const assignedUsersList = users.filter((u) => obra?.assignedUsers.includes(u.id))

  if (!obra) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Building2 className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">Obra não encontrada</h2>
        <Button onClick={() => router.push("/dashboard/obras")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar às Obras
        </Button>
      </div>
    )
  }

  const status = statusConfig[obra.status]
  const urgency = urgencyConfig[obra.urgency as keyof typeof urgencyConfig]
  const StatusIcon = status.icon

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja eliminar esta obra?")) {
      deleteObra(id)
      router.push("/dashboard/obras")
    }
  }

  const calculateTotalBudget = () => {
    return obraBudgets.reduce(
      (total, budget) => total + budget.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
      0,
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/obras")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{obra.name}</h1>
              <Badge className={status.color}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
              {urgency && (
                <Badge variant="outline" className={urgency.color}>
                  {urgency.label}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {obra.address || obra.region}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="bg-card/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso do Projeto</span>
            <span className="text-sm font-bold">{obra.progress}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-price-below transition-all duration-500"
              style={{ width: `${obra.progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Euro className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Orçamento Estimado</p>
                <p className="text-lg font-bold">€{obra.estimatedBudget.toLocaleString("pt-PT")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-price-below/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-price-below" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Orçamentado</p>
                <p className="text-lg font-bold">
                  €{calculateTotalBudget().toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-price-average/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-price-average" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data de Início</p>
                <p className="text-lg font-bold">{new Date(obra.startDate).toLocaleDateString("pt-PT")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-price-above/10 flex items-center justify-center">
                <CalendarCheck className="h-5 w-5 text-price-above" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data de Conclusão</p>
                <p className="text-lg font-bold">{new Date(obra.endDate).toLocaleDateString("pt-PT")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="bg-card/50">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="budgets">Orçamentos ({obraBudgets.length})</TabsTrigger>
          <TabsTrigger value="visits">Visitas ({obraVisitas.length})</TabsTrigger>
          <TabsTrigger value="team">Equipa ({assignedUsersList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Descrição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{obra.description}</p>
                {obra.requirements && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2">Requisitos Específicos</h4>
                    <p className="text-sm text-muted-foreground">{obra.requirements}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{obra.contactName}</p>
                    <p className="text-sm text-muted-foreground">Responsável</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{obra.contactPhone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{obra.contactEmail}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          {obraBudgets.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {obraBudgets.map((budget) => (
                <Card key={budget.id} className="bg-card/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{budget.name}</CardTitle>
                        <CardDescription>
                          Criado em {new Date(budget.createdDate).toLocaleDateString("pt-PT")}
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          budget.status === "finalizado"
                            ? "bg-price-below/20 text-price-below"
                            : budget.status === "enviado"
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                        }
                      >
                        {budget.status === "finalizado"
                          ? "Finalizado"
                          : budget.status === "enviado"
                            ? "Enviado"
                            : "Rascunho"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{budget.items.length} itens</span>
                      <span className="text-lg font-bold">
                        €
                        {budget.items
                          .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
                          .toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <Link href="/dashboard/orcamentos" className="block mt-4">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Ver Orçamento
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card/50">
              <CardContent className="py-12 text-center">
                <Calculator className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Sem orçamentos</h3>
                <p className="text-muted-foreground mb-4">Ainda não existem orçamentos para esta obra.</p>
                <Link href="/dashboard/orcamentos">
                  <Button>Criar Orçamento</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          {obraVisitas.length > 0 ? (
            <div className="space-y-4">
              {obraVisitas.map((visita) => (
                <Card key={visita.id} className="bg-card/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                          <span className="text-xs text-primary font-medium">
                            {new Date(visita.date).toLocaleDateString("pt-PT", { day: "2-digit" })}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(visita.date).toLocaleDateString("pt-PT", { month: "short" })}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{visita.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {visita.time} - {visita.contactName}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          visita.status === "realizada"
                            ? "bg-price-below/20 text-price-below"
                            : visita.status === "cancelada"
                              ? "bg-price-high/20 text-price-high"
                              : "bg-primary/20 text-primary"
                        }
                      >
                        {visita.status === "realizada"
                          ? "Realizada"
                          : visita.status === "cancelada"
                            ? "Cancelada"
                            : "Agendada"}
                      </Badge>
                    </div>
                    {visita.notes && <p className="text-sm text-muted-foreground mt-3 pl-16">{visita.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card/50">
              <CardContent className="py-12 text-center">
                <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Sem visitas agendadas</h3>
                <p className="text-muted-foreground mb-4">Ainda não existem visitas agendadas para esta obra.</p>
                <Link href="/dashboard/visitas">
                  <Button>Agendar Visita</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          {assignedUsersList.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignedUsersList.map((user) => (
                <Card key={user.id} className="bg-card/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.role}</p>
                        <p className="text-xs text-muted-foreground">{user.company}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card/50">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Sem equipa atribuída</h3>
                <p className="text-muted-foreground">Ainda não existem membros atribuídos a esta obra.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
