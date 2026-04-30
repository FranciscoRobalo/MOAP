import { NextRequest, NextResponse } from "next/server"
import { extractText } from "unpdf"
import OpenAI from "openai"
import * as XLSX from "xlsx"

interface ParsedItem {
  name: string
  unit: string
  quantity: number
  price: number
}

// Initialize OpenAI client
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) return null
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

// Parse Portuguese number format
function parsePortugueseNumber(str: string): number {
  if (!str || typeof str !== "string") return 0
  let cleaned = str.replace(/€/g, "").replace(/\s+/g, "").trim()
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".")
  }
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

// Normalize unit strings
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
// GPT PARSER - Uses OpenAI to intelligently parse budget text
// ============================================================================

async function parseWithGPT(text: string, debugInfo: string[]): Promise<ParsedItem[]> {
  const openai = getOpenAIClient()
  if (!openai) {
    debugInfo.push("OpenAI API key not configured")
    return []
  }
  
  debugInfo.push("Using GPT to parse budget text...")
  
  // Limit text to avoid token limits
  const maxChars = 12000
  const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text
  debugInfo.push(`Text length for GPT: ${truncatedText.length} chars`)
  
  const systemPrompt = `You are an expert Portuguese construction budget parser. Your task is to extract ALL budget line items from the provided text.

CRITICAL INSTRUCTIONS:
1. The text may be continuous without line breaks - items are separated by article numbers like "0,01", "1,02", "2,01"
2. Portuguese number format: "22 000,00" or "1.234,56" means 22000.00 or 1234.56
3. Common units and their meanings:
   - vg or v.g. = verba global (lump sum)
   - m2 or m² = square meters
   - m3 or m³ = cubic meters
   - ml or m.l. = linear meters
   - un or und = units
   - kg = kilograms
4. Data patterns to look for:
   - "v.g.1,00" means unit=vg, quantity=1.00
   - "m235,20" means unit=m2, quantity=35.20
   - "22 000,00 €" or "22000,00€" means price=22000.00
5. Each item typically has: article number, description text, unit, quantity, unit price, total price
6. Extract the UNIT PRICE (preço unitário), not the total price
7. Section headers like "ESTRUTURA", "ARQUITETURA", "ACABAMENTOS" in ALL CAPS are categories, NOT items
8. Skip headers, footers, company info, totals, subtotals

For each item found, extract:
- name: The full description in Portuguese (minimum 10 characters)
- unit: The measurement unit (vg, m2, m3, ml, un, kg, etc.)
- quantity: The quantity as a number
- price: The UNIT price as a number (not total)

Return a JSON object with an "items" array. Example:
{"items": [
  {"name": "Montagem e desmontagem de estaleiro", "unit": "vg", "quantity": 1, "price": 22000},
  {"name": "Betão C25/30 em fundações", "unit": "m3", "quantity": 38.58, "price": 200}
]}

If no valid items found, return: {"items": []}`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extract all budget items from this Portuguese construction budget:\n\n${truncatedText}` }
      ],
      temperature: 0.1,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    })

    const content = response.choices[0]?.message?.content || "{}"
    debugInfo.push(`GPT response received, length: ${content.length}`)
    
    // Parse JSON response
    let items: ParsedItem[] = []
    try {
      const parsed = JSON.parse(content)
      items = Array.isArray(parsed) ? parsed : (parsed.items || [])
    } catch {
      // Try to extract JSON array as fallback
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        items = JSON.parse(jsonMatch[0])
      }
    }
    debugInfo.push(`GPT parsed ${items.length} items`)
    
    // Validate and normalize items
    return items
      .filter((item: ParsedItem) => 
        item && 
        item.name && 
        typeof item.name === "string" && 
        item.name.length > 5
      )
      .map((item: ParsedItem) => ({
        name: String(item.name).trim(),
        unit: normalizeUnit(String(item.unit || "un")),
        quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
        price: typeof item.price === "number" && item.price >= 0 ? item.price : 0
      }))
  } catch (error) {
    debugInfo.push(`GPT error: ${error instanceof Error ? error.message : "Unknown"}`)
    return []
  }
}

// ============================================================================
// EXCEL PARSER - Parse XLS/XLSX files
// ============================================================================

function parseExcelFile(buffer: ArrayBuffer, debugInfo: string[]): ParsedItem[] {
  debugInfo.push("Parsing Excel file...")
  const items: ParsedItem[] = []
  
  try {
    const workbook = XLSX.read(buffer, { type: "array" })
    debugInfo.push(`Excel sheets: ${workbook.SheetNames.join(", ")}`)
    
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
      
      debugInfo.push(`Sheet "${sheetName}": ${data.length} rows`)
      
      // Find header row to identify columns
      let headerRow = -1
      let descCol = -1, unitCol = -1, qtyCol = -1, priceCol = -1
      
      for (let i = 0; i < Math.min(data.length, 20); i++) {
        const row = data[i]
        if (!row || !Array.isArray(row)) continue
        
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || "").toLowerCase().trim()
          
          if (cell.includes("descrição") || cell.includes("designação") || cell.includes("especificação")) {
            descCol = j
            headerRow = i
          } else if (cell.includes("unid") || cell === "un" || cell === "und") {
            unitCol = j
            headerRow = i
          } else if (cell.includes("quant") || cell === "qt" || cell === "qtd") {
            qtyCol = j
            headerRow = i
          } else if (cell.includes("preço") && (cell.includes("unit") || cell.includes("€"))) {
            priceCol = j
            headerRow = i
          } else if (cell.includes("valor") && cell.includes("unit")) {
            priceCol = j
            headerRow = i
          }
        }
        
        if (descCol >= 0 && headerRow >= 0) break
      }
      
      debugInfo.push(`Header found at row ${headerRow}: desc=${descCol}, unit=${unitCol}, qty=${qtyCol}, price=${priceCol}`)
      
      // If no header found, try to detect columns from data
      if (headerRow < 0) {
        headerRow = 0
        // Assume common column order: Article, Description, Unit, Qty, Unit Price, Total
        for (let i = 0; i < Math.min(data.length, 30); i++) {
          const row = data[i]
          if (!row || row.length < 3) continue
          
          // Find first row with enough data
          for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] || "")
            if (cell.length > 20 && !/^\d+[.,]?\d*$/.test(cell) && descCol < 0) {
              descCol = j
            }
          }
          if (descCol >= 0) {
            headerRow = i - 1
            break
          }
        }
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
        
        // Extract unit
        if (unitCol >= 0 && row[unitCol]) {
          unit = normalizeUnit(String(row[unitCol]))
        }
        
        // Extract quantity
        if (qtyCol >= 0 && row[qtyCol] != null) {
          const rawQ = row[qtyCol]
          const q: number = typeof rawQ === "number" ? rawQ : parsePortugueseNumber(String(rawQ))
          if (q > 0 && q < 100000) quantity = q
        }
        
        // Extract price
        if (priceCol >= 0 && row[priceCol] != null) {
          const rawP = row[priceCol]
          price = typeof rawP === "number" ? rawP : parsePortugueseNumber(String(rawP))
        }
        
        // If no specific columns, try to find numbers that look like prices
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
        
        // Add item if valid
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
// REGEX FALLBACK PARSER
// ============================================================================

function parseWithRegex(text: string, debugInfo: string[]): ParsedItem[] {
  debugInfo.push("Using regex fallback parser...")
  const items: ParsedItem[] = []
  
  // Find all € prices
  const euroMatches = [...text.matchAll(/([\d\s,.]+)\s*€/g)]
  debugInfo.push(`Found ${euroMatches.length} € patterns`)
  
  // Find all unit+quantity patterns
  const unitQtyMatches = [...text.matchAll(/(v\.?g\.?|vb|m\.?l\.?|m2|m²|m3|m³|un\.?d?|unid|kg|pc|pç|m|l)\s*(\d+[,.]?\d*)/gi)]
  debugInfo.push(`Found ${unitQtyMatches.length} unit+qty patterns`)
  
  // Try to match unit patterns with following prices
  for (const unitMatch of unitQtyMatches) {
    const unitIndex = unitMatch.index || 0
    const unit = normalizeUnit(unitMatch[1])
    const qty = parsePortugueseNumber(unitMatch[2])
    
    // Look for description before this unit (up to 500 chars back)
    const startSearch = Math.max(0, unitIndex - 500)
    const textBefore = text.substring(startSearch, unitIndex)
    
    // Find article number or significant text
    const articleMatch = textBefore.match(/(\d+[,.]?\d{0,2})\s+([^€]{10,200})$/)
    let description = ""
    
    if (articleMatch) {
      description = articleMatch[2].trim()
    } else {
      // Get last significant text block
      const textBlocks = textBefore.split(/\d+[,.]?\d{0,2}\s*€/)
      const lastBlock = textBlocks[textBlocks.length - 1]
      if (lastBlock) {
        description = lastBlock.replace(/^[\d\s.,€]+/, "").trim()
      }
    }
    
    // Clean description
    description = description
      .replace(/^\d+[,.]?\d{0,2}\s*/, "")
      .replace(/\s+/g, " ")
      .trim()
    
    if (description.length < 10) continue
    if (/^(Nº|Art|Designação|Preço|Total|Empresa|Obra)/i.test(description)) continue
    
    // Find price after unit
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
// API ROUTE
// ============================================================================

export async function POST(request: NextRequest) {
  const debugInfo: string[] = []
  
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided", debug: ["No file in formData"], items: [] }, { status: 400 })
    }
    
    const fileName = file.name.toLowerCase()
    debugInfo.push(`File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`)
    
    const arrayBuffer = await file.arrayBuffer()
    let items: ParsedItem[] = []
    let text = ""
    
    // Handle Excel files
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      debugInfo.push("Detected Excel file")
      items = parseExcelFile(arrayBuffer, debugInfo)
      
      // If Excel parsing found items, return them
      if (items.length > 0) {
        return NextResponse.json({ 
          success: true, 
          items,
          fileName: file.name,
          debug: debugInfo
        })
      }
      
      // Convert Excel to text for GPT parsing
      try {
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        text = workbook.SheetNames
          .map(name => XLSX.utils.sheet_to_csv(workbook.Sheets[name]))
          .join("\n\n")
        debugInfo.push(`Excel converted to text: ${text.length} chars`)
      } catch (e) {
        debugInfo.push(`Excel to text conversion failed: ${e}`)
      }
    }
    // Handle PDF files
    else if (fileName.endsWith(".pdf")) {
      debugInfo.push("Detected PDF file")
      try {
        const result = await extractText(arrayBuffer, { mergePages: true })
        text = result.text
        debugInfo.push(`PDF text extracted: ${text.length} chars`)
      } catch (extractError) {
        debugInfo.push(`PDF extract error: ${extractError instanceof Error ? extractError.message : "Unknown"}`)
        return NextResponse.json({ 
          error: "Failed to extract text from PDF",
          debug: debugInfo,
          items: []
        }, { status: 500 })
      }
    }
    // Handle CSV/TXT files
    else if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
      debugInfo.push("Detected text file")
      text = await file.text()
      debugInfo.push(`Text file read: ${text.length} chars`)
    }
    else {
      return NextResponse.json({ 
        error: "Unsupported file type. Please upload PDF, Excel (XLS/XLSX), or CSV files.",
        debug: debugInfo,
        items: []
      }, { status: 400 })
    }
    
    if (text.length < 50 && items.length === 0) {
      debugInfo.push("Text too short and no Excel items found")
      return NextResponse.json({ 
        error: "File appears to be empty or too short",
        debug: debugInfo,
        items: []
      }, { status: 400 })
    }
    
    // Add sample of text for debugging
    if (text) {
      debugInfo.push(`First 500 chars: ${text.substring(0, 500).replace(/\n/g, "\\n")}`)
    }
    
    // If no items yet, try GPT parsing
    if (items.length === 0 && text) {
      items = await parseWithGPT(text, debugInfo)
    }
    
    // Fallback to regex if GPT didn't work
    if (items.length === 0 && text) {
      items = parseWithRegex(text, debugInfo)
    }
    
    debugInfo.push(`Total items before filtering: ${items.length}`)
    
    // Filter invalid items
    items = items.filter(item => 
      item.name && 
      item.name.length > 5 && 
      item.quantity > 0 &&
      item.quantity < 1000000
    )
    debugInfo.push(`Items after filtering: ${items.length}`)
    
    // Remove duplicates
    const seen = new Set<string>()
    items = items.filter(item => {
      const key = `${item.name.toLowerCase().substring(0, 50)}-${item.price.toFixed(2)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    debugInfo.push(`Final items after dedup: ${items.length}`)
    
    if (items.length > 0) {
      debugInfo.push(`Sample items: ${JSON.stringify(items.slice(0, 3))}`)
    }
    
    return NextResponse.json({ 
      success: true, 
      items,
      textLength: text?.length || 0,
      fileName: file.name,
      debug: debugInfo
    })
  } catch (error) {
    debugInfo.push(`Fatal error: ${error instanceof Error ? error.message : "Unknown"}`)
    return NextResponse.json({ 
      error: "Failed to parse file", 
      message: error instanceof Error ? error.message : "Unknown error",
      items: [],
      debug: debugInfo
    }, { status: 500 })
  }
}
