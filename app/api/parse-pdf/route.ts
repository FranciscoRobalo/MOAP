import { NextRequest, NextResponse } from "next/server"
import { extractText } from "unpdf"

// ============================================================================
// UTILITIES
// ============================================================================

// Parse Portuguese number format: "1 234,56" or "1.234,56" or "1234,56" -> 1234.56
function parsePortugueseNumber(str: string): number {
  if (!str) return 0
  let cleaned = str.replace(/€/g, "").trim()
  cleaned = cleaned.replace(/\s+/g, "")
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".")
  }
  const num = Number.parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

// Normalize unit strings to standard format
function normalizeUnit(unit: string): string {
  if (!unit) return "un"
  const trimmed = unit.trim().toLowerCase().replace(/\./g, "")
  
  const unitMap: Record<string, string> = {
    "vg": "vg", "vglobal": "vg", "vb": "vg",
    "ml": "ml", "metro linear": "ml",
    "m2": "m2", "m²": "m2", "metro quadrado": "m2",
    "m3": "m3", "m³": "m3", "metro cubico": "m3",
    "un": "un", "und": "un", "unid": "un", "unidade": "un", 
    "pç": "un", "pc": "un", "peça": "un",
    "kg": "kg", "quilo": "kg",
    "m": "m", "metro": "m",
    "l": "l", "lt": "l", "litro": "l",
    "cx": "cx", "caixa": "cx",
    "cj": "cj", "conj": "cj", "conjunto": "cj",
    "degrau": "degrau",
    "mes": "mes", "mês": "mes",
  }
  
  return unitMap[trimmed] || (trimmed.length <= 6 ? trimmed : "un")
}

// Unit regex pattern for matching units at start of line
const UNIT_PATTERN = /^(v\.?g\.?|vb|m\.?l\.?|m2|m²|m3|m³|un\.?d?\.?|unid\.?|kg|pc|pç|degrau|mes|mês|m|l|lt)/i

// Check if a string is a valid unit
function isUnit(str: string): boolean {
  if (!str) return false
  const normalized = str.trim().toLowerCase().replace(/\./g, "")
  return /^(vg|vb|ml|m2|m²|m3|m³|un|und|unid|kg|pc|pç|l|lt|cx|cj|degrau|m|mes|mês)$/i.test(normalized)
}

// Skip patterns - headers, footers, metadata that should be ignored
const SKIP_PATTERNS = [
  /^(Nº\s*Artigo|Art\.?º?\s*$|Item\s*$|Descrição\s*$|Designação\s*$|Especificação\s*$)/i,
  /^(Un\.?d?\.?\s*$|Unidade\s*$|Quant\.?\s*$|Quantidade\s*$)/i,
  /^(Preço|Valor|Total\s*$|Subtotal|IVA|Observ|Nota\s*:)/i,
  /^(Empresa:|A\/C:|Telefone:|Ref\.?ª?|Obra:|ORÇAMENTO|Contacto)/i,
  /^(De:|Data:|Cliente:|Condições|Garantia|Assinatura)/i,
  /^(PLANILHA|TERMOS|ACRESCE|Capital|Alvará|NIF|NIPC|www\.|@)/i,
  /^(REVIVE|Valor\s*da\s*Proposta|RESUMO|LOCAL:|PRAZO|EXECUÇÃO)/i,
  /^(Aos\s*valores|meses?\s*$|Página|Page)/i,
  /^(ARQUITECTURA|FUNDAÇÕES|ELETRICIDADE|ÁGUAS|AQUECIMENTO)\s*$/i,
]

function shouldSkipLine(line: string): boolean {
  return SKIP_PATTERNS.some(pattern => pattern.test(line))
}

