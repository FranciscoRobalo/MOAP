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

// ============================================================================
// PARSED ITEM INTERFACE
// ============================================================================

interface ParsedItem {
  name: string
  unit: string
  quantity: number
  price: number
}

// ============================================================================
// CONTINUOUS TEXT PARSER - Handles PDF text without line breaks
// ============================================================================

function parseContinuousText(text: string, debugInfo: string[] = []): ParsedItem[] {
  const items: ParsedItem[] = []
  
  // Split by article numbers like "0,01", "0,02", "1,01", "1.01", "2.1" etc.
  // These mark the beginning of each item in Portuguese budgets
  // Pattern: number followed by comma/period and 1-2 digits, then space
  const articlePattern = /(\d+[,.]\d{1,2})\s+/g
  
  // First, find all € prices with their positions to understand the structure
  const euroPattern = /([\d\s,.]+)\s*€/g
  const euroMatches: { value: number; index: number; fullMatch: string }[] = []
  let euroMatch
  while ((euroMatch = euroPattern.exec(text)) !== null) {
    const value = parsePortugueseNumber(euroMatch[1])
    if (value >= 0) {
      euroMatches.push({ value, index: euroMatch.index, fullMatch: euroMatch[0] })
    }
  }
  debugInfo.push(`Found ${euroMatches.length} € values in text`)
  
  // Find all unit patterns with their positions
  const unitPattern = /\b(v\.?g\.?|vb|m\.?l\.?|m2|m²|m3|m³|un\.?|und\.?|unid\.?|kg|pc|pç|degrau|mes|mês)\s*(\d+[,.]\d*)/gi
  const unitMatches: { unit: string; qty: number; index: number; length: number }[] = []
  let unitMatch
  while ((unitMatch = unitPattern.exec(text)) !== null) {
    unitMatches.push({
      unit: normalizeUnit(unitMatch[1]),
      qty: parsePortugueseNumber(unitMatch[2]),
      index: unitMatch.index,
      length: unitMatch[0].length
    })
  }
  debugInfo.push(`Found ${unitMatches.length} unit+qty patterns`)
  
  // For each unit match, find the description before it and prices after it
  for (let i = 0; i < unitMatches.length; i++) {
    const um = unitMatches[i]
    
    // Find description: text between previous item's end and this unit
    const prevEnd = i > 0 ? unitMatches[i - 1].index + unitMatches[i - 1].length : 0
    let descStart = prevEnd
    
    // Look for article number to find start of this item's description
    const textBefore = text.substring(prevEnd, um.index)
    const articleMatch = textBefore.match(/(\d+[,.]\d{1,2})\s+([^€]+)$/)
    if (articleMatch) {
      descStart = prevEnd + (textBefore.lastIndexOf(articleMatch[0]))
    }
    
    // Extract description
    let description = text.substring(descStart, um.index).trim()
    
    // Clean description
    description = description
      .replace(/^\d+[,.]\d{1,2}\s*/, "") // Remove article number at start
      .replace(/^\d+\s+/, "") // Remove section number
      .replace(/[\d\s,.]+€[\d\s,.€]*$/, "") // Remove trailing prices
      .replace(/\s+/g, " ")
      .trim()
    
    // Skip if description is too short or looks like header
    if (description.length < 10) continue
    if (/^(Nº|Artigo|Designação|Preço|Total|Empresa|Obra)/i.test(description)) continue
    
    // Find prices after this unit - look for € values
    const afterUnitText = text.substring(um.index + um.length, um.index + um.length + 100)
    const priceMatches = [...afterUnitText.matchAll(/([\d\s,.]+)\s*€/g)]
    
    let unitPrice = 0
    if (priceMatches.length >= 1) {
      // First price is usually unit price
      unitPrice = parsePortugueseNumber(priceMatches[0][1])
    }
    
    if (unitPrice > 0 && description) {
      items.push({
        name: description,
        unit: um.unit,
        quantity: um.qty > 0 && um.qty < 100000 ? um.qty : 1,
        price: unitPrice
      })
    }
  }
  
  // If no items found with unit patterns, try alternative approach
  // Split text by € and work backwards to find items
  if (items.length === 0) {
    debugInfo.push("Trying alternative € split approach...")
    
    const parts = text.split(/€/)
    let currentDesc = ""
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      
      // Find the price at the end of this part
      const priceMatch = part.match(/([\d\s,.]+)$/)
      if (!priceMatch) continue
      
      const price = parsePortugueseNumber(priceMatch[1])
      if (price <= 0) continue
      
      // Find unit and quantity before the price
      const beforePrice = part.substring(0, part.length - priceMatch[0].length)
      const unitQtyMatch = beforePrice.match(/(v\.?g\.?|vb|m\.?l\.?|m2|m²|m3|m³|un\.?|und\.?|unid\.?|kg|pc|pç)\s*(\d+[,.]\d*)\s*$/i)
      
      if (unitQtyMatch) {
        const unit = normalizeUnit(unitQtyMatch[1])
        const qty = parsePortugueseNumber(unitQtyMatch[2])
        
        // Get description from before the unit
        const descPart = beforePrice.substring(0, beforePrice.length - unitQtyMatch[0].length)
        
        // Find description - look for article number or significant text
        const artMatch = descPart.match(/\d+[,.]\d{1,2}\s+(.+)$/)
        let desc = artMatch ? artMatch[1] : descPart
        
        // Clean description
        desc = desc
          .replace(/^[\d\s,.€]+/, "")
          .replace(/[\d\s,.]+€[\d\s,.€]*$/, "")
          .replace(/\s+/g, " ")
          .trim()
        
        if (desc.length >= 10 && !/^(Nº|Artigo|Designação|Preço|Total|Empresa)/i.test(desc)) {
          items.push({
            name: desc,
            unit,
            quantity: qty > 0 && qty < 100000 ? qty : 1,
            price
          })
        }
      }
    }
  }
  
  return items
}

