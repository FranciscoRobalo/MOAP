import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Types
interface APIRequest {
  method: "GET" | "POST" | "PUT" | "DELETE"
  action?: "submit_budget" | "get_approved_budgets" | "sync_materials" | "register_user"
  table?: "budgets" | "budget_items" | "obras" | "materials" | "profiles"
  id?: string
  data?: Record<string, unknown>
  filters?: Record<string, unknown>
}

interface BudgetSubmission {
  name: string
  obraId?: string
  obraName: string
  items: {
    materialId: string
    materialName: string
    unit: string
    quantity: number
    unitPrice: number
    category: string
  }[]
  clientEmail?: string
  clientName?: string
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

    // Handle special actions first
    if (body.action) {
      switch (body.action) {
        case "submit_budget":
          return await handleSubmitBudget(supabase, body.data as unknown as BudgetSubmission, ownerId)
        case "get_approved_budgets":
          return await handleGetApprovedBudgets(supabase, ownerId)
        case "sync_materials":
          return await handleSyncMaterials(supabase)
        case "register_user":
          return await handleRegisterUser(supabase, body.data as Record<string, unknown>)
        default:
          return NextResponse.json({ error: "Invalid action" }, { status: 400 })
      }
    }

    // Validate table for CRUD operations
    if (!body.table || !body.method) {
      return NextResponse.json({ error: "Missing required fields: table, method (or use action for special operations)" }, { status: 400 })
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

    if (["budgets", "budget_items"].includes(request.table!)) {
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

// ============================================
// SPECIAL ACTION HANDLERS
// ============================================

// Submit a budget for admin approval (status starts as "pendente")
async function handleSubmitBudget(supabase: any, budgetData: BudgetSubmission, ownerId: string) {
  try {
    if (!budgetData || !budgetData.items || budgetData.items.length === 0) {
      return NextResponse.json({ error: "Invalid budget data - must include items" }, { status: 400 })
    }

    // Calculate total value (without admin margins - those are added by admin later)
    const totalValue = budgetData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

    // Create the budget with status "pendente" - admin must approve before client sees it
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .insert({
        name: budgetData.name,
        obra_id: budgetData.obraId || null,
        obra_name: budgetData.obraName,
        user_id: ownerId,
        status: "pendente", // Requires admin approval
        total_value: totalValue,
        visible_to_client: false, // Hidden until approved
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (budgetError) {
      console.error("Budget creation error:", budgetError)
      return NextResponse.json({ error: budgetError.message }, { status: 400 })
    }

    // Insert budget items
    const budgetItems = budgetData.items.map(item => ({
      budget_id: budget.id,
      material_id: item.materialId,
      material_name: item.materialName,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      category: item.category,
      admin_margin_percent: 0, // Admin will set this
      admin_margin_value: 0,
    }))

    const { error: itemsError } = await supabase
      .from("budget_items")
      .insert(budgetItems)

    if (itemsError) {
      console.error("Budget items error:", itemsError)
      // Rollback budget
      await supabase.from("budgets").delete().eq("id", budget.id)
      return NextResponse.json({ error: itemsError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Budget submitted for admin approval",
      data: {
        budgetId: budget.id,
        status: "pendente",
        totalValue,
        itemCount: budgetData.items.length,
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Submit budget error:", error)
    return NextResponse.json({ error: "Failed to submit budget" }, { status: 500 })
  }
}

// Get only approved budgets visible to the client
async function handleGetApprovedBudgets(supabase: any, ownerId: string) {
  try {
    const { data: budgets, error } = await supabase
      .from("budgets")
      .select(`
        id,
        name,
        obra_name,
        status,
        total_value,
        created_at,
        approved_at,
        budget_items (
          id,
          material_name,
          unit,
          quantity,
          unit_price,
          category
        )
      `)
      .eq("user_id", ownerId)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Return budgets WITHOUT admin margin information (that's private)
    const sanitizedBudgets = budgets?.map(budget => ({
      ...budget,
      budget_items: budget.budget_items?.map((item: any) => ({
        id: item.id,
        material_name: item.material_name,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        category: item.category,
        total: item.quantity * item.unit_price,
      }))
    }))

    return NextResponse.json({
      success: true,
      data: sanitizedBudgets,
      count: sanitizedBudgets?.length || 0,
    })
  } catch (error) {
    console.error("Get approved budgets error:", error)
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 })
  }
}

// Sync materials database - returns all material prices
async function handleSyncMaterials(supabase: any) {
  try {
    const { data: materials, error } = await supabase
      .from("materials")
      .select("id, name, unit, price, price_max, category, type, region, last_updated")
      .order("category")
      .order("name")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: materials,
      count: materials?.length || 0,
      lastSync: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Sync materials error:", error)
    return NextResponse.json({ error: "Failed to sync materials" }, { status: 500 })
  }
}

// Register a new user (pending admin approval)
async function handleRegisterUser(supabase: any, userData: Record<string, unknown>) {
  try {
    if (!userData.email || !userData.name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 })
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", userData.email)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    // Create pending registration (not a full user yet - admin must approve)
    const { data: registration, error } = await supabase
      .from("pending_registrations")
      .insert({
        email: userData.email,
        name: userData.name,
        company: userData.company || null,
        phone: userData.phone || null,
        role: userData.role || "cliente",
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Registration error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Registration submitted for admin approval",
      data: {
        registrationId: registration.id,
        status: "pending",
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Register user error:", error)
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
  }
}
