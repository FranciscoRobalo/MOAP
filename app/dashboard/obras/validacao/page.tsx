"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/contexts/data-context"
import { Building2, Calendar, MapPin, Euro, Eye, Clock, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react"

type ValidationStatus = "aprovado" | "pendente" | "em_analise" | "rejeitado" | "info_adicional"

const statusConfig: Record<ValidationStatus, { label: string; color: string; icon: React.ElementType }> = {
  aprovado: { label: "Aprovado", color: "bg-price-below text-white", icon: CheckCircle },
  pendente: { label: "Pendente", color: "bg-price-average text-white", icon: Clock },
  em_analise: { label: "Em Análise", color: "bg-primary text-primary-foreground", icon: AlertCircle },
  info_adicional: { label: "Info Adicional", color: "bg-price-above text-white", icon: AlertCircle },
  rejeitado: { label: "Rejeitado", color: "bg-price-high text-white", icon: XCircle },
}

export default function ValidacaoObrasPage() {
  const { obras } = useData()
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredObras = obras.filter((obra) => {
    const matchesStatus = filterStatus === "all" || obra.status === filterStatus
    const matchesSearch = obra.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const statusCounts = obras.reduce(
    (acc, obra) => {
      acc[obra.status] = (acc[obra.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pré-Validação de Obras</h1>
        <p className="text-muted-foreground">Acompanhe o estado de aprovação de cada obra submetida.</p>
      </div>

      {/* Status Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(statusConfig).map(([key, config]) => {
          const StatusIcon = config.icon
          return (
            <Card
              key={key}
              className={`bg-card/50 cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                filterStatus === key ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                    <p className="text-2xl font-bold">{statusCounts[key] || 0}</p>
                  </div>
                  <div className={`p-2 rounded-full ${config.color}`}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar obras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-input/50"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48 bg-input/50">
            <SelectValue placeholder="Todos os estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Obras List */}
      <div className="space-y-4">
        {filteredObras.map((obra) => {
          const status = statusConfig[obra.status]
          const StatusIcon = status.icon

          return (
            <Card key={obra.id} className="bg-card/50">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{obra.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {obra.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {obra.region}
                          </span>
                          <span className="flex items-center gap-1">
                            <Euro className="h-3.5 w-3.5" />
                            {obra.estimatedBudget.toLocaleString("pt-PT")}€
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(obra.createdDate).toLocaleDateString("pt-PT")}
                          </span>
                        </div>
                      </div>
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progresso da validação</span>
                        <span>{obra.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            obra.status === "aprovado"
                              ? "bg-price-below"
                              : obra.status === "rejeitado"
                                ? "bg-price-high"
                                : "bg-primary"
                          }`}
                          style={{ width: `${obra.progress}%` }}
                        />
                      </div>
                    </div>

                    {obra.requirements && (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 mt-2">
                        {obra.requirements}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/dashboard/obras/${obra.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredObras.length === 0 && (
          <Card className="bg-card/50">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma obra encontrada com os filtros selecionados.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
