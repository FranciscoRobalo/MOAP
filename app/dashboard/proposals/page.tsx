"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Star,
  TrendingUp,
  TrendingDown,
  FileText,
  Calendar,
  MapPin,
  Euro,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Proposal {
  id: string
  name: string
  client: string
  location: string
  date: string
  totalValue: number
  status: "approved" | "pending" | "rejected" | "analyzing"
  rating: {
    overall: number
    priceAccuracy: number
    marketComparison: number
    documentation: number
  }
  priceIndicator: "below" | "average" | "above" | "high"
  variance: number
  itemsAnalyzed: number
  alerts: number
}

const mockProposals: Proposal[] = [
  {
    id: "1",
    name: "Renovação Apartamento T3 Chiado",
    client: "Carlos Mendes",
    location: "Lisboa",
    date: "2024-01-15",
    totalValue: 45000,
    status: "approved",
    rating: {
      overall: 4.5,
      priceAccuracy: 4.8,
      marketComparison: 4.2,
      documentation: 4.5,
    },
    priceIndicator: "below",
    variance: -8,
    itemsAnalyzed: 156,
    alerts: 0,
  },
  {
    id: "2",
    name: "Construção Moradia V4 Cascais",
    client: "Ana Sousa",
    location: "Cascais",
    date: "2024-01-12",
    totalValue: 320000,
    status: "analyzing",
    rating: {
      overall: 0,
      priceAccuracy: 0,
      marketComparison: 0,
      documentation: 0,
    },
    priceIndicator: "average",
    variance: 0,
    itemsAnalyzed: 0,
    alerts: 0,
  },
  {
    id: "3",
    name: "Reabilitação Edifício Histórico",
    client: "Município de Coimbra",
    location: "Coimbra",
    date: "2024-01-10",
    totalValue: 890000,
    status: "pending",
    rating: {
      overall: 3.8,
      priceAccuracy: 3.5,
      marketComparison: 4.0,
      documentation: 4.0,
    },
    priceIndicator: "above",
    variance: 22,
    itemsAnalyzed: 312,
    alerts: 8,
  },
  {
    id: "4",
    name: "Ampliação Escritórios Porto",
    client: "TechStart Lda",
    location: "Porto",
    date: "2024-01-08",
    totalValue: 125000,
    status: "rejected",
    rating: {
      overall: 2.5,
      priceAccuracy: 2.0,
      marketComparison: 2.8,
      documentation: 2.7,
    },
    priceIndicator: "high",
    variance: 65,
    itemsAnalyzed: 89,
    alerts: 15,
  },
  {
    id: "5",
    name: "Remodelação Cozinha Industrial",
    client: "Restaurante Sabores",
    location: "Faro",
    date: "2024-01-05",
    totalValue: 78000,
    status: "approved",
    rating: {
      overall: 4.2,
      priceAccuracy: 4.0,
      marketComparison: 4.5,
      documentation: 4.0,
    },
    priceIndicator: "average",
    variance: 3,
    itemsAnalyzed: 67,
    alerts: 2,
  },
]

const statusConfig = {
  approved: {
    label: "Aprovada",
    color: "bg-price-below/20 text-price-below",
    icon: CheckCircle,
  },
  pending: {
    label: "Pendente",
    color: "bg-price-average/20 text-price-average",
    icon: Clock,
  },
  rejected: {
    label: "Rejeitada",
    color: "bg-price-high/20 text-price-high",
    icon: AlertTriangle,
  },
  analyzing: {
    label: "Em Análise",
    color: "bg-primary/20 text-primary",
    icon: Eye,
  },
}

const priceIndicatorConfig = {
  below: {
    label: "Abaixo da Média",
    color: "text-price-below",
    bg: "bg-price-below/10",
  },
  average: {
    label: "Na Média",
    color: "text-price-average",
    bg: "bg-price-average/10",
  },
  above: {
    label: "Acima da Média",
    color: "text-price-above",
    bg: "bg-price-above/10",
  },
  high: {
    label: "Muito Acima",
    color: "text-price-high",
    bg: "bg-price-high/10",
  },
}

