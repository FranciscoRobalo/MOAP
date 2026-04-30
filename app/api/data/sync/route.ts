import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Sync all user data to/from Supabase
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Allow fetching even without auth for demo users
    const userId = user?.id
    
    // Fetch materials (global, not user-specific)
    const { data: materials } = await supabase
      .from("materials")
      .select("*")
      .order("name")
    
    // Fetch user-specific data if authenticated
    let budgets: any[] = []
    let obras: any[] = []
    let visitas: any[] = []
    let notifications: any[] = []
    let profiles: any[] = []
    let analises: any[] = []
    
    if (userId) {
      // Fetch budgets
      const { data: budgetsData } = await supabase
        .from("budgets")
        .select("*, budget_items(*)")
        .or(`uploaded_by.eq.${userId},analyzed_by.eq.${userId}`)
        .order("created_at", { ascending: false })
      budgets = budgetsData || []
      
      // Fetch obras
      const { data: obrasData } = await supabase
        .from("obras")
        .select("*")
        .or(`client_id.eq.${userId},created_by.eq.${userId},assigned_to.eq.${userId}`)
        .order("created_at", { ascending: false })
      obras = obrasData || []
      
      // Fetch visitas
      const { data: visitasData } = await supabase
        .from("visitas")
        .select("*")
        .order("date", { ascending: false })
      visitas = visitasData || []
      
      // Fetch notifications
      const { data: notificationsData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)
      notifications = notificationsData || []
      
      // Fetch saved analyses
      const { data: analisesData } = await supabase
        .from("analise_saved")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
      analises = analisesData || []
    }
    
    // Fetch all profiles for admin view
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("name")
    profiles = profilesData || []
    
    return NextResponse.json({
      success: true,
      data: {
        materials: (materials || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          unit: m.unit,
          price: parseFloat(m.min_price || m.avg_price),
          priceMax: parseFloat(m.max_price || m.avg_price),
          category: m.category,
          type: "material",
          region: m.region || "Nacional",
          lastUpdated: m.last_updated || m.created_at
        })),
        budgets: budgets.map((b: any) => ({
          id: b.id,
          name: b.name,
          obraId: b.obra_id,
          obraName: obras.find((o: any) => o.id === b.obra_id)?.title || "Obra",
          userId: b.uploaded_by,
          createdDate: b.created_at,
          status: b.status,
          items: b.budget_items || [],
          totalValue: parseFloat(b.total_value || 0),
          analysisVariance: null
        })),
        obras: obras.map((o: any) => ({
          id: o.id,
          title: o.title,
          client: o.client_name,
          location: o.location,
          category: o.category,
          budget: parseFloat(o.budget || 0),
          startDate: o.start_date,
          endDate: o.end_date,
          status: o.status,
          description: o.description,
          area: o.area,
          type: o.type,
          timeline: o.timeline,
          contact: {
            name: o.contact_name,
            email: o.contact_email,
            phone: o.contact_phone
          },
          progress: o.progress || 0,
          createdAt: o.created_at,
          updatedAt: o.updated_at
        })),
        visitas: visitas.map((v: any) => ({
          id: v.id,
          obraId: v.obra_id,
          obraName: obras.find((o: any) => o.id === v.obra_id)?.title || "Obra",
          date: v.date,
          time: v.time,
          type: v.type,
          contactName: v.contact_name,
          contactPhone: v.contact_phone,
          notes: v.notes,
          status: v.status
        })),
        notifications: notifications.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          description: n.description,
          timestamp: n.created_at,
          read: n.read,
          link: n.link
        })),
        users: profiles.map((p: any) => ({
          id: p.id,
          name: p.name || "User",
          email: p.email,
          role: p.role || "cliente",
          company: p.company || "",
          avatar: p.avatar_url || "/placeholder.svg",
          online: false,
          joinDate: p.created_at
        })),
        analises: analises.map((a: any) => ({
          id: a.id,
          fileName: a.file_name,
          uploadDate: a.created_at,
          region: a.region,
          totalBudget: parseFloat(a.total_budget || 0),
          totalReference: parseFloat(a.total_reference || 0),
          overallVariance: parseFloat(a.overall_variance || 0),
          overallRating: a.overall_rating,
          items: a.items || [],
          stats: a.stats || {},
          categoryBreakdown: a.category_breakdown || [],
          recommendations: a.recommendations || [],
          qualityScore: a.quality_score
        }))
      }
    })
  } catch (error) {
    console.error("Data sync error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to sync data" 
    }, { status: 500 })
  }
}

