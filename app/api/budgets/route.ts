import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { budgets, budgetItems } from "@/lib/db/schema"
import { desc, eq, inArray } from "drizzle-orm"
import { getApiSession } from "@/lib/api-auth"

interface BudgetItemInput {
  originalName: string
  matchedName?: string
  matchedMaterialId?: string
  matchConfidence?: number
  quantity: number
  unit: string
  unitPrice: number
  referenceAvgPrice?: number
  referenceMinPrice?: number
  referenceMaxPrice?: number
  variance?: number
  rating?: string
  category?: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function toItemValues(budgetId: string, item: BudgetItemInput) {
  return {
    budgetId,
    originalName: item.originalName,
    matchedName: item.matchedName || null,
    matchedMaterialId:
      item.matchedMaterialId && UUID_RE.test(item.matchedMaterialId)
        ? item.matchedMaterialId
        : null,
    matchConfidence: String(item.matchConfidence || 0),
    quantity: String(item.quantity),
    unit: item.unit,
    unitPrice: String(item.unitPrice),
    totalPrice: String(item.unitPrice * item.quantity),
    referenceAvgPrice: item.referenceAvgPrice != null ? String(item.referenceAvgPrice) : null,
    referenceMinPrice: item.referenceMinPrice != null ? String(item.referenceMinPrice) : null,
    referenceMaxPrice: item.referenceMaxPrice != null ? String(item.referenceMaxPrice) : null,
    variance: item.variance != null ? String(item.variance) : null,
    rating: item.rating || "unknown",
    category: item.category || "Sem categoria",
  }
}

// GET - Fetch user's budgets (admins see all)
export async function GET(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = session.role === "admin"

    const budgetRows = isAdmin
      ? await db.select().from(budgets).orderBy(desc(budgets.createdAt))
      : await db
          .select()
          .from(budgets)
          .where(eq(budgets.uploadedBy, session.userId))
          .orderBy(desc(budgets.createdAt))

    const budgetIds = budgetRows.map((b) => b.id)
    const itemRows = budgetIds.length
      ? await db.select().from(budgetItems).where(inArray(budgetItems.budgetId, budgetIds))
      : []

    const result = budgetRows.map((b) => ({
      ...b,
      budget_items: itemRows.filter((i) => i.budgetId === b.id),
    }))

    return NextResponse.json({
      success: true,
      budgets: result,
      count: result.length,
    })
  } catch (error) {
    console.error("Budgets API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - Create new budget with items (auto-save)
export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      obraId,
      fileName,
      items,
      totalValue,
      analysisScore,
      status = "pendente",
      notes,
    } = body

    if (!name || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const computedTotal =
      totalValue ||
      items.reduce((sum: number, i: BudgetItemInput) => sum + i.unitPrice * i.quantity, 0)

    const [budget] = await db
      .insert(budgets)
      .values({
        name,
        obraId: obraId && UUID_RE.test(obraId) ? obraId : null,
        uploadedBy: session.userId,
        fileUrl: fileName,
        status,
        totalValue: String(computedTotal),
        totalItems: items.length,
        analysisScore: analysisScore != null ? String(analysisScore) : null,
        notes,
      })
      .returning()

    // Create budget items
    const itemValues = items.map((item: BudgetItemInput) => toItemValues(budget.id, item))
    if (itemValues.length > 0) {
      try {
        await db.insert(budgetItems).values(itemValues)
      } catch (itemsError) {
        console.error("Error creating budget items:", itemsError)
        // Don't fail completely, budget was created
      }
    }

    return NextResponse.json({
      success: true,
      budget,
      itemsCount: itemValues.length,
    })
  } catch (error) {
    console.error("Create budget error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PUT - Update budget
export async function PUT(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, notes, analysisScore, items } = body

    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json({ error: "Budget ID required" }, { status: 400 })
    }

    const isAdmin = session.role === "admin"

    const [existingBudget] = await db.select().from(budgets).where(eq(budgets.id, id))

    if (!existingBudget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 })
    }

    if (!isAdmin && existingBudget.uploadedBy !== session.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Update budget
    const updates: Partial<typeof budgets.$inferInsert> = { updatedAt: new Date() }
    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes
    if (analysisScore !== undefined) updates.analysisScore = String(analysisScore)

    // If admin is analyzing, set analyzed_by
    if (isAdmin && status) {
      updates.analyzedBy = session.userId
      updates.analysisDate = new Date()
    }

    const [budget] = await db.update(budgets).set(updates).where(eq(budgets.id, id)).returning()

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete old items and insert new ones
      await db.delete(budgetItems).where(eq(budgetItems.budgetId, id))

      const itemValues = items.map((item: BudgetItemInput) => toItemValues(id, item))
      if (itemValues.length > 0) {
        await db.insert(budgetItems).values(itemValues)
      }
    }

    return NextResponse.json({ success: true, budget })
  } catch (error) {
    console.error("Update budget error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE - Remove budget
export async function DELETE(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json({ error: "Budget ID required" }, { status: 400 })
    }

    const isAdmin = session.role === "admin"

    const [existingBudget] = await db.select().from(budgets).where(eq(budgets.id, id))

    if (!existingBudget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 })
    }

    if (!isAdmin && existingBudget.uploadedBy !== session.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Delete items first, then the budget
    await db.delete(budgetItems).where(eq(budgetItems.budgetId, id))
    await db.delete(budgets).where(eq(budgets.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete budget error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
