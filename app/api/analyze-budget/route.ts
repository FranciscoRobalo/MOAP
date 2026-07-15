import { NextRequest, NextResponse } from "next/server"
import { extractText } from "unpdf"
import OpenAI from "openai"
import * as XLSX from "xlsx"
import { db } from "@/lib/db"
import { materials as materialsTable } from "@/lib/db/schema"
import { asc } from "drizzle-orm"

// Increase timeout for this API route (Vercel Pro allows up to 300s)
export const maxDuration = 60

// ============================================================================
// TYPES
// ============================================================================

interface ParsedItem {
  name: string
  unit: string
  quantity: number
  price: number
}

interface AnalyzedItem extends ParsedItem {
  unitPrice: number
  totalPrice: number
  isGlobalPrice: boolean
  matchedMaterialId: string | null
  matchedMaterialName: string | null
  confidence: number
  referenceMinPrice: number | null
  referenceMaxPrice: number | null
  referenceAvgPrice: number | null
  variance: number | null
  category: string
  matchReason: string
  rating: "below" | "average" | "above" | "critical" | "unknown"
  riskLevel: "low" | "medium" | "high" | "critical"
  aiInsight?: string
}

interface MaterialRef {
  id: string
  name: string
  unit: string
  price: number
  priceMin?: number
  priceMax?: number
  category: string
}

interface AnalysisResponse {
  success: boolean
  items: AnalyzedItem[]
  stats: {
    totalItems: number
    matchedItems: number
    avgConfidence: number
    processingTimeMs: number
    totalBudget: number
    totalReference: number
    overallVariance: number
    qualityScore: number
    riskItems: number
    potentialSavings: number
  }
  recommendations: string[]
  categoryBreakdown: { category: string; total: number; count: number; variance: number }[]
  debug?: string[]
}

// ============================================================================
// OPENAI CLIENT
// ============================================================================

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    console.error("[API] OPENAI_API_KEY not found in environment")
    return null
  }
  return new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 50000, // 50s timeout (under Vercel's 60s function limit)
    maxRetries: 4,  // Retry on transient errors (ECONNRESET, 429, 5xx)
  })
}

// ============================================================================
// AUTO-FETCH MATERIALS FROM DATABASE
// ============================================================================

async function fetchMaterialsFromDB(): Promise<MaterialRef[]> {
  try {
    const rows = await db
      .select({
        id: materialsTable.id,
        name: materialsTable.name,
        unit: materialsTable.unit,
        avgPrice: materialsTable.avgPrice,
        minPrice: materialsTable.minPrice,
        maxPrice: materialsTable.maxPrice,
        category: materialsTable.category,
      })
      .from(materialsTable)
      .orderBy(asc(materialsTable.category))

    return rows.map((m) => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      price: m.avgPrice != null ? Number(m.avgPrice) : 0,
      priceMin: m.minPrice != null ? Number(m.minPrice) : 0,
      priceMax: m.maxPrice != null ? Number(m.maxPrice) : 0,
      category: m.category,
    }))
  } catch (error) {
    console.error("Failed to fetch materials:", error)
    return []
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function parsePortugueseNumber(str: string): number {
  if (!str || typeof str !== "string") return 0
  let cleaned = str.replace(/€/g, "").replace(/\s+/g, "").trim()
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".")
  }
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function normalizeUnit(unit: string): string {
  if (!unit) return "un"
  const trimmed = unit.toString().trim().toLowerCase().replace(/\./g, "")
  const unitMap: Record<string, string> = {
    "vg": "vg", "vglobal": "vg", "vb": "vg", "verba": "vg",
    "ml": "ml", "m.l": "ml", "metro linear": "ml",
    "m2": "m2", "m²": "m2", "m 2": "m2",
    "m3": "m3", "m³": "m3", "m 3": "m3",
    "un": "un", "und": "un", "unid": "un", "unidade": "un", 
    "pç": "un", "pc": "un", "peça": "un",
    "kg": "kg", "quilo": "kg",
    "m": "m", "metro": "m",
    "l": "l", "lt": "l", "litro": "l",
    "mês": "mês", "mes": "mês", "hora": "hora", "h": "hora",
  }
  return unitMap[trimmed] || (trimmed.length <= 6 ? trimmed : "un")
}

function calculateRating(variance: number | null): "below" | "average" | "above" | "critical" | "unknown" {
  if (variance === null) return "unknown"
  if (variance < -10) return "below"
  if (variance <= 10) return "average"
  if (variance <= 50) return "above"
  return "critical"
}

function calculateRiskLevel(variance: number | null, confidence: number): "low" | "medium" | "high" | "critical" {
  if (variance === null || confidence < 60) return "medium"
  if (variance > 50) return "critical"
  if (variance > 25) return "high"
  if (variance > 10) return "medium"
  return "low"
}

// ============================================================================
// EXCEL PARSER (Fast, local)
// ============================================================================

