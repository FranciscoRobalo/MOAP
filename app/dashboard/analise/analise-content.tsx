"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
  Pencil,
  Sparkles,
  Loader2,
  Save,
  MapPin,
  Check,
  ArrowLeft,
  CreditCard,
  Lock,
  AlertCircle,
  History,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  Filter,
  CheckSquare,
  Square,
  Lightbulb,
  FileDown,
  Printer,
} from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { cn } from "@/lib/utils"
import { useData } from "@/contexts/data-context"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

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
  qualityScore?: number
}

interface AnalysisHistoryEntry {
  id: string
  fileName: string
  savedAt: string
  region: string
  totalBudget: number
  itemCount: number
  matchRate: number
  overallRating: "below" | "average" | "above" | "critical"
  qualityScore: number
  result: AnalysisResult
}

const ANALYSIS_HISTORY_KEY = "moap-analysis-history"
const MAX_HISTORY_ENTRIES = 10

// Regional price adjustment coefficients
const regionalCoefficients: Record<string, { coefficient: number; label: string }> = {
  "Norte": { coefficient: 0.92, label: "-8%" },
  "Centro": { coefficient: 0.95, label: "-5%" },
  "Lisboa e Vale do Tejo": { coefficient: 1.0, label: "Base" },
  "Alentejo": { coefficient: 0.90, label: "-10%" },
  "Algarve": { coefficient: 1.05, label: "+5%" },
  "Açores": { coefficient: 1.15, label: "+15%" },
  "Madeira": { coefficient: 1.12, label: "+12%" },
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
  const { materials, importBudgetItems, addBudget } = useData()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [analyzeStatus, setAnalyzeStatus] = useState("")
  const [isBulkReanalyzing, setIsBulkReanalyzing] = useState(false)
  const [bulkReanalyzeProgress, setBulkReanalyzeProgress] = useState(0)
  
  // Save budget dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveBudgetName, setSaveBudgetName] = useState("")
  const [saveBudgetLocation, setSaveBudgetLocation] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState("Lisboa e Vale do Tejo")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRating, setFilterRating] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("all")
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null)
  const [editForm, setEditForm] = useState({ name: "", unit: "", quantity: "", price: "" })
  const [isReanalyzing, setIsReanalyzing] = useState<string | null>(null)
  
  // Payment dialog state for public users (8+ lines)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingItemCount, setPendingItemCount] = useState(0)
  const [selectedPricingTier, setSelectedPricingTier] = useState<number | null>(null)
  const [paidLineLimit, setPaidLineLimit] = useState<number | null>(null)
  // Payment flow steps: "select" | "checkout" | "processing" | "success"
  const [paymentStep, setPaymentStep] = useState<"select" | "checkout" | "processing" | "success">("select")
  const [paymentForm, setPaymentForm] = useState({ name: "", card: "", expiry: "", cvv: "" })
  const [paymentError, setPaymentError] = useState("")
  
  // Analysis History
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryEntry[]>([])
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  
  // Multi-select for bulk operations
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // Charts visibility
  const [showCharts, setShowCharts] = useState(true)
  
  // Smart suggestions for unmatched items
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null)
  
  // Quality score expanded explanation
  const [showQualityDetails, setShowQualityDetails] = useState(false)
  
  // Pricing tiers for budget analysis
  const pricingTiers = [
    { maxLines: 8, price: 0, label: "Grátis" },
    { maxLines: 20, price: 9.90, label: "€9,90" },
    { maxLines: 50, price: 14.90, label: "€14,90" },
    { maxLines: 100, price: 24.90, label: "€24,90" },
    { maxLines: 200, price: 34.90, label: "€34,90" },
    { maxLines: Infinity, price: 49.90, label: "€49,90" },
  ]
  
  const getPricingTier = (lineCount: number) => {
    return pricingTiers.find(tier => lineCount <= tier.maxLines) || pricingTiers[pricingTiers.length - 1]
  }

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
    demolicao: { synonyms: ["demolicao", "demolir", "derrube", "remocao", "arranque", "levantamento", "desmontagem", "picagem"], category: "Demolições", weight: 1.5 },
    // Estrutura
    betao: { synonyms: ["betao", "concreto", "cimento", "betonagem", "armado", "c25", "c30", "c20", "fundacao", "fundacoes", "laje", "pilar", "viga", "sapata"], category: "Estrutura", weight: 1.5 },
    ferro: { synonyms: ["ferro", "aco", "armadura", "varoes", "malhasol", "a500", "estribos"], category: "Estrutura", weight: 1.4 },
    cofragem: { synonyms: ["cofragem", "doka", "peri", "taipal", "molde", "descofragem"], category: "Estrutura", weight: 1.4 },
    // Alvenaria
    alvenaria: { synonyms: ["alvenaria", "bloco", "tijolo", "parede", "divisoria", "pano", "muretes", "muro"], category: "Alvenarias", weight: 1.4 },
    reboco: { synonyms: ["reboco", "estuque", "embocar", "argamassa", "regularizacao", "barramento", "chapisco", "emboço"], category: "Rebocos", weight: 1.4 },
    gesso: { synonyms: ["gesso", "pladur", "cartonado", "drywall", "teto falso", "sanca", "forro"], category: "Tetos", weight: 1.4 },
    // Revestimentos
    azulejo: { synonyms: ["azulejo", "ceramica", "revestimento", "ladrilho", "faianca", "mosaico", "gres", "porcelanato"], category: "Revestimentos", weight: 1.3 },
    pavimento: { synonyms: ["pavimento", "chao", "soalho", "flutuante", "parquet", "vinilico", "laminado", "ceramico", "epoxy", "epoxi", "resina", "betonilha"], category: "Pavimentos", weight: 1.3 },
    // Pintura
    pintura: { synonyms: ["pintura", "tinta", "primario", "esmalte", "velatura", "verniz", "latex", "acrilica", "plastica", "pintar"], category: "Pinturas", weight: 1.3 },
    // Caixilharia
    caixilharia: { synonyms: ["janela", "caixilharia", "vidro", "aluminio", "pvc", "oscilobatente", "correr", "batente", "vidros"], category: "Caixilharias", weight: 1.3 },
    porta: { synonyms: ["porta", "aro", "guarnicao", "forra", "batente", "interior", "exterior", "blindada", "seguranca", "corta-fogo"], category: "Carpintarias", weight: 1.3 },
    // Instalações Elétricas
    eletrico: { synonyms: ["eletrico", "eletricidade", "tomada", "interruptor", "quadro", "cabo", "cablagem", "iluminacao", "luz", "ponto"], category: "Instalações Elétricas", weight: 1.4 },
    // Canalizações
    canalizacao: { synonyms: ["canalizacao", "tubo", "tubagem", "esgoto", "agua", "ppr", "pex", "pvc", "multicamada", "hidraulica", "abastecimento", "drenagem"], category: "Canalizações", weight: 1.4 },
    sanitarios: { synonyms: ["louca", "sanita", "lavatorio", "banheira", "duche", "base", "bide", "wc", "sanitarios", "casa banho"], category: "Canalizações", weight: 1.3 },
    torneira: { synonyms: ["torneira", "misturadora", "valvula", "monocomando", "chuveiro"], category: "Canalizações", weight: 1.2 },
    // Coberturas
    telhado: { synonyms: ["telhado", "cobertura", "telha", "zinco", "chapa", "ondulado", "subtelha", "ripado", "beirado", "rufo"], category: "Coberturas", weight: 1.4 },
    // Impermeabilização
    impermeabilizacao: { synonyms: ["impermeabilizacao", "tela", "membrana", "waterstop", "sika", "betuminoso", "asfaltica", "primario"], category: "Impermeabilizações", weight: 1.4 },
    // Isolamento
    isolamento: { synonyms: ["isolamento", "termico", "acustico", "capoto", "cappotto", "etics", "eps", "xps", "la", "mineral", "rocha", "poliestireno"], category: "Isolamentos", weight: 1.5 },
    // AVAC / Climatização
    avac: { synonyms: ["avac", "hvac", "ar condicionado", "climatizacao", "aquecimento", "radiador", "caldeira", "bomba calor", "piso radiante", "split", "multi-split"], category: "Climatização", weight: 1.4 },
    // Carpintarias
    carpintaria: { synonyms: ["carpintaria", "madeira", "armario", "roupeiro", "movel", "rodape", "guarnicao", "embutido"], category: "Carpintarias", weight: 1.3 },
    // Cozinhas
    cozinha: { synonyms: ["cozinha", "bancada", "moveis", "tampo", "lava-louca", "exaustor", "fogao"], category: "Cozinhas", weight: 1.3 },
    // Serralharia
    serralharia: { synonyms: ["serralharia", "grade", "gradeamento", "corrimao", "guarda", "metalico", "ferro", "inox", "portao"], category: "Serralharias", weight: 1.3 },
    // Movimento de Terras
    escavacao: { synonyms: ["escavacao", "terraplanagem", "aterro", "movimento terras", "decapagem", "nivelamento"], category: "Movimento de Terras", weight: 1.3 },
    // Exteriores
    exterior: { synonyms: ["exterior", "pave", "lancil", "vedacao", "muro", "portao", "gradeamento", "jardim", "calcada"], category: "Arranjos Exteriores", weight: 1.3 },
    // Limpezas / Estaleiro
    estaleiro: { synonyms: ["estaleiro", "montagem", "desmontagem", "andaime", "vedacao", "instalacao"], category: "Estaleiro", weight: 1.2 },
    limpeza: { synonyms: ["limpeza", "contentor", "entulho", "residuo", "transporte", "remocao"], category: "Demolições", weight: 1.2 },
    // Energias Renováveis
    solar: { synonyms: ["solar", "fotovoltaico", "painel", "inversor", "energia", "renovavel"], category: "Energias Renováveis", weight: 1.3 },
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

  // Advanced PDF text parser - handles multiple Portuguese budget formats
  const parsePDFText = (text: string): Array<{ name: string; unit: string; quantity: number; price: number }> => {
    const items: Array<{ name: string; unit: string; quantity: number; price: number }> = []
    const lines = text.split(/[\r\n]+/)
    
    let currentDescription = ""
    let linesSinceDescription = 0
    
    // Skip patterns
    const shouldSkip = (line: string) => {
      const patterns = [
        /^(Nº\s*Artigo|Art\.?º?\s*$|Item\s*$|Descrição\s*$|Designação\s*$)/i,
        /^(Un\.?\s*$|Unidade\s*$|Quant\.?\s*$|Quantidade\s*$)/i,
        /^(Preço|Valor)\s*(unitário|total)?\s*$/i,
        /^(Subtotal|IVA|Observ|Nota\s*:|Total\s*Geral|Página|Page)/i,
        /^(Empresa:|A\/C:|Telefone:|Ref\.?ª?|Obra:|ORÇAMENTO|De:|Data:|Cliente:)/i,
      ]
      return patterns.some(p => p.test(line))
    }
    
    // Check if section header
    const isSectionHeader = (line: string) => {
      if (/^\d+\.?\d*\s{2,}[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+$/.test(line)) return true
      if (/^[A-ZÁÉ��ÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{3,30}$/.test(line) && !line.includes(",")) return true
      if (/^\d+$/.test(line)) return true
      return false
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.length < 2) { linesSinceDescription++; continue }
      if (shouldSkip(line)) continue
      if (isSectionHeader(line)) { currentDescription = ""; continue }
      if (/^[\d\s.,]+\s*€\s*$/.test(line) && line.length < 25) continue
      if (/^\d+[,.]?\d*\s*$/.test(line) && line.length < 10) continue
      
      // OR_MORADIA format: un1.006228.006228.00
      const oraMatch = line.match(/^(un|vg|vb|m2|m²|m3|m³|ml|kg|pc|m|l)(\d+\.\d+)(\d+\.\d+)(\d+\.\d+)$/i)
      if (oraMatch && currentDescription) {
        items.push({
          name: currentDescription.trim(),
          unit: normalizeUnit(oraMatch[1]),
          quantity: parseFloat(oraMatch[2]),
          price: parseFloat(oraMatch[3])
        })
        currentDescription = ""
        linesSinceDescription = 0
        continue
      }
      
      // Z format with €: v.g.1,0022 000,00 €
      const unitMatch = line.match(/^(v\.?g\.?|vb|m\.?l\.?|m2|m²|m3|m³|un\.?d?|unid|kg|pc|pç|m|l)/i)
      if (unitMatch && currentDescription) {
        const euroMatches = [...line.matchAll(/([\d\s]+[,]\d{2})\s*€/g)]
        if (euroMatches.length >= 1) {
          const afterUnit = line.substring(unitMatch[0].length)
          const qtyMatch = afterUnit.match(/^(\d+[,]?\d*)/)
          const quantity = qtyMatch ? parsePortugueseNumber(qtyMatch[1]) : 1
          const price = parsePortugueseNumber(euroMatches[0][1])
          
          if (price > 0) {
            items.push({
              name: currentDescription.trim(),
              unit: normalizeUnit(unitMatch[1]),
              quantity: quantity > 0 && quantity < 10000 ? quantity : 1,
              price
            })
            currentDescription = ""
            linesSinceDescription = 0
            continue
          }
        }
      }
      
      // Sub-item format: Betãom338,58200,00 €7 716,00 €
      const subMatch = line.match(/^(Betão|Ferro|Cofragem|Aço)(m3|m²|m2|kg|m)(\d+[,.]?\d*)([\d\s,]+€[\d\s,]+€)/i)
      if (subMatch) {
        const priceMatch = subMatch[4].match(/([\d\s,]+)€/)
        if (priceMatch) {
          items.push({
            name: subMatch[1],
            unit: normalizeUnit(subMatch[2]),
            quantity: parsePortugueseNumber(subMatch[3]),
            price: parsePortugueseNumber(priceMatch[1])
          })
          continue
        }
      }
      
      // Tabular format with tabs/spaces
      const parts = line.split(/\t+|\s{3,}/).filter(p => p.trim().length > 0)
      if (parts.length >= 4) {
        let desc = "", unit = "un", qty = 1, price = 0
        for (const part of parts) {
          const t = part.trim()
          if (/^(vg|vb|ml|m2|m²|m3|m³|un|und|unid|kg|pc|pç|m|l|mes)$/i.test(t)) {
            unit = normalizeUnit(t)
          } else if (/€/.test(t) || /^\d[\d\s]*[,]\d{2}$/.test(t)) {
            const p = parsePortugueseNumber(t)
            if (p > 0 && price === 0) price = p
          } else if (/^\d+[,.]?\d*$/.test(t)) {
            const n = parsePortugueseNumber(t)
            if (n > 0 && n < 10000) qty = n
          } else if (t.length > 10 && !/^\d/.test(t)) {
            desc = t
          }
        }
        if (desc && price > 0) {
          items.push({ name: desc, unit, quantity: qty, price })
          currentDescription = ""
          linesSinceDescription = 0
          continue
        }
      }
      
      // Description accumulation
      let cleanLine = line
        .replace(/^[\d]+[,.]?[\d]*\s*/, "")
        .replace(/^[\d]+\s+/, "")
        .trim()
      
      if (cleanLine.length < 5) continue
      if (/^[\d.,\s€\-–—:;()\[\]]+$/.test(cleanLine)) continue
      
      if (linesSinceDescription > 10) currentDescription = ""
      
      if (currentDescription && linesSinceDescription < 5) {
        const startsLower = /^[a-záéíóúâêôãõç]/.test(cleanLine)
        currentDescription = startsLower ? currentDescription + " " + cleanLine : cleanLine
      } else {
        currentDescription = cleanLine
      }
      linesSinceDescription = 0
    }
    
    return items
  }
  
  // Read PDF file - use API route for server-side parsing or fallback to client-side
  const parsePDF = async (file: File): Promise<Array<{ name: string; unit: string; quantity: number; price: number }>> => {
    // First try the API route (uses GPT for intelligent parsing)
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData
      })
      
      const data = await response.json()
      
      if (data.items && data.items.length > 0) {
        return data.items
      }
    } catch {
      // API failed, continue to fallback
    }
    
    // Fallback: try reading file as text directly
    try {
      const text = await file.text()
      
      if (text.length > 50) {
        const items = parsePDFText(text)
        
        if (items.length > 0) {
          return items
        }
      }
    } catch {
      // Text reading failed
    }
    
    throw new Error("Não foi possível extrair itens do PDF. Por favor, converta para CSV.")
  }

  // Wrapper for analyzing with a specific line limit (after payment selection)
  const analyzeFileWithLimit = async (file: File, lineLimit: number | null) => {
    await analyzeFile(file, lineLimit)
  }

  // On mount: check if there's a pending file stored from the landing page upload
  useEffect(() => {
    const base64 = sessionStorage.getItem("pending_budget_file")
    const name = sessionStorage.getItem("pending_budget_name")
    const type = sessionStorage.getItem("pending_budget_type")

    if (base64 && name) {
      // Convert base64 back to a File object
      const byteString = atob(base64.split(",")[1])
      const mimeType = type || "application/octet-stream"
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const restoredFile = new File([ab], name, { type: mimeType })

      // Clear sessionStorage so it doesn't re-trigger on refresh
      sessionStorage.removeItem("pending_budget_file")
      sessionStorage.removeItem("pending_budget_name")
      sessionStorage.removeItem("pending_budget_type")
      sessionStorage.removeItem("pending_budget_region")
      sessionStorage.removeItem("pending_budget_year")

      // Auto-trigger the analysis
      analyzeFile(restoredFile, null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Load analysis history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ANALYSIS_HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AnalysisHistoryEntry[]
        setAnalysisHistory(parsed)
      }
    } catch {
      // Invalid data, ignore
    }
  }, [])
  
  // Calculate quality score for an analysis
  const calculateQualityScore = (result: AnalysisResult): number => {
    const matchRateScore = result.stats.matchRate * 40 // 0-40 points
    const confidenceScore = result.stats.avgConfidence * 30 // 0-30 points
    const coverageScore = Math.min(result.items.length / 50, 1) * 15 // 0-15 points (max at 50 items)
    const lowRiskScore = (1 - result.stats.riskItems / Math.max(result.items.length, 1)) * 15 // 0-15 points
    return Math.round(matchRateScore + confidenceScore + coverageScore + lowRiskScore)
  }
  
  // Save current analysis to history
  const saveToHistory = () => {
    if (!analysisResult) return
    
    const qualityScore = calculateQualityScore(analysisResult)
    const entry: AnalysisHistoryEntry = {
      id: `history-${Date.now()}`,
      fileName: analysisResult.fileName,
      savedAt: new Date().toISOString(),
      region: analysisResult.region,
      totalBudget: analysisResult.totalBudget,
      itemCount: analysisResult.items.length,
      matchRate: analysisResult.stats.matchRate,
      overallRating: analysisResult.overallRating,
      qualityScore,
      result: { ...analysisResult, qualityScore }
    }
    
    const updatedHistory = [entry, ...analysisHistory].slice(0, MAX_HISTORY_ENTRIES)
    setAnalysisHistory(updatedHistory)
    localStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(updatedHistory))
    toast.success("Analise guardada no historico!")
  }
  
  // Restore analysis from history
  const restoreFromHistory = (entry: AnalysisHistoryEntry) => {
    setAnalysisResult(entry.result)
    setShowHistoryPanel(false)
    toast.success(`Analise "${entry.fileName}" restaurada!`)
  }
  
  // Delete history entry
  const deleteFromHistory = (id: string) => {
    const updatedHistory = analysisHistory.filter(e => e.id !== id)
    setAnalysisHistory(updatedHistory)
    localStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(updatedHistory))
  }
  
  // Get smart suggestions for an unmatched item
  const getSmartSuggestions = (item: BudgetItem): Array<{ name: string; confidence: number; category: string }> => {
    if (item.matchConfidence > 0.5) return [] // Already has good match
    
    const normalizedName = normalizeText(item.originalName)
    const suggestions: Array<{ name: string; confidence: number; category: string }> = []
    
    for (const material of materials.slice(0, 500)) { // Check first 500 materials
      const normalizedMaterial = normalizeText(material.name)
      const similarity = 1 - levenshteinDistance(normalizedName, normalizedMaterial) / Math.max(normalizedName.length, normalizedMaterial.length)
      
      if (similarity > 0.3 && similarity < 0.7) { // Partial matches that weren't auto-matched
        suggestions.push({
          name: material.name,
          confidence: similarity,
          category: material.category || "Geral"
        })
      }
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  }
  
  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }
  
  // Select all items
  const selectAllItems = () => {
    if (!analysisResult) return
    const allIds = new Set(analysisResult.items.map(i => i.id))
    setSelectedItems(allIds)
    setShowBulkActions(true)
  }
  
  // Clear selection
  const clearSelection = () => {
    setSelectedItems(new Set())
    setShowBulkActions(false)
  }
  
  // Export analysis as formatted text for PDF
  const generatePDFContent = () => {
    if (!analysisResult) return ""
    
    const qualityScore = calculateQualityScore(analysisResult)
    let content = `
RELATORIO DE ANALISE DE ORCAMENTO
================================
Gerado por MOAP - ${new Date().toLocaleDateString("pt-PT")}

RESUMO EXECUTIVO
----------------
Ficheiro: ${analysisResult.fileName}
Regiao: ${analysisResult.region}
Data da Analise: ${new Date(analysisResult.uploadDate).toLocaleDateString("pt-PT")}

METRICAS PRINCIPAIS
-------------------
Total do Orcamento: ${analysisResult.totalBudget.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
Referencia de Mercado: ${analysisResult.totalReference.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
Variacao Global: ${analysisResult.overallVariance > 0 ? "+" : ""}${analysisResult.overallVariance.toFixed(1)}%
Qualidade da Analise: ${qualityScore}/100

ESTATISTICAS
------------
Total de Itens: ${analysisResult.stats.totalItems}
Itens Correspondidos: ${analysisResult.stats.matchedItems} (${(analysisResult.stats.matchRate * 100).toFixed(0)}%)
Confianca Media: ${(analysisResult.stats.avgConfidence * 100).toFixed(0)}%
Poupanca Potencial: ${analysisResult.stats.potentialSavings.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
Itens de Risco: ${analysisResult.stats.riskItems}

DISTRIBUICAO POR CLASSIFICACAO
------------------------------
Abaixo da Media: ${analysisResult.stats.belowAverage} itens
Na Media: ${analysisResult.stats.average} itens
Acima da Media: ${analysisResult.stats.aboveAverage} itens
Muito Acima: ${analysisResult.stats.critical} itens
Sem Referencia: ${analysisResult.stats.unknown} itens

ITENS DETALHADOS
----------------
`
    
    for (const item of analysisResult.items) {
      const rating = ratingConfig[item.rating]
      content += `
${item.originalName}
  Correspondencia: ${item.matchedName || "Nao encontrado"}
  Quantidade: ${item.quantity} ${item.unit}
  Preco Orcamento: ${item.budgetPrice.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
  Preco Referencia: ${item.referenceAvgPrice ? item.referenceAvgPrice.toLocaleString("pt-PT", { style: "currency", currency: "EUR" }) : "N/A"}
  Variacao: ${item.variance !== null ? `${item.variance > 0 ? "+" : ""}${item.variance.toFixed(1)}%` : "N/A"}
  Classificacao: ${rating.label}
  Confianca: ${(item.matchConfidence * 100).toFixed(0)}%
`
    }
    
    content += `
RECOMENDACOES
-------------
${analysisResult.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

---
Relatorio gerado automaticamente por MOAP
www.moap.pt
`
    return content
  }
  
  // Export to text file (simpler than PDF for now)
  const exportAnalysis = () => {
    if (!analysisResult) return
    
    const content = generatePDFContent()
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analise-${analysisResult.fileName.replace(/\.[^/.]+$/, "")}-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Relatorio exportado!")
  }
  
  // Export to CSV
  const exportToCSV = () => {
    if (!analysisResult) return
    
    const headers = ["Item Original", "Correspondencia", "Unidade", "Quantidade", "Preco Orcamento", "Preco Min Ref", "Preco Max Ref", "Preco Med Ref", "Variacao %", "Classificacao", "Categoria", "Confianca %"]
    const rows = analysisResult.items.map(item => [
      `"${item.originalName}"`,
      `"${item.matchedName || ""}"`,
      item.unit,
      item.quantity,
      item.budgetPrice,
      item.referenceMinPrice || "",
      item.referenceMaxPrice || "",
      item.referenceAvgPrice || "",
      item.variance !== null ? item.variance.toFixed(1) : "",
      ratingConfig[item.rating].label,
      item.category,
      (item.matchConfidence * 100).toFixed(0)
    ])
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analise-${analysisResult.fileName.replace(/\.[^/.]+$/, "")}-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("CSV exportado!")
  }

  const analyzeFile = async (file: File, lineLimit: number | null = null) => {
    setIsAnalyzing(true)
    setAnalyzeProgress(0)
    setAnalyzeStatus("A ler ficheiro...")

    try {
      let parsedItems: Array<{ name: string; unit: string; quantity: number; price: number }> = []
      const fileName = file.name.toLowerCase()
      
      // PDF and Excel files go through the API (which uses GPT)
      if (fileName.endsWith(".pdf") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        setAnalyzeStatus("A extrair itens do documento (IA)...")
        setAnalyzeProgress(2)
        try {
          parsedItems = await parsePDF(file)
        } catch {
          // For PDF, try fallback
          if (fileName.endsWith(".pdf")) {
            setAnalyzeStatus("A processar PDF localmente...")
            const content = await file.text()
            parsedItems = parsePDFText(content)
          }
        }
      } else {
        // CSV/TXT files parsed locally
        setAnalyzeStatus("A processar CSV...")
        const content = await file.text()
        parsedItems = parseCSV(content)
      }
      
      setAnalyzeStatus(`${parsedItems.length} itens encontrados. A validar preços...`)
      setAnalyzeProgress(4)
      
      // Check if public user needs to pay for large budgets (8+ lines)
      // Skip this check if a lineLimit is already set (meaning payment was handled)
      if (!isAdmin && parsedItems.length > 8 && lineLimit === null) {
        setIsAnalyzing(false)
        setAnalyzeProgress(0)
        setAnalyzeStatus("")
        setPendingFile(file)
        setPendingItemCount(parsedItems.length)
        setShowPaymentDialog(true)
        return
      }
      
      // Apply line limit if set (free tier = 8 items max)
      if (lineLimit !== null && parsedItems.length > lineLimit) {
        parsedItems = parsedItems.slice(0, lineLimit)
        setAnalyzeStatus(`Limitado a ${lineLimit} itens (plano gratuito). A validar preços...`)
      }
      
      // Check if the budget has valid prices (not all zeros)
      const itemsWithPrice = parsedItems.filter(item => item.price > 0)
      const itemsWithoutPrice = parsedItems.filter(item => item.price <= 0)
      const percentWithoutPrice = parsedItems.length > 0 ? (itemsWithoutPrice.length / parsedItems.length) * 100 : 0
      
      // If more than 80% of items have no price, warn the user
      if (percentWithoutPrice > 80 && parsedItems.length > 3) {
        setIsAnalyzing(false)
        setAnalyzeProgress(0)
        setAnalyzeStatus("")
        toast.error("Orçamento sem preços", {
          description: `Este orçamento não contém preços unitários (${itemsWithoutPrice.length} de ${parsedItems.length} itens sem preço). Por favor, carregue um orçamento com preços preenchidos ou adicione os preços manualmente.`,
        })
        return
      }
      
      // Filter out items without valid prices for analysis (but keep a minimum of items)
      const itemsToAnalyze = itemsWithPrice.length >= 3 ? itemsWithPrice : parsedItems
      
      const totalItems = itemsToAnalyze.length
      const analyzedItems: BudgetItem[] = []

      let belowCount = 0,
        avgCount = 0,
        aboveCount = 0,
        criticalCount = 0,
        unknownCount = 0
      let totalBudget = 0,
        totalReference = 0
      
      // Track items without price for reporting
      let itemsSkippedNoPrice = parsedItems.length - itemsToAnalyze.length

      // First pass: identify items needing GPT assistance (no match or low confidence < 60%)
      const itemsNeedingGPT: Array<{ index: number; name: string; unit: string; quantity: number; price: number }> = []
      const localMatches: Map<number, { material: typeof materials[0] | null; confidence: number; matchDetails: string }> = new Map()
      
      const CONFIDENCE_THRESHOLD = 60 // Minimum confidence to show match
      
      for (let i = 0; i < itemsToAnalyze.length; i++) {
        const item = itemsToAnalyze[i]
        const match = findBestMatch(item.name, item.unit)
        localMatches.set(i, match)
        
        // Items with no match OR confidence below 60% need GPT
        if (!match.material || match.confidence < CONFIDENCE_THRESHOLD) {
          itemsNeedingGPT.push({ index: i, ...item })
        }
      }
      
      // GPT semantic matching for low-confidence items
      let gptMatches: Record<string, { materialId: string | null; confidence: number; reason: string }> = {}
      let gptPrices: Record<string, { minPrice: number; maxPrice: number; avgPrice: number; confidence: number }> = {}
      
      if (itemsNeedingGPT.length > 0) {
        setAnalyzeProgress(5)
        setAnalyzeStatus(`A procurar correspondências IA para ${itemsNeedingGPT.length} itens...`)
        
        // First try GPT matching against our database
        try {
          const materialRefs = materials.map(m => ({
            id: m.id,
            name: m.name,
            unit: m.unit,
            price: m.price,
            priceMax: m.priceMax,
            category: m.category
          }))
          
          const matchResponse = await fetch("/api/match-items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              items: itemsNeedingGPT.map(i => ({ name: i.name, unit: i.unit, quantity: i.quantity, price: i.price })),
              materials: materialRefs 
            })
          })
          
          if (matchResponse.ok) {
            const matchData = await matchResponse.json()
            if (matchData.matches) {
              gptMatches = matchData.matches
            }
          }
        } catch {
          // Continue without GPT matching
        }
        
        setAnalyzeProgress(8)
        
        // For items still without good matches, get price estimates
        const itemsStillNeedingPrices = itemsNeedingGPT.filter((item, idx) => {
          const gptMatch = gptMatches[String(idx + 1)]
          return !gptMatch || !gptMatch.materialId || gptMatch.confidence < CONFIDENCE_THRESHOLD
        })
        
        if (itemsStillNeedingPrices.length > 0) {
          setAnalyzeStatus(`A consultar preços de mercado para ${itemsStillNeedingPrices.length} itens...`)
          try {
            const response = await fetch("/api/lookup-prices", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: itemsStillNeedingPrices })
            })
            
            if (response.ok) {
              const data = await response.json()
              if (data.prices) {
                gptPrices = data.prices
              }
            }
          } catch {
            // Continue without GPT prices
          }
        }
      }
      
      setAnalyzeStatus("A comparar preços e calcular variâncias...")

      // Map itemsNeedingGPT indices for quick lookup
      const gptItemIndexMap = new Map<number, number>()
      itemsNeedingGPT.forEach((item, gptIdx) => {
        gptItemIndexMap.set(item.index, gptIdx + 1) // GPT uses 1-based indices
      })

      for (let i = 0; i < itemsToAnalyze.length; i++) {
        const item = itemsToAnalyze[i]
        const currentProgress = 10 + Math.round(((i + 1) / totalItems) * 85)
        setAnalyzeProgress(currentProgress)
        
        // Update status every 5 items or for the first few
        if (i < 3 || i % 5 === 0) {
          setAnalyzeStatus(`A analisar item ${i + 1} de ${totalItems}: ${item.name.substring(0, 40)}${item.name.length > 40 ? '...' : ''}`)
        }

        let { material, confidence, matchDetails } = localMatches.get(i) || findBestMatch(item.name, item.unit)
        const itemTotal = item.quantity * item.price
        totalBudget += itemTotal

        let rating: BudgetItem["rating"] = "unknown"
        let variance: number | null = null
        let refMin: number | null = null
        let refMax: number | null = null
        let refAvg: number | null = null
        let finalMatchedName: string | null = material?.name || null
        let finalConfidence = confidence
        let finalMatchDetails = matchDetails
        let finalCategory = material?.category || "Sem categoria"
        
        // Skip items with zero price - mark them differently
        if (item.price <= 0) {
          analyzedItems.push({
            id: `item-${i}`,
            originalName: item.name,
            matchedName: null,
            unit: item.unit,
            quantity: item.quantity,
            budgetPrice: 0,
            referenceMinPrice: null,
            referenceMaxPrice: null,
            referenceAvgPrice: null,
            variance: null,
            rating: "unknown",
            category: "Sem preço",
            matchConfidence: 0,
            type: "work",
            matchDetails: "Item sem preço no orçamento",
          } as BudgetItem & { matchDetails: string })
          unknownCount++
          continue
        }

        // Check if this item was sent to GPT for matching
        const gptIdx = gptItemIndexMap.get(i)
        if (gptIdx !== undefined) {
          const gptMatch = gptMatches[String(gptIdx)]
          
          // If GPT found a good match in our database
          if (gptMatch && gptMatch.materialId && gptMatch.confidence >= CONFIDENCE_THRESHOLD) {
            const matchedMaterial = materials.find(m => m.id === gptMatch.materialId)
            if (matchedMaterial) {
              material = matchedMaterial
              confidence = gptMatch.confidence
              matchDetails = gptMatch.reason + " (IA)"
              finalMatchedName = matchedMaterial.name
              finalConfidence = gptMatch.confidence
              finalMatchDetails = gptMatch.reason + " (correspondência IA)"
              finalCategory = matchedMaterial.category
            }
          }
        }

        // If still no good match, check GPT price estimates
        const gptPrice = gptPrices[item.name]
        if ((!material || finalConfidence < CONFIDENCE_THRESHOLD) && gptPrice && gptPrice.avgPrice > 0) {
          refMin = gptPrice.minPrice
          refMax = gptPrice.maxPrice
          refAvg = gptPrice.avgPrice
          finalMatchedName = item.name + " (estimativa IA)"
          finalConfidence = gptPrice.confidence || 70
          finalMatchDetails = "Preço estimado via IA (mercado PT)"
          finalCategory = "Estimativa IA"
          totalReference += item.quantity * refAvg

          if (refAvg > 0) {
            variance = ((item.price - refAvg) / refAvg) * 100
          }

          // Rating based on variance
          if (variance !== null) {
            if (variance <= -10) {
              rating = "below"
              belowCount++
            } else if (variance <= 10) {
              rating = "average"
              avgCount++
            } else if (variance <= 50) {
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
            matchedName: finalMatchedName,
            unit: item.unit,
            quantity: item.quantity,
            budgetPrice: item.price,
            referenceMinPrice: refMin,
            referenceMaxPrice: refMax,
            referenceAvgPrice: refAvg,
            variance,
            rating,
            category: finalCategory,
            matchConfidence: finalConfidence,
            type: "work",
            matchDetails: finalMatchDetails,
          } as BudgetItem & { matchDetails: string })
          
          continue
        }

        // Use local match if confidence is above threshold
        if (material && finalConfidence >= CONFIDENCE_THRESHOLD) {
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
          matchedName: finalMatchedName,
          unit: item.unit,
          quantity: item.quantity,
          budgetPrice: item.price,
          referenceMinPrice: refMin,
          referenceMaxPrice: refMax,
          referenceAvgPrice: refAvg,
          variance,
          rating,
          category: finalCategory,
          matchConfidence: finalConfidence,
          type: material?.type || "work",
          matchDetails: finalMatchDetails,
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
        recommendations.push(`Potencial de poupança identificado: ${potentialSavings.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })} através de renegociação de preços acima da média.`)
      }
      
      if (itemsSkippedNoPrice > 0) {
        recommendations.push(`${itemsSkippedNoPrice} itens foram ignorados por não terem preço no orçamento original. Verifique se o ficheiro contém os preços unitários.`)
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
      
      setAnalyzeProgress(95)
      setAnalyzeStatus("A gerar relatório final...")

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
      setAnalyzeStatus("")
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

    // Generate PDF using browser print
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão. Verifique se os popups estão bloqueados.")
      return
    }

    const getRatingColor = (rating: string) => {
      switch (rating) {
        case 'below': return '#22c55e'
        case 'average': return '#eab308'
        case 'above': return '#f97316'
        case 'critical': return '#ef4444'
        default: return '#6b7280'
      }
    }

    const getRatingLabel = (rating: string) => {
      switch (rating) {
        case 'below': return 'Abaixo da Média'
        case 'average': return 'Na Média'
        case 'above': return 'Acima da Média'
        case 'critical': return 'Muito Acima'
        default: return 'Sem Dados'
      }
    }

    const totalBudget = analysisResult.items.reduce((sum, item) => sum + (item.quantity * item.budgetPrice), 0)
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório MOAP - ${analysisResult.fileName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1f2937; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
          .header h1 { font-size: 28px; color: #1e40af; margin-bottom: 8px; }
          .header p { color: #6b7280; font-size: 14px; }
          .summary { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
          .summary-card { flex: 1; min-width: 150px; padding: 16px; border-radius: 8px; background: #f3f4f6; }
          .summary-card h3 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
          .summary-card p { font-size: 24px; font-weight: bold; color: #1f2937; }
          .summary-card.green { background: #dcfce7; }
          .summary-card.green p { color: #16a34a; }
          .summary-card.red { background: #fee2e2; }
          .summary-card.red p { color: #dc2626; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 20px; }
          th { background: #1e40af; color: white; padding: 10px 6px; text-align: left; font-weight: 600; }
          td { padding: 8px 6px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #f9fafb; }
          .rating { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; color: white; }
          .variance { font-weight: 600; }
          .variance.positive { color: #dc2626; }
          .variance.negative { color: #16a34a; }
          .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Análise MOAP</h1>
          <p>Ficheiro: ${analysisResult.fileName} | Data: ${new Date().toLocaleDateString('pt-PT')}</p>
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <h3>Total de Itens</h3>
            <p>${analysisResult.items.length}</p>
          </div>
          <div class="summary-card">
            <h3>Valor Total</h3>
            <p>€${totalBudget.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
          </div>
          <div class="summary-card ${analysisResult.overallVariance > 0 ? 'red' : 'green'}">
            <h3>Variação Média</h3>
            <p>${analysisResult.overallVariance > 0 ? '+' : ''}${analysisResult.overallVariance.toFixed(1)}%</p>
          </div>
          <div class="summary-card green">
            <h3>Abaixo da Média</h3>
            <p>${analysisResult.items.filter(i => i.rating === 'below').length}</p>
          </div>
          <div class="summary-card red">
            <h3>Acima da Média</h3>
            <p>${analysisResult.items.filter(i => i.rating === 'above' || i.rating === 'critical').length}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 5%">Nº</th>
              <th style="width: 30%">Descrição</th>
              <th style="width: 8%">Un.</th>
              <th style="width: 8%">Qtd.</th>
              <th style="width: 12%">Preço Unit.</th>
              <th style="width: 12%">Ref. Min-Max</th>
              <th style="width: 10%">Variação</th>
              <th style="width: 15%">Classificação</th>
            </tr>
          </thead>
          <tbody>
            ${analysisResult.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.originalName}</td>
                <td>${item.unit}</td>
                <td>${item.quantity}</td>
                <td>€${item.budgetPrice.toFixed(2)}</td>
                <td>${item.referenceMinPrice ? `€${item.referenceMinPrice.toFixed(2)} - €${item.referenceMaxPrice?.toFixed(2)}` : 'N/A'}</td>
                <td class="variance ${item.variance && item.variance > 0 ? 'positive' : 'negative'}">${item.variance ? (item.variance > 0 ? '+' : '') + item.variance.toFixed(1) + '%' : 'N/A'}</td>
                <td><span class="rating" style="background: ${getRatingColor(item.rating)}">${getRatingLabel(item.rating)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Relatório gerado automaticamente pelo MOAP - Módulo de Orçamentação e Análise de Preços</p>
          <p>© ${new Date().getFullYear()} MOAP. Todos os direitos reservados.</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.print()
    }
    
    toast.success("PDF gerado! Use Ctrl+P ou Cmd+P para guardar como PDF.")
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

  // Open edit dialog for an item
  const openEditDialog = (item: BudgetItem) => {
    setEditingItem(item)
    setEditForm({
      name: item.originalName,
      unit: item.unit,
      quantity: item.quantity.toString(),
      price: item.budgetPrice.toString()
    })
  }

  // Save edited item and re-analyze
  const saveEditedItem = async () => {
    if (!editingItem || !analysisResult) return
    
    setIsReanalyzing(editingItem.id)
    
    try {
      // Call GPT to get price for the edited item
      const response = await fetch("/api/lookup-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            name: editForm.name,
            unit: editForm.unit,
            quantity: parseFloat(editForm.quantity) || 1,
            price: parseFloat(editForm.price) || 0
          }]
        })
      })
      
      let refMin: number | null = null
      let refMax: number | null = null
      let refAvg: number | null = null
      let matchedName: string | null = null
      let confidence = 0
      let rating: BudgetItem["rating"] = "unknown"
      let variance: number | null = null
      
      if (response.ok) {
        const data = await response.json()
        const gptPrice = data.prices?.[editForm.name]
        
        if (gptPrice && gptPrice.avgPrice > 0) {
          refMin = gptPrice.minPrice
          refMax = gptPrice.maxPrice
          refAvg = gptPrice.avgPrice
          matchedName = editForm.name + " (GPT)"
          confidence = gptPrice.confidence || 70
          
          const budgetPrice = parseFloat(editForm.price) || 0
          if (refAvg > 0) {
            variance = ((budgetPrice - refAvg) / refAvg) * 100
            
            if (variance <= -10) rating = "below"
            else if (variance <= 10) rating = "average"
            else if (variance <= 50) rating = "above"
            else rating = "critical"
          }
        }
      }
      
      // Also try local database match
      const { material, confidence: localConf } = findBestMatch(editForm.name, editForm.unit)
      if (material && localConf >= 18 && (!refAvg || localConf > confidence)) {
        refMin = material.price
        refMax = material.priceMax || material.price
        refAvg = (refMin + refMax) / 2
        matchedName = material.name
        confidence = localConf
        
        const budgetPrice = parseFloat(editForm.price) || 0
        if (refAvg > 0) {
          variance = ((budgetPrice - refAvg) / refAvg) * 100
          
          if (variance <= -10) rating = "below"
          else if (variance <= 10) rating = "average"
          else if (variance <= 50) rating = "above"
          else rating = "critical"
        }
      }
      
      // Update the item in the results
      const updatedItems = analysisResult.items.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            originalName: editForm.name,
            unit: editForm.unit,
            quantity: parseFloat(editForm.quantity) || 1,
            budgetPrice: parseFloat(editForm.price) || 0,
            referenceMinPrice: refMin,
            referenceMaxPrice: refMax,
            referenceAvgPrice: refAvg,
            matchedName,
            matchConfidence: confidence,
            variance,
            rating
          }
        }
        return item
      })
      
      // Recalculate totals
      const totalBudget = updatedItems.reduce((sum, i) => sum + (i.quantity * i.budgetPrice), 0)
      const totalReference = updatedItems.reduce((sum, i) => sum + (i.referenceAvgPrice ? i.quantity * i.referenceAvgPrice : 0), 0)
      const overallVariance = totalReference > 0 ? ((totalBudget - totalReference) / totalReference) * 100 : 0
      
      setAnalysisResult({
        ...analysisResult,
        items: updatedItems,
        totalBudget,
        totalReference,
        overallVariance
      })
      
    } catch (err) {
      console.error("Error re-analyzing item:", err)
    } finally {
      setIsReanalyzing(null)
      setEditingItem(null)
    }
  }

  // Re-analyze a single item with GPT (without editing)
  const reanalyzeItem = async (item: BudgetItem) => {
    if (!analysisResult) return
    
    setIsReanalyzing(item.id)
    
    try {
      const response = await fetch("/api/lookup-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            name: item.originalName,
            unit: item.unit,
            quantity: item.quantity,
            price: item.budgetPrice
          }]
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const gptPrice = data.prices?.[item.originalName]
        
        if (gptPrice && gptPrice.avgPrice > 0) {
          const variance = ((item.budgetPrice - gptPrice.avgPrice) / gptPrice.avgPrice) * 100
          let rating: BudgetItem["rating"] = "unknown"
          
          if (variance <= -10) rating = "below"
          else if (variance <= 10) rating = "average"
          else if (variance <= 50) rating = "above"
          else rating = "critical"
          
          const updatedItems = analysisResult.items.map(i => {
            if (i.id === item.id) {
              return {
                ...i,
                referenceMinPrice: gptPrice.minPrice,
                referenceMaxPrice: gptPrice.maxPrice,
                referenceAvgPrice: gptPrice.avgPrice,
                matchedName: item.originalName + " (GPT)",
                matchConfidence: gptPrice.confidence || 70,
                variance,
                rating
              }
            }
            return i
          })
          
          const totalReference = updatedItems.reduce((sum, i) => sum + (i.referenceAvgPrice ? i.quantity * i.referenceAvgPrice : 0), 0)
          const overallVariance = totalReference > 0 ? ((analysisResult.totalBudget - totalReference) / totalReference) * 100 : 0
          
          setAnalysisResult({
            ...analysisResult,
            items: updatedItems,
            totalReference,
            overallVariance
          })
        }
      }
    } catch (err) {
      console.error("Error re-analyzing item:", err)
    } finally {
      setIsReanalyzing(null)
    }
  }

  // Re-analyze ALL items with GPT
  const reanalyzeAllItems = async () => {
    if (!analysisResult || isBulkReanalyzing) return
    
    setIsBulkReanalyzing(true)
    setBulkReanalyzeProgress(0)
    
    try {
      const items = analysisResult.items
      const updatedItems = [...items]
      const batchSize = 5 // Process items in batches
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, Math.min(i + batchSize, items.length))
        const progress = Math.round(((i + batch.length) / items.length) * 100)
        setBulkReanalyzeProgress(progress)
        
        try {
          const response = await fetch("/api/lookup-prices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: batch.map(item => ({
                name: item.originalName,
                unit: item.unit,
                quantity: item.quantity,
                price: item.budgetPrice
              }))
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            
            batch.forEach((item) => {
              const gptPrice = data.prices?.[item.originalName]
              if (gptPrice && gptPrice.avgPrice > 0) {
                const variance = ((item.budgetPrice - gptPrice.avgPrice) / gptPrice.avgPrice) * 100
                let rating: BudgetItem["rating"] = "unknown"
                
                if (variance <= -10) rating = "below"
                else if (variance <= 10) rating = "average"
                else if (variance <= 50) rating = "above"
                else rating = "critical"
                
                const idx = updatedItems.findIndex(u => u.id === item.id)
                if (idx !== -1) {
                  updatedItems[idx] = {
                    ...updatedItems[idx],
                    referenceMinPrice: gptPrice.minPrice,
                    referenceMaxPrice: gptPrice.maxPrice,
                    referenceAvgPrice: gptPrice.avgPrice,
                    matchedName: item.originalName + " (IA)",
                    matchConfidence: gptPrice.confidence || 75,
                    variance,
                    rating
                  }
                }
              }
            })
          }
        } catch {
          // Continue with next batch
        }
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      // Recalculate totals
      const totalBudget = updatedItems.reduce((sum, i) => sum + (i.quantity * i.budgetPrice), 0)
      const totalReference = updatedItems.reduce((sum, i) => sum + (i.referenceAvgPrice ? i.quantity * i.referenceAvgPrice : 0), 0)
      const overallVariance = totalReference > 0 ? ((totalBudget - totalReference) / totalReference) * 100 : 0
      
      // Recalculate stats
      const belowCount = updatedItems.filter(i => i.rating === "below").length
      const avgCount = updatedItems.filter(i => i.rating === "average").length
      const aboveCount = updatedItems.filter(i => i.rating === "above").length
      const criticalCount = updatedItems.filter(i => i.rating === "critical").length
      const unknownCount = updatedItems.filter(i => i.rating === "unknown").length
      
      setAnalysisResult({
        ...analysisResult,
        items: updatedItems,
        totalBudget,
        totalReference,
        overallVariance,
        stats: {
          ...analysisResult.stats,
          belowAverage: belowCount,
          average: avgCount,
          aboveAverage: aboveCount,
          critical: criticalCount,
          unknown: unknownCount,
        }
      })
      
      toast.success("Re-análise concluída", {
        description: `${items.length} itens foram re-analisados com IA.`,
      })
      
    } catch (err) {
      console.error("Error bulk re-analyzing:", err)
      toast.error("Erro na re-análise", {
        description: "Ocorreu um erro ao re-analisar os itens.",
      })
    } finally {
      setIsBulkReanalyzing(false)
      setBulkReanalyzeProgress(0)
    }
  }

  // Save budget to approval list
  const handleSaveBudget = () => {
    if (!analysisResult || !saveBudgetName.trim()) return
    
    setIsSaving(true)
    
    try {
      // Convert analysis items to budget items format
      const budgetItems = analysisResult.items.map((item, index) => ({
        id: `item-${index}`,
        materialId: item.id,
        materialName: item.matchedName || item.originalName,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.budgetPrice,
        category: item.category,
      }))
      
      // Add budget to the data context with "pendente" status for approval
      addBudget({
        name: saveBudgetName.trim(),
        obraId: "",
        obraName: saveBudgetLocation.trim() || "Localização não especificada",
        createdDate: new Date().toISOString().split("T")[0],
        status: "pendente",
        items: budgetItems,
        totalValue: analysisResult.totalBudget,
        analysisVariance: analysisResult.overallVariance,
      })
      
      // Reset form and close dialog
      setSaveBudgetName("")
      setSaveBudgetLocation("")
      setShowSaveDialog(false)
      
      // Show success toast
      toast.success("Orçamento guardado", {
        description: `"${saveBudgetName.trim()}" foi adicionado à lista de aprovação.`,
      })
    } catch (err) {
      console.error("Error saving budget:", err)
      toast.error("Erro ao guardar", {
        description: "Ocorreu um erro ao guardar o orçamento.",
      })
    } finally {
      setIsSaving(false)
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
  accept=".csv,.txt,.pdf,.xls,.xlsx"
  onChange={handleFileUpload}
  className="hidden"
                  disabled={isAnalyzing}
                />
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
<p className="font-medium mb-1">Arraste o ficheiro aqui</p>
<p className="text-sm text-muted-foreground mb-4">Formatos aceites: PDF, Excel (XLS/XLSX), CSV, TXT</p>
                <Button variant="outline" disabled={isAnalyzing}>
                  Selecionar Ficheiro
                </Button>
              </div>

              {isAnalyzing && (
                <div className="mt-4 space-y-2">
  <div className="flex justify-between text-sm">
  <span className="text-muted-foreground">{analyzeStatus || "A analisar..."}</span>
  <span className="font-medium">{analyzeProgress}%</span>
  </div>
  <Progress value={analyzeProgress} className="h-2" />
  <p className="text-xs text-muted-foreground mt-1">
    {analyzeProgress < 5 && "A extrair itens do documento..."}
    {analyzeProgress >= 5 && analyzeProgress < 10 && "A procurar correspondências na base de dados..."}
    {analyzeProgress >= 10 && analyzeProgress < 50 && "A analisar itens e calcular variâncias..."}
    {analyzeProgress >= 50 && analyzeProgress < 90 && "A processar categorias e estatísticas..."}
    {analyzeProgress >= 90 && "A finalizar análise..."}
  </p>
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
              <CardDescription>PDF, Excel (XLS/XLSX), CSV ou TXT com orçamento de construção</CardDescription>
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
                <div className="text-2xl font-bold">{analysisResult.totalBudget.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</div>
                <p className="text-sm text-muted-foreground">Total do Orçamento</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{analysisResult.totalReference.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</div>
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

          {/* Quality Score and Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Quality Score Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Pontuação de Qualidade</p>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-bold text-primary">{calculateQualityScore(analysisResult)}</div>
                      <span className="text-muted-foreground">/100</span>
                    </div>
                    <div className="w-32 h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${calculateQualityScore(analysisResult)}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQualityDetails(!showQualityDetails)}
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </button>
                </div>
                {showQualityDetails && (
                  <div className="mt-4 pt-4 border-t text-xs space-y-2 text-muted-foreground">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground mb-2">Composição da Pontuação:</p>
                      <p>🎯 Taxa de correspondência: {(analysisResult.stats.matchRate * 40).toFixed(0)}/40</p>
                      <p>⭐ Confiança média: {(analysisResult.stats.avgConfidence * 30).toFixed(0)}/30</p>
                      <p>📊 Cobertura: {Math.min((analysisResult.items.length / 50) * 15, 15).toFixed(0)}/15</p>
                      <p>🛡️ Baixo risco: {((1 - analysisResult.stats.riskItems / Math.max(analysisResult.items.length, 1)) * 15).toFixed(0)}/15</p>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <p className="font-medium text-foreground mb-1">Ajuste Regional ({analysisResult.region}):</p>
                      <p>{regionalCoefficients[analysisResult.region]?.label || "Base (Sem ajuste)"}</p>
                      <p className="text-xs text-muted-foreground">Valores podem variar {regionalCoefficients[analysisResult.region]?.label}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Toolbar */}
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground mb-3">Ações Rápidas</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setShowCharts(!showCharts)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Gráficos
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    onClick={saveToHistory}
                  >
                    <Save className="h-4 w-4" />
                    Guardar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    onClick={exportToCSV}
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                  >
                    <History className="h-4 w-4" />
                    Histórico ({analysisHistory.length})
                  </Button>
                </div>
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
                    <div className="text-xl font-bold text-price-above">{analysisResult.stats.potentialSavings.toLocaleString("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
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
                            <span className="text-muted-foreground">{cat.total.toLocaleString("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
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
                  {isAdmin && (
                    <Button variant="outline" onClick={importToDatabase} className="bg-price-below/10 hover:bg-price-below/20 text-price-below border-price-below/30">
                      <Database className="mr-2 h-4 w-4" />
                      Importar para Base de Dados
                    </Button>
                  )}
                  <Button onClick={exportResults}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                  <Button 
                    onClick={() => setShowSaveDialog(true)}
                    className="bg-price-below hover:bg-price-below/90"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Guardar para Aprovação
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Bulk Re-analyze with AI - Admin only */}
              {isAdmin && (
                <div className="mb-4 p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Re-analisar todos os itens com IA
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Procura preços de referência atualizados para todos os {analysisResult.items.length} itens usando inteligência artificial
                      </p>
                    </div>
                    <Button
                      onClick={reanalyzeAllItems}
                      disabled={isBulkReanalyzing}
                      className="shrink-0"
                    >
                      {isBulkReanalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          A re-analisar... {bulkReanalyzeProgress}%
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Re-analisar Tudo
                        </>
                      )}
                    </Button>
                  </div>
                  {isBulkReanalyzing && (
                    <div className="mt-3">
                      <Progress value={bulkReanalyzeProgress} className="h-1.5" />
                    </div>
                  )}
                </div>
              )}

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
                            <th className="px-4 py-3 text-center text-sm font-medium w-10">
                              <button
                                onClick={() => selectedItems.size === filteredItems.length ? clearSelection() : selectAllItems()}
                                className="p-1 hover:bg-muted rounded transition-colors"
                                title="Selecionar tudo"
                              >
                                {selectedItems.size === filteredItems.length && filteredItems.length > 0 ? (
                                  <CheckSquare className="h-4 w-4" />
                                ) : (
                                  <Square className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Correspondência</th>
                            <th className="px-4 py-3 text-center text-sm font-medium w-20">Confiança</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Qtd</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Preço Orç.</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Preço Ref.</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Variação</th>
                            <th className="px-4 py-3 text-center text-sm font-medium">Classif.</th>
                            <th className="px-4 py-3 text-center text-sm font-medium">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {filteredItems.map((item) => {
                            const config = ratingConfig[item.rating as keyof typeof ratingConfig] || ratingConfig.unknown
                            const Icon = config.icon
                            const isSelected = selectedItems.has(item.id)
                            const suggestions = getSmartSuggestions(item)
                            return (
                              <React.Fragment key={item.id}>
                                <tr className={cn("hover:bg-muted/30", isSelected && "bg-primary/10")}>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => toggleItemSelection(item.id)}
                                      className="p-1 hover:bg-muted rounded transition-colors"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="h-4 w-4 text-primary" />
                                      ) : (
                                        <Square className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </button>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-sm">{item.originalName}</div>
                                    <div className="text-xs text-muted-foreground">{item.unit}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    {item.matchedName ? (
                                      <div>
                                        <div className="text-sm">{item.matchedName}</div>
                                        <div className="text-xs text-muted-foreground">{item.category}</div>
                                      </div>
                                    ) : suggestions.length > 0 ? (
                                      <button
                                        onClick={() => setShowSuggestions(showSuggestions === item.id ? null : item.id)}
                                        className="text-sm text-primary hover:underline flex items-center gap-1"
                                      >
                                        <Lightbulb className="h-3 w-3" />
                                        {suggestions.length} sugestões
                                      </button>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">Sem correspondência</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className={cn(
                                            "h-full transition-all",
                                            item.matchConfidence >= 0.8 ? "bg-green-500" :
                                            item.matchConfidence >= 0.6 ? "bg-yellow-500" :
                                            item.matchConfidence >= 0.4 ? "bg-orange-500" :
                                            "bg-red-500"
                                          )}
                                          style={{ width: `${item.matchConfidence * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-medium w-7 text-right">{(item.matchConfidence * 100).toFixed(0)}%</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm">{item.quantity}</td>
                                  <td className="px-4 py-3 text-right text-sm font-medium">
                                    {item.budgetPrice.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm">
                                    {item.referenceAvgPrice ? (
                                      <div>
                                        <div>{item.referenceAvgPrice.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {item.referenceMinPrice?.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })} - {item.referenceMaxPrice?.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
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
                                  <td className="px-4 py-3">
                                    <div className="flex justify-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openEditDialog(item)}
                                        disabled={isReanalyzing === item.id}
                                        title="Editar item"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      {isAdmin && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => reanalyzeItem(item)}
                                          disabled={isReanalyzing === item.id}
                                          title="Re-analisar com IA"
                                          className={item.rating === "unknown" ? "text-yellow-500 hover:text-yellow-600" : ""}
                                        >
                                          {isReanalyzing === item.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Sparkles className="h-4 w-4" />
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                                {/* Suggestions Row */}
                                {showSuggestions === item.id && suggestions.length > 0 && (
                                  <tr className="bg-primary/5 border-b-2 border-primary/20">
                                    <td colSpan={10} className="px-4 py-3">
                                      <div className="space-y-2">
                                        <p className="text-sm font-medium flex items-center gap-2">
                                          <Lightbulb className="h-4 w-4 text-primary" />
                                          Sugestões de correspondência para "{item.originalName}"
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {suggestions.map((sugg, idx) => (
                                            <button
                                              key={idx}
                                              onClick={() => {
                                                // TODO: Update item with suggestion
                                                setShowSuggestions(null)
                                              }}
                                              className="text-left p-2 rounded border border-primary/30 hover:bg-primary/10 transition-colors"
                                            >
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium truncate">{sugg.name}</p>
                                                  <p className="text-xs text-muted-foreground">{sugg.category}</p>
                                                </div>
                                                <span className="text-xs font-semibold text-primary shrink-0">
                                                  {(sugg.confidence * 100).toFixed(0)}%
                                                </span>
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
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

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Corrija os dados do item e clique em guardar para re-analisar com os novos valores.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Descrição do Item</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Ex: Pintura interior a tinta plástica"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-unit">Unidade</Label>
                <Input
                  id="edit-unit"
                  value={editForm.unit}
                  onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                  placeholder="m2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-quantity">Quantidade</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Preço Unit. (EUR)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  placeholder="12.50"
                />
              </div>
            </div>
            {editingItem?.rating === "unknown" && (
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-sm">
                <p className="text-yellow-500 font-medium mb-1">Item sem referência de preço</p>
                <p className="text-muted-foreground">
                  Ao guardar, a IA irá procurar preços de referência no mercado português para este item.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEditedItem} disabled={isReanalyzing === editingItem?.id}>
              {isReanalyzing === editingItem?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A analisar...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Guardar e Re-analisar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Budget Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-price-below" />
              Guardar Orçamento para Aprovação
            </DialogTitle>
            <DialogDescription>
              Adicione um nome e localização para identificar este orçamento na lista de aprovação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="budget-name">Nome do Orçamento *</Label>
              <Input
                id="budget-name"
                placeholder="Ex: Orçamento Reabilitação Fachada"
                value={saveBudgetName}
                onChange={(e) => setSaveBudgetName(e.target.value)}
                className="bg-input/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Localização / Nome da Obra
              </Label>
              <Input
                id="budget-location"
                placeholder="Ex: Rua das Flores, 123 - Lisboa"
                value={saveBudgetLocation}
                onChange={(e) => setSaveBudgetLocation(e.target.value)}
                className="bg-input/50"
              />
            </div>
            {analysisResult && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="text-sm font-medium">Resumo do Orçamento</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Total de itens:</span>
                  <span className="font-medium text-foreground">{analysisResult.items.length}</span>
                  <span>Valor total:</span>
                  <span className="font-medium text-foreground">
                    {analysisResult.totalBudget.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                  </span>
                  <span>Ficheiro original:</span>
                  <span className="font-medium text-foreground truncate">{analysisResult.fileName}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveBudget} 
              disabled={!saveBudgetName.trim() || isSaving}
              className="bg-price-below hover:bg-price-below/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A guardar...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Orçamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analysis History Panel */}
      <Sheet open={showHistoryPanel} onOpenChange={setShowHistoryPanel}>
        <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Análises
            </SheetTitle>
            <SheetDescription>
              {analysisHistory.length === 0 ? "Nenhuma análise guardada ainda" : `${analysisHistory.length} análise${analysisHistory.length !== 1 ? "s" : ""} guardada${analysisHistory.length !== 1 ? "s" : ""}`}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-3 mt-6">
            {analysisHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground">Guarde análises para revisão futura</p>
              </div>
            ) : (
              analysisHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate group-hover:text-primary transition-colors">{entry.fileName}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.savedAt).toLocaleDateString("pt-PT")} às {new Date(entry.savedAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Badge variant="outline" className="text-xs">{entry.region}</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-muted-foreground">Orçamento</p>
                      <p className="font-semibold">{entry.totalBudget.toLocaleString("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-muted-foreground">Correspondência</p>
                      <p className="font-semibold">{(entry.matchRate * 100).toFixed(0)}%</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-muted-foreground">Qualidade</p>
                      <p className="font-semibold">{entry.qualityScore}/100</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => restoreFromHistory(entry)}
                    >
                      Restaurar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="px-2"
                      onClick={() => deleteFromHistory(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Charts Modal */}
      <Dialog open={showCharts} onOpenChange={setShowCharts}>
        <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Visualizações Gráficas
            </DialogTitle>
          </DialogHeader>
          
          {analysisResult && (
            <div className="space-y-6">
              {/* Pie Chart - Rating Distribution */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Pie className="h-4 w-4" />
                  Distribuição por Classificação
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Abaixo", value: analysisResult.stats.belowAverage, fill: "#22c55e" },
                        { name: "Média", value: analysisResult.stats.average, fill: "#3b82f6" },
                        { name: "Acima", value: analysisResult.stats.aboveAverage, fill: "#f59e0b" },
                        { name: "Crítica", value: analysisResult.stats.critical, fill: "#ef4444" },
                        { name: "S/ Ref.", value: analysisResult.stats.unknown, fill: "#9ca3af" },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#9ca3af" />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} itens`, "Quantidade"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart - Budget vs Reference */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Orçamento vs Referência de Mercado
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: "Comparação", Orçamento: analysisResult.totalBudget, Referência: analysisResult.totalReference }
                    ]}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => value.toLocaleString("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    />
                    <Legend />
                    <Bar dataKey="Orçamento" fill="#3b82f6" />
                    <Bar dataKey="Referência" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog for Public Users (8+ lines) */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => {
        if (!open) {
          setShowPaymentDialog(false)
          setSelectedPricingTier(null)
          setPendingFile(null)
          setPendingItemCount(0)
          setPaymentStep("select")
          setPaymentForm({ name: "", card: "", expiry: "", cvv: "" })
          setPaymentError("")
        }
      }}>
        <DialogContent className="sm:max-w-lg">

          {/* STEP: Plan Selection */}
          {paymentStep === "select" && (<>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-6 w-6 text-primary" />
                Orçamento com {pendingItemCount} Linhas
              </DialogTitle>
              <DialogDescription className="text-base">
                O seu orçamento excede o limite gratuito de 8 linhas. Selecione um plano para continuar a análise.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              {pricingTiers.map((tier, index) => {
                const isFreeTier = tier.price === 0
                const rangeStart = index === 0 ? 1 : pricingTiers[index - 1].maxLines + 1
                const rangeEnd = tier.maxLines === Infinity ? "200+" : tier.maxLines
                const isSelected = selectedPricingTier === index
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedPricingTier(index)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-md"
                        : isFreeTier
                          ? "border-price-below/30 bg-price-below/5 hover:bg-price-below/10"
                          : "border-border bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="font-medium text-sm">{rangeStart}–{rangeEnd} linhas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isFreeTier ? (
                        <Badge className="bg-price-below text-white text-sm px-3 py-1">Grátis</Badge>
                      ) : (
                        <span className={`font-bold text-base ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                          €{tier.price.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                      {!isFreeTier && <span className="text-xs text-muted-foreground">(inclui PDF)</span>}
                    </div>
                  </button>
                )
              })}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setShowPaymentDialog(false); setSelectedPricingTier(null); setPendingFile(null); setPendingItemCount(0) }}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (selectedPricingTier === null) return
                  if (pricingTiers[selectedPricingTier].price === 0) {
                    // Free tier — go straight to analysis
                    const fileToAnalyze = pendingFile!
                    const lineLimit = 8
                    setShowPaymentDialog(false)
                    setSelectedPricingTier(null)
                    setPendingFile(null)
                    setPendingItemCount(0)
                    setPaymentStep("select")
                    analyzeFileWithLimit(fileToAnalyze, lineLimit)
                    toast.success("Análise com limite gratuito iniciada!", { description: "Mostrando os primeiros 8 itens." })
                  } else {
                    setPaymentStep("checkout")
                  }
                }}
                disabled={selectedPricingTier === null}
                className="bg-primary hover:bg-primary/90"
              >
                {selectedPricingTier !== null && pricingTiers[selectedPricingTier].price === 0
                  ? "Continuar com Análise Grátis (8 itens)"
                  : selectedPricingTier !== null
                    ? `Continuar para Pagamento`
                    : "Selecionar Plano"
                }
              </Button>
            </DialogFooter>
          </>)}

          {/* STEP: Checkout Form */}
          {paymentStep === "checkout" && selectedPricingTier !== null && (<>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => setPaymentStep("select")} className="text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <DialogTitle className="text-xl">Pagamento Seguro</DialogTitle>
              </div>
              <DialogDescription>
                Plano selecionado: <span className="font-semibold text-foreground">{(() => { const t = pricingTiers[selectedPricingTier]; const start = selectedPricingTier === 0 ? 1 : pricingTiers[selectedPricingTier - 1].maxLines + 1; const end = t.maxLines === Infinity ? "200+" : t.maxLines; return `${start}–${end} linhas` })()} — €{pricingTiers[selectedPricingTier].price.toFixed(2).replace(".", ",")}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Card visual */}
              <div className="relative h-40 rounded-2xl bg-gradient-to-br from-primary/80 to-primary p-5 text-primary-foreground shadow-lg overflow-hidden select-none">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                <div className="flex justify-between items-start mb-6">
                  <span className="text-xs font-medium tracking-widest uppercase opacity-70">MOAP Pay</span>
                  <div className="flex gap-1">
                    <div className="h-6 w-6 rounded-full bg-white/40" />
                    <div className="h-6 w-6 rounded-full bg-white/20 -ml-3" />
                  </div>
                </div>
                <p className="font-mono text-lg tracking-[0.2em] mb-3">
                  {paymentForm.card ? paymentForm.card.replace(/(.{4})/g, "$1 ").trim() : "•••• •••• •••• ••••"}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-60 mb-0.5">Titular</p>
                    <p className="text-sm font-medium uppercase tracking-wide">{paymentForm.name || "NOME DO TITULAR"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-60 mb-0.5">Validade</p>
                    <p className="text-sm font-medium">{paymentForm.expiry || "MM/AA"}</p>
                  </div>
                </div>
              </div>

              {paymentError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {paymentError}
                </div>
              )}

              {/* Form fields */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="card-name" className="text-sm">Nome no Cartão</Label>
                  <Input
                    id="card-name"
                    placeholder="João Silva"
                    value={paymentForm.name}
                    onChange={(e) => setPaymentForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
                    className="uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="card-number" className="text-sm">Número do Cartão</Label>
                  <div className="relative">
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      value={paymentForm.card.replace(/(\d{4})(?=\d)/g, "$1 ")}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 16)
                        setPaymentForm(f => ({ ...f, card: digits }))
                      }}
                      className="font-mono pr-10"
                    />
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="card-expiry" className="text-sm">Validade</Label>
                    <Input
                      id="card-expiry"
                      placeholder="MM/AA"
                      maxLength={5}
                      value={paymentForm.expiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "").slice(0, 4)
                        if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2)
                        setPaymentForm(f => ({ ...f, expiry: val }))
                      }}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="card-cvv" className="text-sm">CVV</Label>
                    <Input
                      id="card-cvv"
                      placeholder="•••"
                      maxLength={3}
                      type="password"
                      value={paymentForm.cvv}
                      onChange={(e) => setPaymentForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Pagamento seguro simulado — nenhum dado real é processado
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPaymentStep("select")}>Voltar</Button>
              <Button
                onClick={() => {
                  setPaymentError("")
                  if (!paymentForm.name.trim()) { setPaymentError("Introduza o nome do titular."); return }
                  if (paymentForm.card.length < 16) { setPaymentError("Número de cartão inválido."); return }
                  if (paymentForm.expiry.length < 5) { setPaymentError("Data de validade inválida."); return }
                  if (paymentForm.cvv.length < 3) { setPaymentError("CVV inválido."); return }
                  setPaymentStep("processing")
                  setTimeout(() => setPaymentStep("success"), 2200)
                }}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Lock className="h-4 w-4" />
                Pagar €{pricingTiers[selectedPricingTier].price.toFixed(2).replace(".", ",")}
              </Button>
            </DialogFooter>
          </>)}

          {/* STEP: Processing */}
          {paymentStep === "processing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
              </div>
              <p className="font-semibold text-lg">A processar pagamento...</p>
              <p className="text-sm text-muted-foreground">Por favor aguarde</p>
            </div>
          )}

          {/* STEP: Success */}
          {paymentStep === "success" && selectedPricingTier !== null && (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-price-below/20 border-2 border-price-below">
                <Check className="h-8 w-8 text-price-below" />
              </div>
              <div>
                <p className="font-bold text-xl mb-1">Pagamento Confirmado!</p>
                <p className="text-muted-foreground text-sm">
                  €{pricingTiers[selectedPricingTier].price.toFixed(2).replace(".", ",")} debitado com sucesso.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-6 py-3 text-sm text-muted-foreground">
                Ref: MOAP-{Math.random().toString(36).slice(2, 10).toUpperCase()}
              </div>
              <Button
                className="mt-2 w-full bg-primary hover:bg-primary/90"
                onClick={() => {
                  const fileToAnalyze = pendingFile!
                  const lineLimit = pricingTiers[selectedPricingTier].maxLines === Infinity ? null : pricingTiers[selectedPricingTier].maxLines
                  setShowPaymentDialog(false)
                  setSelectedPricingTier(null)
                  setPendingFile(null)
                  setPendingItemCount(0)
                  setPaymentStep("select")
                  setPaymentForm({ name: "", card: "", expiry: "", cvv: "" })
                  analyzeFileWithLimit(fileToAnalyze, lineLimit)
                  toast.success("A análise vai começar agora!")
                }}
              >
                Iniciar Análise
              </Button>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </div>
  )
}
