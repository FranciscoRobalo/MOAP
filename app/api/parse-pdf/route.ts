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
  // Portuguese format uses comma as decimal separator
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

// Check if line should be skipped
function shouldSkipLine(line: string): boolean {
  const skipPatterns = [
    /^(Nº\s*Artigo|Art\.?º?\s*$|Item\s*$|Descrição\s*$|Designação\s*$)/i,
    /^(Un\.?\s*$|Unidade\s*$|Quant\.?\s*$|Quantidade\s*$)/i,
    /^(Preço\s*(unitário|total)?|Valor\s*(unitário|total)?)\s*$/i,
    /^(Subtotal|IVA|Observ|Nota\s*:|Total\s*Geral)/i,
    /^(Empresa:|A\/C:|Telefone:|Ref\.?ª?\/?\s*$|Obra:|ORÇAMENTO)/i,
    /^(De:|Data:|Cliente:|Contacto|Condições|Garantia)/i,
    /^(PLANILHA|TERMOS|ACRESCE|Capital|Alvará|NIF|NIPC|www\.|@)/i,
    /^(Página|Page|\d+\s*de\s*\d+|\.xlsx|Notas:)/i,
    /^U\.\s*M\.\s*$/i,
    /^PROPOSTA/i,
    /FRANCISCO SACRAMENTO/i,
    /IMPIC/i,
  ]
  return skipPatterns.some(p => p.test(line))
}

