import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Types
interface APIRequest {
  method: "GET" | "POST" | "PUT" | "DELETE"
  table: "budgets" | "budget_items" | "obras" | "materials"
  id?: string
  data?: Record<string, unknown>
  filters?: Record<string, unknown>
}

// Verify API key
async function verifyApiKey(key: string, supabase: any): Promise<{ valid: boolean; ownerId?: string }> {
  try {
    if (!supabase) {
      console.warn("Supabase not available for API key verification")
      return { valid: false }
    }

    // Hash the provided key to compare with stored hash
    const keyHash = crypto.createHash("sha256").update(key).digest("hex")

    const { data: apiKey } = await supabase
      .from("api_keys")
      .select("owner_id, is_active, expires_at")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .single()

    if (!apiKey) return { valid: false }

    // Check expiration
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return { valid: false }
    }

    // Update last used
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("key_hash", keyHash)

    return { valid: true, ownerId: apiKey.owner_id }
  } catch (error) {
    console.error("API key verification error:", error)
    return { valid: false }
  }
}

// Main handler
export async function POST(req: NextRequest) {
  try {
    // Get API key from header
    const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "")

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 })
    }

    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }

    // Verify API key
    const { valid, ownerId } = await verifyApiKey(apiKey, supabase)
    if (!valid) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    // Parse request body
    const body: APIRequest = await req.json()

    // Validate request
    if (!body.table || !body.method) {
      return NextResponse.json({ error: "Missing required fields: table, method" }, { status: 400 })
    }

    // Route based on method and table
    switch (body.method) {
      case "GET":
        return await handleGet(supabase, body, ownerId)
      case "POST":
        return await handlePost(supabase, body, ownerId)
      case "PUT":
        return await handlePut(supabase, body, ownerId)
      case "DELETE":
        return await handleDelete(supabase, body, ownerId)
      default:
        return NextResponse.json({ error: "Invalid method" }, { status: 400 })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET handler
async function handleGet(supabase: any, request: APIRequest, ownerId: string) {
  try {
    let query = supabase.from(request.table).select("*")

    // Apply filters
    if (request.filters) {
      for (const [key, value] of Object.entries(request.filters)) {
        query = query.eq(key, value)
      }
    }

    // Owner-based filtering for sensitive data
    if (["budgets", "budget_items"].includes(request.table)) {
      query = query.eq("uploaded_by", ownerId)
    } else if (request.table === "obras") {
      query = query.or(`client_id.eq.${ownerId},created_by.eq.${ownerId}`)
    }

    // Get specific record if ID provided
    if (request.id) {
      query = query.eq("id", request.id)
      const { data, error } = await query.single()
      if (error) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 })
      }
      return NextResponse.json({ data })
    }

    const { data, error } = await query.limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data, count: data?.length || 0 })
  } catch (error) {
    console.error("GET error:", error)
    return NextResponse.json({ error: "GET request failed" }, { status: 500 })
  }
}

// POST handler
async function handlePost(supabase: any, request: APIRequest, ownerId: string) {
  try {
    if (!request.data) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    // Add owner information
    const dataWithOwner = {
      ...request.data,
      uploaded_by: ownerId,
      created_by: ownerId,
    }

    const { data, error } = await supabase.from(request.table).insert(dataWithOwner).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data, message: "Record created successfully" }, { status: 201 })
  } catch (error) {
    console.error("POST error:", error)
    return NextResponse.json({ error: "POST request failed" }, { status: 500 })
  }
}

// PUT handler
async function handlePut(supabase: any, request: APIRequest, ownerId: string) {
  try {
    if (!request.id || !request.data) {
      return NextResponse.json({ error: "Missing id or data" }, { status: 400 })
    }

    // Verify ownership before updating
    let ownershipCheck = supabase.from(request.table)

    if (["budgets", "budget_items"].includes(request.table)) {
      ownershipCheck = ownershipCheck.select("id").eq("id", request.id).eq("uploaded_by", ownerId)
    } else if (request.table === "obras") {
      ownershipCheck = ownershipCheck.select("id").eq("id", request.id)
    }

    const { data: existing, error: checkError } = await ownershipCheck.single()

    if (checkError || !existing) {
      return NextResponse.json({ error: "Record not found or no permission" }, { status: 404 })
    }

    const { data, error } = await supabase.from(request.table).update(request.data).eq("id", request.id).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data, message: "Record updated successfully" })
  } catch (error) {
    console.error("PUT error:", error)
    return NextResponse.json({ error: "PUT request failed" }, { status: 500 })
  }
}

// DELETE handler
async function handleDelete(supabase: any, request: APIRequest, ownerId: string) {
  try {
    if (!request.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    // Verify ownership before deleting
    let ownershipCheck = supabase.from(request.table)

    if (["budgets", "budget_items"].includes(request.table)) {
      ownershipCheck = ownershipCheck.select("id").eq("id", request.id).eq("uploaded_by", ownerId)
    } else if (request.table === "obras") {
      ownershipCheck = ownershipCheck.select("id").eq("id", request.id)
    }

    const { data: existing, error: checkError } = await ownershipCheck.single()

    if (checkError || !existing) {
      return NextResponse.json({ error: "Record not found or no permission" }, { status: 404 })
    }

    const { error } = await supabase.from(request.table).delete().eq("id", request.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: "Record deleted successfully" })
  } catch (error) {
    console.error("DELETE error:", error)
    return NextResponse.json({ error: "DELETE request failed" }, { status: 500 })
  }
}
