"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Database,
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
  matchDetails?: string
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
    matchRate: number
    avgConfidence: number
    potentialSavings: number
    riskItems: number
  }
  categoryBreakdown: { category: string; total: number; count: number; variance: number }[]
  recommendations: string[]
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
  const { materials, importBudgetItems } = useData()
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [selectedRegion, setSelectedRegion] = useState("Lisboa e Vale do Tejo")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRating, setFilterRating] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("all")

  // Normalize text for matching - enhanced for Portuguese construction terms
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  // Calculate Levenshtein distance with optimization
  const levenshteinDistance = (str1: string, str2: string): number => {
    const m = str1.length
    const n = str2.length
    
    // Early exit for empty strings
    if (m === 0) return n
    if (n === 0) return m
    
    // Use single array optimization
    let prev = Array.from({ length: n + 1 }, (_, i) => i)
    let curr = new Array(n + 1)
    
    for (let i = 1; i <= m; i++) {
      curr[0] = i
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          curr[j] = prev[j - 1]
        } else {
          curr[j] = Math.min(prev[j - 1] + 1, prev[j] + 1, curr[j - 1] + 1)
        }
      }
      ;[prev, curr] = [curr, prev]
    }
    return prev[n]
  }

  // Calculate Jaccard similarity for word sets
  const jaccardSimilarity = (set1: Set<string>, set2: Set<string>): number => {
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    return union.size === 0 ? 0 : intersection.size / union.size
  }

  // N-gram similarity for fuzzy matching
  const getNgrams = (str: string, n: number): Set<string> => {
    const ngrams = new Set<string>()
    for (let i = 0; i <= str.length - n; i++) {
      ngrams.add(str.substring(i, i + n))
    }
    return ngrams
  }

  // Comprehensive construction terminology mapping for Portuguese
  const constructionTerminology: Record<string, { synonyms: string[], category: string, weight: number }> = {
    // Demolições
    demolicao: { synonyms: ["demolicao", "demolir", "derrube", "remocao", "arranque", "levantamento", "desmontagem"], category: "Demolições", weight: 1.5 },
    // Estrutura
    betao: { synonyms: ["betao", "concreto", "cimento", "betonagem", "armado", "c25", "c30", "c20"], category: "Estrutura", weight: 1.5 },
    ferro: { synonyms: ["ferro", "aco", "armadura", "varoes", "malhasol", "a500"], category: "Estrutura", weight: 1.4 },
    cofragem: { synonyms: ["cofragem", "doka", "peri", "taipal", "molde"], category: "Estrutura", weight: 1.4 },
    bloco: { synonyms: ["bloco", "tijolo", "alvenaria", "parede", "divisoria"], category: "Estrutura", weight: 1.3 },
    // Alvenaria
    reboco: { synonyms: ["reboco", "estuque", "embocar", "argamassa", "regularizacao", "barramento"], category: "Alvenaria", weight: 1.4 },
    gesso: { synonyms: ["gesso", "pladur", "cartonado", "drywall", "teto falso", "sanca"], category: "Alvenaria", weight: 1.4 },
    // Revestimentos
    azulejo: { synonyms: ["azulejo", "ceramica", "revestimento", "ladrilho", "faianca", "mosaico"], category: "Revestimentos", weight: 1.3 },
    pavimento: { synonyms: ["pavimento", "chao", "soalho", "flutuante", "parquet", "vinilico", "laminado", "ceramico"], category: "Pavimentos", weight: 1.3 },
    // Pintura
    pintura: { synonyms: ["pintura", "tinta", "primario", "esmalte", "velatura", "verniz", "latex", "acrilica"], category: "Pinturas", weight: 1.3 },
    // Caixilharia
    janela: { synonyms: ["janela", "caixilharia", "vidro", "aluminio", "pvc", "oscilobatente"], category: "Carpintarias", weight: 1.3 },
    porta: { synonyms: ["porta", "aro", "guarnicao", "forra", "batente", "interior", "exterior", "blindada"], category: "Carpintarias", weight: 1.3 },
    // Instalações
    eletrico: { synonyms: ["eletrico", "eletricidade", "tomada", "interruptor", "quadro", "cabo", "cablagem", "iluminacao"], category: "Instalações", weight: 1.4 },
    canalizacao: { synonyms: ["canalizacao", "tubo", "tubagem", "esgoto", "agua", "ppr", "pex", "pvc", "multicamada"], category: "Instalações", weight: 1.4 },
    louca: { synonyms: ["louca", "sanita", "lavatorio", "banheira", "duche", "base", "bide", "sanduiche"], category: "Instalações", weight: 1.3 },
    torneira: { synonyms: ["torneira", "misturadora", "valvula", "monocomando"], category: "Instalações", weight: 1.2 },
    // Coberturas
    telhado: { synonyms: ["telhado", "cobertura", "telha", "zinco", "chapa", "ondulado", "subtelha", "ripado"], category: "Coberturas", weight: 1.4 },
    // Impermeabilização
    impermeabilizacao: { synonyms: ["impermeabilizacao", "tela", "membrana", "waterstop", "sika", "betuminoso"], category: "Impermeabilizações", weight: 1.4 },
    // Isolamento
    isolamento: { synonyms: ["isolamento", "termico", "acustico", "capoto", "etics", "eps", "xps", "la", "mineral", "rocha"], category: "Isolamentos", weight: 1.4 },
    // AVAC
    avac: { synonyms: ["avac", "hvac", "ar condicionado", "climatizacao", "aquecimento", "radiador", "caldeira", "bomba calor", "piso radiante"], category: "Instalações AVAC", weight: 1.4 },
    // Exteriores
    exterior: { synonyms: ["exterior", "pave", "lancil", "vedacao", "muro", "portao", "gradeamento"], category: "Arranjos Exteriores", weight: 1.3 },
    // Limpezas
    limpeza: { synonyms: ["limpeza", "contentor", "entulho", "residuo", "transporte"], category: "Limpezas", weight: 1.2 },
  }

  // Extract key terms from text
  const extractKeyTerms = (text: string): Set<string> => {
    const normalized = normalizeText(text)
    const terms = new Set<string>()
    
    for (const [term, data] of Object.entries(constructionTerminology)) {
      for (const synonym of data.synonyms) {
        if (normalized.includes(synonym)) {
          terms.add(term)
          break
        }
      }
    }
    return terms
  }

  // Find best match from database with advanced multi-factor matching
  const findBestMatch = useCallback(
    (itemName: string, itemUnit?: string): { material: (typeof materials)[0] | null; confidence: number; matchDetails: string } => {
      const normalizedItem = normalizeText(itemName)
      const itemWords = new Set(normalizedItem.split(" ").filter((w) => w.length > 2))
      const itemNgrams = getNgrams(normalizedItem, 3)
      const itemKeyTerms = extractKeyTerms(itemName)

      let bestMatch: (typeof materials)[0] | null = null
      let bestScore = 0
      let bestMatchDetails = ""

      for (const material of materials) {
        const normalizedMaterial = normalizeText(material.name)
        const materialWords = new Set(normalizedMaterial.split(" ").filter((w) => w.length > 2))
        const materialNgrams = getNgrams(normalizedMaterial, 3)
        const materialKeyTerms = extractKeyTerms(material.name)

        let score = 0
        let details: string[] = []

        // 1. Exact match (highest priority)
        if (normalizedItem === normalizedMaterial) {
          return { material, confidence: 100, matchDetails: "Correspondência exata" }
        }

        // 2. Contains match (high priority)
        if (normalizedMaterial.includes(normalizedItem)) {
          score += 60
          details.push("Contém texto completo")
        } else if (normalizedItem.includes(normalizedMaterial)) {
          score += 50
          details.push("Texto contém material")
        }

        // 3. Key construction term matching (weighted)
        const commonTerms = new Set([...itemKeyTerms].filter(t => materialKeyTerms.has(t)))
        if (commonTerms.size > 0) {
          let termScore = 0
          commonTerms.forEach(term => {
            const termData = constructionTerminology[term]
            if (termData) {
              termScore += 25 * termData.weight
            }
          })
          score += Math.min(termScore, 50)
          if (commonTerms.size > 0) {
            details.push(`Termos: ${[...commonTerms].join(", ")}`)
          }
        }

        // 4. Word overlap with Jaccard similarity
        const wordSimilarity = jaccardSimilarity(itemWords, materialWords)
        score += wordSimilarity * 35
        if (wordSimilarity > 0.3) {
          details.push(`Palavras comuns: ${(wordSimilarity * 100).toFixed(0)}%`)
        }

        // 5. N-gram similarity for fuzzy matching
        const ngramSimilarity = jaccardSimilarity(itemNgrams, materialNgrams)
        score += ngramSimilarity * 25
        if (ngramSimilarity > 0.2) {
          details.push(`Similaridade: ${(ngramSimilarity * 100).toFixed(0)}%`)
        }

        // 6. Levenshtein distance for short strings
        if (normalizedItem.length < 50 && normalizedMaterial.length < 50) {
          const maxLen = Math.max(normalizedItem.length, normalizedMaterial.length)
          const distance = levenshteinDistance(normalizedItem, normalizedMaterial)
          const similarity = (maxLen - distance) / maxLen
          score += similarity * 15
        }

        // 7. Unit matching bonus
        if (itemUnit && material.unit) {
          const normalizedItemUnit = itemUnit.toLowerCase().replace(/[^a-z0-9]/g, "")
          const normalizedMaterialUnit = material.unit.toLowerCase().replace(/[^a-z0-9]/g, "")
          if (normalizedItemUnit === normalizedMaterialUnit || 
              (normalizedItemUnit.includes(normalizedMaterialUnit) || normalizedMaterialUnit.includes(normalizedItemUnit))) {
            score += 10
            details.push("Unidade compatível")
          }
        }

        // 8. Category context bonus - boost if item seems to fit material's category
        const materialCategory = material.category.toLowerCase()
        for (const [term, data] of Object.entries(constructionTerminology)) {
          if (itemKeyTerms.has(term) && data.category.toLowerCase() === materialCategory) {
            score += 8
            break
          }
        }

        // Track best match
        if (score > bestScore) {
          bestScore = score
          bestMatch = material
          bestMatchDetails = details.length > 0 ? details.join(" | ") : "Correspondência parcial"
        }
      }

      // Normalize confidence to 0-100 scale with calibrated threshold
      const confidence = Math.min(Math.round(bestScore * 0.8), 100)
      const threshold = 18 // Lowered threshold to catch more potential matches
      
      return {
        material: confidence >= threshold ? bestMatch : null,
        confidence: confidence >= threshold ? confidence : 0,
        matchDetails: confidence >= threshold ? bestMatchDetails : "Sem correspondência encontrada",
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
    let cleaned = str.replace(/€/g, "").trim()
    cleaned = cleaned.replace(/\s+/g, "")
    if (cleaned.includes(",")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".")
    }
    const num = Number.parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }

  // Normalize unit strings
  const normalizeUnit = (unit: string): string => {
    const trimmed = unit.trim().toLowerCase()
    const unitMap: Record<string, string> = {
      "v.g.": "vg", "vg": "vg", "v.g": "vg",
      "m.l.": "ml", "ml": "ml", "m.l": "ml",
      "m2": "m2", "m²": "m2",
      "m3": "m3", "m³": "m3",
      "un.": "un", "un": "un", "unid.": "un", "unid": "un",
      "kg": "kg", "pc": "pc", "pç": "pc",
      "m": "m", "l": "l", "lt": "l",
      "cx": "cx", "cj": "cj", "conj.": "cj", "degrau": "un"
    }
    return unitMap[trimmed.replace(/\./g, "")] || unitMap[trimmed] || trimmed.replace(/\./g, "")
  }

  // Check if string looks like a unit
  const isUnit = (str: string): boolean => {
    const normalized = str.trim().toLowerCase()
    return /^(v\.?g\.?|m\.?l\.?|m[2²3³]?|un\.?|unid\.?|kg|pc|pç|l|lt|cx|cj|degrau)$/i.test(normalized)
  }

  // Advanced PDF text parser - handles any column order
  const parsePDFText = (text: string): Array<{ name: string; unit: string; quantity: number; price: number }> => {
    const items: Array<{ name: string; unit: string; quantity: number; price: number }> = []
    
    const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    const lines = normalizedText.split("\n").filter(l => l.trim().length > 0)
    
    // Skip patterns for headers/footers
    const skipPatterns = /^(Nº\s*Artigo|Designação|Unidade|Quantidade|Preço|total\s*geral|subtotal|iva|nota\s*:|observ|página|page|Empresa:|A\/C:|Telefone:|Ref\.?ª?|Obra:|ORÇAMENTO|Contacto|De:|Data:|Cliente:|Nº\s*Ref|Condições|Garantia|Assinatura|PLANILHA|TERMOS|ACRESCE|Capital|Alvará|NIF|NIPC|www\.|@|REVIVE|Valor\s*da\s*Proposta)/i
    
    let currentDescription = ""
    
    // Pattern for data lines with embedded unit+qty+prices
    const dataLinePattern = /^(v\.?g\.?|vg|m\.?l\.?|ml|m2|m²|m3|m³|un\.?|unid\.?|kg|pc|pç|degrau|m|l)(\d+[.,]?\d*)/i
    
    // Pattern for lines with separate columns
    const separateColsPattern = /^(v\.?g\.?|vg|m\.?l\.?|ml|m2|m²|m3|m³|un\.?|unid\.?|kg|pc|pç|degrau|m|l)\s+(\d+[.,]?\d*)\s+([\d\s]+[.,]\d{2})\s*€/i
    
    // Pattern for tabular data (tab or multiple space separated)
    const tabularPattern = /\t+|;+|\s{3,}/
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.length < 2) continue
      if (skipPatterns.test(line)) continue
      if (/^[\d\s.,]+\s*€$/.test(line) && line.length < 25) continue // Just a total
      if (/^\d+[.,]?\d*$/.test(line)) continue // Just a section number
      
      // Try tabular parsing first
      const cols = line.split(tabularPattern).filter(c => c.trim().length > 0)
      
      if (cols.length >= 3) {
        // Identify column types dynamically
        let descCol = -1, unitCol = -1, qtyCol = -1, priceCol = -1
        
        for (let j = 0; j < cols.length; j++) {
          const col = cols[j].trim()
          
          if (isUnit(col) && unitCol === -1) {
            unitCol = j
          } else if (/€/.test(col) || /^\d+[.,]\d{2}$/.test(col)) {
            if (priceCol === -1) priceCol = j
          } else if (/^\d+[.,]?\d*$/.test(col) && qtyCol === -1 && col.length < 8) {
            qtyCol = j
          } else if (col.length > 10 && !/^[\d.,€\s]+$/.test(col)) {
            if (descCol === -1) descCol = j
          }
        }
        
        // If we found a price, try to extract an item
        if (priceCol >= 0) {
          const price = parsePortugueseNumber(cols[priceCol])
          const unit = unitCol >= 0 ? normalizeUnit(cols[unitCol]) : "un"
          const qty = qtyCol >= 0 ? parsePortugueseNumber(cols[qtyCol]) : 1
          let desc = descCol >= 0 ? cols[descCol] : currentDescription
          
          if (desc && price > 0) {
            items.push({
              name: desc.trim(),
              unit,
              quantity: qty > 0 && qty < 100000 ? qty : 1,
              price
            })
            currentDescription = ""
            continue
          }
        }
      }
      
      // Try embedded data pattern (like "m235,2030,00 €1 056,00 €")
      const dataMatch = line.match(dataLinePattern)
      
      if (dataMatch) {
        let unit = normalizeUnit(dataMatch[1])
        const restOfLine = line.substring(dataMatch[0].length - dataMatch[2].length)
        
        const qtyMatch = restOfLine.match(/^(\d+[.,]?\d*)/)
        let quantity = 1
        if (qtyMatch) {
          quantity = parsePortugueseNumber(qtyMatch[1])
          if (quantity > 100000) quantity = 1
        }
        
        const priceMatches = line.match(/([\d\s]+[.,]\d{2})\s*€/g)
        
        if (priceMatches && priceMatches.length >= 1 && currentDescription) {
          const prices = priceMatches.map(p => parsePortugueseNumber(p))
          const unitPrice = prices[0]
          
          if (unitPrice > 0) {
            items.push({
              name: currentDescription.trim(),
              unit,
              quantity: quantity || 1,
              price: unitPrice
            })
            currentDescription = ""
          }
        }
      } else {
        // Try separate columns pattern
        const sepMatch = line.match(separateColsPattern)
        if (sepMatch && currentDescription) {
          const unit = normalizeUnit(sepMatch[1])
          const quantity = parsePortugueseNumber(sepMatch[2])
          const price = parsePortugueseNumber(sepMatch[3])
          
          if (price > 0) {
            items.push({
              name: currentDescription.trim(),
              unit,
              quantity: quantity || 1,
              price
            })
            currentDescription = ""
          }
        } else {
          // Description line - accumulate
          let cleanLine = line
            .replace(/^\d+[.,]\d*\s*/, "") // Remove article numbers
            .replace(/([\d\s]+[.,]\d{2})\s*€/g, "") // Remove prices
            .replace(/\s+/g, " ")
            .trim()
          
          if (cleanLine.length < 3) continue
          if (/^[\d.,\s€\-–—:;]+$/.test(cleanLine)) continue
          
          if (currentDescription) {
            currentDescription += " " + cleanLine
          } else {
            currentDescription = cleanLine
          }
        }
      }
    }
    
    return items
  }
  
  // Read PDF file - use API route for server-side parsing or fallback to client-side
  const parsePDF = async (file: File): Promise<Array<{ name: string; unit: string; quantity: number; price: number }>> => {
    console.log("[v0] Starting PDF parsing for:", file.name, "Size:", file.size)
    
    // First try the API route (uses unpdf for proper PDF text extraction)
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData
      })
      
      const data = await response.json()
      console.log("[v0] API response:", { 
        ok: response.ok, 
        itemsCount: data.items?.length || 0,
        textLength: data.textLength,
        error: data.error
      })
      
      if (data.items && data.items.length > 0) {
        console.log("[v0] API extracted items successfully:", data.items.length)
        return data.items
      }
      
      // API parsed but found no items, might be a format issue
      if (data.textLength && data.textLength > 100) {
        console.log("[v0] API found text but no items, will try client-side parsing")
      }
    } catch (apiError) {
      console.error("[v0] API request failed:", apiError)
    }
    
    // Fallback: try reading file as text directly (works for text-based PDFs only)
    try {
      const text = await file.text()
      console.log("[v0] Direct text read length:", text.length)
      
      if (text.length > 50) {
        const items = parsePDFText(text)
        console.log("[v0] Client-side parsing found:", items.length, "items")
        
        if (items.length > 0) {
          return items
        }
      }
    } catch (textError) {
      console.error("[v0] Text reading failed:", textError)
    }
    
    throw new Error("Não foi possível extrair itens do PDF. Por favor, converta para CSV.")
  }

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true)
    setAnalyzeProgress(0)

    try {
      let parsedItems: Array<{ name: string; unit: string; quantity: number; price: number }> = []
      
      // Check file type and parse accordingly
      console.log("[v0] Analyzing file:", file.name, "type:", file.type)
      
      if (file.name.toLowerCase().endsWith(".pdf")) {
        try {
          parsedItems = await parsePDF(file)
          console.log("[v0] PDF parsed successfully, items:", parsedItems.length)
        } catch (pdfError) {
          console.error("[v0] PDF parsing error:", pdfError)
          // Fallback: try to read as text (some PDFs are text-based)
          const content = await file.text()
          parsedItems = parsePDFText(content)
        }
      } else {
        const content = await file.text()
        parsedItems = parseCSV(content)
        console.log("[v0] CSV parsed, items:", parsedItems.length)
      }

      console.log("[v0] Total parsed items:", parsedItems.length)
      if (parsedItems.length > 0 && parsedItems.length <= 5) {
        console.log("[v0] Sample items:", parsedItems.slice(0, 5))
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

        const { material, confidence, matchDetails } = findBestMatch(item.name, item.unit)
        const itemTotal = item.quantity * item.price
        totalBudget += itemTotal

        let rating: BudgetItem["rating"] = "unknown"
        let variance: number | null = null
        let refMin: number | null = null
        let refMax: number | null = null
        let refAvg: number | null = null

        if (material && confidence >= 18) {
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

          // Enhanced rating system with granular thresholds
          if (variance !== null) {
            if (variance <= -25) {
              rating = "below" // Significantly below market - potential quality concern
              belowCount++
            } else if (variance <= -10) {
              rating = "below" // Below market - good deal
              belowCount++
            } else if (variance <= 10) {
              rating = "average" // Within market range
              avgCount++
            } else if (variance <= 30) {
              rating = "above" // Moderately above market
              aboveCount++
            } else if (variance <= 50) {
              rating = "above" // Significantly above market
              aboveCount++
            } else {
              rating = "critical" // Extremely overpriced
              criticalCount++
            }
          } else {
            unknownCount++
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
          matchDetails: matchDetails,
        } as BudgetItem & { matchDetails: string })

        // Small delay for visual progress
        await new Promise((r) => setTimeout(r, 10))
      }

      const overallVariance = totalReference > 0 ? ((totalBudget - totalReference) / totalReference) * 100 : 0
      let overallRating: AnalysisResult["overallRating"] = "average"
      if (overallVariance <= -10) overallRating = "below"
      else if (overallVariance <= 10) overallRating = "average"
      else if (overallVariance <= 49) overallRating = "above"
      else overallRating = "critical"

      // Calculate advanced metrics
      const matchedItems = analyzedItems.filter(i => i.matchedName !== null)
      const matchRate = totalItems > 0 ? (matchedItems.length / totalItems) * 100 : 0
      const avgConfidence = matchedItems.length > 0 
        ? matchedItems.reduce((sum, i) => sum + i.matchConfidence, 0) / matchedItems.length 
        : 0
      
      // Calculate potential savings (items above market price)
      const potentialSavings = analyzedItems
        .filter(i => i.variance !== null && i.variance > 10)
        .reduce((sum, i) => {
          const refPrice = i.referenceAvgPrice || 0
          const overpaid = (i.budgetPrice - refPrice) * i.quantity
          return sum + Math.max(0, overpaid)
        }, 0)
      
      // Count high-risk items (critical or very high variance)
      const riskItems = analyzedItems.filter(i => i.rating === "critical" || (i.variance && i.variance > 50)).length

      // Calculate category breakdown
      const categoryMap = new Map<string, { total: number; count: number; budgetTotal: number; refTotal: number }>()
      analyzedItems.forEach(item => {
        const cat = item.category
        const existing = categoryMap.get(cat) || { total: 0, count: 0, budgetTotal: 0, refTotal: 0 }
        const itemBudgetTotal = item.budgetPrice * item.quantity
        const itemRefTotal = (item.referenceAvgPrice || item.budgetPrice) * item.quantity
        categoryMap.set(cat, {
          total: existing.total + itemBudgetTotal,
          count: existing.count + 1,
          budgetTotal: existing.budgetTotal + itemBudgetTotal,
          refTotal: existing.refTotal + itemRefTotal,
        })
      })
      
      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          total: data.total,
          count: data.count,
          variance: data.refTotal > 0 ? ((data.budgetTotal - data.refTotal) / data.refTotal) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total)

      // Generate smart recommendations
      const recommendations: string[] = []
      
      if (criticalCount > 0) {
        recommendations.push(`Existem ${criticalCount} itens com preços muito acima do mercado que requerem atenção urgente.`)
      }
      
      if (potentialSavings > 1000) {
        recommendations.push(`Potencial de poupança identificado: €${potentialSavings.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} através de renegociação de preços acima da média.`)
      }
      
      if (unknownCount > totalItems * 0.3) {
        recommendations.push(`${unknownCount} itens (${((unknownCount/totalItems)*100).toFixed(0)}%) não têm correspondência na base de dados. Considere adicionar mais referências de preços.`)
      }
      
      if (avgConfidence < 50) {
        recommendations.push("A confiança média das correspondências é baixa. Revise manualmente os itens para garantir precisão.")
      }
      
      const highVarianceCategories = categoryBreakdown.filter(c => c.variance > 25)
      if (highVarianceCategories.length > 0) {
        recommendations.push(`Categorias com variação elevada: ${highVarianceCategories.map(c => c.category).join(", ")}.`)
      }
      
      if (belowCount > totalItems * 0.2) {
        recommendations.push("Vários itens estão significativamente abaixo do preço de mercado. Verifique a qualidade dos materiais propostos.")
      }

      if (recommendations.length === 0) {
        recommendations.push("O orçamento está globalmente alinhado com os preços de mercado.")
      }

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
          matchedItems: matchedItems.length,
          belowAverage: belowCount,
          average: avgCount,
          aboveAverage: aboveCount,
          critical: criticalCount,
          unknown: unknownCount,
          matchRate,
          avgConfidence,
          potentialSavings,
          riskItems,
        },
        categoryBreakdown,
        recommendations,
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
      (ratingConfig[item.rating as keyof typeof ratingConfig] || ratingConfig.unknown).label,
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

  // Import analyzed items to the materials database
  const importToDatabase = () => {
    if (!analysisResult) return
    
    const itemsToImport = analysisResult.items.map(item => ({
      name: item.originalName,
      unit: item.unit,
      quantity: item.quantity,
      price: item.budgetPrice
    }))
    
    const importedCount = importBudgetItems(itemsToImport, "Importado de Orçamento")
    
    // Show feedback
    if (importedCount > 0) {
      alert(`${importedCount} novos itens foram adicionados à base de dados de materiais e serviços.`)
    } else {
      alert("Todos os itens já existem na base de dados. Os preços foram atualizados quando necessário.")
    }
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
          {/* Summary Cards - Enhanced */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">€{analysisResult.totalBudget.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</div>
                <p className="text-sm text-muted-foreground">Total do Orçamento</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">€{analysisResult.totalReference.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</div>
                <p className="text-sm text-muted-foreground">Total de Referência</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className={cn("text-2xl font-bold", (ratingConfig[analysisResult.overallRating as keyof typeof ratingConfig] || ratingConfig.unknown).color)}>
                  {analysisResult.overallVariance > 0 ? "+" : ""}
                  {analysisResult.overallVariance.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Variação Global</p>
              </CardContent>
            </Card>
            <Card className={cn("bg-card/50", (ratingConfig[analysisResult.overallRating as keyof typeof ratingConfig] || ratingConfig.unknown).bg)}>
              <CardContent className="pt-6">
                <div className={cn("text-2xl font-bold", (ratingConfig[analysisResult.overallRating as keyof typeof ratingConfig] || ratingConfig.unknown).color)}>
                  {(ratingConfig[analysisResult.overallRating as keyof typeof ratingConfig] || ratingConfig.unknown).label}
                </div>
                <p className="text-sm text-muted-foreground">Classificação Geral</p>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Metrics Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card/50 border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold">{analysisResult.stats.matchRate.toFixed(0)}%</div>
                    <p className="text-sm text-muted-foreground">Taxa de Correspondência</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-l-4 border-l-price-below">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold">{analysisResult.stats.avgConfidence.toFixed(0)}%</div>
                    <p className="text-sm text-muted-foreground">Confiança Média</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-price-below/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-price-below" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-l-4 border-l-price-above">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-price-above">€{analysisResult.stats.potentialSavings.toLocaleString("pt-PT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                    <p className="text-sm text-muted-foreground">Poupança Potencial</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-price-above/10 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-price-above" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-l-4 border-l-price-critical">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-price-critical">{analysisResult.stats.riskItems}</div>
                    <p className="text-sm text-muted-foreground">Itens de Risco</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-price-critical/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-price-critical" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations Card */}
          {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Recomendações da Análise
                </CardTitle>
                <CardDescription>Insights automáticos baseados na análise do orçamento</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysisResult.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      <p className="text-sm text-foreground/90">{rec}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Category Breakdown */}
          {analysisResult.categoryBreakdown && analysisResult.categoryBreakdown.length > 0 && (
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Análise por Categoria
                </CardTitle>
                <CardDescription>Distribuição de custos e variações por tipo de trabalho/material</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.categoryBreakdown.slice(0, 8).map((cat) => {
                    const isPositiveVariance = cat.variance > 0
                    const varianceColor = cat.variance <= -10 ? "text-price-below" : 
                                          cat.variance <= 10 ? "text-price-average" : 
                                          cat.variance <= 50 ? "text-price-above" : "text-price-critical"
                    const barWidth = (cat.total / analysisResult.totalBudget) * 100
                    return (
                      <div key={cat.category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{cat.category}</span>
                            <Badge variant="outline" className="text-xs">{cat.count} itens</Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">€{cat.total.toLocaleString("pt-PT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                            <span className={cn("font-medium", varianceColor)}>
                              {isPositiveVariance ? "+" : ""}{cat.variance.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full bg-primary/60 transition-all"
                            style={{ width: `${Math.min(barWidth, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

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
                  const config = ratingConfig[key as keyof typeof ratingConfig] || ratingConfig.unknown
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
                  <Button variant="outline" onClick={importToDatabase} className="bg-price-below/10 hover:bg-price-below/20 text-price-below border-price-below/30">
                    <Database className="mr-2 h-4 w-4" />
                    Importar para Base de Dados
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
                            const config = ratingConfig[item.rating as keyof typeof ratingConfig] || ratingConfig.unknown
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
                                  ��{item.budgetPrice.toFixed(2)}
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
