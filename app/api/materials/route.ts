import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { materials } from "@/lib/db/schema"
import { asc, eq } from "drizzle-orm"
import { getApiSession } from "@/lib/api-auth"

// GET - Fetch all materials from database (auto-sync)
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(materials)
      .orderBy(asc(materials.category), asc(materials.name))

    // Transform to match frontend Material interface
    const transformedMaterials = rows.map((m) => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      price: m.avgPrice != null ? Number(m.avgPrice) : 0,
      priceMax: m.maxPrice != null ? Number(m.maxPrice) : undefined,
      priceMin: m.minPrice != null ? Number(m.minPrice) : undefined,
      category: m.category,
      type:
        m.category?.toLowerCase().includes("demoliç") ||
        m.category?.toLowerCase().includes("trabalho")
          ? "work"
          : "material",
      region: m.region || "Nacional",
      lastUpdated: m.lastUpdated?.toISOString(),
      keywords: m.keywords || [],
    }))

    return NextResponse.json({
      success: true,
      materials: transformedMaterials,
      count: transformedMaterials.length,
      lastSync: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Materials API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - Add new material (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { name, unit, price, priceMax, priceMin, category, region } = body

    if (!name || !unit || !price || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [created] = await db
      .insert(materials)
      .values({
        name,
        unit,
        avgPrice: String(price),
        maxPrice: String(priceMax || price * 1.2),
        minPrice: String(priceMin || price * 0.8),
        category,
        region: region || "Nacional",
        lastUpdated: new Date(),
        createdBy: session.userId,
      })
      .returning()

    return NextResponse.json({ success: true, material: created })
  } catch (error) {
    console.error("Add material error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PUT - Update material (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, unit, price, priceMax, priceMin, category, region } = body

    if (!id) {
      return NextResponse.json({ error: "Material ID required" }, { status: 400 })
    }

    const updates: Partial<typeof materials.$inferInsert> = { lastUpdated: new Date() }
    if (name) updates.name = name
    if (unit) updates.unit = unit
    if (price) updates.avgPrice = String(price)
    if (priceMax) updates.maxPrice = String(priceMax)
    if (priceMin) updates.minPrice = String(priceMin)
    if (category) updates.category = category
    if (region) updates.region = region

    const [updated] = await db
      .update(materials)
      .set(updates)
      .where(eq(materials.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, material: updated })
  } catch (error) {
    console.error("Update material error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE - Remove material (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Material ID required" }, { status: 400 })
    }

    await db.delete(materials).where(eq(materials.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete material error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