// Check if line is a section header (e.g., "1PAREDES", "ITEM 1 Estaleiro")
function isSectionHeader(line: string): boolean {
  // All caps section names
  if (/^(\d+\.?\d*\s*)?[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{4,}$/.test(line.trim())) return true
  // ITEM X pattern
  if (/^ITEM\s*\d+/i.test(line.trim())) return true
  // Numbered section with title
  if (/^\d+\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+$/.test(line.trim())) return true
  return false
}

// ============================================================================
// PARSING STRATEGIES
// ============================================================================

interface ParsedItem {
  name: string
  unit: string
  quantity: number
  price: number
}

// Strategy 1: Parse lines with embedded unit+qty at the START
// Handles: "vg1,00", "m216970,7311954,02", "m.l.18,50100,00 €1 850,00 €"
function parseEmbeddedDataLine(line: string, description: string): ParsedItem | null {
  const match = line.match(UNIT_PATTERN)
  if (!match) return null
  
  const unit = normalizeUnit(match[1])
  const afterUnit = line.substring(match[0].length)
  
  // Try to extract quantity (first number after unit)
  const qtyMatch = afterUnit.match(/^(\d+[.,]?\d*)/)
  if (!qtyMatch) return null
  
  const quantity = parsePortugueseNumber(qtyMatch[1])
  if (quantity <= 0 || quantity > 1000000) return null
  
  // Extract prices (numbers with 2 decimal places, optionally with €)
  const priceMatches = line.match(/([\d\s]+[.,]\d{2})\s*€?/g)
  if (!priceMatches || priceMatches.length === 0) return null
  
  // First price is usually unit price
  const unitPrice = parsePortugueseNumber(priceMatches[0])
  
  if (description && unitPrice > 0) {
    return {
      name: description.trim(),
      unit,
      quantity,
      price: unitPrice
    }
  }
  
  return null
}

// Strategy 2: Parse tabular data with clear separators (tabs, multiple spaces, semicolons)
function parseTabularLine(line: string, description: string): ParsedItem | null {
  // Split by tabs, semicolons, or 2+ spaces
  const cols = line.split(/\t+|;+|\s{2,}/).map(c => c.trim()).filter(c => c.length > 0)
  
  if (cols.length < 2) return null
  
  // Try to identify columns
  let unitCol = -1, qtyCol = -1, priceCol = -1, descCol = -1
  
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i]
    
    if (isUnit(col) && unitCol === -1) {
      unitCol = i
    } else if (/€/.test(col) || /^\d[\d\s]*[.,]\d{2}$/.test(col)) {
      // Price column
      if (priceCol === -1) priceCol = i
    } else if (/^\d+[.,]?\d*$/.test(col) && col.length < 10 && qtyCol === -1) {
      // Quantity column
      qtyCol = i
    } else if (col.length > 10 && !/^[\d.,€\s]+$/.test(col) && descCol === -1) {
      // Description column
      descCol = i
    }
  }
  
  // Need at least a price
  if (priceCol === -1) return null
  
  const price = parsePortugueseNumber(cols[priceCol])
  if (price <= 0) return null
  
  const unit = unitCol >= 0 ? normalizeUnit(cols[unitCol]) : "un"
  const quantity = qtyCol >= 0 ? parsePortugueseNumber(cols[qtyCol]) : 1
  const desc = descCol >= 0 ? cols[descCol] : description
  
  if (desc && desc.length > 3) {
    return {
      name: desc.trim(),
      unit,
      quantity: quantity > 0 && quantity < 1000000 ? quantity : 1,
      price
    }
  }
  
  return null
}

// Strategy 3: Parse lines with standalone price patterns
// Handles lines like: "1,00vg  €  2.200,00  €  2.200,00"
function parsePricePatternLine(line: string, description: string): ParsedItem | null {
  // Must have € symbol or clear price pattern
  const priceMatches = line.match(/([\d\s]+[.,]\d{2})\s*€/g)
  if (!priceMatches || priceMatches.length === 0) return null
  
  // Look for unit anywhere in the line
  const unitMatch = line.match(/\b(v\.?g\.?|vb|m\.?l\.?|m2|m²|m3|m³|un\.?d?|unid\.?|kg|pc|pç|degrau|mes|mês|m|l)\b/i)
  const unit = unitMatch ? normalizeUnit(unitMatch[1]) : "un"
  
  // Look for quantity (number before the unit or at start)
  let quantity = 1
  if (unitMatch) {
    const beforeUnit = line.substring(0, unitMatch.index)
    const qtyMatch = beforeUnit.match(/(\d+[.,]?\d*)\s*$/)
    if (qtyMatch) {
      quantity = parsePortugueseNumber(qtyMatch[1])
    }
  }
  
  const prices = priceMatches.map(p => parsePortugueseNumber(p))
  const unitPrice = prices[0]
  
  if (description && unitPrice > 0) {
    return {
      name: description.trim(),
      unit,
      quantity: quantity > 0 && quantity < 1000000 ? quantity : 1,
      price: unitPrice
    }
  }
  
  return null
}

