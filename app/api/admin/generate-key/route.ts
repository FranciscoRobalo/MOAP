import { db } from "@/lib/db"
import { apiKeys } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, ownerId, expiresInDays = 365 } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const apiKey = `moap_${crypto.randomBytes(32).toString("hex")}`
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    await db.insert(apiKeys).values({
      name,
      keyHash,
      keyPrefix: apiKey.substring(0, 12),
      ownerId: ownerId || "admin",
      isActive: true,
      expiresAt,
    })

    return NextResponse.json({
      success: true,
      message: "API key generated successfully. Store this key securely - it will not be shown again.",
      data: {
        apiKey,
        keyPrefix: apiKey.substring(0, 12),
        name,
        expiresAt: expiresAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error("Generate API key error:", error)
    return NextResponse.json({ error: "Failed to generate API key" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        ownerId: apiKeys.ownerId,
        isActive: apiKeys.isActive,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
      })
      .from(apiKeys)
      .orderBy(apiKeys.createdAt)

    return NextResponse.json({ keys })
  } catch (error) {
    console.error("Get API keys error:", error)
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
  }
}
