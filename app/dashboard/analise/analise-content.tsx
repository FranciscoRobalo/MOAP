"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
  Search,
  Info,
  Euro,
  FileText,
  BarChart3,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useData } from "@/contexts/data-context"

interface BudgetItem {
  id: string
  originalName: string
  matchedName: string | null
  unit: string
  quantity: number
  budgetPrice: number
  referenceMinPrice: number | null
  referenceMaxPrice: number | null
  referenceAvgPrice: number | null
  variance: number | null
  rating: "below" | "average" | "above" | "critical" | "unknown"
  category: string
  matchConfidence: number
  type: "material" | "work"
}

interface AnalysisResult {
  id: string
  fileName: string
  uploadDate: string
  region: string
  totalBudget: number
  totalReference: number
  overallVariance: number
  overallRating: "below" | "average" | "above" | "critical"
  items: BudgetItem[]
  stats: {
    totalItems: number
    matchedItems: number
    belowAverage: number
    average: number
    aboveAverage: number
    critical: number
    unknown: number
  }
}

const ratingConfig = {
  below: {
    label: "Abaixo da Média",
    shortLabel: "< -10%",
    color: "text-price-below",
    bg: "bg-price-below/20",
    border: "border-price-below",
    icon: TrendingDown,
    description: "Preço mais de 10% abaixo da média de mercado",
  },
  average: {
    label: "Na Média",
    shortLabel: "-10% a +10%",
    color: "text-price-average",
    bg: "bg-price-average/20",
    border: "border-price-average",
    icon: Minus,
    description: "Preço dentro da faixa de mercado (-10% a +10%)",
  },
  above: {
    label: "Acima da Média",
    shortLabel: "+11% a +49%",
    color: "text-price-above",
    bg: "bg-price-above/20",
    border: "border-price-above",
    icon: TrendingUp,
    description: "Preço entre 11% e 49% acima da média de mercado",
  },
  critical: {
    label: "Muito Acima",
    shortLabel: "> +50%",
    color: "text-price-critical",
    bg: "bg-price-critical/20",
    border: "border-price-critical",
    icon: AlertTriangle,
    description: "Preço mais de 50% acima da média de mercado",
  },
  unknown: {
    label: "Sem Referência",
    shortLabel: "N/A",
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-muted",
    icon: HelpCircle,
    description: "Material/trabalho não encontrado na base de dados",
  },
}

const regions = ["Lisboa", "Porto", "Faro", "Coimbra", "Braga", "Aveiro", "Setúbal", "Leiria", "Nacional"]

