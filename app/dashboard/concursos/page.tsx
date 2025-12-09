"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Building2,
  Calendar,
  MapPin,
  Euro,
  Search,
  Filter,
  UserPlus,
  Eye,
  Clock,
  Users,
  ExternalLink,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Concurso {
  id: string
  title: string
  entity: string
  type: string
  region: string
  budget: number
  deadline: string
  publishDate: string
  status: "aberto" | "fechado" | "em_avaliacao"
  category: string
  description: string
  participants: number
}

const mockConcursos: Concurso[] = [
  {
    id: "1",
    title: "Construção de Centro de Saúde Municipal",
    entity: "Câmara Municipal de Lisboa",
    type: "Concurso Público",
    region: "Lisboa e Vale do Tejo",
    budget: 3500000,
    deadline: "2024-03-15",
    publishDate: "2024-01-20",
    status: "aberto",
    category: "Saúde",
    description:
      "Construção de um novo centro de saúde com 15 gabinetes médicos, sala de espera, farmácia e estacionamento.",
    participants: 12,
  },
  {
    id: "2",
    title: "Reabilitação de Escola Secundária",
    entity: "Ministério da Educação",
    type: "Concurso Limitado",
    region: "Norte",
    budget: 1800000,
    deadline: "2024-02-28",
    publishDate: "2024-01-15",
    status: "aberto",
    category: "Educação",
    description: "Obras de reabilitação incluindo isolamento térmico, renovação de instalações elétricas e cobertura.",
    participants: 8,
  },
  {
    id: "3",
    title: "Pavimentação de Estradas Municipais",
    entity: "Câmara Municipal do Porto",
    type: "Ajuste Direto",
    region: "Norte",
    budget: 450000,
    deadline: "2024-02-10",
    publishDate: "2024-01-25",
    status: "em_avaliacao",
    category: "Infraestruturas",
    description: "Repavimentação de 5km de estradas municipais em várias freguesias.",
    participants: 15,
  },
  {
    id: "4",
    title: "Construção de Parque Desportivo",
    entity: "Câmara Municipal de Faro",
    type: "Concurso Público",
    region: "Algarve",
    budget: 2200000,
    deadline: "2024-01-30",
    publishDate: "2024-01-05",
    status: "fechado",
    category: "Desporto",
    description: "Construção de complexo desportivo com piscina, campos de ténis e pavilhão gimnodesportivo.",
    participants: 20,
  },
  {
    id: "5",
    title: "Ampliação de ETAR",
    entity: "Águas de Portugal",
    type: "Concurso Público",
    region: "Centro",
    budget: 5800000,
    deadline: "2024-04-01",
    publishDate: "2024-01-28",
    status: "aberto",
    category: "Saneamento",
    description:
      "Ampliação da estação de tratamento de águas residuais para aumentar capacidade de 50.000 para 80.000 habitantes.",
    participants: 6,
  },
]

const mockUsers = [
  { id: "1", name: "João Silva", email: "joao@empresa.pt", company: "Silva Construções" },
  { id: "2", name: "Maria Costa", email: "maria@buildtech.pt", company: "BuildTech Lda" },
  { id: "3", name: "António Ferreira", email: "antonio@obras.pt", company: "Ferreira & Filhos" },
  { id: "4", name: "Ana Santos", email: "ana@construir.pt", company: "Construir Mais" },
]

const categories = ["Todos", "Saúde", "Educação", "Infraestruturas", "Desporto", "Saneamento", "Habitação"]
const regions = ["Todas", "Norte", "Centro", "Lisboa e Vale do Tejo", "Alentejo", "Algarve", "Açores", "Madeira"]
const types = ["Todos", "Concurso Público", "Concurso Limitado", "Ajuste Direto"]

