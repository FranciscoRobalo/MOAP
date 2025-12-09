"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "@/contexts/data-context"
import { Building2, MapPin, Calendar, Euro, Search, Plus, Eye, Filter, ArrowUpDown, Clock } from "lucide-react"

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-muted text-muted-foreground" },
  em_analise: { label: "Em Análise", color: "bg-primary/20 text-primary" },
  info_adicional: { label: "Info Adicional", color: "bg-price-above/20 text-price-above" },
  aprovado: { label: "Aprovado", color: "bg-price-below/20 text-price-below" },
  rejeitado: { label: "Rejeitado", color: "bg-price-high/20 text-price-high" },
}

const urgencyConfig = {
  baixa: { label: "Baixa", color: "text-muted-foreground" },
  media: { label: "Média", color: "text-price-average" },
  alta: { label: "Alta", color: "text-price-above" },
  urgente: { label: "Urgente", color: "text-price-high" },
}

export default function ObrasListPage() {
  const { obras } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date")

  const regions = [...new Set(obras.map((o) => o.region))]

  const filteredObras = obras
    .filter((obra) => {
      const matchesSearch =
        obra.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obra.address.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || obra.status === statusFilter
      const matchesRegion = regionFilter === "all" || obra.region === regionFilter
      return matchesSearch && matchesStatus && matchesRegion
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      if (sortBy === "budget") return b.estimatedBudget - a.estimatedBudget
      if (sortBy === "name") return a.name.localeCompare(b.name)
      return 0
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minhas Obras</h1>
          <p className="text-muted-foreground">Gerencie todas as suas obras e projetos.</p>
        </div>
        <Link href="/dashboard/obras/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Obra
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-card/50">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar obras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-input/50"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-input/50">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(statusConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[160px] bg-input/50">
                  <MapPin className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Região" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Regiões</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-input/50">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="budget">Orçamento</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Obras</p>
                <p className="text-2xl font-bold">{obras.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprovadas</p>
                <p className="text-2xl font-bold text-price-below">
                  {obras.filter((o) => o.status === "aprovado").length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-price-below/20 flex items-center justify-center">
                <span className="text-price-below font-bold">
                  {Math.round((obras.filter((o) => o.status === "aprovado").length / obras.length) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Análise</p>
                <p className="text-2xl font-bold text-primary">
                  {obras.filter((o) => o.status === "em_analise" || o.status === "pendente").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Orçamento Total</p>
                <p className="text-2xl font-bold">
                  €{(obras.reduce((sum, o) => sum + o.estimatedBudget, 0) / 1000000).toFixed(1)}M
                </p>
              </div>
              <Euro className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Obras Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredObras.map((obra) => {
          const status = statusConfig[obra.status]
          const urgency = urgencyConfig[obra.urgency as keyof typeof urgencyConfig]

          return (
            <Card key={obra.id} className="bg-card/50 hover:bg-card/80 transition-colors group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{obra.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {obra.region}
                    </CardDescription>
                  </div>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{obra.description}</p>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span>€{(obra.estimatedBudget / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(obra.startDate).toLocaleDateString("pt-PT", { month: "short", year: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className={urgency?.color}>{obra.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${obra.progress}%` }}
                    />
                  </div>
                </div>

                <Link href={`/dashboard/obras/${obra.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors bg-transparent"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalhes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredObras.length === 0 && (
        <Card className="bg-card/50">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma obra encontrada</h3>
            <p className="text-muted-foreground mb-4">Tente ajustar os filtros ou crie uma nova obra.</p>
            <Link href="/dashboard/obras/nova">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Obra
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
