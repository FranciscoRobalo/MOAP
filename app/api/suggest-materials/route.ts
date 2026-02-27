import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenAI client - will be created per request to ensure fresh API key
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured")
  }
  return new OpenAI({ apiKey })
}

interface SuggestedMaterial {
  name: string
  unit: string
  priceMin: number
  priceMax: number
  category: string
  type: "material" | "work"
  description?: string
}

export async function POST(request: NextRequest) {
  try {
    const { type, category, query } = await request.json()
    
    let openai: OpenAI
    try {
      openai = getOpenAIClient()
    } catch {
      return NextResponse.json({ 
        error: "OPENAI_API_KEY não configurada. Adicione a chave nas variáveis de ambiente.",
        suggestions: []
      }, { status: 500 })
    }

    const itemType = type === "material" ? "materiais de construção" : "serviços/trabalhos de construção"
    const categoryFilter = category && category !== "all" ? `na categoria "${category}"` : "em todas as categorias"
    const searchQuery = query ? `relacionados com "${query}"` : ""

    const systemPrompt = `Você é um especialista em preços de construção civil em Portugal. Forneça uma lista de ${itemType} ${categoryFilter} ${searchQuery} com preços atualizados do mercado português (2024-2025).

IMPORTANTE:
1. Os preços devem ser realistas para o mercado português atual (Lisboa/Porto)
2. Inclua materiais/serviços comuns e úteis para orçamentos de construção
3. Use unidades padrão (m2, m3, ml, kg, un, vg, etc.)
4. Forneça preço mínimo e máximo para cada item
5. Categorize corretamente cada item

CATEGORIAS PARA MATERIAIS:
- Consumíveis (parafusos, pregos, colas, etc.)
- Estrutura (betão, aço, ferro, etc.)
- Revestimentos (azulejos, cerâmicos, pedra)
- Pavimentos (madeira, vinílico, cerâmico)
- Isolamentos (térmico, acústico)
- Pinturas (tintas, primários, vernizes)
- Instalações (tubos, cabos, torneiras)

CATEGORIAS PARA TRABALHOS:
- Demolições
- Alvenaria
- Pinturas
- Revestimentos
- Pavimentos
- Isolamentos
- Coberturas
- Impermeabilizações
- Carpintarias
- Instalações Elétricas
- Instalações Águas
- Instalações AVAC
- Arranjos Exteriores
- Estrutura
- Limpezas

Forneça 10-15 itens relevantes. Responda APENAS com um array JSON válido:
[
  {
    "name": "Nome do item",
    "unit": "m2",
    "priceMin": 10.00,
    "priceMax": 15.00,
    "category": "Categoria",
    "type": "${type}",
    "description": "Breve descrição (opcional)"
  }
]`

    const userPrompt = query 
      ? `Pesquise ${itemType} ${categoryFilter} relacionados com: ${query}`
      : `Liste os ${itemType} mais comuns e úteis ${categoryFilter} para orçamentos de construção em Portugal.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    })

    const content = response.choices[0]?.message?.content || "[]"
    
    // Extract JSON from response
    let suggestions: SuggestedMaterial[] = []
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error("Failed to parse GPT response:", parseError)
    }

    // Validate and clean suggestions
    suggestions = suggestions
      .filter(s => s.name && s.unit && s.priceMin >= 0 && s.priceMax > 0)
      .map(s => ({
        ...s,
        priceMin: Math.round(s.priceMin * 100) / 100,
        priceMax: Math.round(s.priceMax * 100) / 100,
        type: type as "material" | "work"
      }))

    return NextResponse.json({
      success: true,
      suggestions,
      query: query || null,
      category: category || null,
      type
    })

  } catch (error) {
    console.error("Error in suggest-materials API:", error)
    
    // Check for specific OpenAI errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    let userMessage = "Erro ao pesquisar materiais"
    
    if (errorMessage.includes("API key")) {
      userMessage = "Chave API inválida ou não configurada"
    } else if (errorMessage.includes("rate limit")) {
      userMessage = "Limite de requisições excedido. Tente novamente em alguns segundos."
    } else if (errorMessage.includes("timeout")) {
      userMessage = "Tempo de resposta excedido. Tente novamente."
    }
    
    return NextResponse.json({ 
      error: userMessage,
      message: errorMessage,
      suggestions: []
    }, { status: 500 })
  }
}
