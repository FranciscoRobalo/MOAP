import { NextRequest, NextResponse } from "next/server"
import { extractText } from "unpdf"

// Parse Portuguese number format: "1 234,56" or "1.234,56" or "1234,56" -> 1234.56
function parsePortugueseNumber(str: string): number {
  if (!str) return 0
  let cleaned = str.replace(/€/g, "").trim()
  cleaned = cleaned.replace(/\s+/g, "")
  // Handle Portuguese format: thousands separator is . or space, decimal is ,
  if (cleaned.includes(",")) {
    // Remove all periods (thousands separators) and replace comma with period
    cleaned = cleaned.replace(/\./g, "").replace(",", ".")
  }
  const num = Number.parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

// Normalize Portuguese text including special characters
function normalizePortugueseText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents for matching
    .toLowerCase()
    .trim()
}

// Unit patterns for Portuguese construction budgets
const unitPatterns: { pattern: RegExp; normalized: string }[] = [
  { pattern: /^v\.?g\.?$/i, normalized: "vg" },
  { pattern: /^m\.?l\.?$/i, normalized: "ml" },
  { pattern: /^m2$/i, normalized: "m2" },
  { pattern: /^m²$/i, normalized: "m2" },
  { pattern: /^m3$/i, normalized: "m3" },
  { pattern: /^m³$/i, normalized: "m3" },
  { pattern: /^un\.?$/i, normalized: "un" },
  { pattern: /^unid\.?$/i, normalized: "un" },
  { pattern: /^kg$/i, normalized: "kg" },
  { pattern: /^pc$/i, normalized: "pc" },
  { pattern: /^pç$/i, normalized: "pc" },
  { pattern: /^degrau$/i, normalized: "un" },
  { pattern: /^m$/i, normalized: "m" },
  { pattern: /^l$/i, normalized: "l" },
  { pattern: /^lt$/i, normalized: "l" },
  { pattern: /^cx$/i, normalized: "cx" },
  { pattern: /^cj$/i, normalized: "cj" },
  { pattern: /^conj\.?$/i, normalized: "cj" },
]

function normalizeUnit(unit: string): string {
  const trimmed = unit.trim()
  for (const { pattern, normalized } of unitPatterns) {
    if (pattern.test(trimmed)) {
      return normalized
    }
  }
  return trimmed.toLowerCase().replace(/\./g, "")
}

// Check if a string looks like a unit
function isUnit(str: string): boolean {
  const normalized = str.trim().toLowerCase()
  return unitPatterns.some(({ pattern }) => pattern.test(normalized)) ||
    /^(m|mm|cm|un|pc|vg|ml|kg|l|lt|cx|cj)$/i.test(normalized)
}

// Check if a string looks like a price (ends with € or has decimal)
function isPrice(str: string): boolean {
  return /€/.test(str) || /^\d+[.,]\d{2}$/.test(str.trim())
}

// Check if a string is a numeric value
function isNumeric(str: string): boolean {
  const cleaned = str.replace(/[€\s]/g, "").replace(",", ".")
  return !isNaN(Number.parseFloat(cleaned))
}

// Detect column structure from header row
interface ColumnMapping {
  descIndex: number
  unitIndex: number
  qtyIndex: number
  priceIndex: number
  totalIndex: number
}

function detectColumnStructure(headerRow: string[]): ColumnMapping | null {
  const mapping: ColumnMapping = {
    descIndex: -1,
    unitIndex: -1,
    qtyIndex: -1,
    priceIndex: -1,
    totalIndex: -1
  }

  const descPatterns = /descri|designa|artigo|item|trabalho|especifica|nome/i
  const unitPatterns = /unid|un\.?|u\.?m\.?/i
  const qtyPatterns = /quant|qtd|qt\.?/i
  const pricePatterns = /pre[cç]o\s*(unit|un\.?)?|p\.?\s*unit|valor\s*unit/i
  const totalPatterns = /total|valor\s*total|pre[cç]o\s*total|import/i

  for (let i = 0; i < headerRow.length; i++) {
    const col = normalizePortugueseText(headerRow[i])
    
    if (descPatterns.test(col) && mapping.descIndex === -1) {
      mapping.descIndex = i
    } else if (unitPatterns.test(col) && mapping.unitIndex === -1) {
      mapping.unitIndex = i
    } else if (qtyPatterns.test(col) && mapping.qtyIndex === -1) {
      mapping.qtyIndex = i
    } else if (totalPatterns.test(col) && mapping.totalIndex === -1) {
      mapping.totalIndex = i
    } else if (pricePatterns.test(col) && mapping.priceIndex === -1) {
      mapping.priceIndex = i
    }
  }

  // If we found at least description and one price column, return the mapping
  if (mapping.descIndex >= 0 && (mapping.priceIndex >= 0 || mapping.totalIndex >= 0)) {
    return mapping
  }

  return null
}

