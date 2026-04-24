import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, company, subject, message } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Format email content
    const emailContent = `
Nome: ${name}
Email: ${email}
Telefone: ${phone || "Não fornecido"}
Empresa: ${company || "Não fornecido"}
Assunto: ${subject}

Mensagem:
${message}
    `.trim()

    // Log the contact message (in production, integrate with email service)
    console.log("[v0] Contact form submission:", {
      name,
      email,
      subject,
      timestamp: new Date().toISOString(),
    })

    // TODO: Send email using service like SendGrid, Resend, or nodemailer
    // For now, we just log and return success
    
    return NextResponse.json({
      success: true,
      message: "Contact message received. We will get back to you soon.",
    })
  } catch (error) {
    console.error("[v0] Contact form error:", error)
    return NextResponse.json(
      { error: "Failed to process contact form" },
      { status: 500 }
    )
  }
}
