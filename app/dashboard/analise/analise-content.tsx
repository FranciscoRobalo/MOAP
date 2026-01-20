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
    bg: "bg-muted/50",
    border: "border-muted",
    icon: HelpCircle,
    description: "Não foi encontrada referência na base de dados",
  },
}

const regions = ["Norte", "Centro", "Lisboa e Vale do Tejo", "Alentejo", "Algarve", "Açores", "Madeira"]

export default function AnaliseContent() {
  const { materials } = useData()
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [selectedRegion, setSelectedRegion] = useState("Lisboa e Vale do Tejo")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRating, setFilterRating] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("all")

  // Normalize text for matching
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  // Calculate Levenshtein distance
  const levenshteinDistance = (str1: string, str2: string): number => {
    const m = str1.length
    const n = str2.length
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1]
        } else {
          dp[i][j] = Math.min(dp[i - 1][j - 1] + 1, dp[i - 1][j] + 1, dp[i][j - 1] + 1)
        }
      }
    }
    return dp[m][n]
  }

  // Find best match from database with improved fuzzy matching
  const findBestMatch = useCallback(
    (itemName: string): { material: (typeof materials)[0] | null; confidence: number } => {
      const normalizedItem = normalizeText(itemName)
      const itemWords = normalizedItem.split(" ").filter((w) => w.length > 2)

      let bestMatch: (typeof materials)[0] | null = null
      let bestScore = 0

      // Key construction terms in Portuguese
      const keyTerms: Record<string, string[]> = {
        betao: ["betao", "concreto", "cimento"],
        demolicao: ["demolicao", "demolir", "derrube", "remocao"],
        alvenaria: ["alvenaria", "tijolo", "bloco", "parede"],
        reboco: ["reboco", "estuque", "embocar", "argamassa"],
        pintura: ["pintura", "pintar", "tinta", "esmalte", "primario"],
        pladur: ["pladur", "gesso", "cartonado", "drywall"],
        pavimento: ["pavimento", "chao", "soalho", "mosaico", "ceramico", "flutuante"],
        caixilharia: ["caixilharia", "janela", "porta", "aluminio", "pvc"],
        canalizacao: ["canalizacao", "tubagem", "esgoto", "agua", "tubo"],
        eletricidade: ["eletricidade", "eletrico", "tomada", "interruptor", "quadro", "cabo"],
        impermeabilizacao: ["impermeabilizacao", "tela", "membrana", "isolamento"],
        isolamento: ["isolamento", "termico", "acustico", "capoto", "eps", "xps", "la"],
        cobertura: ["cobertura", "telha", "telhado", "zinco", "chapa"],
        serralharia: ["serralharia", "metal", "ferro", "aco", "grade"],
        carpintaria: ["carpintaria", "madeira", "rodape", "forra", "aro"],
        revestimento: ["revestimento", "azulejo", "ceramica", "pedra", "marmore"],
        aquecimento: ["aquecimento", "radiador", "caldeira", "piso radiante", "bomba calor"],
        ar: ["ar condicionado", "avac", "hvac", "climatizacao"],
        louca: ["louca", "sanita", "lavatorio", "banheira", "base duche", "bidé"],
        torneira: ["torneira", "misturadora", "valvula"],
      }

      for (const material of materials) {
        const normalizedMaterial = normalizeText(material.name)
        const materialWords = normalizedMaterial.split(" ").filter((w) => w.length > 2)

        let score = 0

        // Exact match
        if (normalizedItem === normalizedMaterial) {
          return { material, confidence: 100 }
        }

        // Contains match
        if (normalizedMaterial.includes(normalizedItem) || normalizedItem.includes(normalizedMaterial)) {
          score += 70
        }

        // Word overlap score
        const commonWords = itemWords.filter(
          (w) => materialWords.some((mw) => mw.includes(w) || w.includes(mw)) || materialWords.includes(w),
        )
        const wordOverlapScore = (commonWords.length / Math.max(itemWords.length, materialWords.length)) * 50
        score += wordOverlapScore

        // Key term matching
        for (const [category, terms] of Object.entries(keyTerms)) {
          const itemHasTerm = terms.some((t) => normalizedItem.includes(t))
          const materialHasTerm = terms.some((t) => normalizedMaterial.includes(t))
          if (itemHasTerm && materialHasTerm) {
            score += 30
            break
          }
        }

        // Levenshtein distance for similar strings
        const maxLen = Math.max(normalizedItem.length, normalizedMaterial.length)
        const distance = levenshteinDistance(normalizedItem, normalizedMaterial)
        const similarity = ((maxLen - distance) / maxLen) * 40
        score += similarity

        // Partial word matching
        for (const word of itemWords) {
          for (const mWord of materialWords) {
            if (word.length >= 4 && mWord.length >= 4) {
              if (mWord.startsWith(word.substring(0, 4)) || word.startsWith(mWord.substring(0, 4))) {
                score += 10
              }
            }
          }
        }

        if (score > bestScore) {
          bestScore = score
          bestMatch = material
        }
      }

      // Lower threshold to find more matches
      const confidence = Math.min(bestScore, 100)
      return {
        material: confidence >= 20 ? bestMatch : null,
        confidence: confidence >= 20 ? confidence : 0,
      }
    },
    [materials],
  )

  const parseCSV = (content: string): Array<{ name: string; unit: string; quantity: number; price: number }> => {
    const lines = content.split("\n").filter((line) => line.trim())
    const items: Array<{ name: string; unit: string; quantity: number; price: number }> = []

    // Try different delimiters
    const delimiters = [";", ",", "\t"]
    let bestDelimiter = ";"
    let maxCols = 0

    for (const delim of delimiters) {
      const cols = lines[0]?.split(delim).length || 0
      if (cols > maxCols) {
        maxCols = cols
        bestDelimiter = delim
      }
    }

    // Skip header row if it looks like headers
    const startIndex = lines[0]?.toLowerCase().includes("nome") || lines[0]?.toLowerCase().includes("descri") ? 1 : 0

    for (let i = startIndex; i < lines.length; i++) {
      const cols = lines[i].split(bestDelimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""))

      if (cols.length >= 2) {
        const name = cols[0] || ""
        let unit = "un"
        let quantity = 1
        let price = 0

        // Try to find price (number with decimals)
        for (let j = 1; j < cols.length; j++) {
          const val = cols[j].replace(/[€$\s]/g, "").replace(",", ".")
          const num = Number.parseFloat(val)
          if (!isNaN(num)) {
            if (num > 0 && num < 1000 && quantity === 1) {
              quantity = num
            } else if (num >= 0) {
              price = num
            }
          } else if (cols[j].match(/^(un|m2|m3|ml|kg|vg|m|l)$/i)) {
            unit = cols[j].toLowerCase()
          }
        }

        if (name && (price > 0 || quantity > 0)) {
          items.push({ name, unit, quantity: quantity || 1, price: price || 0 })
        }
      }
    }

    return items
  }

  // Parse Portuguese number format: "1 234,56" or "1.234,56" or "1234,56" -> 1234.56
  const parsePortugueseNumber = (str: string): number => {
    if (!str) return 0
    // Remove € symbol and spaces
    let cleaned = str.replace(/€/g, "").trim()
    // Handle format like "1 234,56" (space as thousand separator, comma as decimal)
    cleaned = cleaned.replace(/\s+/g, "")
    // Handle format like "1.234,56" (dot as thousand separator, comma as decimal)
    if (cleaned.includes(",")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".")
    }
    const num = Number.parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }

  // Parse text extracted from PDF to find budget items - handles Portuguese budget formats
  const parsePDFText = (text: string): Array<{ name: string; unit: string; quantity: number; price: number }> => {
    const items: Array<{ name: string; unit: string; quantity: number; price: number }> = []
    const lines = text.split(/\n|\r/).filter(line => line.trim().length > 3)
    
    // Pattern for Portuguese price format: € 1 234,56 or €1.234,56 or 1234,56 €
    const pricePattern = /€\s*([\d\s.,]+)|(\d[\d\s.,]*)\s*€/g
    
    // Units commonly found in Portuguese budgets
    const unitPatterns = /\b(v\.?g\.?|vg|m\.?l\.?|ml|m2|m²|m3|m³|un\.?|unid\.?|kg|pc|pç|m)\b/gi
    
    // Skip patterns - headers, totals, company info
    const skipPatterns = /^(total|subtotal|iva|desconto|página|page|data:|valor|artigo|descrição|quant|morada|contribuinte|capital|alvará|termos|condições|garantia|prazo|observações|dono|assinatura|\d{1,2}\/\d{1,2}\/\d{2,4})/i
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Skip short lines, headers, and company info
      if (trimmedLine.length < 10) continue
      if (skipPatterns.test(trimmedLine)) continue
      if (/^REVIVE|^Orçamento nº|^Cliente:/i.test(trimmedLine)) continue
      
      // Find all prices in the line
      const prices: number[] = []
      let priceMatch: RegExpExecArray | null
      const priceRegex = /€\s*([\d\s.,]+)|([\d][\d\s.,]*)\s*€/g
      
      while ((priceMatch = priceRegex.exec(trimmedLine)) !== null) {
        const priceStr = priceMatch[1] || priceMatch[2]
        const price = parsePortugueseNumber(priceStr)
        if (price > 0) {
          prices.push(price)
        }
      }
      
      // If no prices found with € symbol, try to find numbers that look like prices
      if (prices.length === 0) {
        const numberMatches = trimmedLine.match(/(\d[\d\s]*[.,]\d{2})/g)
        if (numberMatches) {
          for (const numStr of numberMatches) {
            const price = parsePortugueseNumber(numStr)
            if (price > 0.5 && price < 1000000) {
              prices.push(price)
            }
          }
        }
      }
      
      // Skip lines without prices
      if (prices.length === 0) continue
      
      // Extract unit
      const unitMatch = trimmedLine.match(unitPatterns)
      let unit = "un"
      if (unitMatch) {
        unit = unitMatch[0].toLowerCase()
          .replace(/\./g, "")
          .replace("²", "2")
          .replace("³", "3")
      }
      
      // Extract quantity - look for patterns like "1,0 vg" or "50 m2" or just "3"
      let quantity = 1
      const qtyPatterns = [
        /(\d+[.,]?\d*)\s*(?:v\.?g\.?|vg|m\.?l\.?|ml|m2|m²|m3|m³|un\.?|unid\.?|kg|pc|pç)\b/i,
        /\b(\d+[.,]\d+)\s+€/,
        /^\s*(\d+[.,]?\d*)\s/
      ]
      
      for (const qtyPattern of qtyPatterns) {
        const qtyMatch = trimmedLine.match(qtyPattern)
        if (qtyMatch) {
          const qtyVal = parsePortugueseNumber(qtyMatch[1])
          if (qtyVal > 0 && qtyVal < 10000) {
            quantity = qtyVal
            break
          }
        }
      }
      
      // Extract item name - remove prices, quantities with units, and clean up
      let name = trimmedLine
        // Remove prices with € symbol
        .replace(/€\s*[\d\s.,]+|[\d][\d\s.,]*\s*€/g, "")
        // Remove quantity + unit patterns
        .replace(/\d+[.,]?\d*\s*(?:v\.?g\.?|vg|m\.?l\.?|ml|m2|m²|m3|m³|un\.?|unid\.?|kg|pc|pç|m)\b/gi, "")
        // Remove standalone numbers
        .replace(/\b\d+[.,]?\d*\b/g, "")
        // Clean up multiple spaces
        .replace(/\s+/g, " ")
        .trim()
      
      // Skip if name is too short, just symbols, or looks like a total line
      if (name.length < 3) continue
      if (/^[\-–—:;,.\s]+$/.test(name)) continue
      if (/subtotal|total/i.test(name)) continue
      
      // For Portuguese budgets, typically the first price is unit price, second is total
      // We want the unit price for comparison
      const price = prices.length >= 2 ? prices[0] : prices[0]
      
      items.push({ name, unit, quantity, price })
    }
    
    return items
  }
  
  // Read PDF file - try multiple methods
  const parsePDF = async (file: File): Promise<Array<{ name: string; unit: string; quantity: number; price: number }>> => {
    // First, try to read PDF as text directly (works for text-based PDFs)
    try {
      const text = await file.text()
      // Check if we got meaningful text content
      if (text && text.length > 100 && /[a-zA-ZÀ-ÿ]/.test(text)) {
        const items = parsePDFText(text)
        if (items.length > 0) {
          return items
        }
      }
    } catch (e) {
      console.log("[v0] Direct text read failed, trying pdf.js")
    }
    
    // Try using pdf.js for scanned/image PDFs
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfjsLib = await import("pdfjs-dist")
      
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ""
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(" ")
        fullText += pageText + "\n"
      }
      
      return parsePDFText(fullText)
    } catch (pdfError) {
      console.error("[v0] PDF.js parsing failed:", pdfError)
      throw new Error("Não foi possível processar o PDF. Por favor, tente converter para CSV.")
    }
  }

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true)
    setAnalyzeProgress(0)

    try {
      let parsedItems: Array<{ name: string; unit: string; quantity: number; price: number }> = []
      
      // Check file type and parse accordingly
      if (file.name.toLowerCase().endsWith(".pdf")) {
        try {
          parsedItems = await parsePDF(file)
        } catch (pdfError) {
          console.error("PDF parsing error:", pdfError)
          // Fallback: try to read as text (some PDFs are text-based)
          const content = await file.text()
          parsedItems = parsePDFText(content)
        }
      } else {
        const content = await file.text()
        parsedItems = parseCSV(content)
      }

      const totalItems = parsedItems.length
      const analyzedItems: BudgetItem[] = []

      let belowCount = 0,
        avgCount = 0,
        aboveCount = 0,
        criticalCount = 0,
        unknownCount = 0
      let totalBudget = 0,
        totalReference = 0

      for (let i = 0; i < parsedItems.length; i++) {
        const item = parsedItems[i]
        setAnalyzeProgress(Math.round(((i + 1) / totalItems) * 100))

        const { material, confidence } = findBestMatch(item.name)
        const itemTotal = item.quantity * item.price
        totalBudget += itemTotal

        let rating: BudgetItem["rating"] = "unknown"
        let variance: number | null = null
        let refMin: number | null = null
        let refMax: number | null = null
        let refAvg: number | null = null

        if (material && confidence >= 20) {
          // Use price as min and priceMax as max (matching Material interface in data-context)
          refMin = material.price
          refMax = material.priceMax || material.price
          refAvg = (refMin + refMax) / 2
          totalReference += item.quantity * refAvg

          // Calculate variance only if we have valid reference price
          if (refAvg > 0) {
            variance = ((item.price - refAvg) / refAvg) * 100
          } else {
            variance = null
          }

          if (variance <= -10) {
            rating = "below"
            belowCount++
          } else if (variance <= 10) {
            rating = "average"
            avgCount++
          } else if (variance <= 49) {
            rating = "above"
            aboveCount++
          } else {
            rating = "critical"
            criticalCount++
          }
        } else {
          unknownCount++
        }

        analyzedItems.push({
          id: `item-${i}`,
          originalName: item.name,
          matchedName: material?.name || null,
          unit: item.unit,
          quantity: item.quantity,
          budgetPrice: item.price,
          referenceMinPrice: refMin,
          referenceMaxPrice: refMax,
          referenceAvgPrice: refAvg,
          variance,
          rating,
          category: material?.category || "Outros",
          matchConfidence: confidence,
          type: material?.type || "work",
        })

        // Small delay for visual progress
        await new Promise((r) => setTimeout(r, 10))
      }

      const overallVariance = totalReference > 0 ? ((totalBudget - totalReference) / totalReference) * 100 : 0
      let overallRating: AnalysisResult["overallRating"] = "average"
      if (overallVariance <= -10) overallRating = "below"
      else if (overallVariance <= 10) overallRating = "average"
      else if (overallVariance <= 49) overallRating = "above"
      else overallRating = "critical"

      setAnalysisResult({
        id: `analysis-${Date.now()}`,
        fileName: file.name,
        uploadDate: new Date().toISOString(),
        region: selectedRegion,
        totalBudget,
        totalReference,
        overallVariance,
        overallRating,
        items: analyzedItems,
        stats: {
          totalItems,
          matchedItems: totalItems - unknownCount,
          belowAverage: belowCount,
          average: avgCount,
          aboveAverage: aboveCount,
          critical: criticalCount,
          unknown: unknownCount,
        },
      })
    } catch (error) {
      console.error("Error analyzing file:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      analyzeFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      analyzeFile(file)
    }
  }

  const exportResults = () => {
    if (!analysisResult) return

    const headers = [
      "Item Original",
      "Item Correspondente",
      "Unidade",
      "Quantidade",
      "Preço Orçamento",
      "Preço Ref. Min",
      "Preço Ref. Max",
      "Variação %",
      "Classificação",
      "Confiança %",
    ]
    const rows = analysisResult.items.map((item) => [
      item.originalName,
      item.matchedName || "N/A",
      item.unit,
      item.quantity,
      item.budgetPrice.toFixed(2),
      item.referenceMinPrice?.toFixed(2) || "N/A",
      item.referenceMaxPrice?.toFixed(2) || "N/A",
      item.variance?.toFixed(1) || "N/A",
      ratingConfig[item.rating].label,
      item.matchConfidence.toFixed(0),
    ])

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analise-${analysisResult.fileName}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const filteredItems =
    analysisResult?.items.filter((item) => {
      const matchesSearch =
        item.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.matchedName?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRating = filterRating === "all" || item.rating === filterRating
      const matchesTab = activeTab === "all" || item.type === activeTab
      return matchesSearch && matchesRating && matchesTab
    }) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Análise de Orçamentos</h1>
        <p className="text-muted-foreground">
          Carregue um ficheiro CSV com o seu orçamento para comparar com os preços de referência.
        </p>
      </div>

      {/* Upload Section */}
      {!analysisResult && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card/50" data-tutorial="analise-upload">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Carregar Orçamento
              </CardTitle>
              <CardDescription>Arraste um ficheiro CSV ou clique para selecionar</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  "hover:border-primary/50 hover:bg-primary/5",
                  isAnalyzing && "pointer-events-none opacity-50",
                )}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.txt,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isAnalyzing}
                />
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium mb-1">Arraste o ficheiro CSV ou PDF aqui</p>
                <p className="text-sm text-muted-foreground mb-4">Formatos aceites: CSV, TXT, PDF</p>
                <Button variant="outline" disabled={isAnalyzing}>
                  Selecionar Ficheiro
                </Button>
              </div>

              {isAnalyzing && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>A analisar...</span>
                    <span>{analyzeProgress}%</span>
                  </div>
                  <Progress value={analyzeProgress} />
                </div>
              )}

              <div className="mt-4">
                <Label className="text-sm font-medium">Região</Label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="mt-1 bg-input/50">
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
            </CardContent>
          </Card>

          <Card className="bg-card/50" data-tutorial="analise-format">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Formatos Aceites
              </CardTitle>
              <CardDescription>CSV, TXT ou PDF com orçamento de construção</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm">
                <p className="text-muted-foreground mb-2"># Formato CSV recomendado:</p>
                <p>Nome;Unidade;Quantidade;Preço</p>
                <p>Demolição de paredes;m2;50;12.50</p>
                <p>Betão C25/30;m3;10;95.00</p>
                <p>Pintura interior;m2;200;8.75</p>
              </div>
              
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 text-sm">
                <p className="font-medium text-blue-400 mb-1">Ficheiros PDF</p>
                <p className="text-muted-foreground">
                  PDFs de orçamentos são automaticamente processados. O sistema extrai texto e identifica itens, quantidades e preços.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Legenda de Classificações:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ratingConfig).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <div className={cn("w-3 h-3 rounded-full", config.bg, config.border, "border")} />
                      <span className={config.color}>{config.shortLabel}</span>
                      <span className="text-muted-foreground">- {config.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Section */}
      {analysisResult && (
        <div className="space-y-6" data-tutorial="analise-results">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">€{analysisResult.totalBudget.toLocaleString("pt-PT")}</div>
                <p className="text-sm text-muted-foreground">Total do Orçamento</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">€{analysisResult.totalReference.toLocaleString("pt-PT")}</div>
                <p className="text-sm text-muted-foreground">Total de Referência</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className={cn("text-2xl font-bold", ratingConfig[analysisResult.overallRating].color)}>
                  {analysisResult.overallVariance > 0 ? "+" : ""}
                  {analysisResult.overallVariance.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Variação Global</p>
              </CardContent>
            </Card>
            <Card className={cn("bg-card/50", ratingConfig[analysisResult.overallRating].bg)}>
              <CardContent className="pt-6">
                <div className={cn("text-2xl font-bold", ratingConfig[analysisResult.overallRating].color)}>
                  {ratingConfig[analysisResult.overallRating].label}
                </div>
                <p className="text-sm text-muted-foreground">Classificação Geral</p>
              </CardContent>
            </Card>
          </div>

          {/* Distribution */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Distribuição por Classificação
              </CardTitle>
              <CardDescription>
                {analysisResult.stats.matchedItems} de {analysisResult.stats.totalItems} itens com referência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                {[
                  { key: "below", count: analysisResult.stats.belowAverage },
                  { key: "average", count: analysisResult.stats.average },
                  { key: "above", count: analysisResult.stats.aboveAverage },
                  { key: "critical", count: analysisResult.stats.critical },
                  { key: "unknown", count: analysisResult.stats.unknown },
                ].map(({ key, count }) => {
                  const config = ratingConfig[key as keyof typeof ratingConfig]
                  const percentage = (count / analysisResult.stats.totalItems) * 100
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full transition-all", config.bg.replace("/20", ""))}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">{percentage.toFixed(0)}%</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card className="bg-card/50">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Itens Analisados</CardTitle>
                  <CardDescription>{analysisResult.fileName}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAnalysisResult(null)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Nova Análise
                  </Button>
                  <Button onClick={exportResults}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
                  <SelectTrigger className="w-[180px] bg-input/50">
                    <SelectValue placeholder="Filtrar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Classificações</SelectItem>
                    {Object.entries(ratingConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4 bg-muted/50">
                  <TabsTrigger value="all">Todos ({analysisResult.items.length})</TabsTrigger>
                  <TabsTrigger value="material">
                    Materiais ({analysisResult.items.filter((i) => i.type === "material").length})
                  </TabsTrigger>
                  <TabsTrigger value="work">
                    Trabalhos ({analysisResult.items.filter((i) => i.type === "work").length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Correspondência</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Qtd</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Preço Orç.</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Preço Ref.</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Variação</th>
                            <th className="px-4 py-3 text-center text-sm font-medium">Classif.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {filteredItems.map((item) => {
                            const config = ratingConfig[item.rating]
                            const Icon = config.icon
                            return (
                              <tr key={item.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3">
                                  <div className="font-medium text-sm">{item.originalName}</div>
                                  <div className="text-xs text-muted-foreground">{item.unit}</div>
                                </td>
                                <td className="px-4 py-3">
                                  {item.matchedName ? (
                                    <div>
                                      <div className="text-sm">{item.matchedName}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {item.matchConfidence.toFixed(0)}% confiança
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">Sem correspondência</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right text-sm">{item.quantity}</td>
                                <td className="px-4 py-3 text-right text-sm font-medium">
                                  €{item.budgetPrice.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right text-sm">
                                  {item.referenceAvgPrice ? (
                                    <div>
                                      <div>€{item.referenceAvgPrice.toFixed(2)}</div>
                                      <div className="text-xs text-muted-foreground">
                                        €{item.referenceMinPrice?.toFixed(2)} - €{item.referenceMaxPrice?.toFixed(2)}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">N/A</span>
                                  )}
                                </td>
                                <td className={cn("px-4 py-3 text-right text-sm font-medium", config.color)}>
                                  {item.variance !== null && !isNaN(item.variance) ? (
                                    <>
                                      {item.variance > 0 ? "+" : ""}
                                      {item.variance.toFixed(1)}%
                                    </>
                                  ) : (
                                    "N/A"
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-center">
                                    <Badge className={cn(config.bg, config.color, "gap-1")}>
                                      <Icon className="h-3 w-3" />
                                      {config.shortLabel}
                                    </Badge>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    {filteredItems.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum item encontrado com os filtros selecionados.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

const Label = ({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-sm font-medium leading-none", className)} {...props}>
    {children}
  </label>
)