// Save data to Supabase
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "Authentication required" 
      }, { status: 401 })
    }
    
    const body = await req.json()
    const { type, data } = body
    
    switch (type) {
      case "material": {
        const { error } = await supabase.from("materials").upsert({
          id: data.id,
          name: data.name,
          unit: data.unit,
          min_price: data.price,
          avg_price: (data.price + (data.priceMax || data.price)) / 2,
          max_price: data.priceMax || data.price,
          category: data.category,
          region: data.region || "Nacional",
          created_by: user.id,
          last_updated: new Date().toISOString()
        })
        if (error) throw error
        break
      }
      
      case "budget": {
        const { error } = await supabase.from("budgets").upsert({
          id: data.id,
          name: data.name,
          obra_id: data.obraId,
          uploaded_by: user.id,
          status: data.status,
          total_value: data.totalValue,
          total_items: data.items?.length || 0,
          updated_at: new Date().toISOString()
        })
        if (error) throw error
        break
      }
      
      case "obra": {
        const { error } = await supabase.from("obras").upsert({
          id: data.id,
          title: data.title,
          client_name: data.client,
          client_id: user.id,
          location: data.location,
          category: data.category,
          description: data.description,
          area: data.area,
          type: data.type,
          budget: data.budget,
          start_date: data.startDate,
          end_date: data.endDate,
          timeline: data.timeline,
          status: data.status,
          progress: data.progress || 0,
          contact_name: data.contact?.name,
          contact_email: data.contact?.email,
          contact_phone: data.contact?.phone,
          created_by: user.id,
          updated_at: new Date().toISOString()
        })
        if (error) throw error
        break
      }
      
      case "visita": {
        const { error } = await supabase.from("visitas").upsert({
          id: data.id,
          obra_id: data.obraId,
          date: data.date,
          time: data.time,
          type: data.type,
          contact_name: data.contactName,
          contact_phone: data.contactPhone,
          notes: data.notes,
          status: data.status,
          created_by: user.id
        })
        if (error) throw error
        break
      }
      
      case "notification": {
        const { error } = await supabase.from("notifications").insert({
          user_id: user.id,
          type: data.type,
          title: data.title,
          description: data.description,
          link: data.link,
          read: false
        })
        if (error) throw error
        break
      }
      
      case "analysis": {
        const { error } = await supabase.from("analise_saved").upsert({
          id: data.id,
          user_id: user.id,
          file_name: data.fileName,
          region: data.region,
          total_budget: data.totalBudget,
          total_reference: data.totalReference,
          overall_variance: data.overallVariance,
          overall_rating: data.overallRating,
          quality_score: data.qualityScore,
          match_rate: data.stats?.matchRate,
          potential_savings: data.stats?.potentialSavings,
          risk_items: data.stats?.riskItems,
          stats: data.stats,
          category_breakdown: data.categoryBreakdown,
          recommendations: data.recommendations,
          items: data.items,
          submission_status: "draft",
          updated_at: new Date().toISOString()
        })
        if (error) throw error
        break
      }
      
      case "mark_notification_read": {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", data.id)
          .eq("user_id", user.id)
        if (error) throw error
        break
      }
      
      case "delete_notification": {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", data.id)
          .eq("user_id", user.id)
        if (error) throw error
        break
      }
      
      case "delete": {
        const { table, id } = data
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("id", id)
        if (error) throw error
        break
      }
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: "Unknown operation type" 
        }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Data save error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to save data" 
    }, { status: 500 })
  }
}
