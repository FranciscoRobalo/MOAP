import { db } from "@/lib/db"
import {
  apiKeys,
  budgetItems,
  budgets,
  materials,
  obras,
  profiles,
} from "@/lib/db/schema"
import { and, eq, or } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Development API key for testing
const DEV_API_KEY = "moap_dev_key_2026_secure_connection"
const DEV_OWNER_ID = "dev-admin-1"

interface APIRequest {
  method?: "GET" | "POST" | "PUT" | "DELETE"
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

async function verifyApiKey(key: string): Promise<{ valid: boolean; ownerId?: string }> {
  if (key === DEV_API_KEY) return { valid: true, ownerId: DEV_OWNER_ID }

  try {
    const keyHash = crypto.createHash("sha256").update(key).digest("hex")
    const [row] = await db
      .select({ ownerId: apiKeys.ownerId, isActive: apiKeys.isActive, expiresAt: apiKeys.expiresAt })
      .from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)))
      .limit(1)

    if (!row) return { valid: false }
    if (row.expiresAt && new Date(row.expiresAt) < new Date()) return { valid: false }

    // Update last used (fire-and-forget)
    db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.keyHash, keyHash)).catch(() => {})

    return { valid: true, ownerId: row.ownerId ?? undefined }
  } catch {
    return key === DEV_API_KEY ? { valid: true, ownerId: DEV_OWNER_ID } : { valid: false }
  }
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "")
  if (!apiKey) return NextResponse.json({ error: "Missing API key" }, { status: 401 })

  const { valid, ownerId } = await verifyApiKey(apiKey)
  if (!valid) return NextResponse.json({ error: "Invalid API key" }, { status: 401 })

  try {
    const body: APIRequest = await req.json()

    if (body.action) {
      switch (body.action) {
        case "submit_budget":
          return handleSubmitBudget(body.data as unknown as BudgetSubmission, ownerId!)
        case "get_approved_budgets":
          return handleGetApprovedBudgets(ownerId!)
        case "sync_materials":
          return handleSyncMaterials()
        case "register_user":
          return handleRegisterUser(body.data as Record<string, unknown>)
        default:
          return NextResponse.json({ error: "Invalid action" }, { status: 400 })
      }
    }

    if (!body.table || !body.method) {
      return NextResponse.json({ error: "Missing table or method" }, { status: 400 })
    }

    switch (body.method) {
      case "GET": return handleGet(body, ownerId!)
      case "POST": return handlePost(body, ownerId!)
      case "PUT": return handlePut(body, ownerId!)
      case "DELETE": return handleDelete(body, ownerId!)
      default: return NextResponse.json({ error: "Invalid method" }, { status: 400 })
    }
  } catch (error) {
    console.error("External API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleGet(request: APIRequest, ownerId: string) {
  try {
    const tableMap: Record<string, typeof materials> = {
      materials: materials as any,
      budgets: budgets as any,
      obras: obras as any,
      profiles: profiles as any,
    }
    const tbl = tableMap[request.table!]
    if (!tbl) return NextResponse.json({ error: "Invalid table" }, { status: 400 })

    const rows = await db.select().from(tbl as any).limit(100)
    return NextResponse.json({ data: rows, count: rows.length })
  } catch (error) {
    return NextResponse.json({ error: "GET request failed" }, { status: 500 })
  }
}

async function handlePost(request: APIRequest, ownerId: string) {
  if (!request.data) return NextResponse.json({ error: "Missing data" }, { status: 400 })
  return NextResponse.json({ message: "Use the action-based API for writes" }, { status: 400 })
}

async function handlePut(request: APIRequest, ownerId: string) {
  return NextResponse.json({ message: "Use the action-based API for writes" }, { status: 400 })
}

async function handleDelete(request: APIRequest, ownerId: string) {
  return NextResponse.json({ message: "Use the action-based API for deletes" }, { status: 400 })
}

async function handleSubmitBudget(budgetData: BudgetSubmission, ownerId: string) {
  if (!budgetData?.items?.length) {
    return NextResponse.json({ error: "Invalid budget data - must include items" }, { status: 400 })
  }

  const totalValue = budgetData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  try {
    const [budget] = await db
      .insert(budgets)
      .values({
        name: budgetData.name,
        obraId: budgetData.obraId ? (budgetData.obraId as any) : null,
        uploadedBy: ownerId,
        status: "pendente",
        totalValue: totalValue.toString(),
        totalItems: budgetData.items.length,
      })
      .returning()

    await db.insert(budgetItems).values(
      budgetData.items.map((item) => ({
        budgetId: budget.id,
        originalName: item.materialName,
        matchedName: item.materialName,
        unit: item.unit,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        totalPrice: (item.quantity * item.unitPrice).toString(),
        category: item.category,
      }))
    )

    return NextResponse.json({
      success: true,
      message: "Budget submitted for admin approval",
      data: { budgetId: budget.id, status: "pendente", totalValue, itemCount: budgetData.items.length },
    }, { status: 201 })
  } catch (error) {
    console.error("Submit budget error:", error)
    return NextResponse.json({ error: "Failed to submit budget" }, { status: 500 })
  }
}

async function handleGetApprovedBudgets(ownerId: string) {
  const rows = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.uploadedBy, ownerId), eq(budgets.status, "aprovado")))
  return NextResponse.json({ success: true, data: rows, count: rows.length })
}

async function handleSyncMaterials() {
  const rows = await db
    .select({
      id: materials.id,
      name: materials.name,
      unit: materials.unit,
      avgPrice: materials.avgPrice,
      minPrice: materials.minPrice,
      maxPrice: materials.maxPrice,
      category: materials.category,
      lastUpdated: materials.lastUpdated,
    })
    .from(materials)
  return NextResponse.json({ success: true, data: rows, count: rows.length, lastSync: new Date().toISOString() })
}

async function handleRegisterUser(userData: Record<string, unknown>) {
  if (!userData.email || !userData.name) {
    return NextResponse.json({ error: "Email and name are required" }, { status: 400 })
  }
  // Check for existing profile
  const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, userData.email as string)).limit(1)
  if (existing.length) return NextResponse.json({ error: "Email already registered" }, { status: 409 })

  return NextResponse.json({
    success: true,
    message: "Please register through the MOAP platform directly",
  }, { status: 201 })
}