// Parse budget items from structured text (tables)
function parseStructuredBudget(text: string): Array<{ name: string; unit: string; quantity: number; price: number }> {
  const items: Array<{ name: string; unit: string; quantity: number; price: number }> = []
  
  // Split into lines
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0)
  
  // Skip patterns - header/footer content
  const skipPatterns = /^(Empresa:|A\/C:|Telefone:|Ref\.?ª?\/|Obra:|ORÇAMENTO|Contacto|De:|Data:|Cliente:|Condições|Garantia|Assinatura|REVIVE|www\.|@|NIF|NIPC|Capital|Alvará|PLANILHA|Página|Page|Observ|Nota:|TERMOS|ACRESCE|IVA|Subtotal|Total\s*Geral|Valor\s*da\s*Proposta)/i
  
  // Try to find header row
  let columnMapping: ColumnMapping | null = null
  let startIndex = 0
  
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const line = lines[i]
    // Split by common delimiters
    const cols = line.split(/\t+|;+|\s{2,}/)
    
    const potentialMapping = detectColumnStructure(cols)
    if (potentialMapping) {
      columnMapping = potentialMapping
      startIndex = i + 1
      break
    }
  }
  
  // If no header found, use heuristic parsing
  if (!columnMapping) {
    return parseHeuristicBudget(text)
  }
  
  // Parse rows using detected column structure
  let currentDescription = ""
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i]
    if (skipPatterns.test(line)) continue
    if (line.length < 3) continue
    
    // Split by delimiters
    const cols = line.split(/\t+|;+|\s{2,}/)
    
    // Get values from detected columns
    let desc = columnMapping.descIndex >= 0 && cols[columnMapping.descIndex] 
      ? cols[columnMapping.descIndex].trim() 
      : ""
    let unit = columnMapping.unitIndex >= 0 && cols[columnMapping.unitIndex] 
      ? normalizeUnit(cols[columnMapping.unitIndex]) 
      : "un"
    let qty = columnMapping.qtyIndex >= 0 && cols[columnMapping.qtyIndex] 
      ? parsePortugueseNumber(cols[columnMapping.qtyIndex]) 
      : 1
    let price = columnMapping.priceIndex >= 0 && cols[columnMapping.priceIndex] 
      ? parsePortugueseNumber(cols[columnMapping.priceIndex]) 
      : 0
    
    // If no unit price, try to derive from total
    if (price === 0 && columnMapping.totalIndex >= 0 && cols[columnMapping.totalIndex]) {
      const total = parsePortugueseNumber(cols[columnMapping.totalIndex])
      if (total > 0 && qty > 0) {
        price = total / qty
      }
    }
    
    // Accumulate description if this seems like a continuation
    if (desc && desc.length > 3 && !isNumeric(desc)) {
      if (price > 0 || qty > 1 || isUnit(unit)) {
        // This is a complete item row
        const fullDesc = currentDescription ? currentDescription + " " + desc : desc
        if (fullDesc.length > 3) {
          items.push({
            name: fullDesc.trim(),
            unit,
            quantity: qty || 1,
            price: price > 0 ? price : 0
          })
        }
        currentDescription = ""
      } else {
        // This is a description continuation
        currentDescription = currentDescription ? currentDescription + " " + desc : desc
      }
    }
  }
  
  return items
}