function parseExcelFile(buffer: ArrayBuffer, debugInfo: string[]): ParsedItem[] {
  debugInfo.push("Parsing Excel file locally...")
  const items: ParsedItem[] = []
  
  try {
    const workbook = XLSX.read(buffer, { type: "array" })
    
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
      
      // Find header row
      let headerRow = -1
      let descCol = -1, unitCol = -1, qtyCol = -1, priceCol = -1
      
      for (let i = 0; i < Math.min(data.length, 20); i++) {
        const row = data[i]
        if (!row || !Array.isArray(row)) continue
        
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || "").toLowerCase().trim()
          
          if (cell.includes("descrição") || cell.includes("designação") || cell.includes("especificação") || cell.includes("artigo")) {
            descCol = j
            headerRow = i
          } else if (cell.includes("unid") || cell === "un" || cell === "und") {
            unitCol = j
            headerRow = i
          } else if (cell.includes("quant") || cell === "qt" || cell === "qtd") {
            qtyCol = j
            headerRow = i
          } else if ((cell.includes("preço") || cell.includes("valor")) && (cell.includes("unit") || cell.includes("€"))) {
            priceCol = j
            headerRow = i
          }
        }
        
        if (descCol >= 0 && headerRow >= 0) break
      }
      
      // Parse data rows
      for (let i = headerRow + 1; i < data.length; i++) {
        const row = data[i]
        if (!row || !Array.isArray(row)) continue
        
        let name = "", unit = "un", quantity = 1, price = 0
        
        // Extract description
        if (descCol >= 0 && row[descCol]) {
          name = String(row[descCol]).trim()
        } else {
          // Find longest text cell as description
          let maxLen = 0
          for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] || "")
            if (cell.length > maxLen && cell.length > 10 && !/^[\d.,€\s]+$/.test(cell)) {
              name = cell.trim()
              maxLen = cell.length
            }
          }
        }
        
        if (unitCol >= 0 && row[unitCol]) unit = normalizeUnit(String(row[unitCol]))
        if (qtyCol >= 0 && row[qtyCol] != null) {
          const rawQ = row[qtyCol]
          const q: number = typeof rawQ === "number" ? rawQ : parsePortugueseNumber(String(rawQ))
          if (q > 0 && q < 100000) quantity = q
        }
        if (priceCol >= 0 && row[priceCol] != null) {
          const rawP = row[priceCol]
          price = typeof rawP === "number" ? rawP : parsePortugueseNumber(String(rawP))
        }
        
        // Find price if not found
        if (price === 0) {
          for (let j = row.length - 1; j >= 0; j--) {
            if (j === descCol) continue
            const val = row[j]
            const num = typeof val === "number" ? val : parsePortugueseNumber(String(val || ""))
            if (num > 0 && num < 10000000) {
              price = num
              break
            }
          }
        }
        
        if (name && name.length > 5 && !/^(total|subtotal|iva|observ)/i.test(name)) {
          items.push({ name, unit, quantity, price })
        }
      }
    }
    
    debugInfo.push(`Excel parsing found ${items.length} items`)
  } catch (error) {
    debugInfo.push(`Excel parse error: ${error instanceof Error ? error.message : "Unknown"}`)
  }
  
  return items
}

// ============================================================================
// WORLD-CLASS GPT ANALYSIS PROMPT
// ============================================================================