// ============================================================================
// LINE-BASED PARSER - For PDFs that preserve line breaks
// ============================================================================

function parseLineBasedText(lines: string[], debugInfo: string[] = []): ParsedItem[] {
  const items: ParsedItem[] = []
  let currentDescription = ""
  let linesSinceDescription = 0
  
  const shouldSkipLine = (line: string): boolean => {
    const skipPatterns = [
      /^(Nº\s*Artigo|Art\.?º?\s*$|Item\s*$|Descrição\s*$|Designação\s*$)/i,
      /^(Un\.?\s*$|Unidade\s*$|Quant\.?\s*$|Quantidade\s*$)/i,
      /^(Preço\s*(unitário|total)?|Valor\s*(unitário|total)?)\s*$/i,
      /^(Subtotal|IVA|Observ|Nota\s*:|Total\s*Geral)/i,
      /^(Empresa:|A\/C:|Telefone:|Ref\.?ª?\/?\s*$|Obra:|ORÇAMENTO)/i,
    ]
    return skipPatterns.some(p => p.test(line))
  }
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length < 2) { linesSinceDescription++; continue }
    if (shouldSkipLine(trimmed)) continue
    
    // Try to match data line with unit+qty+price
    const dataMatch = trimmed.match(/^(v\.?g\.?|vb|m\.?l\.?|m2|m²|m3|m³|un\.?d?|unid|kg|pc|pç|m|l)(\d+[,.]\d*)(.*€.*)?$/i)
    
    if (dataMatch && currentDescription) {
      const unit = normalizeUnit(dataMatch[1])
      const qty = parsePortugueseNumber(dataMatch[2])
      
      // Find price if present
      let price = 0
      const priceMatch = trimmed.match(/([\d\s,.]+)\s*€/)
      if (priceMatch) {
        price = parsePortugueseNumber(priceMatch[1])
      }
      
      if (currentDescription.length >= 10) {
        items.push({
          name: currentDescription.trim(),
          unit,
          quantity: qty > 0 && qty < 100000 ? qty : 1,
          price
        })
      }
      currentDescription = ""
      linesSinceDescription = 0
      continue
    }
    
    // Accumulate description
    let cleanLine = trimmed
      .replace(/^\d+[,.]\d{1,2}\s*/, "")
      .replace(/^\d+\s+/, "")
      .trim()
    
    if (cleanLine.length < 5) continue
    if (/^[\d.,\s€\-]+$/.test(cleanLine)) continue
    
    if (linesSinceDescription > 10) currentDescription = ""
    
    if (currentDescription && linesSinceDescription < 5) {
      currentDescription += " " + cleanLine
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
  const debugInfo: string[] = []
  
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided", debug: ["No file in formData"] }, { status: 400 })
    }
    
    debugInfo.push(`File: ${file.name}, Size: ${file.size} bytes`)
    
    // Read file as ArrayBuffer and extract text using unpdf
    const arrayBuffer = await file.arrayBuffer()
    
    let text = ""
    try {
      const result = await extractText(arrayBuffer, { mergePages: true })
      text = result.text
      debugInfo.push(`Text extracted: ${text.length} chars`)
    } catch (extractError) {
      debugInfo.push(`Extract error: ${extractError instanceof Error ? extractError.message : "Unknown"}`)
      return NextResponse.json({ 
        error: "Failed to extract text from PDF",
        debug: debugInfo,
        items: []
      }, { status: 500 })
    }
    
    // Check how many lines we have
    const lines = text.split(/[\r\n]+/).filter(l => l.trim().length > 0)
    debugInfo.push(`Lines after split: ${lines.length}`)
    debugInfo.push(`First 500 chars: ${text.substring(0, 500).replace(/\n/g, "\\n")}`)
    
    let items: ParsedItem[] = []
    
    // If text is essentially one line (or very few lines), use continuous parser
    if (lines.length <= 5 && text.length > 500) {
      debugInfo.push("Using continuous text parser (single-line PDF)")
      items = parseContinuousText(text, debugInfo)
    } else {
      debugInfo.push("Using line-based parser")
      items = parseLineBasedText(lines, debugInfo)
      
      // If line-based found nothing, try continuous
      if (items.length === 0) {
        debugInfo.push("Line-based found 0 items, trying continuous parser")
        items = parseContinuousText(text, debugInfo)
      }
    }
    
    debugInfo.push(`Raw items found: ${items.length}`)
    
    // Filter out items with invalid data
    const beforeFilter = items.length
    items = items.filter(item => 
      item.name && 
      item.name.length > 5 && 
      item.quantity > 0 &&
      item.quantity < 1000000
    )
    debugInfo.push(`After filter: ${items.length} (removed ${beforeFilter - items.length})`)
    
    // Remove duplicates
    const beforeDedup = items.length
    const seen = new Set<string>()
    items = items.filter(item => {
      const key = `${item.name.toLowerCase().substring(0, 50)}-${item.price.toFixed(2)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    debugInfo.push(`After dedup: ${items.length} (removed ${beforeDedup - items.length})`)
    
    // Add sample items to debug
    if (items.length > 0) {
      debugInfo.push(`Sample items: ${JSON.stringify(items.slice(0, 3))}`)
    }
    
    return NextResponse.json({ 
      success: true, 
      items,
      textLength: text.length,
      linesCount: lines.length,
      fileName: file.name,
      debug: debugInfo
    })
  } catch (error) {
    debugInfo.push(`Fatal error: ${error instanceof Error ? error.message : "Unknown"}`)
    return NextResponse.json({ 
      error: "Failed to parse PDF", 
      message: error instanceof Error ? error.message : "Unknown error",
      items: [],
      debug: debugInfo
    }, { status: 500 })
  }
}