export default function ProposalsPage() {
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)

  const stats = {
    total: mockProposals.length,
    approved: mockProposals.filter((p) => p.status === "approved").length,
    pending: mockProposals.filter((p) => p.status === "pending" || p.status === "analyzing").length,
    avgRating:
      mockProposals.filter((p) => p.rating.overall > 0).reduce((acc, p) => acc + p.rating.overall, 0) /
        mockProposals.filter((p) => p.rating.overall > 0).length || 0,
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= Math.floor(rating)
                ? "fill-price-average text-price-average"
                : star - 0.5 <= rating
                  ? "fill-price-average/50 text-price-average"
                  : "text-muted-foreground",
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Propostas</h1>
        <p className="text-muted-foreground">Visualize e analise as suas propostas e avaliações.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Propostas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprovadas</p>
                <p className="text-2xl font-bold text-price-below">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-price-below" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Análise</p>
                <p className="text-2xl font-bold text-price-average">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-price-average" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avaliação Média</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
                  {renderStars(stats.avgRating)}
                </div>
              </div>
              <Star className="h-8 w-8 text-price-average" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Proposals List */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="approved">Aprovadas</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {mockProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  isSelected={selectedProposal?.id === proposal.id}
                  onClick={() => setSelectedProposal(proposal)}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4 mt-4">
              {mockProposals
                .filter((p) => p.status === "approved")
                .map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    isSelected={selectedProposal?.id === proposal.id}
                    onClick={() => setSelectedProposal(proposal)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ))}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 mt-4">
              {mockProposals
                .filter((p) => p.status === "pending" || p.status === "analyzing")
                .map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    isSelected={selectedProposal?.id === proposal.id}
                    onClick={() => setSelectedProposal(proposal)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ))}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4 mt-4">
              {mockProposals
                .filter((p) => p.status === "rejected")
                .map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    isSelected={selectedProposal?.id === proposal.id}
                    onClick={() => setSelectedProposal(proposal)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Proposal Details */}
        <div className="space-y-4">
          {selectedProposal ? (
            <>
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Detalhes da Proposta</CardTitle>
                  <CardDescription>{selectedProposal.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Cliente</span>
                      <span className="font-medium">{selectedProposal.client}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Localização</span>
                      <span className="font-medium">{selectedProposal.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Valor Total</span>
                      <span className="font-medium">{formatCurrency(selectedProposal.totalValue)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Itens Analisados</span>
                      <span className="font-medium">{selectedProposal.itemsAnalyzed}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Alertas</span>
                      <span
                        className={cn(
                          "font-medium",
                          selectedProposal.alerts > 0 ? "text-price-high" : "text-price-below",
                        )}
                      >
                        {selectedProposal.alerts}
                      </span>
                    </div>
                  </div>

                  {selectedProposal.status !== "analyzing" && (
                    <div className={cn("rounded-lg p-4", priceIndicatorConfig[selectedProposal.priceIndicator].bg)}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Variação de Preço</span>
                        <div className="flex items-center gap-2">
                          {selectedProposal.variance > 0 ? (
                            <TrendingUp
                              className={cn("h-4 w-4", priceIndicatorConfig[selectedProposal.priceIndicator].color)}
                            />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-price-below" />
                          )}
                          <span
                            className={cn("font-bold", priceIndicatorConfig[selectedProposal.priceIndicator].color)}
                          >
                            {selectedProposal.variance > 0 ? "+" : ""}
                            {selectedProposal.variance}%
                          </span>
                        </div>
                      </div>
                      <p className={cn("text-xs mt-1", priceIndicatorConfig[selectedProposal.priceIndicator].color)}>
                        {priceIndicatorConfig[selectedProposal.priceIndicator].label}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedProposal.rating.overall > 0 && (
                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Avaliações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center pb-4 border-b border-border">
                      <p className="text-4xl font-bold">{selectedProposal.rating.overall.toFixed(1)}</p>
                      <div className="flex justify-center mt-2">{renderStars(selectedProposal.rating.overall)}</div>
                      <p className="text-sm text-muted-foreground mt-1">Avaliação Geral</p>
                    </div>

                    <div className="space-y-3">
                      <RatingBar label="Precisão de Preços" value={selectedProposal.rating.priceAccuracy} />
                      <RatingBar label="Comparação de Mercado" value={selectedProposal.rating.marketComparison} />
                      <RatingBar label="Documentação" value={selectedProposal.rating.documentation} />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button className="w-full">Ver Relatório Completo</Button>
            </>
          ) : (
            <Card className="bg-card/50">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Selecione uma proposta para ver os detalhes</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ProposalCard({
  proposal,
  isSelected,
  onClick,
  formatCurrency,
  formatDate,
}: {
  proposal: Proposal
  isSelected: boolean
  onClick: () => void
  formatCurrency: (value: number) => string
  formatDate: (date: string) => string
}) {
  const StatusIcon = statusConfig[proposal.status].icon

  return (
    <Card
      className={cn("bg-card/50 cursor-pointer transition-all hover:bg-card/80", isSelected && "ring-2 ring-primary")}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{proposal.name}</h3>
              <Badge className={cn("text-xs", statusConfig[proposal.status].color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[proposal.status].label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{proposal.client}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {proposal.location}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formatDate(proposal.date)}
          </div>
          <div className="flex items-center gap-1 font-medium">
            <Euro className="h-4 w-4" />
            {formatCurrency(proposal.totalValue)}
          </div>
        </div>

        {proposal.rating.overall > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-3 w-3",
                    star <= Math.floor(proposal.rating.overall)
                      ? "fill-price-average text-price-average"
                      : "text-muted-foreground",
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{proposal.rating.overall.toFixed(1)}</span>
            {proposal.variance !== 0 && (
              <span className={cn("text-sm font-medium ml-auto", priceIndicatorConfig[proposal.priceIndicator].color)}>
                {proposal.variance > 0 ? "+" : ""}
                {proposal.variance}% vs mercado
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RatingBar({ label, value }: { label: string; value: number }) {
  const percentage = (value / 5) * 100

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(1)}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}