// Check if line is a section header
function isSectionHeader(line: string): boolean {
  // Numbered section like "1.0    ESTALEIRO" or "2    DEMOLIÇÕES"
  if (/^\d+\.?\d*\s{2,}[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+$/.test(line)) return true
  // All caps section like "AESTRUTURA" or "PAREDES"
  if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{3,30}$/.test(line) && !line.includes(",")) return true
  // Section number alone
  if (/^\d+$/.test(line)) return true
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

// STRATEGY 1: OR_MORADIA_COBRE format
// Pattern: "description\nun1.006228.006228.00" or "m2207.2524.915163.01"
// Format: unit + qty (decimals with dots) + unitPrice (decimals with dots) + totalPrice
function parseORAMoradiaFormat(line: string, description: string): ParsedItem | null {
  // Match: unit followed by numbers with dots as decimals (NOT thousand separators)
  // Examples: "un1.006228.006228.00", "m2207.2524.915163.01", "vg1.002615.762615.76"
  const match = line.match(/^(un|vg|vb|m2|m²|m3|m³|ml|kg|pc|m|l)(\d+\.\d+)(\d+\.\d+)(\d+\.\d+)$/i)
  
  if (match && description) {
    const unit = normalizeUnit(match[1])
    const quantity = parseFloat(match[2])
    const unitPrice = parseFloat(match[3])
    
    if (unitPrice > 0 && quantity > 0) {
      return {
        name: description.trim(),
        unit,
        quantity,
        price: unitPrice
      }
    }
  }
  return null
}

// STRATEGY 2: Z_0010-25 format with € symbols
// Pattern: "v.g.1,000,00 €" or "m.l.18,50100,00 €1 850,00 €" or "m235,2030,00 €1 056,00 €"
function parseZFormat(line: string, description: string): ParsedItem | null {
  // Match unit at start, followed by quantity and prices with €
  const unitMatch = line.match(/^(v\.?g\.?|vb|m\.?l\.?|m2|m²|m3|m³|un\.?d?|unid|kg|pc|pç|m|l)/i)
  if (!unitMatch) return null
  
  const unit = normalizeUnit(unitMatch[1])
  const afterUnit = line.substring(unitMatch[0].length)
  
  // Find all numbers that could be qty or prices
  // Portuguese format: "1,00" for 1.00, "22 000,00" for 22000.00
  const euroMatches = [...afterUnit.matchAll(/([\d\s]+[,]\d{2})\s*€/g)]
  
  if (euroMatches.length >= 1 && description) {
    // First number before € is usually unit price, or could be qty then price
    const firstPrice = parsePortugueseNumber(euroMatches[0][1])
    
    // Try to find quantity (number before the prices)
    const qtyMatch = afterUnit.match(/^(\d+[,]?\d*)/)
    let quantity = 1
    if (qtyMatch) {
      const qtyStr = qtyMatch[1]
      // Check if this looks like a quantity (small number) vs part of a price
      const potentialQty = parsePortugueseNumber(qtyStr)
      if (potentialQty > 0 && potentialQty < 10000) {
        quantity = potentialQty
      }
    }
    
    if (firstPrice > 0) {
      return {
        name: description.trim(),
        unit,
        quantity,
        price: firstPrice
      }
    }
  }
  return null
}

// STRATEGY 3: Sub-item format like "Betãom338,58200,00 €7 716,00 €"
// These are component items (Betão, Ferro, Cofragem) with their own unit/qty/price
function parseSubItemFormat(line: string): ParsedItem | null {
  // Match: MaterialName + unit + qty + prices
  const match = line.match(/^(Betão|Ferro|Cofragem|Aço)(m3|m²|m2|kg|m)(\d+[,.]?\d*)([\d\s,]+€[\d\s,]+€)/i)
  
  if (match) {
    const name = match[1]
    const unit = normalizeUnit(match[2])
    const quantity = parsePortugueseNumber(match[3])
    const pricesStr = match[4]
    
    // Extract first price (unit price)
    const priceMatch = pricesStr.match(/([\d\s,]+)€/)
    if (priceMatch) {
      const unitPrice = parsePortugueseNumber(priceMatch[1])
      if (unitPrice > 0) {
        return {
          name,
          unit,
          quantity: quantity > 0 ? quantity : 1,
          price: unitPrice
        }
      }
    }
  }
  return null
}

// STRATEGY 4: LPU_Travessa format - unit+qty only (no prices)
// Pattern: "vg1,00" at the end of data
// These files don't have prices in the text extraction!
function parseLPUFormat(line: string, description: string): ParsedItem | null {
  // Match simple unit+qty pattern like "vg1,00" or "m215,50"
  const match = line.match(/^(v\.?g\.?|vb|m\.?l\.?|m2|m²|m3|m³|un\.?|unid\.?|kg|pc|pç|m|l)(\d+[,.]?\d*)$/i)
  
  if (match && description) {
    const unit = normalizeUnit(match[1])
    const quantity = parsePortugueseNumber(match[2])
    
    // No price available in this format - set to 0 so it can still be imported
    return {
      name: description.trim(),
      unit,
      quantity: quantity > 0 ? quantity : 1,
      price: 0 // Price not available in this format
    }
  }
  return null
}

// STRATEGY 5: Mapa de Quantidades / GEO4MODULO format with tabs/spaces
function parseTabularFormat(line: string): ParsedItem | null {
  // Split by tabs or multiple spaces
  const parts = line.split(/\t+|\s{3,}/).filter(p => p.trim().length > 0)
  
  if (parts.length >= 4) {
    // Try to identify: description, unit, quantity, price
    let desc = "", unit = "un", qty = 1, price = 0
    
    for (const part of parts) {
      const trimmed = part.trim()
      
      // Check if it's a unit
      if (/^(vg|vb|ml|m2|m²|m3|m³|un|und|unid|kg|pc|pç|m|l|mes)$/i.test(trimmed)) {
        unit = normalizeUnit(trimmed)
      }
      // Check if it's a price (has € or looks like money)
      else if (/€/.test(trimmed) || /^\d[\d\s]*[,]\d{2}$/.test(trimmed)) {
        const p = parsePortugueseNumber(trimmed)
        if (p > 0 && price === 0) price = p
      }
      // Check if it's a small number (quantity)
      else if (/^\d+[,.]?\d*$/.test(trimmed)) {
        const n = parsePortugueseNumber(trimmed)
        if (n > 0 && n < 10000) qty = n
      }
      // Otherwise it might be description
      else if (trimmed.length > 10 && !/^\d/.test(trimmed)) {
        desc = trimmed
      }
    }
    
    if (desc && price > 0) {
      return { name: desc, unit, quantity: qty, price }
    }
  }
  return null
}

// STRATEGY 6: Inline price pattern
// Match lines like: "Execução de paredes... m2 200.00 29.89 5978.88"
function parseInlineFormat(line: string): ParsedItem | null {
  // Look for description followed by unit, qty, and prices
  const match = line.match(/^(.{20,}?)\s+(vg|vb|ml|m2|m²|m3|m³|un|und|kg|pc|m|l)\s+(\d+[,.]?\d*)\s+([\d,.\s]+)\s+([\d,.\s]+)$/i)
  
  if (match) {
    const desc = match[1].trim()
    const unit = normalizeUnit(match[2])
    const qty = parsePortugueseNumber(match[3])
    const unitPrice = parsePortugueseNumber(match[4])
    
    if (desc.length > 10 && unitPrice > 0) {
      return {
        name: desc,
        unit,
        quantity: qty > 0 ? qty : 1,
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
  const lines = text.split(/[\r\n]+/)
  
  let currentDescription = ""
  let linesSinceDescription = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty or very short lines
    if (line.length < 2) {
      linesSinceDescription++
      continue
    }
    
    // Skip headers/footers
    if (shouldSkipLine(line)) {
      continue
    }
    
    // Skip section headers but reset description
    if (isSectionHeader(line)) {
      currentDescription = ""
      continue
    }
    
    // Skip lines that are just totals (number + €)
    if (/^[\d\s.,]+\s*€\s*$/.test(line) && line.length < 25) continue
    if (/^\d+[,.]?\d*\s*$/.test(line) && line.length < 10) continue
    
    // Try all parsing strategies
    let item: ParsedItem | null = null
    
    // Strategy 1: OR_MORADIA format (un1.006228.006228.00)
    item = parseORAMoradiaFormat(line, currentDescription)
    if (item && item.price > 0) {
      items.push(item)
      currentDescription = ""
      linesSinceDescription = 0
      continue
    }
    
    // Strategy 2: Z format with € (v.g.1,0022 000,00 €)
    item = parseZFormat(line, currentDescription)
    if (item && item.price > 0) {
      items.push(item)
      currentDescription = ""
      linesSinceDescription = 0
      continue
    }
    
    // Strategy 3: Sub-item format (Betãom338,58200,00 €)
    item = parseSubItemFormat(line)
    if (item && item.price > 0) {
      items.push(item)
      continue
    }
    
    // Strategy 4: Tabular format
    item = parseTabularFormat(line)
    if (item && item.price > 0) {
      items.push(item)
      currentDescription = ""
      linesSinceDescription = 0
      continue
    }
    
    // Strategy 5: Inline format
    item = parseInlineFormat(line)
    if (item && item.price > 0) {
      items.push(item)
      currentDescription = ""
      linesSinceDescription = 0
      continue
    }
    
    // Strategy 6: LPU format (no prices, just unit+qty)
    item = parseLPUFormat(line, currentDescription)
    if (item) {
      // Only add if we have no other items with prices, or this has a price
      if (item.price > 0 || items.length === 0) {
        items.push(item)
      }
      currentDescription = ""
      linesSinceDescription = 0
      continue
    }
    
    // If no pattern matched, this might be a description line
    // Clean article numbers from start
    let cleanLine = line
      .replace(/^[\d]+[,.]?[\d]*\s*/, "") // Remove "0,01", "1.2", "2.1" etc
      .replace(/^[\d]+\s+/, "") // Remove "1 ", "2 " etc
      .trim()
    
    // Skip if too short or just numbers/punctuation
    if (cleanLine.length < 5) continue
    if (/^[\d.,\s€\-–—:;()\[\]]+$/.test(cleanLine)) continue
    
    // Reset description if too many lines passed
    if (linesSinceDescription > 10) {
      currentDescription = ""
    }
    
    // Accumulate description
    if (currentDescription && linesSinceDescription < 5) {
      // Check if continuation or new description
      const startsLower = /^[a-záéíóúâêôãõç]/.test(cleanLine)
      if (startsLower) {
        currentDescription += " " + cleanLine
      } else {
        currentDescription = cleanLine
      }
    } else {
      currentDescription = cleanLine
    }
    linesSinceDescription = 0
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
    
    // Read file as ArrayBuffer and extract text using unpdf
    const arrayBuffer = await file.arrayBuffer()
    const { text } = await extractText(arrayBuffer, { mergePages: true })
    
    // Parse the text
    let items = parseBudgetText(text)
    
    // Filter out items with invalid data
    items = items.filter(item => 
      item.name && 
      item.name.length > 3 && 
      item.quantity > 0 &&
      item.quantity < 1000000
    )
    
    // Remove duplicates
    const seen = new Set<string>()
    items = items.filter(item => {
      const key = `${item.name.toLowerCase().substring(0, 50)}-${item.price.toFixed(2)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    
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
      message: error instanceof Error ? error.message : "Unknown error",
      items: []
    }, { status: 500 })
  }
}
