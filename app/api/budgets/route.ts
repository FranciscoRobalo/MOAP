import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

// GET - Fetch user's budgets
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    
    const isAdmin = profile?.role === "admin"
    
    // Admins see all budgets, users see only their own
    let query = supabase
      .from("budgets")
      .select(`
        *,
        budget_items (*)
      `)
      .order("created_at", { ascending: false })
    
    if (!isAdmin) {
      query = query.eq("uploaded_by", user.id)
    }
    
    const { data: budgets, error } = await query
    
    if (error) {
      console.error("Error fetching budgets:", error)
      return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      budgets: budgets || [],
      count: budgets?.length || 0
    })
  } catch (error) {
    console.error("Budgets API error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// POST - Create new budget with items (auto-save)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
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
      region,
      status = "pendente",
      notes
    } = body
    
    if (!name || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    // Create budget
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .insert({
        name,
        obra_id: obraId || null,
        uploaded_by: user.id,
        file_url: fileName,
        status,
        total_value: totalValue || items.reduce((sum: number, i: BudgetItemInput) => sum + (i.unitPrice * i.quantity), 0),
        total_items: items.length,
        analysis_score: analysisScore,
        notes
      })
      .select()
      .single()
    
    if (budgetError) {
      console.error("Error creating budget:", budgetError)
      return NextResponse.json({ error: "Failed to create budget" }, { status: 500 })
    }
    
    // Create budget items
    const budgetItems = items.map((item: BudgetItemInput) => ({
      budget_id: budget.id,
      original_name: item.originalName,
      matched_name: item.matchedName || null,
      matched_material_id: item.matchedMaterialId || null,
      match_confidence: item.matchConfidence || 0,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unitPrice,
      total_price: item.unitPrice * item.quantity,
      reference_avg_price: item.referenceAvgPrice || null,
      reference_min_price: item.referenceMinPrice || null,
      reference_max_price: item.referenceMaxPrice || null,
      variance: item.variance || null,
      rating: item.rating || "unknown",
      category: item.category || "Sem categoria"
    }))
    
    const { error: itemsError } = await supabase
      .from("budget_items")
      .insert(budgetItems)
    
    if (itemsError) {
      console.error("Error creating budget items:", itemsError)
      // Don't fail completely, budget was created
    }
    
    return NextResponse.json({ 
      success: true, 
      budget,
      itemsCount: budgetItems.length
    })
  } catch (error) {
    console.error("Create budget error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// PUT - Update budget
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { id, status, notes, analysisScore, items } = body
    
    if (!id) {
      return NextResponse.json({ error: "Budget ID required" }, { status: 400 })
    }
    
    // Verify ownership or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    
    const isAdmin = profile?.role === "admin"
    
    const { data: existingBudget } = await supabase
      .from("budgets")
      .select("uploaded_by")
      .eq("id", id)
      .single()
    
    if (!existingBudget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 })
    }
    
    if (!isAdmin && existingBudget.uploaded_by !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    // Update budget
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes
    if (analysisScore !== undefined) updates.analysis_score = analysisScore
    
    // If admin is analyzing, set analyzed_by
    if (isAdmin && status) {
      updates.analyzed_by = user.id
      updates.analysis_date = new Date().toISOString()
    }
    
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    
    if (budgetError) {
      console.error("Error updating budget:", budgetError)
      return NextResponse.json({ error: "Failed to update budget" }, { status: 500 })
    }
    
    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete old items and insert new ones
      await supabase.from("budget_items").delete().eq("budget_id", id)
      
      const budgetItems = items.map((item: BudgetItemInput) => ({
        budget_id: id,
        original_name: item.originalName,
        matched_name: item.matchedName || null,
        matched_material_id: item.matchedMaterialId || null,
        match_confidence: item.matchConfidence || 0,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
        reference_avg_price: item.referenceAvgPrice || null,
        reference_min_price: item.referenceMinPrice || null,
        reference_max_price: item.referenceMaxPrice || null,
        variance: item.variance || null,
        rating: item.rating || "unknown",
        category: item.category || "Sem categoria"
      }))
      
      await supabase.from("budget_items").insert(budgetItems)
    }
    
    return NextResponse.json({ success: true, budget })
  } catch (error) {
    console.error("Update budget error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// DELETE - Remove budget
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "Budget ID required" }, { status: 400 })
    }
    
    // Verify ownership or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    
    const isAdmin = profile?.role === "admin"
    
    const { data: existingBudget } = await supabase
      .from("budgets")
      .select("uploaded_by")
      .eq("id", id)
      .single()
    
    if (!existingBudget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 })
    }
    
    if (!isAdmin && existingBudget.uploaded_by !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    // Delete budget (items cascade delete)
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("id", id)
    
    if (error) {
      console.error("Error deleting budget:", error)
      return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete budget error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
