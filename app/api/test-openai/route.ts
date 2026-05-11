import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function GET() {
  const hasKey = !!process.env.OPENAI_API_KEY
  const keyPrefix = process.env.OPENAI_API_KEY?.substring(0, 15) || "NOT_SET"
  
  if (!hasKey) {
    return NextResponse.json({
      success: false,
      error: "OPENAI_API_KEY not configured",
      keyPrefix
    })
  }
  
  try {
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 15000,
    })
    
    const startTime = Date.now()
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Responde apenas: OK" }],
      max_tokens: 10,
    })
    
    const elapsed = Date.now() - startTime
    const content = response.choices[0]?.message?.content || ""
    
    return NextResponse.json({
      success: true,
      message: "OpenAI connection working!",
      response: content,
      responseTime: `${elapsed}ms`,
      model: response.model,
      keyPrefix
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
      keyPrefix,
      errorType: error.constructor?.name
    })
  }
}