// Heuristic parsing for unstructured PDFs
function parseHeuristicBudget(text: string): Array<{ name: string; unit: string; quantity: number; price: number }> {
  const items: Array<{ name: string; unit: string; quantity: number; price: number }> = []
  
  // Normalize text
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const lines = normalizedText.split("\n").filter(l => l.trim().length > 0)
  
  // Skip patterns
  const skipPatterns = /^(Nº\s*Artigo|Designação|Unidade|Quantidade|Preço|total|subtotal|iva|nota\s*:|observ|página|page|Empresa:|A\/C:|Telefone:|Ref\.?ª?|Obra:|ORÇAMENTO|Contacto|De:|Data:|Cliente:|Nº\s*Ref|Condições|Garantia|Assinatura|PLANILHA|TERMOS|ACRESCE|Capital|Alvará|NIF|NIPC)/i
  
  let currentDescription = ""
  
  // Pattern for data lines with embedded unit+qty+prices
  // Examples: "v.g.1,0022 000,00 €22 000,00 €", "m235,2030,00 €1 056,00 €"
  const dataLinePattern = /^(v\.?g\.?|vg|m\.?l\.?|ml|m2|m²|m3|m³|un\.?|unid\.?|kg|pc|pç|degrau|m|l)(\d+[.,]?\d*)/i
  
  // Pattern for separate data columns
  // Example: "vg    1,00    22 000,00 €    22 000,00 €"
  const separateDataPattern = /^(v\.?g\.?|vg|m\.?l\.?|ml|m2|m²|m3|m³|un\.?|unid\.?|kg|pc|pç|degrau|m|l)\s+(\d+[.,]?\d*)\s+([\d\s]+[.,]\d{2})\s*€/i
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line.length < 2) continue
    if (skipPatterns.test(line)) continue
    
    // Check if line is just a total (ends with €)
    if (/^[\d\s.,]+\s*€$/.test(line) && line.length < 25) continue
    
    // Check if line is a section number
    if (/^\d+[.,]?\d*$/.test(line)) continue
    
    // Try to match data line with embedded values
    const dataMatch = line.match(dataLinePattern)
    
    if (dataMatch) {
      // Extract unit
      let unit = normalizeUnit(dataMatch[1])
      
      // Get the rest of the line after the initial unit
      const restOfLine = line.substring(dataMatch[0].length - dataMatch[2].length)
      
      // Extract quantity (first number)
      const qtyMatch = restOfLine.match(/^(\d+[.,]?\d*)/)
      let quantity = 1
      if (qtyMatch) {
        quantity = parsePortugueseNumber(qtyMatch[1])
        if (quantity > 100000) quantity = 1 // Sanity check
      }
      
      // Find prices (numbers with 2 decimals followed by €)
      const priceMatches = line.match(/([\d\s]+[.,]\d{2})\s*€/g)
      
      if (priceMatches && priceMatches.length >= 1 && currentDescription) {
        const prices = priceMatches.map(p => parsePortugueseNumber(p))
        // First price is usually unit price, second is total
        const unitPrice = prices[0]
        
        if (unitPrice > 0) {
          items.push({
            name: currentDescription.trim(),
            unit,
            quantity: quantity || 1,
            price: unitPrice
          })
        }
        currentDescription = ""
      }
    } else {
      // Try separate data pattern
      const sepMatch = line.match(separateDataPattern)
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
        // This is a description line
        let cleanLine = line
          .replace(/^\d+[.,]\d*\s*/, "") // Remove article numbers like "0,01", "1,02"
          .replace(/([\d\s]+[.,]\d{2})\s*€/g, "") // Remove prices
          .replace(/\s+/g, " ")
          .trim()
        
        // Skip if too short or just numbers/symbols
        if (cleanLine.length < 3) continue
        if (/^[\d.,\s€\-–—:;]+$/.test(cleanLine)) continue
        
        // Accumulate description
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

// Advanced multi-pass parser that handles various PDF formats
function parseMultiFormatBudget(text: string): Array<{ name: string; unit: string; quantity: number; price: number }> {
  let items: Array<{ name: string; unit: string; quantity: number; price: number }> = []
  
  // First try structured parsing (tabular data)
  items = parseStructuredBudget(text)
  
  // If we got items, great!
  if (items.length > 0) {
    return items
  }
  
  // Try heuristic parsing
  items = parseHeuristicBudget(text)
  
  if (items.length > 0) {
    return items
  }
  
  // Last resort: regex-based extraction for common Portuguese budget patterns
  const budgetItemRegex = /(?:^|\n)[\s\d.,]*([A-ZÀ-Ú][^€\n]{10,200}?)(?:\s*(?:v\.?g\.?|m\.?l\.?|m[²³]?|un\.?|kg|pc)\s*)?(\d+[.,]?\d*)\s*([\d\s]+[.,]\d{2})\s*€/gi
  
  let match
  while ((match = budgetItemRegex.exec(text)) !== null) {
    const name = match[1].trim()
    const quantity = parsePortugueseNumber(match[2]) || 1
    const price = parsePortugueseNumber(match[3])
    
    if (name.length > 5 && price > 0) {
      // Try to extract unit from the description
      let unit = "un"
      const unitMatch = name.match(/\b(v\.?g\.?|m\.?l\.?|m2|m²|m3|m³|un\.?|kg|pc)\b/i)
      if (unitMatch) {
        unit = normalizeUnit(unitMatch[1])
      }
      
      items.push({
        name: name.replace(/\b(v\.?g\.?|m\.?l\.?|m2|m²|m3|m³|un\.?|kg|pc)\s*$/i, "").trim(),
        unit,
        quantity,
        price
      })
    }
  }
  
  return items
}

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
    
    // Parse the extracted text using multi-format parser
    const items = parseMultiFormatBudget(text)
    
    return NextResponse.json({ 
      success: true, 
      items,
      textLength: text.length,
      linesCount: text.split("\n").length
    })
  } catch (error) {
    console.error("PDF parsing error:", error)
    return NextResponse.json({ 
      error: "Failed to parse PDF", 
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
