import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch all materials from database (auto-sync)
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: materials, error } = await supabase
      .from("materials")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true })
    
    if (error) {
      console.error("Error fetching materials:", error)
      return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 })
    }
    
    // Transform to match frontend Material interface
    const transformedMaterials = (materials || []).map(m => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      price: m.avg_price,
      priceMax: m.max_price,
      priceMin: m.min_price,
      category: m.category,
      type: m.category?.toLowerCase().includes("demoliç") || 
            m.category?.toLowerCase().includes("trabalho") ? "work" : "material",
      region: m.region || "Nacional",
      lastUpdated: m.last_updated,
      keywords: m.keywords || []
    }))
    
    return NextResponse.json({ 
      success: true, 
      materials: transformedMaterials,
      count: transformedMaterials.length,
      lastSync: new Date().toISOString()
    })
  } catch (error) {
    console.error("Materials API error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// POST - Add new material (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    
    const body = await request.json()
    const { name, unit, price, priceMax, priceMin, category, region } = body
    
    if (!name || !unit || !price || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from("materials")
      .insert({
        name,
        unit,
        avg_price: price,
        max_price: priceMax || price * 1.2,
        min_price: priceMin || price * 0.8,
        category,
        region: region || "Nacional",
        last_updated: new Date().toISOString(),
        created_by: user.id
      })
      .select()
      .single()
    
    if (error) {
      console.error("Error adding material:", error)
      return NextResponse.json({ error: "Failed to add material" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, material: data })
  } catch (error) {
    console.error("Add material error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// PUT - Update material (admin only)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    
    const body = await request.json()
    const { id, name, unit, price, priceMax, priceMin, category, region } = body
    
    if (!id) {
      return NextResponse.json({ error: "Material ID required" }, { status: 400 })
    }
    
    const updates: Record<string, unknown> = { last_updated: new Date().toISOString() }
    if (name) updates.name = name
    if (unit) updates.unit = unit
    if (price) updates.avg_price = price
    if (priceMax) updates.max_price = priceMax
    if (priceMin) updates.min_price = priceMin
    if (category) updates.category = category
    if (region) updates.region = region
    
    const { data, error } = await supabase
      .from("materials")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    
    if (error) {
      console.error("Error updating material:", error)
      return NextResponse.json({ error: "Failed to update material" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, material: data })
  } catch (error) {
    console.error("Update material error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// DELETE - Remove material (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "Material ID required" }, { status: 400 })
    }
    
    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", id)
    
    if (error) {
      console.error("Error deleting material:", error)
      return NextResponse.json({ error: "Failed to delete material" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete material error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
