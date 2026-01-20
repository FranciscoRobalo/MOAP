import { NextRequest, NextResponse } from "next/server"
import { extractText } from "unpdf"

// Parse Portuguese number format: "1 234,56" or "1.234,56" -> 1234.56
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

// Parse budget text extracted from PDF
function parseBudgetText(text: string): Array<{ name: string; unit: string; quantity: number; price: number }> {
  const items: Array<{ name: string; unit: string; quantity: number; price: number }> = []
  
  // Split into lines
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0)
  
  // Skip patterns
  const skipPatterns = /^(Nº\s*Artigo|Designação|Unidade|Quantidade|Preço|total|subtotal|iva|nota|observ|página|page|Empresa:|A\/C:|Telefone:|Ref|Obra:|ORÇAMENTO|Contacto|De:|Data:|Cliente:|Condições|Garantia|Assinatura|REVIVE|www\.|@|NIF|Capital|Alvará)/i
  
  let currentDescription = ""
  
  for (const line of lines) {
    if (skipPatterns.test(line)) continue
    if (/^[\d\s.,]+€$/.test(line)) continue // Just a price
    if (line.length < 3) continue
    
    // Pattern for lines with description+unit+quantity+prices (like "Betãom338,58200,00 €7 716,00 €")
    const descUnitQtyPricePattern = /^(Betão|Ferro|Cofragem)(m2|m3|m²|m³|kg)(\d+[.,]?\d*)(.*€)/i
    const descMatch = line.match(descUnitQtyPricePattern)
    
    if (descMatch) {
      const description = descMatch[1]
      const unit = descMatch[2].toLowerCase().replace("²", "2").replace("³", "3")
      const quantity = parsePortugueseNumber(descMatch[3])
      const priceSection = descMatch[4]
      const prices = priceSection.match(/([\d\s]+[.,]\d{2})\s*€/g)
      
      if (prices && prices.length > 0) {
        const unitPrice = parsePortugueseNumber(prices[0])
        if (unitPrice > 0) {
          items.push({ name: description, unit, quantity: quantity || 1, price: unitPrice })
        }
      }
      continue
    }
    
    // Pattern for lines with unit+quantity+prices concatenated
    // Examples: "v.g.1,0022 000,00 €22 000,00 €", "m235,2030,00 €1 056,00 €"
    const unitQtyPricePattern = /^(v\.?g\.?|vg|m\.?l\.?|ml|m2|m²|m3|m³|un\.?|unid\.?|kg|pc|pç|degrau)(\d+[.,]?\d*)(.*€)/i
    const match = line.match(unitQtyPricePattern)
    
    if (match) {
      const unit = match[1].toLowerCase().replace(/\./g, "").replace("²", "2").replace("³", "3")
      const quantity = parsePortugueseNumber(match[2])
      
      // Extract prices from the rest
      const priceSection = match[3]
      const prices = priceSection.match(/([\d\s]+[.,]\d{2})\s*€/g)
      
      if (prices && prices.length > 0 && currentDescription) {
        const unitPrice = parsePortugueseNumber(prices[0])
        
        if (unitPrice > 0) {
          items.push({
            name: currentDescription.trim(),
            unit,
            quantity: quantity > 0 ? quantity : 1,
            price: unitPrice
          })
        }
        currentDescription = ""
      }
    } else if (/^\d+[.,]?\d*$/.test(line)) {
      // Just a number (like article number "0", "1", "0,01") - skip
      continue
    } else if (/^[\d\s.,€]+$/.test(line)) {
      // Just numbers and currency - skip
      continue
    } else {
      // Description line - clean and accumulate
      let cleanLine = line
        .replace(/^\d+[.,]\d*\s*/, "") // Remove article numbers
        .replace(/([\d\s]+[.,]\d{2})\s*€/g, "") // Remove prices
        .replace(/\s+/g, " ")
        .trim()
      
      if (cleanLine.length >= 3 && !/^[\d.,\s€\-–—:;]+$/.test(cleanLine)) {
        currentDescription = currentDescription ? currentDescription + " " + cleanLine : cleanLine
      }
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
    
    // Parse the extracted text
    const items = parseBudgetText(text)
    
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
