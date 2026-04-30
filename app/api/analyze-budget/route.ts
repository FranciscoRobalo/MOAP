import { NextRequest, NextResponse } from "next/server"
import { extractText } from "unpdf"
import OpenAI from "openai"
import * as XLSX from "xlsx"

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
  matchedMaterialId: string | null
  matchedMaterialName: string | null
  confidence: number
  referenceMinPrice: number | null
  referenceMaxPrice: number | null
  referenceAvgPrice: number | null
  variance: number | null
  category: string
  matchReason: string
}

interface MaterialRef {
  id: string
  name: string
  unit: string
  price: number
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
  }
  debug?: string[]
}

// ============================================================================
// OPENAI CLIENT
// ============================================================================

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) return null
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
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
  }
  return unitMap[trimmed] || (trimmed.length <= 6 ? trimmed : "un")
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
          const q = typeof row[qtyCol] === "number" ? row[qtyCol] : parsePortugueseNumber(String(row[qtyCol]))
          if (q > 0 && q < 100000) quantity = q
        }
        if (priceCol >= 0 && row[priceCol] != null) {
          price = typeof row[priceCol] === "number" ? row[priceCol] : parsePortugueseNumber(String(row[priceCol]))
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
// UNIFIED GPT ANALYSIS - Parse + Match + Price in ONE call
// ============================================================================

async function analyzeWithGPT(
  text: string, 
  materials: MaterialRef[], 
  debugInfo: string[]
): Promise<AnalyzedItem[]> {
  const openai = getOpenAIClient()
  if (!openai) {
    debugInfo.push("OpenAI API key not configured")
    return []
  }
  
  debugInfo.push("Starting unified GPT analysis...")
  const startTime = Date.now()
  
  // Limit text to avoid token limits
  const maxChars = 15000
  const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text
  
  // Create compact material database reference
  const materialSummary = materials.slice(0, 150).map(m => 
    `${m.id}|${m.name}|${m.unit}|${m.price}-${m.priceMax || m.price}|${m.category}`
  ).join("\n")
  
  const systemPrompt = `Você é um sistema de análise de orçamentos de construção civil portuguesa de classe mundial.

SUA TAREFA (execute em uma única resposta):
1. EXTRAIR todos os itens do orçamento do texto fornecido
2. Para cada item, CORRESPONDER com a base de dados de materiais/serviços OU estimar preços de mercado
3. CALCULAR variação entre preço do orçamento e preço de referência

FORMATO DO TEXTO DE ORÇAMENTO:
- Itens podem estar em linhas separadas ou contínuos
- Artigos identificados por números como "0,01", "1,02", "2,01"
- Formato de preços português: "22 000,00" ou "1.234,56" = 22000 ou 1234.56 euros
- Unidades comuns: vg (verba global), m2, m3, ml, un, kg

REGRAS DE CORRESPONDÊNCIA:
- Faça correspondência SEMÂNTICA (entenda o significado, não apenas palavras)
- Sinónimos: "capoto" = "ETICS" = "isolamento térmico exterior"
- Unidades devem ser compatíveis
- Confiança mínima 60% para match válido
- Se não houver match, ESTIME preços de mercado Portugal 2024-2025

PREÇOS DE REFERÊNCIA PORTUGAL 2024-2025:
- Pintura interior: €8-15/m2
- Pintura exterior: €12-22/m2
- Betão C25/30 fundações: €90-140/m3
- Alvenaria tijolo: €40-75/m2
- ETICS/Cappotto: €55-100/m2
- Teto falso gesso: €28-50/m2
- Portas interiores: €250-600/un
- Caixilharia alumínio: €350-700/m2
- Impermeabilização: €22-45/m2
- Cerâmico pavimento: €30-60/m2
- Estaleiro: €5000-30000/vg
- Escavação: €10-25/m3
- Eletricidade: €40-80/m2
- Canalização: €30-60/m2
- Demolições: €15-40/m3

BASE DE DADOS DE MATERIAIS/SERVIÇOS:
${materialSummary}

RESPONDA COM JSON:
{
  "items": [
    {
      "name": "descrição original do item",
      "unit": "unidade (vg, m2, m3, ml, un, kg)",
      "quantity": número,
      "price": preço unitário do orçamento,
      "matchedMaterialId": "ID do material correspondente ou null",
      "matchedMaterialName": "nome do material correspondente ou null",
      "confidence": 0-100,
      "referenceMinPrice": preço mínimo de referência,
      "referenceMaxPrice": preço máximo de referência,
      "referenceAvgPrice": preço médio de referência,
      "category": "categoria do item",
      "matchReason": "breve explicação da correspondência/estimativa"
    }
  ]
}`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analise este orçamento de construção portuguesa e extraia todos os itens com correspondências e preços:\n\n${truncatedText}` }
      ],
      temperature: 0.1,
      max_tokens: 16000,
      response_format: { type: "json_object" },
    })

    const content = response.choices[0]?.message?.content || "{}"
    debugInfo.push(`GPT response received in ${Date.now() - startTime}ms`)
    
    // Parse JSON response
    let items: AnalyzedItem[] = []
    try {
      const parsed = JSON.parse(content)
      items = parsed.items || []
    } catch {
      debugInfo.push("JSON parse failed, trying extraction...")
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        items = parsed.items || []
      }
    }
    
    // Validate and calculate variance for each item
    items = items
      .filter((item: AnalyzedItem) => item && item.name && item.name.length > 5)
      .map((item: AnalyzedItem) => {
        const refAvg = item.referenceAvgPrice || 0
        const budgetPrice = item.price || 0
        let variance: number | null = null
        
        if (refAvg > 0 && budgetPrice > 0) {
          variance = ((budgetPrice - refAvg) / refAvg) * 100
        }
        
        return {
          ...item,
          name: String(item.name).trim(),
          unit: normalizeUnit(String(item.unit || "un")),
          quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
          price: typeof item.price === "number" ? item.price : 0,
          variance,
          confidence: item.confidence || 0,
          category: item.category || "Sem categoria",
          matchReason: item.matchReason || ""
        }
      })
    
    debugInfo.push(`Unified analysis extracted ${items.length} items in ${Date.now() - startTime}ms`)
    return items
    
  } catch (error) {
    debugInfo.push(`GPT error: ${error instanceof Error ? error.message : "Unknown"}`)
    return []
  }
}

// ============================================================================
// REGEX FALLBACK PARSER (when GPT fails)
// ============================================================================

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
    const refMax = bestMatch?.priceMax || refAvg
    const variance = refAvg && item.price > 0 ? ((item.price - refAvg) / refAvg) * 100 : null
    
    return {
      ...item,
      matchedMaterialId: confidence >= 60 ? bestMatch?.id || null : null,
      matchedMaterialName: confidence >= 60 ? bestMatch?.name || null : null,
      confidence,
      referenceMinPrice: refAvg,
      referenceMaxPrice: refMax,
      referenceAvgPrice: refAvg,
      variance,
      category: bestMatch?.category || "Sem categoria",
      matchReason: confidence >= 60 ? "Correspondência local por palavras-chave" : "Sem correspondência adequada"
    }
  })
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
    
    let materials: MaterialRef[] = []
    if (materialsJson) {
      try {
        materials = JSON.parse(materialsJson)
      } catch {
        debugInfo.push("Failed to parse materials JSON")
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
        
        // Try unified GPT analysis
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
        
        // Unified GPT analysis
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
      
      // Unified GPT analysis
      items = await analyzeWithGPT(text, materials, debugInfo)
      
      // Fallback to regex + local matching
      if (items.length === 0) {
        const parsedItems = parseWithRegex(text, debugInfo)
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
    
    // Calculate stats
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
        processingTimeMs
      },
      debug: debugInfo
    })
    
  } catch (error) {
    debugInfo.push(`Fatal error: ${error instanceof Error ? error.message : "Unknown"}`)
    return NextResponse.json({ 
      error: "Failed to analyze budget"
    }, { status: 500 })
  }
}
