"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "@/contexts/data-context"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { DashboardStatCard } from "@/components/dashboard/stat-card"
import { Building2, MapPin, Calendar, Euro, Search, Plus, Eye, Filter, ArrowUpDown, Clock } from "lucide-react"

const statusConfig = {
  pending: { label: "Pendente", color: "bg-muted text-muted-foreground" },
  "in-analysis": { label: "Em Análise", color: "bg-primary/20 text-primary" },
  "info-needed": { label: "Info Adicional", color: "bg-price-above/20 text-price-above" },
  approved: { label: "Aprovado", color: "bg-price-below/20 text-price-below" },
  rejected: { label: "Rejeitado", color: "bg-price-high/20 text-price-high" },
}

export default function ObrasListPage() {
  const { obras } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date")

  const categories = [...new Set(obras.map((o) => o.category).filter(Boolean))]

  const filteredObras = obras
    .filter((obra) => {
      const matchesSearch =
        (obra.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (obra.location?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (obra.client?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || obra.status === statusFilter
      const matchesCategory = categoryFilter === "all" || obra.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === "budget") return (b.budget || 0) - (a.budget || 0)
      if (sortBy === "name") return (a.title || "").localeCompare(b.title || "")
      return 0
    })

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Projetos / 03"
        title="Minhas Obras"
        description="Gerencie todas as suas obras e projetos."
        actions={
          <Link href="/dashboard/obras/nova">
            <Button className="rounded-full gap-2">
              <Plus className="h-4 w-4" />
              Nova Obra
            </Button>
          </Link>
        }
      />

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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] bg-input/50">
                  <Building2 className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
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
        <DashboardStatCard eyebrow="Total de Obras" value={obras.length} icon={Building2} />
        <DashboardStatCard
          eyebrow="Aprovadas"
          value={obras.filter((o) => o.status === "approved").length}
          description={`${obras.length > 0 ? Math.round((obras.filter((o) => o.status === "approved").length / obras.length) * 100) : 0}% do total`}
        />
        <DashboardStatCard
          eyebrow="Em Análise"
          value={obras.filter((o) => o.status === "in-analysis" || o.status === "pending").length}
          icon={Clock}
          tone="primary"
        />
        <DashboardStatCard
          eyebrow="Orçamento Total"
          value={`€${(obras.reduce((sum, o) => sum + (o.budget || 0), 0) / 1000000).toFixed(1)}M`}
          icon={Euro}
        />
      </div>

      {/* Obras Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredObras.map((obra) => {
          const status = statusConfig[obra.status as keyof typeof statusConfig] || { label: obra.status || "Unknown", color: "bg-muted text-muted-foreground" }

          return (
            <Card key={obra.id} className="bg-card/50 hover:bg-card/80 transition-colors group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{obra.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {obra.location}
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
                    <span>€{((obra.budget || 0) / 1000).toFixed(0)}k</span>
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
                    <span className="text-muted-foreground">{obra.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${obra.progress || 0}%` }}
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