// Strategy 4: Parse Mapa de Quantidades format (ITEM | Descrição | Unidade | Quantidade | Valor Unit. | Valor Total)
function parseMapaQuantidadesLine(line: string): ParsedItem | null {
  // Pattern: description followed by unit, qty, prices with €
  const match = line.match(/^(.{15,}?)\s+(vg|un|m2|m²|m3|m³|ml|kg|mes|mês|m|l)\s+(\d+)\s+([\d\s.,]+)\s*€\s*([\d\s.,]+)\s*€/i)
  
  if (match) {
    const name = match[1].trim()
    const unit = normalizeUnit(match[2])
    const quantity = parsePortugueseNumber(match[3])
    const unitPrice = parsePortugueseNumber(match[4])
    
    if (name.length > 5 && unitPrice > 0) {
      return {
        name,
        unit,
        quantity: quantity > 0 ? quantity : 1,
        price: unitPrice
      }
    }
  }
  
  return null
}

// Strategy 5: Parse GEO4MODULO format (Quant. | Und. | Preço Unitário | Total)
function parseGeoModuloLine(line: string, description: string): ParsedItem | null {
  // Pattern: quantity, unit, unit price €, total €
  const match = line.match(/^(\d+[.,]?\d*)\s*(vg|vb|un|und|m2|m²|m3|m³|ml|kg|l)\s*€?\s*([\d\s.,]+)\s*€?\s*([\d\s.,]+)?\s*€?/i)
  
  if (match && description) {
    const quantity = parsePortugueseNumber(match[1])
    const unit = normalizeUnit(match[2])
    const unitPrice = parsePortugueseNumber(match[3])
    
    if (unitPrice > 0) {
      return {
        name: description.trim(),
        unit,
        quantity: quantity > 0 ? quantity : 1,
        price: unitPrice
      }
    }
  }
  
  return null
}

// ============================================================================
// MAIN PARSER
// ============================================================================

function parseBudgetText(text: string): ParsedItem[] {
  const items: ParsedItem[] = []
  
  // Normalize line endings
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const lines = normalizedText.split("\n")
  
  let currentDescription = ""
  let lastItemLine = -1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty lines
    if (line.length < 2) continue
    
    // Skip headers/footers
    if (shouldSkipLine(line)) {
      currentDescription = ""
      continue
    }
    
    // Skip section headers but don't clear description
    if (isSectionHeader(line)) {
      currentDescription = ""
      continue
    }
    
    // Skip pure total lines (just numbers with €)
    if (/^[\d\s.,]+\s*€$/.test(line) && line.length < 30) continue
    
    // Skip pure section numbers
    if (/^\d+([.,]\d+)?$/.test(line) && line.length < 8) continue
    
    // Try all parsing strategies in order of specificity
    
    // Strategy 1: Mapa de Quantidades format (full line with all data)
    let item = parseMapaQuantidadesLine(line)
    if (item) {
      items.push(item)
      currentDescription = ""
      lastItemLine = i
      continue
    }
    
    // Strategy 2: GEO4MODULO format
    item = parseGeoModuloLine(line, currentDescription)
    if (item) {
      items.push(item)
      currentDescription = ""
      lastItemLine = i
      continue
    }
    
    // Strategy 3: Embedded data at start of line (vg1,00...)
    item = parseEmbeddedDataLine(line, currentDescription)
    if (item) {
      items.push(item)
      currentDescription = ""
      lastItemLine = i
      continue
    }
    
    // Strategy 4: Tabular format with separators
    item = parseTabularLine(line, currentDescription)
    if (item) {
      items.push(item)
      currentDescription = ""
      lastItemLine = i
      continue
    }
    
    // Strategy 5: Price pattern line
    item = parsePricePatternLine(line, currentDescription)
    if (item) {
      items.push(item)
      currentDescription = ""
      lastItemLine = i
      continue
    }
    
    // If none of the strategies worked, this might be a description line
    // Clean the line
    let cleanLine = line
      // Remove leading article numbers (e.g., "0,01", "1.2.3", "2.1")
      .replace(/^[\d]+([.,]\d+)*\s*/, "")
      // Remove trailing prices if no description found
      .replace(/([\d\s]+[.,]\d{2})\s*€?\s*$/g, "")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .trim()
    
    // Skip if too short or just numbers/punctuation
    if (cleanLine.length < 3) continue
    if (/^[\d.,\s€\-–—:;()\[\]]+$/.test(cleanLine)) continue
    
    // Accumulate description
    if (currentDescription) {
      // Check if this is a new description or continuation
      const startsWithLower = /^[a-záéíóúâêôãõç]/.test(cleanLine)
      const endsWithPunct = /[.,:;-]$/.test(currentDescription)
      
      if (startsWithLower || endsWithPunct || (i - lastItemLine <= 3)) {
        // Continuation of previous description
        currentDescription += " " + cleanLine
      } else {
        // New description - the previous one might not have had data
        currentDescription = cleanLine
      }
    } else {
      currentDescription = cleanLine
    }
  }
  
  return items
}

