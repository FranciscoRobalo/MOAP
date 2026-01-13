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
  AlertTriangle,
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

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, " ") // Replace special chars with space
    .replace(/\s+/g, " ") // Normalize spaces
    .trim()
}

function getWords(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .filter((w) => w.length > 2)
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }
  return matrix[b.length][a.length]
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1)
  const s2 = normalizeText(str2)

  if (s1 === s2) return 100

  const maxLen = Math.max(s1.length, s2.length)
  if (maxLen === 0) return 100

  const distance = levenshteinDistance(s1, s2)
  return Math.max(0, Math.round((1 - distance / maxLen) * 100))
}

export default function AnaliseContent() {
  const { materials } = useData()
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [selectedRegion, setSelectedRegion] = useState("Nacional")
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRating, setFilterRating] = useState<string>("all")

  const findBestMatch = useCallback(
    (itemName: string, itemUnit: string) => {
      const normalizedInput = normalizeText(itemName)
      const inputWords = getWords(itemName)

      let bestMatch = null
      let bestScore = 0

      for (const material of materials) {
        const normalizedMaterial = normalizeText(material.name)
        const materialWords = getWords(material.name)

        let score = 0

        // 1. Exact match (normalized)
        if (normalizedMaterial === normalizedInput) {
          score = 100
        }
        // 2. One contains the other
        else if (normalizedMaterial.includes(normalizedInput) || normalizedInput.includes(normalizedMaterial)) {
          score = 85
        }
        // 3. String similarity
        else {
          const stringSimilarity = calculateSimilarity(itemName, material.name)
          score = Math.max(score, stringSimilarity * 0.8)
        }

        // 4. Word-based matching - check how many words match
        const matchedWords = inputWords.filter((inputWord) =>
          materialWords.some((materialWord) => {
            // Exact word match
            if (materialWord === inputWord) return true
            // Word contains or is contained
            if (materialWord.includes(inputWord) || inputWord.includes(materialWord)) return true
            // Similar word (Levenshtein)
            if (inputWord.length > 3 && materialWord.length > 3) {
              const wordSimilarity = calculateSimilarity(inputWord, materialWord)
              return wordSimilarity >= 75
            }
            return false
          }),
        )

        if (matchedWords.length > 0) {
          const wordMatchRatio = matchedWords.length / Math.max(inputWords.length, 1)
          const wordScore = 40 + wordMatchRatio * 50 // 40-90 based on word matches
          score = Math.max(score, wordScore)
        }

        // 5. Check for key construction terms
        const keyTerms = [
          "demolicao",
          "demolição",
          "demolir",
          "betao",
          "betão",
          "concreto",
          "alvenaria",
          "tijolo",
          "bloco",
          "reboco",
          "estuque",
          "gesso",
          "pintura",
          "tinta",
          "pintar",
          "azulejo",
          "ceramica",
          "ceramico",
          "pavimento",
          "piso",
          "chao",
          "caixilharia",
          "janela",
          "porta",
          "eletrico",
          "eletrica",
          "electricidade",
          "canalizacao",
          "tubagem",
          "agua",
          "impermeabilizacao",
          "impermeabilizar",
          "pladur",
          "gesso cartonado",
          "divisoria",
          "teto",
          "tecto",
          "falso teto",
          "rodape",
          "soleira",
          "peitoril",
          "sanita",
          "lavatorio",
          "base duche",
          "aquecimento",
          "radiador",
          "piso radiante",
        ]

        for (const term of keyTerms) {
          const normalizedTerm = normalizeText(term)
          if (normalizedInput.includes(normalizedTerm) && normalizedMaterial.includes(normalizedTerm)) {
            score = Math.max(score, 60) // Boost score if key term matches
          }
        }

        // Unit match bonus
        if (material.unit.toLowerCase() === itemUnit.toLowerCase()) {
          score += 5
        }

        if (score > bestScore && score >= 25) {
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

  const parseCSV = (content: string): Array<{ name: string; unit: string; quantity: number; price: number }> => {
    const lines = content.split("\n").filter((line) => line.trim())
    const items: Array<{ name: string; unit: string; quantity: number; price: number }> = []

    // Try to detect delimiter
    const firstDataLine = lines[1] || lines[0]
    const delimiter = firstDataLine.includes(";") ? ";" : firstDataLine.includes("\t") ? "\t" : ","

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ""))

      if (parts.length >= 4) {
        const name = parts[0]
        const unit = parts[1] || "un"
        const quantity = Number.parseFloat(parts[2].replace(",", ".").replace(/[^\d.-]/g, "")) || 1
        const price =
          Number.parseFloat(
            parts[3]
              .replace(",", ".")
              .replace(/[€\s]/g, "")
              .replace(/[^\d.-]/g, ""),
          ) || 0

        if (name && name.length > 1) {
          items.push({ name, unit, quantity, price: price > 0 ? price : 0 })
        }
      } else if (parts.length >= 2) {
        // Try to extract at least name and price
        const name = parts[0]
        const price =
          Number.parseFloat(
            parts[parts.length - 1]
              .replace(",", ".")
              .replace(/[€\s]/g, "")
              .replace(/[^\d.-]/g, ""),
          ) || 0

        if (name && name.length > 1) {
          items.push({ name, unit: "un", quantity: 1, price: price > 0 ? price : 0 })
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
            refMin = match.priceMin || match.price
            refMax = match.priceMax || match.price
            refAvg = (refMin + refMax) / 2
            if (item.price > 0 && refAvg > 0) {
              variance = ((item.price - refAvg) / refAvg) * 100
            }
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
            type: match?.type || "work",
          })

          // Update progress
          setAnalyzeProgress(Math.round(((i + 1) / parsedItems.length) * 100))
          await new Promise((r) => setTimeout(r, 20))
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

    let csvContent =
      "Material;Correspondência;Unidade;Quantidade;Preço Orçamento;Preço Referência;Variação;Classificação;Confiança\n"

    analysisResult.items.forEach((item) => {
      csvContent += `"${item.originalName}";"${item.matchedName || "N/A"}";${item.unit};${item.quantity};${item.budgetPrice.toFixed(2)};${item.referenceAvgPrice?.toFixed(2) || "N/A"};${item.variance?.toFixed(1) || "N/A"}%;${ratingConfig[item.rating].label};${item.matchConfidence}%\n`
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
          Carregue um ficheiro CSV com o orçamento para comparar com os preços de referência. ({materials.length} itens
          na base de dados)
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
Betão C25/30;m3;10;95.00`}
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
                    <p className="text-sm text-muted-foreground">Itens Correspondidos</p>
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

          {/* Items List */}
          <Card className="bg-card/50">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg">Itens Analisados</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAnalysisResult(null)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Nova Análise
                  </Button>
                  <Button variant="default" size="sm" onClick={exportReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar itens..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-input/50"
                  />
                </div>
                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger className="w-full md:w-48 bg-input/50">
                    <SelectValue placeholder="Filtrar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="below">Abaixo da Média</SelectItem>
                    <SelectItem value="average">Na Média</SelectItem>
                    <SelectItem value="above">Acima da Média</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                    <SelectItem value="unknown">Sem Referência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Todos ({filteredItems.length})</TabsTrigger>
                  <TabsTrigger value="materials">
                    Materiais ({filteredItems.filter((i) => i.type === "material").length})
                  </TabsTrigger>
                  <TabsTrigger value="works">
                    Trabalhos ({filteredItems.filter((i) => i.type === "work").length})
                  </TabsTrigger>
                </TabsList>

                {["all", "materials", "works"].map((tab) => (
                  <TabsContent key={tab} value={tab}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 font-medium">Item do Orçamento</th>
                            <th className="text-left p-3 font-medium">Correspondência</th>
                            <th className="text-center p-3 font-medium">Un.</th>
                            <th className="text-right p-3 font-medium">Preço Orç.</th>
                            <th className="text-right p-3 font-medium">Preço Ref.</th>
                            <th className="text-right p-3 font-medium">Variação</th>
                            <th className="text-center p-3 font-medium">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems
                            .filter(
                              (item) =>
                                tab === "all" ||
                                (tab === "materials" ? item.type === "material" : item.type === "work"),
                            )
                            .map((item) => {
                              const config = ratingConfig[item.rating]
                              return (
                                <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50">
                                  <td className="p-3">
                                    <div className="font-medium">{item.originalName}</div>
                                    <div className="text-xs text-muted-foreground">Qtd: {item.quantity}</div>
                                  </td>
                                  <td className="p-3">
                                    {item.matchedName ? (
                                      <div>
                                        <div className="text-sm">{item.matchedName}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {item.matchConfidence}% confiança
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">Não encontrado</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">{item.unit}</td>
                                  <td className="p-3 text-right font-mono">{formatCurrency(item.budgetPrice)}</td>
                                  <td className="p-3 text-right font-mono">
                                    {item.referenceAvgPrice ? formatCurrency(item.referenceAvgPrice) : "-"}
                                  </td>
                                  <td className={cn("p-3 text-right font-mono font-medium", config.color)}>
                                    {item.variance !== null
                                      ? `${item.variance > 0 ? "+" : ""}${item.variance.toFixed(1)}%`
                                      : "-"}
                                  </td>
                                  <td className="p-3 text-center">
                                    <Badge className={cn("gap-1", config.bg, config.color, "border", config.border)}>
                                      <config.icon className="h-3 w-3" />
                                      {config.shortLabel}
                                    </Badge>
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
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
