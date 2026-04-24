import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

interface BudgetItem {
  name: string
  unit: string
  quantity: number
  price: number
}

interface MaterialRef {
  id: string
  name: string
  unit: string
  price: number
  priceMax?: number
  category: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, materials } = body as { items: BudgetItem[]; materials: MaterialRef[] }
    
    console.log("[v0] match-items API called with", items?.length || 0, "items")
    
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      console.log("[v0] match-items: No OPENAI_API_KEY configured")
      // Return empty matches instead of error - allows fallback to local matching
      return NextResponse.json({ 
        matches: {},
        warning: "OPENAI_API_KEY não configurada - usando correspondência local"
      })
    }
    
    if (!items || items.length === 0) {
      return NextResponse.json({ matches: {} })
    }
    
    const openai = new OpenAI({ apiKey })
    
    // Create a summary of available materials for GPT
    const materialSummary = materials.map(m => 
      `ID:${m.id} | ${m.name} | ${m.unit} | ${m.price.toFixed(2)}-${(m.priceMax || m.price).toFixed(2)}EUR | ${m.category}`
    ).join("\n")
    
    // Create list of items to match
    const itemsList = items.map((item, i) => 
      `${i+1}. "${item.name}" (${item.unit}, ${item.price.toFixed(2)}EUR)`
    ).join("\n")
    
    const systemPrompt = `Você é um especialista em construção civil portuguesa. Sua tarefa é fazer correspondência entre itens de orçamento e uma base de dados de materiais/serviços.

REGRAS IMPORTANTES:
1. Faça correspondência SEMÂNTICA - entenda o que o item realmente é, não apenas palavras similares
2. Considere sinónimos portugueses de construção (ex: "capoto" = "ETICS" = "isolamento térmico exterior")
3. Se um item de orçamento descreve um TRABALHO COMPLETO (com material + mão de obra), faça correspondência com o trabalho na base de dados
4. Se não houver correspondência razoável (>60% de certeza), retorne null
5. A unidade deve ser compatível (m2 com m2, un com un, etc.)
6. Considere o CONTEXTO - "execução de pintura" corresponde a "Pintura interior" mesmo sem palavras exatas

EXEMPLOS DE CORRESPONDÊNCIAS CORRETAS:
- "Fornecimento e aplicação de isolamento térmico pelo exterior" → "Isolamento térmico ETICS/Cappotto"
- "Execução de paredes em alvenaria de tijolo" → "Alvenaria de tijolo cerâmico"
- "Pintura a tinta plástica em paredes interiores" → "Pintura interior a tinta plástica (paredes)"
- "Fornecimento e montagem de armário" → "Roupeiro embutido"
- "Betonagem de fundações" → "Betão armado em fundações"

BASE DE DADOS DE MATERIAIS/SERVIÇOS:
${materialSummary}

Responda APENAS com um JSON object onde cada chave é o índice do item (1, 2, 3...) e o valor é um objeto com:
- materialId: ID do material correspondente (ou null se não houver correspondência boa)
- confidence: 0-100 (sua confiança na correspondência)
- reason: breve explicação em português

Exemplo de resposta:
{
  "1": {"materialId": "work-pt-001", "confidence": 85, "reason": "Isolamento térmico exterior ETICS"},
  "2": {"materialId": null, "confidence": 0, "reason": "Sem correspondência adequada na base de dados"},
  "3": {"materialId": "work-pt-044", "confidence": 78, "reason": "Alvenaria de tijolo cerâmico"}
}`

    const userPrompt = `Faça correspondência para estes itens de orçamento:

${itemsList}`

    let response
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      })
    } catch {
      try {
        response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        })
      } catch (err) {
        return NextResponse.json({ 
          error: "Erro na API OpenAI",
          matches: {}
        }, { status: 500 })
      }
    }

    const content = response.choices[0]?.message?.content || "{}"
    
    // Parse GPT response
    let matches: Record<string, { materialId: string | null; confidence: number; reason: string }> = {}
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        matches = JSON.parse(jsonMatch[0])
      }
    } catch {
      // If parsing fails, return empty matches
    }

    return NextResponse.json({
      success: true,
      matches
    })

  } catch (error) {
    console.error("Error in match-items API:", error)
    return NextResponse.json({ 
      error: "Erro ao processar correspondências",
      matches: {}
    }, { status: 500 })
  }
}
