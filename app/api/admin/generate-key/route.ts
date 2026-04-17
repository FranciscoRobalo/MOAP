import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Generate a new API key for external website connection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, ownerId, expiresInDays = 365 } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Generate a secure random API key
    const apiKey = `moap_${crypto.randomBytes(32).toString("hex")}`
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex")

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    // Try to store in Supabase if available
    const supabase = await createClient()
    
    if (supabase) {
      try {
        const { error } = await supabase
          .from("api_keys")
          .insert({
            name,
            key_hash: keyHash,
            key_prefix: apiKey.substring(0, 12), // Store prefix for identification
            owner_id: ownerId || "admin",
            is_active: true,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
          })

        if (error) {
          console.error("Failed to store API key in database:", error)
        }
      } catch (dbError) {
        console.error("Database error:", dbError)
      }
    }

    // Return the API key (this is the only time it will be shown in full)
    return NextResponse.json({
      success: true,
      message: "API key generated successfully. Store this key securely - it will not be shown again.",
      data: {
        apiKey,
        keyPrefix: apiKey.substring(0, 12),
        name,
        expiresAt: expiresAt.toISOString(),
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Generate API key error:", error)
    return NextResponse.json({ error: "Failed to generate API key" }, { status: 500 })
  }
}

// Get list of API keys (without the actual keys, just metadata)
export async function GET() {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }

    const { data: keys, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, owner_id, is_active, expires_at, created_at, last_used_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch API keys:", error)
      return NextResponse.json({ keys: [] })
    }

    return NextResponse.json({ keys: keys || [] })
  } catch (error) {
    console.error("Get API keys error:", error)
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
  }
}