export default function ConcursosPage() {
  const [concursos] = useState<Concurso[]>(mockConcursos)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRegion, setFilterRegion] = useState("Todas")
  const [filterCategory, setFilterCategory] = useState("Todos")
  const [filterType, setFilterType] = useState("Todos")
  const [filterStatus, setFilterStatus] = useState("all")
  const [budgetMin, setBudgetMin] = useState("")
  const [budgetMax, setBudgetMax] = useState("")

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [selectedConcurso, setSelectedConcurso] = useState<Concurso | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [inviteMessage, setInviteMessage] = useState("")

  const filteredConcursos = concursos.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.entity.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = filterRegion === "Todas" || c.region === filterRegion
    const matchesCategory = filterCategory === "Todos" || c.category === filterCategory
    const matchesType = filterType === "Todos" || c.type === filterType
    const matchesStatus = filterStatus === "all" || c.status === filterStatus
    const matchesBudgetMin = !budgetMin || c.budget >= Number.parseFloat(budgetMin)
    const matchesBudgetMax = !budgetMax || c.budget <= Number.parseFloat(budgetMax)

    return (
      matchesSearch &&
      matchesRegion &&
      matchesCategory &&
      matchesType &&
      matchesStatus &&
      matchesBudgetMin &&
      matchesBudgetMax
    )
  })

  const statusConfig = {
    aberto: { label: "Aberto", color: "bg-price-below text-white" },
    fechado: { label: "Fechado", color: "bg-muted text-muted-foreground" },
    em_avaliacao: { label: "Em Avaliação", color: "bg-price-average text-white" },
  }

  const openInviteDialog = (concurso: Concurso) => {
    setSelectedConcurso(concurso)
    setSelectedUsers([])
    setInviteMessage("")
    setInviteDialogOpen(true)
  }

  const handleInvite = () => {
    // In a real app, this would send invitations
    alert(`Convites enviados para ${selectedUsers.length} utilizadores!`)
    setInviteDialogOpen(false)
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const daysUntilDeadline = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Concursos Públicos</h1>
        <p className="text-muted-foreground">Explore obras disponíveis e convide parceiros para participar.</p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por título ou entidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input/50"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="bg-input/50">
                <SelectValue placeholder="Região" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="bg-input/50">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-input/50">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-input/50">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_avaliacao">Em Avaliação</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Orçamento Mínimo (€)</Label>
              <Input
                type="number"
                placeholder="0"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className="bg-input/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Orçamento Máximo (€)</Label>
              <Input
                type="number"
                placeholder="10000000"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="bg-input/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filteredConcursos.length} concursos encontrados</p>
      </div>

      {/* Concursos List */}
      <div className="space-y-4">
        {filteredConcursos.map((concurso) => {
          const status = statusConfig[concurso.status]
          const days = daysUntilDeadline(concurso.deadline)

          return (
            <Card key={concurso.id} className="bg-card/50">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-lg leading-tight">{concurso.title}</h3>
                            <Badge className={status.color}>{status.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{concurso.entity}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground pl-11">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {concurso.region}
                        </span>
                        <span className="flex items-center gap-1">
                          <Euro className="h-3.5 w-3.5" />
                          {concurso.budget.toLocaleString("pt-PT")}€
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Prazo: {new Date(concurso.deadline).toLocaleDateString("pt-PT")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {concurso.participants} participantes
                        </span>
                        {concurso.status === "aberto" && days > 0 && (
                          <Badge
                            variant="outline"
                            className={days <= 7 ? "border-price-high text-price-high" : "border-primary text-primary"}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {days} dias restantes
                          </Badge>
                        )}
                      </div>

                      <div className="pl-11 flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">{concurso.type}</Badge>
                        <Badge variant="outline">{concurso.category}</Badge>
                      </div>

                      <p className="text-sm text-muted-foreground pl-11 mt-2 line-clamp-2">{concurso.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pl-11">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{concurso.title}</DialogTitle>
                          <DialogDescription>{concurso.entity}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Região:</span>
                              <p className="font-medium">{concurso.region}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tipo:</span>
                              <p className="font-medium">{concurso.type}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Orçamento Base:</span>
                              <p className="font-medium">{concurso.budget.toLocaleString("pt-PT")}€</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Prazo de Submissão:</span>
                              <p className="font-medium">{new Date(concurso.deadline).toLocaleDateString("pt-PT")}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Data de Publicação:</span>
                              <p className="font-medium">
                                {new Date(concurso.publishDate).toLocaleDateString("pt-PT")}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Participantes:</span>
                              <p className="font-medium">{concurso.participants}</p>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-sm">Descrição:</span>
                            <p className="mt-1 p-3 bg-muted/50 rounded-lg text-sm">{concurso.description}</p>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button className="flex-1">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver Documentos
                            </Button>
                            <Button variant="outline" onClick={() => openInviteDialog(concurso)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Convidar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" size="sm" onClick={() => openInviteDialog(concurso)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Convidar Utilizadores
                    </Button>

                    <Button size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Candidatar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredConcursos.length === 0 && (
          <Card className="bg-card/50">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum concurso encontrado com os filtros selecionados.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Convidar Utilizadores</DialogTitle>
            <DialogDescription>
              {selectedConcurso && `Convide parceiros para o concurso: ${selectedConcurso.title}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Selecione os utilizadores a convidar:</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {mockUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    <Checkbox checked={selectedUsers.includes(user.id)} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.company} - {user.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mensagem (opcional):</Label>
              <Textarea
                placeholder="Adicione uma mensagem personalizada ao convite..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="bg-input/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInvite} disabled={selectedUsers.length === 0}>
                <UserPlus className="h-4 w-4 mr-2" />
                Enviar {selectedUsers.length > 0 && `(${selectedUsers.length})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