export default function AnaliseContent() {
  const { materials } = useData()
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [selectedRegion, setSelectedRegion] = useState("Nacional")
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRating, setFilterRating] = useState<string>("all")

  // Fuzzy match function to find similar items in database
  const findBestMatch = useCallback(
    (itemName: string, itemUnit: string) => {
      const normalizedName = itemName.toLowerCase().trim()
      let bestMatch = null
      let bestScore = 0

      for (const material of materials) {
        const materialName = material.name.toLowerCase()

        // Calculate similarity score
        let score = 0

        // Exact match
        if (materialName === normalizedName) {
          score = 100
        }
        // Contains match
        else if (materialName.includes(normalizedName) || normalizedName.includes(materialName)) {
          score = 80
        }
        // Word matching
        else {
          const itemWords = normalizedName.split(/\s+/)
          const materialWords = materialName.split(/\s+/)
          const matchedWords = itemWords.filter((word) =>
            materialWords.some((mw) => mw.includes(word) || word.includes(mw)),
          )
          score = (matchedWords.length / Math.max(itemWords.length, materialWords.length)) * 70
        }

        // Bonus for unit match
        if (material.unit.toLowerCase() === itemUnit.toLowerCase()) {
          score += 10
        }

        if (score > bestScore && score >= 40) {
          bestScore = score
          bestMatch = material
        }
      }

      return { match: bestMatch, confidence: bestScore }
    },
    [materials],
  )

  // Calculate rating based on variance
  const calculateRating = (variance: number | null): BudgetItem["rating"] => {
    if (variance === null) return "unknown"
    if (variance < -10) return "below"
    if (variance >= -10 && variance <= 10) return "average"
    if (variance > 10 && variance < 50) return "above"
    return "critical"
  }

  // Parse CSV content
  const parseCSV = (content: string): Array<{ name: string; unit: string; quantity: number; price: number }> => {
    const lines = content.split("\n").filter((line) => line.trim())
    const items: Array<{ name: string; unit: string; quantity: number; price: number }> = []

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      // Handle both comma and semicolon delimiters
      const delimiter = line.includes(";") ? ";" : ","
      const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ""))

      if (parts.length >= 4) {
        const name = parts[0]
        const unit = parts[1]
        const quantity = Number.parseFloat(parts[2].replace(",", ".")) || 1
        const price = Number.parseFloat(parts[3].replace(",", ".").replace(/[€\s]/g, "")) || 0

        if (name && price > 0) {
          items.push({ name, unit, quantity, price })
        }
      }
    }

    return items
  }

  // Analyze budget
  const analyzeBudget = useCallback(
    async (file: File) => {
      setIsAnalyzing(true)
      setAnalyzeProgress(0)

      try {
        const content = await file.text()
        const parsedItems = parseCSV(content)

        const analyzedItems: BudgetItem[] = []
        let totalBudget = 0
        let totalReference = 0
        let matchedCount = 0

        for (let i = 0; i < parsedItems.length; i++) {
          const item = parsedItems[i]
          const { match, confidence } = findBestMatch(item.name, item.unit)

          const itemTotal = item.quantity * item.price
          totalBudget += itemTotal

          let variance: number | null = null
          let refMin: number | null = null
          let refMax: number | null = null
          let refAvg: number | null = null

          if (match) {
            matchedCount++
            refMin = match.priceMin
            refMax = match.priceMax
            refAvg = (match.priceMin + match.priceMax) / 2
            variance = ((item.price - refAvg) / refAvg) * 100
            totalReference += item.quantity * refAvg
          }

          analyzedItems.push({
            id: `item-${i}`,
            originalName: item.name,
            matchedName: match?.name || null,
            unit: item.unit,
            quantity: item.quantity,
            budgetPrice: item.price,
            referenceMinPrice: refMin,
            referenceMaxPrice: refMax,
            referenceAvgPrice: refAvg,
            variance,
            rating: calculateRating(variance),
            category: match?.category || "Outros",
            matchConfidence: confidence,
            type: match?.type || "material",
          })

          // Update progress
          setAnalyzeProgress(Math.round(((i + 1) / parsedItems.length) * 100))
          await new Promise((r) => setTimeout(r, 30)) // Small delay for visual feedback
        }

        const overallVariance = totalReference > 0 ? ((totalBudget - totalReference) / totalReference) * 100 : 0

        const stats = {
          totalItems: analyzedItems.length,
          matchedItems: matchedCount,
          belowAverage: analyzedItems.filter((i) => i.rating === "below").length,
          average: analyzedItems.filter((i) => i.rating === "average").length,
          aboveAverage: analyzedItems.filter((i) => i.rating === "above").length,
          critical: analyzedItems.filter((i) => i.rating === "critical").length,
          unknown: analyzedItems.filter((i) => i.rating === "unknown").length,
        }

        setAnalysisResult({
          id: `analysis-${Date.now()}`,
          fileName: file.name,
          uploadDate: new Date().toISOString(),
          region: selectedRegion,
          totalBudget,
          totalReference,
          overallVariance,
          overallRating: calculateRating(overallVariance),
          items: analyzedItems,
          stats,
        })
      } catch (error) {
        console.error("Error analyzing budget:", error)
      } finally {
        setIsAnalyzing(false)
        setAnalyzeProgress(0)
      }
    },
    [findBestMatch, selectedRegion],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      const csvFile = files.find((f) => f.name.endsWith(".csv"))
      if (csvFile) {
        analyzeBudget(csvFile)
      }
    },
    [analyzeBudget],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      analyzeBudget(e.target.files[0])
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(value)
  }

  const filteredItems =
    analysisResult?.items.filter((item) => {
      const matchesSearch =
        item.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.matchedName?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterRating === "all" || item.rating === filterRating
      return matchesSearch && matchesFilter
    }) || []

  const exportReport = () => {
    if (!analysisResult) return

    let csvContent = "Material;Unidade;Quantidade;Preço Orçamento;Preço Referência;Variação;Classificação\n"

    analysisResult.items.forEach((item) => {
      csvContent += `"${item.originalName}";${item.unit};${item.quantity};${item.budgetPrice.toFixed(2)};${item.referenceAvgPrice?.toFixed(2) || "N/A"};${item.variance?.toFixed(1) || "N/A"}%;${ratingConfig[item.rating].label}\n`
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_${analysisResult.fileName.replace(".csv", "")}_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Análise de Orçamentos</h1>
        <p className="text-muted-foreground">
          Carregue um ficheiro CSV com o orçamento para comparar com os preços de referência.
        </p>
      </div>

      {/* Legend */}
      <Card className="bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            Legenda de Classificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(ratingConfig).map(([key, config]) => (
              <div key={key} className={cn("rounded-lg p-3 border", config.bg, config.border)}>
                <div className="flex items-center gap-2">
                  <config.icon className={cn("h-4 w-4", config.color)} />
                  <span className={cn("font-medium text-sm", config.color)}>{config.shortLabel}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{config.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!analysisResult ? (
        <>
          {/* Upload Area */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Carregar Orçamento</CardTitle>
              <CardDescription>
                O ficheiro CSV deve ter as colunas: Nome, Unidade, Quantidade, Preço Unitário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <div className="md:col-span-1">
                  <label className="text-sm font-medium mb-2 block">Região</label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="bg-input/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                className={cn(
                  "relative rounded-lg border-2 border-dashed p-12 text-center transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                )}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={isAnalyzing}
                />
                <div className="flex flex-col items-center gap-4">
                  {isAnalyzing ? (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                      </div>
                      <div className="w-full max-w-xs">
                        <Progress value={analyzeProgress} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-2">A analisar... {analyzeProgress}%</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Arraste o ficheiro CSV ou clique para selecionar</p>
                        <p className="text-sm text-muted-foreground">Formato: Nome;Unidade;Quantidade;Preço</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Format */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm">Formato do Ficheiro CSV</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                {`Nome;Unidade;Quantidade;Preço
Demolição de alvenaria;m2;50;12.50
Reboco tradicional;m2;120;18.00
Pintura interior;m2;200;6.50
Azulejo cerâmico 30x60;m2;45;35.00`}
              </pre>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Analysis Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orçamento</p>
                    <p className="text-2xl font-bold">{formatCurrency(analysisResult.totalBudget)}</p>
                  </div>
                  <Euro className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Referência Mercado</p>
                    <p className="text-2xl font-bold">{formatCurrency(analysisResult.totalReference)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card className={cn("bg-card/50", ratingConfig[analysisResult.overallRating].bg)}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Variação Global</p>
                    <p className={cn("text-2xl font-bold", ratingConfig[analysisResult.overallRating].color)}>
                      {analysisResult.overallVariance > 0 ? "+" : ""}
                      {analysisResult.overallVariance.toFixed(1)}%
                    </p>
                  </div>
                  {analysisResult.overallVariance > 0 ? (
                    <TrendingUp className={cn("h-8 w-8", ratingConfig[analysisResult.overallRating].color)} />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-price-below" />
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Itens Analisados</p>
                    <p className="text-2xl font-bold">
                      {analysisResult.stats.matchedItems}/{analysisResult.stats.totalItems}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats by Rating */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Classificação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center p-4 rounded-lg bg-price-below/10">
                  <p className="text-3xl font-bold text-price-below">{analysisResult.stats.belowAverage}</p>
                  <p className="text-sm text-muted-foreground">Abaixo</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-price-average/10">
                  <p className="text-3xl font-bold text-price-average">{analysisResult.stats.average}</p>
                  <p className="text-sm text-muted-foreground">Na Média</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-price-above/10">
                  <p className="text-3xl font-bold text-price-above">{analysisResult.stats.aboveAverage}</p>
                  <p className="text-sm text-muted-foreground">Acima</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-price-critical/10">
                  <p className="text-3xl font-bold text-price-critical">{analysisResult.stats.critical}</p>
                  <p className="text-sm text-muted-foreground">Crítico</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-3xl font-bold text-muted-foreground">{analysisResult.stats.unknown}</p>
                  <p className="text-sm text-muted-foreground">S/ Ref.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card className="bg-card/50">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Itens do Orçamento</CardTitle>
                  <CardDescription>
                    {analysisResult.fileName} - {new Date(analysisResult.uploadDate).toLocaleDateString("pt-PT")}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAnalysisResult(null)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Nova Análise
                  </Button>
                  <Button onClick={exportReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar material ou trabalho..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-input/50"
                  />
                </div>
                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger className="w-[200px] bg-input/50">
                    <SelectValue placeholder="Filtrar por classificação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as classificações</SelectItem>
                    <SelectItem value="below">Abaixo da Média</SelectItem>
                    <SelectItem value="average">Na Média</SelectItem>
                    <SelectItem value="above">Acima da Média</SelectItem>
                    <SelectItem value="critical">Muito Acima</SelectItem>
                    <SelectItem value="unknown">Sem Referência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">Todos ({filteredItems.length})</TabsTrigger>
                  <TabsTrigger value="materials">
                    Materiais ({filteredItems.filter((i) => i.type === "material").length})
                  </TabsTrigger>
                  <TabsTrigger value="works">
                    Trabalhos ({filteredItems.filter((i) => i.type === "work").length})
                  </TabsTrigger>
                </TabsList>

                {["all", "materials", "works"].map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Item</th>
                            <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Un.</th>
                            <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Qtd.</th>
                            <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Preço Orç.</th>
                            <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Preço Ref.</th>
                            <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Variação</th>
                            <th className="pb-3 text-center text-sm font-medium text-muted-foreground">Class.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredItems
                            .filter((item) => {
                              if (tab === "all") return true
                              if (tab === "materials") return item.type === "material"
                              return item.type === "work"
                            })
                            .map((item) => {
                              const rating = ratingConfig[item.rating]
                              const RatingIcon = rating.icon

                              return (
                                <tr key={item.id} className="group hover:bg-muted/50">
                                  <td className="py-4">
                                    <div>
                                      <p className="font-medium">{item.originalName}</p>
                                      {item.matchedName && item.matchedName !== item.originalName && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <CheckCircle className="h-3 w-3 text-price-below" />
                                          {item.matchedName} ({item.matchConfidence.toFixed(0)}% match)
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-4 text-muted-foreground">{item.unit}</td>
                                  <td className="py-4 text-right">{item.quantity}</td>
                                  <td className="py-4 text-right font-medium">{formatCurrency(item.budgetPrice)}</td>
                                  <td className="py-4 text-right text-muted-foreground">
                                    {item.referenceAvgPrice ? formatCurrency(item.referenceAvgPrice) : "—"}
                                  </td>
                                  <td className="py-4 text-right">
                                    {item.variance !== null ? (
                                      <span className={cn("font-medium", rating.color)}>
                                        {item.variance > 0 ? "+" : ""}
                                        {item.variance.toFixed(1)}%
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                  <td className="py-4">
                                    <div className="flex justify-center">
                                      <Badge className={cn("gap-1", rating.bg, rating.color)}>
                                        <RatingIcon className="h-3 w-3" />
                                        {rating.shortLabel}
                                      </Badge>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>

                      {filteredItems.length === 0 && (
                        <div className="py-12 text-center">
                          <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">Nenhum item encontrado com os filtros selecionados.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