// ============================================================================
// ALTERNATIVE PARSER FOR SPECIFIC FORMATS
// ============================================================================

// This parser handles the OR_MORADIA_COBRE and similar formats
// where data comes in separate columns on the same line
function parseAlternativeFormat(text: string): ParsedItem[] {
  const items: ParsedItem[] = []
  const lines = text.split(/[\n\r]+/)
  
  let currentDescription = ""
  
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line.length < 5) continue
    if (shouldSkipLine(line)) continue
    
    // Check for pattern: description ... unit ... quantity ... prices
    // Example: "Betãom338,58200,00 €7 716,00 €"
    const compactMatch = line.match(/^([A-Za-záéíóúâêôãõçÀ-Ú][^€]{5,}?)(v\.?g\.?|vb|m\.?l\.?|m2|m²|m3|m³|un\.?d?|kg|pc|l|m)(\d+[.,]?\d*)([\d\s.,]+)€([\d\s.,]+)€/i)
    
    if (compactMatch) {
      const name = compactMatch[1].trim()
      const unit = normalizeUnit(compactMatch[2])
      const quantity = parsePortugueseNumber(compactMatch[3])
      const unitPrice = parsePortugueseNumber(compactMatch[4])
      
      if (name.length > 3 && unitPrice > 0) {
        items.push({
          name,
          unit,
          quantity: quantity > 0 ? quantity : 1,
          price: unitPrice
        })
        currentDescription = ""
        continue
      }
    }
    
    // Check for sub-item pattern (e.g., "Sapatas", "Vigas de Fundação" followed by data)
    const subItemMatch = line.match(/^([A-Za-záéíóúâêôãõçÀ-Ú][A-Za-záéíóúâêôãõçÀ-Ú\s]{3,30}?)(m2|m3|m²|m³|kg|un|ml|vg)\s*(\d+[.,]?\d*)\s*([\d\s.,]+)€?([\d\s.,]+)?€?/i)
    
    if (subItemMatch) {
      const name = (currentDescription ? currentDescription + " - " : "") + subItemMatch[1].trim()
      const unit = normalizeUnit(subItemMatch[2])
      const quantity = parsePortugueseNumber(subItemMatch[3])
      const unitPrice = parsePortugueseNumber(subItemMatch[4])
      
      if (unitPrice > 0) {
        items.push({
          name,
          unit,
          quantity: quantity > 0 ? quantity : 1,
          price: unitPrice
        })
        continue
      }
    }
    
    // Accumulate description for multi-line items
    if (!/€/.test(line) && !/^\d+[.,]?\d*$/.test(line)) {
      const cleanLine = line.replace(/^\d+([.,]\d+)*\s*/, "").trim()
      if (cleanLine.length > 5 && !/^[\d.,\s]+$/.test(cleanLine)) {
        currentDescription = cleanLine
      }
    }
  }
  
  return items
}

// ============================================================================
// API ROUTE
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    
    console.log("[v0] PDF Parser: Processing file:", file.name, "Size:", file.size)
    
    // Read file as ArrayBuffer and extract text using unpdf
    const arrayBuffer = await file.arrayBuffer()
    const { text } = await extractText(arrayBuffer, { mergePages: true })
    
    console.log("[v0] PDF Parser: Extracted text length:", text.length)
    
    // Try main parser first
    let items = parseBudgetText(text)
    
    console.log("[v0] PDF Parser: Main parser found", items.length, "items")
    
    // If main parser found few items, try alternative parser
    if (items.length < 5) {
      const altItems = parseAlternativeFormat(text)
      console.log("[v0] PDF Parser: Alternative parser found", altItems.length, "items")
      
      // Use whichever found more items
      if (altItems.length > items.length) {
        items = altItems
      }
    }
    
    // Filter out items with invalid data
    items = items.filter(item => 
      item.name && 
      item.name.length > 3 && 
      item.price > 0 &&
      item.quantity > 0 &&
      item.quantity < 1000000
    )
    
    // Remove duplicates
    const seen = new Set<string>()
    items = items.filter(item => {
      const key = `${item.name.toLowerCase().substring(0, 50)}-${item.price}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    
    console.log("[v0] PDF Parser: Final item count:", items.length)
    
    return NextResponse.json({ 
      success: true, 
      items,
      textLength: text.length,
      linesCount: text.split("\n").length,
      fileName: file.name
    })
  } catch (error) {
    console.error("[v0] PDF parsing error:", error)
    return NextResponse.json({ 
      error: "Failed to parse PDF", 
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