async function analyzeWithGPT(
  text: string, 
  materials: MaterialRef[], 
  debugInfo: string[]
): Promise<AnalyzedItem[]> {
  const openai = getOpenAIClient()
  if (!openai) {
    debugInfo.push("OpenAI API key not configured - check OPENAI_API_KEY env var")
    return []
  }
  debugInfo.push("Starting world-class GPT analysis...")
  const startTime = Date.now()
  
  // Limit text to avoid token limits
  const maxChars = 20000
  const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text
  
  // Create detailed material database reference
  const materialSummary = materials.slice(0, 200).map(m => 
    `${m.id}|${m.name}|${m.unit}|€${m.priceMin?.toFixed(2) || m.price.toFixed(2)}-€${m.priceMax?.toFixed(2) || m.price.toFixed(2)}|${m.category}`
  ).join("\n")
  
  const systemPrompt = `Você é o sistema de análise de orçamentos de construção civil mais avançado do mundo, especializado no mercado português.

MISSÃO CRÍTICA: Analisar orçamentos de construção com precisão cirúrgica, identificando:
- Preços inflacionados ou abaixo do mercado
- Itens com risco financeiro elevado
- Oportunidades de poupança
- Correspondências semânticas inteligentes com a base de dados

═══════════════════════════════════════════════════════════════════════════════
REGRA CRÍTICA: IDENTIFICAR TIPO DE PREÇO
═══════════════════════════════════════════════════════════════════════════════

ATENÇÃO MÁXIMA: Você DEVE identificar se cada item é:

A) PREÇO UNITÁRIO (por m2, m3, un, ml, kg, etc.):
   • O preço é POR UNIDADE de medida
   • Exemplo: "Pintura interior - m2 - 200 m2 - €8.50/m2"
   • Compare com preços de referência unitários

B) PREÇO GLOBAL/TOTAL (vg = verba global):
   • O preço é pelo TRABALHO TODO, não unitário
   • Palavras-chave: "verba", "global", "conjunto", "total", "completo"
   • Exemplo: "Demoli��ões (verba global) - €5.000,00" = preço total de todas demolições
   • NÃO compare diretamente com preços unitários!

C) CATEGORIA/CAPÍTULO (NÃO É UM ITEM):
   • Títulos como "1. DEMOLIÇÕES", "2. ESTRUTURA", "CAPÍTULO III"
   • Estes são cabeçalhos, não itens de orçamento
   • O valor associado é geralmente SUBTOTAL do capítulo
   • IGNORE estes ou marque como "isChapterHeader": true

COMO DISTINGUIR:
• Se tem unidade específica (m2, m3, un, ml) → PREÇO UNITÁRIO
• Se diz "vg", "verba", "global", "total" → PREÇO GLOBAL
• Se o preço é muito alto (>€1000) sem quantidade clara → provavelmente GLOBAL
• Se é só um nome de categoria sem detalhes → CABEÇALHO (ignorar)

PARA PREÇOS GLOBAIS:
• Não calcule variação % comparando com preços unitários
• Estime se o valor global é razoável para o trabalho descrito
• Marque "isGlobalPrice": true na resposta

═══════════════════════════════════════════════════════════════════════════════
INSTRUÇÕES DE EXTRAÇÃO E ANÁLISE
═══════════════════════════════════════════════════════════════════════════════

1. EXTRAÇÃO DE ITENS:
   • Identificar TODOS os artigos individuais do orçamento
   • IGNORAR linhas que são apenas títulos de capítulos/categorias
   • Artigos têm formato: número + descrição + unidade + quantidade + preço
   • Números de artigo: "1,01", "2,03", "Art. 5", "01.02.03"
   • Preços portugueses: "22 000,00" = 22000€, "1.234,56" = 1234.56€

2. UNIDADES PADRÃO:
   • vg = verba global (trabalho completo, preço total)
   • m2 = metro quadrado (preço por m2)
   • m3 = metro cúbico (preço por m3)
   • ml = metro linear (preço por metro)
   • un = unidade (preço por peça)
   • kg = quilograma (preço por kg)
   • mês = mensal

3. CORRESPONDÊNCIA SEMÂNTICA INTELIGENTE:
   • Entender SIGNIFICADO, não apenas palavras
   • "capoto" = "cappotto" = "ETICS" = "isolamento térmico exterior"
   • "gesso cartonado" = "pladur" = "drywall"
   • "pavimento cerâmico" = "azulejo pavimento" = "ladrilho cerâmico"
   • Considerar contexto da frase para melhor match

4. ESTIMATIVA DE PREÇOS (quando não há match na BD):
   Use estes preços de referência Portugal 2025:

   DEMOLIÇÕES:
   • Demolição pavimento/revestimento: €8-15/m2
   • Demolição alvenaria tijolo: €14-27/m2
   • Remoção entulho: €25-50/m3
   
   ESTRUTURA:
   • Betão C25/30 fundações: €90-140/m3
   • Betão C30/37: €100-160/m3
   • Armadura aço A500: €1.4-2.4/kg
   • Cofragem: €20-55/m2
   
   ALVENARIAS:
   • Tijolo 30x20x11: €22-38/m2
   • Bloco térmico: €35-65/m2
   • Pladur simples: €28-52/m2
   
   REVESTIMENTOS:
   • Reboco tradicional: €8-18/m2
   • Pintura interior: €6-16/m2
   • Pintura exterior: €10-24/m2
   • Pavimento cerâmico: €30-60/m2
   • Pavimento flutuante: €18-42/m2
   
   INSTALAÇÕES:
   • Elétrica completa T2: €3500-7500/vg
   • Elétrica por m2: €35-78/m2
   • Hidráulica completa T2: €2800-6200/vg
   • Hidráulica por m2: €28-62/m2
   
   ISOLAMENTOS:
   • ETICS/Cappotto: €55-100/m2
   • Impermeabilização: €18-48/m2
   
   CARPINTARIAS:
   • Porta interior: €280-650/un
   • Porta segurança: €850-2200/un
   • Armário roupeiro: €380-850/ml
   
   CAIXILHARIAS:
   • Alumínio RPT: €320-720/m2
   • PVC: €250-550/m2
   • Vidro duplo: €55-125/m2
   
   OUTROS:
   • Estaleiro pequeno: €2500-8000/vg
   • Estaleiro médio: €8000-25000/vg
   • Teto falso gesso: €28-52/m2

5. INSIGHTS E RECOMENDAÇÕES:
   • Para cada item, fornecer insight sobre o preço
   • Identificar se está muito acima/abaixo do mercado
   • Sugerir pontos de negociação

═════════════════════════════════════════════════════════════════════════════��═
BASE DE DADOS DE MATERIAIS/SERVIÇOS (usar para correspondência):
═���════════════════════════��════════════════════════════════════════════════════
${materialSummary}

═════════════════════════════════════������════════════════════════════════════════
FORMATO DE RESPOSTA (JSON obrigatório):
═══════════════════════════════════════════════════════════════════════════════
{
  "items": [
    {
      "name": "descrição original completa do item",
      "unit": "unidade normalizada (vg, m2, m3, ml, un, kg)",
      "quantity": número (quantidade do item),
      "unitPrice": PREÇO POR UNIDADE em euros (NUNCA o total da linha! Ex: se "120 m2 x 18,50€" então unitPrice=18.50),
      "totalPrice": preço total da linha em euros (quantity * unitPrice. Ex: 120 * 18.50 = 2220),
      "isGlobalPrice": true/false (true se é verba global/vg, false se é preço unitário),
      "matchedMaterialId": "UUID do material correspondente ou null",
      "matchedMaterialName": "nome do material correspondente ou null",
      "confidence": 0-100 (confiança na correspondência),
      "referenceMinPrice": preço mínimo de referência POR UNIDADE (ou null se global),
      "referenceMaxPrice": preço máximo de referência POR UNIDADE (ou null se global),
      "referenceAvgPrice": preço médio de referência POR UNIDADE (ou null se global),
      "category": "categoria do item",
      "matchReason": "explicação clara - se global, explicar que é verba global",
      "aiInsight": "insight sobre este preço - se global, avaliar se valor total é razoável"
    }
  ],
  "recommendations": [
    "Recomendação 1 sobre o orçamento geral",
    "Recomendação 2 sobre itens específicos",
    "Recomendação 3 sobre negociação"
  ]
}

⚠️ REGRA ABSOLUTA SOBRE PREÇOS (LER COM ATENÇÃO):
• "unitPrice" = preço POR UMA unidade (por m2, por m3, por un...). É o valor que comparamos com a referência.
• "totalPrice" = unitPrice × quantity (o total da linha).
• NUNCA coloque o total da linha no campo unitPrice! Isto causa erros graves de análise.
• A referência (referenceAvgPrice) é SEMPRE por unidade, então unitPrice deve ser comparável a ela.
• Exemplo correto: "Demolição 120 m2 a 18,50€/m2" → unitPrice=18.50, totalPrice=2220, quantity=120
• Para verba global (vg): unitPrice = totalPrice = valor global, isGlobalPrice=true`

  try {
    console.log("[API] Starting OpenAI GPT-4o-mini analysis...")
    const startGPT = Date.now()
    
    // Resilient call: retry on transient network errors (ECONNRESET, socket hang up, 5xx)
    const callOpenAI = () => openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analise este orçamento de construção portuguesa:\n\n${truncatedText}` }
      ],
      temperature: 0.1,
      max_tokens: 8000, // Reduced for faster response
      response_format: { type: "json_object" },
    })

    const isTransient = (err: unknown): boolean => {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
      return (
        msg.includes("econnreset") ||
        msg.includes("socket hang up") ||
        msg.includes("etimedout") ||
        msg.includes("econnrefused") ||
        msg.includes("network") ||
        msg.includes("fetch failed") ||
        msg.includes("terminated") ||
        msg.includes("timeout") ||
        msg.includes("502") ||
        msg.includes("503") ||
        msg.includes("504")
      )
    }

    let response: Awaited<ReturnType<typeof callOpenAI>> | null = null
    let lastError: unknown = null
    const maxAttempts = 3
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Per-attempt timeout (keep margin under the 60s route limit)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("OpenAI timeout")), 45000)
      })
      try {
        response = await Promise.race([callOpenAI(), timeoutPromise])
        break
      } catch (err) {
        lastError = err
        const transient = isTransient(err)
        debugInfo.push(`GPT attempt ${attempt}/${maxAttempts} failed: ${err instanceof Error ? err.message : "unknown"}`)
        console.warn(`[API] GPT attempt ${attempt} failed (transient=${transient}): ${err instanceof Error ? err.message : err}`)
        if (!transient || attempt === maxAttempts) throw err
        await new Promise(r => setTimeout(r, attempt * 750)) // backoff: 750ms, 1500ms
      }
    }
    if (!response) throw lastError ?? new Error("OpenAI returned no response")
    console.log(`[API] OpenAI response received in ${Date.now() - startGPT}ms`)

    const content = response.choices[0]?.message?.content || "{}"
    debugInfo.push(`GPT response received in ${Date.now() - startTime}ms`)
    
    // Parse JSON response
    let items: AnalyzedItem[] = []
    let recommendations: string[] = []
    
    try {
      const parsed = JSON.parse(content)
      items = parsed.items || []
      recommendations = parsed.recommendations || []
    } catch {
      debugInfo.push("JSON parse failed, trying extraction...")
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        items = parsed.items || []
        recommendations = parsed.recommendations || []
      }
    }
    
    // Validate and enrich items
    items = items
      .filter((item: AnalyzedItem) => item && item.name && item.name.length > 5)
      .map((item: AnalyzedItem) => {
        const quantity = typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1

        // Resolve unit price robustly. The AI may sometimes still put the line
        // total in unitPrice; if unitPrice is missing but totalPrice exists,
        // derive it. If only legacy "price" exists, treat it as unit price.
        const rawUnit = typeof item.unitPrice === "number" ? item.unitPrice : NaN
        const rawTotal = typeof item.totalPrice === "number" ? item.totalPrice : NaN
        const legacy = typeof item.price === "number" ? item.price : 0

        let unitPrice = !isNaN(rawUnit) && rawUnit > 0 ? rawUnit : legacy
        let totalPrice = !isNaN(rawTotal) && rawTotal > 0 ? rawTotal : unitPrice * quantity

        // Sanity correction: if unitPrice looks like a line total (≈ total and
        // quantity > 1), divide it down so it's comparable to the reference.
        if (!item.isGlobalPrice && quantity > 1 && !isNaN(rawTotal) && rawTotal > 0) {
          if (Math.abs(unitPrice - rawTotal) < 0.01) {
            unitPrice = rawTotal / quantity
          }
        }

        const refAvg = item.referenceAvgPrice || 0
        let variance: number | null = null
        // Only compute variance for unit-priced items with a reference
        if (!item.isGlobalPrice && refAvg > 0 && unitPrice > 0) {
          variance = ((unitPrice - refAvg) / refAvg) * 100
        }

        const rating = calculateRating(item.isGlobalPrice ? null : variance)
        const riskLevel = calculateRiskLevel(variance, item.confidence || 0)

        return {
          ...item,
          name: String(item.name).trim(),
          unit: normalizeUnit(String(item.unit || "un")),
          quantity,
          unitPrice,
          totalPrice,
          // Keep "price" as the unit price for backward compatibility with the UI
          price: unitPrice,
          isGlobalPrice: !!item.isGlobalPrice,
          variance,
          confidence: item.confidence || 0,
          category: item.category || "Sem categoria",
          matchReason: item.matchReason || "",
          rating,
          riskLevel,
          aiInsight: item.aiInsight || ""
        }
      })
    
    debugInfo.push(`World-class analysis extracted ${items.length} items with ${recommendations.length} recommendations in ${Date.now() - startTime}ms`)
    
    // Store recommendations in debug for later retrieval
    if (recommendations.length > 0) {
      debugInfo.push(`RECOMMENDATIONS:${JSON.stringify(recommendations)}`)
    }
    
    return items
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    console.error(`[API] GPT analysis failed: ${errorMsg}`)
    debugInfo.push(`GPT error: ${errorMsg}`)
    
    // Log specific OpenAI errors for debugging
    if (errorMsg.includes("timeout")) {
      debugInfo.push("HINT: OpenAI API timed out. Consider smaller documents or check API quota.")
    } else if (errorMsg.includes("429")) {
      debugInfo.push("HINT: Rate limited. Check OpenAI API usage limits.")
    } else if (errorMsg.includes("401")) {
      debugInfo.push("HINT: Invalid API key. Check OPENAI_API_KEY environment variable.")
    }
    
    return []
  }
}

// ============================================================================
// REGEX FALLBACK PARSER (when GPT fails)
// ============================================================================

// ============================================================================
// DELIMITED (CSV/TSV/TXT) PARSER — robust column detection for structured data
// ============================================================================

function parseDelimitedFile(text: string, debugInfo: string[]): ParsedItem[] {
  debugInfo.push("Using delimited (CSV/TXT) parser...")
  const items: ParsedItem[] = []

  const rawLines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (rawLines.length === 0) {
    debugInfo.push("Delimited parser: no lines found")
    return items
  }

  // Detect the most likely delimiter by counting occurrences in the first lines
  const sample = rawLines.slice(0, Math.min(10, rawLines.length)).join("\n")
  const delimiters = [";", "\t", ",", "|"]
  let delimiter = ";"
  let maxCount = 0
  for (const d of delimiters) {
    const count = (sample.match(new RegExp(d === "|" ? "\\|" : d, "g")) || []).length
    if (count > maxCount) {
      maxCount = count
      delimiter = d
    }
  }
  debugInfo.push(`Delimited parser: delimiter='${delimiter === "\t" ? "TAB" : delimiter}'`)

  const splitLine = (line: string): string[] =>
    line.split(delimiter).map(c => c.replace(/^["']|["']$/g, "").trim())

  // Find header row + column indexes
  let headerIdx = -1
  let descCol = -1, unitCol = -1, qtyCol = -1, priceCol = -1, totalCol = -1
  for (let i = 0; i < Math.min(rawLines.length, 15); i++) {
    const cells = splitLine(rawLines[i])
    let localDesc = -1, localUnit = -1, localQty = -1, localPrice = -1, localTotal = -1
    cells.forEach((cell, j) => {
      const c = cell.toLowerCase()
      if (localDesc < 0 && (c.includes("descri") || c.includes("design") || c.includes("especific") || c.includes("artigo") || c.includes("trabalho") || c.includes("item"))) localDesc = j
      else if (localUnit < 0 && (c === "un" || c === "und" || c === "unid" || c.includes("unidade") || c.includes("unid"))) localUnit = j
      else if (localQty < 0 && (c.includes("quant") || c === "qt" || c === "qtd" || c === "qtde")) localQty = j
      else if (localPrice < 0 && (c.includes("preç") || c.includes("prec") || c.includes("valor")) && (c.includes("unit") || c.includes("€") || c.includes("eur"))) localPrice = j
      else if (localTotal < 0 && (c.includes("total") || c.includes("subtotal") || c.includes("import"))) localTotal = j
    })
    if (localDesc >= 0 && (localPrice >= 0 || localQty >= 0 || localUnit >= 0)) {
      headerIdx = i
      descCol = localDesc; unitCol = localUnit; qtyCol = localQty; priceCol = localPrice; totalCol = localTotal
      break
    }
  }

  const startRow = headerIdx >= 0 ? headerIdx + 1 : 0
  if (headerIdx >= 0) {
    debugInfo.push(`Delimited parser: header at row ${headerIdx} (desc=${descCol}, unit=${unitCol}, qty=${qtyCol}, price=${priceCol})`)
  } else {
    debugInfo.push("Delimited parser: no header detected, using heuristic column detection")
  }

  const unitPattern = /^(v\.?g\.?|vb|verba|m\.?l\.?|m2|m²|m3|m³|un\.?d?|unid(?:ade)?|kg|pc|pç|peça|m|l|lt|h|hora|mês|mes|dia)$/i

  for (let i = startRow; i < rawLines.length; i++) {
    const cells = splitLine(rawLines[i])
    if (cells.length < 2) continue

    let name = ""
    let unit = "un"
    let quantity = 1
    let price = 0

    if (headerIdx >= 0 && descCol >= 0) {
      // Structured: use detected columns
      name = (cells[descCol] || "").trim()
      if (unitCol >= 0 && cells[unitCol]) unit = normalizeUnit(cells[unitCol])
      if (qtyCol >= 0 && cells[qtyCol]) {
        const q = parsePortugueseNumber(cells[qtyCol])
        if (q > 0 && q < 1000000) quantity = q
      }
      if (priceCol >= 0 && cells[priceCol]) price = parsePortugueseNumber(cells[priceCol])
      // Derive unit price from total if needed
      if (price === 0 && totalCol >= 0 && cells[totalCol]) {
        const total = parsePortugueseNumber(cells[totalCol])
        if (total > 0 && quantity > 0) price = total / quantity
      }
    } else {
      // Heuristic: longest non-numeric cell = description; detect unit + numbers
      let maxLen = 0
      const numericCells: number[] = []
      cells.forEach(cell => {
        const isNumeric = /^[\d.,€\s]+$/.test(cell) && /\d/.test(cell)
        if (isNumeric) {
          numericCells.push(parsePortugueseNumber(cell))
        } else if (unitPattern.test(cell.trim())) {
          unit = normalizeUnit(cell)
        } else if (cell.length > maxLen && cell.length > 5) {
          name = cell.trim()
          maxLen = cell.length
        }
      })
      // Assume: [quantity, unitPrice, ...] — pick first as qty, largest plausible as price
      if (numericCells.length >= 2) {
        if (numericCells[0] > 0 && numericCells[0] < 1000000) quantity = numericCells[0]
        price = numericCells[1]
      } else if (numericCells.length === 1) {
        price = numericCells[0]
      }
    }

    // Clean and validate
    name = name.replace(/\s+/g, " ").trim()
    if (!name || name.length < 4) continue
    if (/^(n[ºo°]?|art\.?|designa|descri|pre[çc]o|total|subtotal|iva|observ|empresa|obra|cliente|data|ref\.?)$/i.test(name)) continue
    if (price <= 0) continue

    items.push({
      name,
      unit,
      quantity: quantity > 0 && quantity < 1000000 ? quantity : 1,
      price,
    })
  }

  debugInfo.push(`Delimited parser found ${items.length} items`)
  return items
}

function parseWithRegex(text: string, debugInfo: string[]): ParsedItem[] {
  debugInfo.push("Using regex fallback parser...")
  const items: ParsedItem[] = []
  
  // Find unit+quantity patterns
  const unitQtyMatches = [...text.matchAll(/(v\.?g\.?|vb|m\.?l\.?|m2|m²|m3|m³|un\.?d?|unid|kg|pc|pç|m|l)\s*(\d+[,.]?\d*)/gi)]
  
  for (const unitMatch of unitQtyMatches) {
    const unitIndex = unitMatch.index || 0
    const unit = normalizeUnit(unitMatch[1])
    const qty = parsePortugueseNumber(unitMatch[2])
    
    // Look for description before this unit
    const startSearch = Math.max(0, unitIndex - 500)
    const textBefore = text.substring(startSearch, unitIndex)
    
    const articleMatch = textBefore.match(/(\d+[,.]?\d{0,2})\s+([^€]{10,200})$/)
    let description = ""
    
    if (articleMatch) {
      description = articleMatch[2].trim()
    } else {
      const textBlocks = textBefore.split(/\d+[,.]?\d{0,2}\s*€/)
      const lastBlock = textBlocks[textBlocks.length - 1]
      if (lastBlock) {
        description = lastBlock.replace(/^[\d\s.,€]+/, "").trim()
      }
    }
    
    description = description.replace(/^\d+[,.]?\d{0,2}\s*/, "").replace(/\s+/g, " ").trim()
    
    if (description.length < 10) continue
    if (/^(Nº|Art|Designação|Preço|Total|Empresa|Obra)/i.test(description)) continue
    
    const afterUnit = text.substring(unitIndex + (unitMatch[0]?.length || 0), unitIndex + 150)
    const priceMatch = afterUnit.match(/([\d\s,.]+)\s*€/)
    const price = priceMatch ? parsePortugueseNumber(priceMatch[1]) : 0
    
    if (price > 0) {
      items.push({
        name: description,
        unit,
        quantity: qty > 0 && qty < 100000 ? qty : 1,
        price
      })
    }
  }
  
  debugInfo.push(`Regex parser found ${items.length} items`)
  return items
}

// ============================================================================
// LOCAL MATCHING (when GPT fails)
// ============================================================================

function matchLocally(
  items: ParsedItem[], 
  materials: MaterialRef[],
  debugInfo: string[]
): AnalyzedItem[] {
  debugInfo.push("Using local matching...")
  
  return items.map(item => {
    // Simple keyword matching
    const itemWords = item.name.toLowerCase().split(/\s+/)
    let bestMatch: MaterialRef | null = null
    let bestScore = 0
    
    for (const material of materials) {
      const materialWords = material.name.toLowerCase().split(/\s+/)
      let score = 0
      
      for (const word of itemWords) {
        if (word.length < 3) continue
        if (materialWords.some(mw => mw.includes(word) || word.includes(mw))) {
          score += 1
        }
      }
      
      // Bonus for unit match
      if (normalizeUnit(material.unit) === normalizeUnit(item.unit)) {
        score += 2
      }
      
      if (score > bestScore) {
        bestScore = score
        bestMatch = material
      }
    }
    
    const confidence = bestScore > 3 ? Math.min(bestScore * 15, 85) : 0
    const refAvg = bestMatch?.price || null
    const refMin = bestMatch?.priceMin || refAvg
    const refMax = bestMatch?.priceMax || refAvg
    const variance = refAvg && item.price > 0 ? ((item.price - refAvg) / refAvg) * 100 : null
    const rating = calculateRating(variance)
    const riskLevel = calculateRiskLevel(variance, confidence)
    
    const isGlobalPrice = normalizeUnit(item.unit) === "vg"
    const quantity = item.quantity > 0 ? item.quantity : 1

    return {
      ...item,
      unitPrice: item.price,
      totalPrice: isGlobalPrice ? item.price : item.price * quantity,
      isGlobalPrice,
      matchedMaterialId: confidence >= 60 ? bestMatch?.id || null : null,
      matchedMaterialName: confidence >= 60 ? bestMatch?.name || null : null,
      confidence,
      referenceMinPrice: refMin,
      referenceMaxPrice: refMax,
      referenceAvgPrice: refAvg,
      variance,
      category: bestMatch?.category || "Sem categoria",
      matchReason: confidence >= 60 ? "Correspondência local por palavras-chave" : "Sem correspondência adequada",
      rating,
      riskLevel,
      aiInsight: ""
    }
  })
}

// ============================================================================
// CALCULATE ANALYSIS STATISTICS
// ============================================================================

function calculateStats(items: AnalyzedItem[]): {
  totalBudget: number
  totalReference: number
  overallVariance: number
  qualityScore: number
  riskItems: number
  potentialSavings: number
  categoryBreakdown: { category: string; total: number; count: number; variance: number }[]
} {
  const totalBudget = items.reduce((sum, i) => sum + (i.price * i.quantity), 0)
  const totalReference = items.reduce((sum, i) => {
    const ref = i.referenceAvgPrice || 0
    return sum + (ref * i.quantity)
  }, 0)
  
  const overallVariance = totalReference > 0 
    ? ((totalBudget - totalReference) / totalReference) * 100 
    : 0
  
  // Quality score based on match rate and confidence
  const matchedItems = items.filter(i => i.confidence >= 60).length
  const avgConfidence = items.length > 0 
    ? items.reduce((sum, i) => sum + i.confidence, 0) / items.length 
    : 0
  const qualityScore = Math.round((matchedItems / Math.max(items.length, 1)) * 50 + (avgConfidence / 100) * 50)
  
  // Risk items (above or critical)
  const riskItems = items.filter(i => i.rating === "above" || i.rating === "critical").length
  
  // Potential savings (items above market)
  const potentialSavings = items.reduce((sum, i) => {
    if (i.variance && i.variance > 10 && i.referenceAvgPrice) {
      const saving = (i.price - i.referenceAvgPrice) * i.quantity
      return sum + Math.max(saving, 0)
    }
    return sum
  }, 0)
  
  // Category breakdown
  const categoryMap = new Map<string, { total: number; count: number; refTotal: number }>()
  for (const item of items) {
    const cat = item.category || "Sem categoria"
    const existing = categoryMap.get(cat) || { total: 0, count: 0, refTotal: 0 }
    existing.total += item.price * item.quantity
    existing.count += 1
    existing.refTotal += (item.referenceAvgPrice || 0) * item.quantity
    categoryMap.set(cat, existing)
  }
  
  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    total: data.total,
    count: data.count,
    variance: data.refTotal > 0 ? ((data.total - data.refTotal) / data.refTotal) * 100 : 0
  })).sort((a, b) => b.total - a.total)
  
  return {
    totalBudget,
    totalReference,
    overallVariance,
    qualityScore,
    riskItems,
    potentialSavings,
    categoryBreakdown
  }
}

// ============================================================================
// MAIN API ROUTE
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<AnalysisResponse | { error: string }>> {
  const startTime = Date.now()
  const debugInfo: string[] = []
  
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const materialsJson = formData.get("materials") as string
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    
    // AUTO-FETCH materials from database (primary) or use provided (fallback)
    let materials: MaterialRef[] = []
    
    debugInfo.push("Auto-fetching materials from database...")
    const dbMaterials = await fetchMaterialsFromDB()
    
    if (dbMaterials.length > 0) {
      materials = dbMaterials
      debugInfo.push(`Loaded ${dbMaterials.length} materials from database`)
    } else if (materialsJson) {
      try {
        materials = JSON.parse(materialsJson)
        debugInfo.push(`Using ${materials.length} provided materials (DB empty)`)
      } catch {
        debugInfo.push("Failed to parse materials JSON and DB is empty")
      }
    }
    
    const fileName = file.name.toLowerCase()
    debugInfo.push(`File: ${file.name}, Size: ${file.size} bytes`)
    
    const arrayBuffer = await file.arrayBuffer()
    let items: AnalyzedItem[] = []
    let text = ""
    
    // Handle Excel files
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      debugInfo.push("Processing Excel file...")
      const parsedItems = parseExcelFile(arrayBuffer, debugInfo)
      
      if (parsedItems.length > 0) {
        // Convert Excel to text for GPT unified analysis
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        text = workbook.SheetNames
          .map(name => XLSX.utils.sheet_to_csv(workbook.Sheets[name]))
          .join("\n\n")
        
        // Try world-class GPT analysis
        items = await analyzeWithGPT(text, materials, debugInfo)
        
        // Fallback to local matching if GPT fails
        if (items.length === 0) {
          items = matchLocally(parsedItems, materials, debugInfo)
        }
      }
    }
    // Handle PDF files
    else if (fileName.endsWith(".pdf")) {
      debugInfo.push("Processing PDF file...")
      try {
        const result = await extractText(arrayBuffer, { mergePages: true })
        text = result.text
        debugInfo.push(`PDF text extracted: ${text.length} chars`)
        
        // World-class GPT analysis
        items = await analyzeWithGPT(text, materials, debugInfo)
        
        // Fallback to regex + local matching
        if (items.length === 0) {
          const parsedItems = parseWithRegex(text, debugInfo)
          items = matchLocally(parsedItems, materials, debugInfo)
        }
      } catch (error) {
        debugInfo.push(`PDF extraction error: ${error instanceof Error ? error.message : "Unknown"}`)
      }
    }
    // Handle CSV/TXT files
    else if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
      debugInfo.push("Processing text file...")
      text = await file.text()
      
      // World-class GPT analysis
      items = await analyzeWithGPT(text, materials, debugInfo)
      
      // Fallback: structured delimited parser first, then regex (for unstructured text)
      if (items.length === 0) {
        let parsedItems = parseDelimitedFile(text, debugInfo)
        if (parsedItems.length === 0) {
          parsedItems = parseWithRegex(text, debugInfo)
        }
        items = matchLocally(parsedItems, materials, debugInfo)
      }
    }
    else {
      return NextResponse.json({ 
        error: "Unsupported file type. Please upload PDF, Excel (XLS/XLSX), or CSV files."
      }, { status: 400 })
    }
    
    // Filter and deduplicate
    items = items.filter(item => 
      item.name && 
      item.name.length > 5 && 
      item.quantity > 0 &&
      item.quantity < 1000000
    )
    
    const seen = new Set<string>()
    items = items.filter(item => {
      const key = `${item.name.toLowerCase().substring(0, 50)}-${(item.price || 0).toFixed(2)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    
    // Calculate comprehensive stats
    const stats = calculateStats(items)
    
    // Extract recommendations from debug
    let recommendations: string[] = []
    const recMatch = debugInfo.find(d => d.startsWith("RECOMMENDATIONS:"))
    if (recMatch) {
      try {
        recommendations = JSON.parse(recMatch.replace("RECOMMENDATIONS:", ""))
      } catch {
        // Ignore parse errors
      }
    }
    
    // Add default recommendations if none
    if (recommendations.length === 0) {
      if (stats.riskItems > 0) {
        recommendations.push(`Identificados ${stats.riskItems} itens com preços acima do mercado que merecem atenção especial.`)
      }
      if (stats.potentialSavings > 0) {
        recommendations.push(`Potencial de poupança estimado: €${stats.potentialSavings.toFixed(2)} através de negociação.`)
      }
      if (stats.qualityScore < 70) {
        recommendations.push("Recomendamos solicitar mais detalhes ao empreiteiro para melhor análise de alguns itens.")
      }
    }
    
    const matchedItems = items.filter(i => i.matchedMaterialId || i.confidence >= 60).length
    const avgConfidence = items.length > 0 
      ? items.reduce((sum, i) => sum + (i.confidence || 0), 0) / items.length 
      : 0
    
    const processingTimeMs = Date.now() - startTime
    debugInfo.push(`Total processing time: ${processingTimeMs}ms`)
    
    return NextResponse.json({
      success: true,
      items,
      stats: {
        totalItems: items.length,
        matchedItems,
        avgConfidence: Math.round(avgConfidence),
        processingTimeMs,
        totalBudget: stats.totalBudget,
        totalReference: stats.totalReference,
        overallVariance: stats.overallVariance,
        qualityScore: stats.qualityScore,
        riskItems: stats.riskItems,
        potentialSavings: stats.potentialSavings
      },
      recommendations,
      categoryBreakdown: stats.categoryBreakdown,
      debug: debugInfo
    })
    
  } catch (error) {
    debugInfo.push(`Fatal error: ${error instanceof Error ? error.message : "Unknown"}`)
    return NextResponse.json({
      success: false,
      items: [],
      stats: {
        totalItems: 0,
        matchedItems: 0,
        avgConfidence: 0,
        processingTimeMs: Date.now() - startTime,
        totalBudget: 0,
        totalReference: 0,
        overallVariance: 0,
        qualityScore: 0,
        riskItems: 0,
        potentialSavings: 0
      },
      recommendations: [],
      categoryBreakdown: [],
      debug: debugInfo
    }, { status: 500 })
  }
}
