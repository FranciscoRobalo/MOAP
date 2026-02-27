import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

interface PriceResult {
  name: string
  minPrice: number
  maxPrice: number
  avgPrice: number
  unit: string
  source: string
  confidence: number
}

// Initialize OpenAI client
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) return null
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json() as { items: Array<{ name: string; unit: string; quantity: number; price: number }> }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    const openai = getOpenAIClient()
    if (!openai) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Batch items for efficient API usage (max 10 items per request)
    const batchSize = 10
    const results: Record<string, PriceResult> = {}
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const itemsList = batch.map((item, idx) => 
        `${idx + 1}. "${item.name}" (unidade: ${item.unit}, preço orçamento: €${item.price.toFixed(2)})`
      ).join("\n")

      const systemPrompt = `Você é um especialista em preços de construção civil em Portugal. Com base no seu conhecimento do mercado português de construção (2024-2025), forneça preços de referência realistas.

IMPORTANTE:
1. Os preços devem refletir o mercado português atual (Lisboa/Porto)
2. Inclua mão de obra e materiais quando aplicável
3. Use preços por unidade (m2, m3, vg, ml, un, kg)
4. Considere qualidade média de materiais
5. Para "vg" (verba global), considere o escopo típico do trabalho

Para cada item, forneça:
- minPrice: preço mínimo de mercado (€)
- maxPrice: preço máximo de mercado (€)
- avgPrice: preço médio esperado (€)
- confidence: 0-100 (quão confiante você está no preço)

REGRAS DE PREÇOS TÍPICOS EM PORTUGAL (2024):
- Pintura interior: €8-15/m2
- Pintura exterior: €12-20/m2
- Betonilha/regularização: €10-18/m2
- Betão C25/30: €90-130/m3
- Alvenaria tijolo: €40-70/m2
- Isolamento térmico ETICS: €50-90/m2
- Tetos falsos gesso cartonado: €25-45/m2
- Carpintaria (portas interiores): €200-500/un
- Caixilharia alumínio: €300-600/m2
- Impermeabilização: €20-40/m2
- Revestimento cerâmico: €25-50/m2
- Estaleiro montagem/desmontagem: €5000-25000/vg
- Escavação: €8-20/m3
- Aterro: €12-25/m3
- Estrutura metálica: €3-6/kg
- Cofragem: €25-50/m2

Responda APENAS com um array JSON válido. Exemplo:
[
  {"name": "Pintura interior", "minPrice": 8, "maxPrice": 15, "avgPrice": 11, "unit": "m2", "confidence": 90},
  {"name": "Betão em fundações", "minPrice": 100, "maxPrice": 140, "avgPrice": 120, "unit": "m3", "confidence": 85}
]`

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Forneça preços de referência para estes itens de construção em Portugal:\n\n${itemsList}` }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        })

        const content = response.choices[0]?.message?.content || "[]"
        
        // Extract JSON array from response
        let jsonStr = content
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          jsonStr = jsonMatch[0]
        }
        
        const parsed = JSON.parse(jsonStr) as PriceResult[]
        
        // Map results back to original items
        for (let j = 0; j < batch.length; j++) {
          const originalItem = batch[j]
          const priceData = parsed[j]
          
          if (priceData && priceData.avgPrice > 0) {
            results[originalItem.name] = {
              name: originalItem.name,
              minPrice: priceData.minPrice || priceData.avgPrice * 0.8,
              maxPrice: priceData.maxPrice || priceData.avgPrice * 1.2,
              avgPrice: priceData.avgPrice,
              unit: priceData.unit || originalItem.unit,
              source: "GPT (mercado PT 2024)",
              confidence: priceData.confidence || 70
            }
          }
        }
      } catch (batchError) {
        console.error("Batch processing error:", batchError)
        // Continue with next batch
      }
    }

    return NextResponse.json({ 
      success: true, 
      prices: results,
      itemsProcessed: items.length,
      pricesFound: Object.keys(results).length
    })
  } catch (error) {
    console.error("Price lookup error:", error)
    return NextResponse.json({ 
      error: "Failed to lookup prices", 
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
