import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  materials,
  budgets,
  budgetItems,
  obras,
  visitas,
  notifications,
  profiles,
  analiseSaved,
} from "@/lib/db/schema"
import { and, asc, desc, eq, inArray, or } from "drizzle-orm"
import { getApiSession } from "@/lib/api-auth"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function asUuid(id: unknown): string | undefined {
  return typeof id === "string" && UUID_RE.test(id) ? id : undefined
}

// Sync all user data from Neon
export async function GET() {
  try {
    const session = await getApiSession()
    const userId = session?.userId

    // Fetch materials (global, not user-specific)
    const materialRows = await db.select().from(materials).orderBy(asc(materials.name))

    let budgetRows: (typeof budgets.$inferSelect & { budget_items: (typeof budgetItems.$inferSelect)[] })[] = []
    let obraRows: (typeof obras.$inferSelect)[] = []
    let visitaRows: (typeof visitas.$inferSelect)[] = []
    let notificationRows: (typeof notifications.$inferSelect)[] = []
    let analiseRows: (typeof analiseSaved.$inferSelect)[] = []

    if (userId) {
      const rawBudgets = await db
        .select()
        .from(budgets)
        .where(or(eq(budgets.uploadedBy, userId), eq(budgets.analyzedBy, userId)))
        .orderBy(desc(budgets.createdAt))

      const budgetIds = rawBudgets.map((b) => b.id)
      const itemRows = budgetIds.length
        ? await db.select().from(budgetItems).where(inArray(budgetItems.budgetId, budgetIds))
        : []

      budgetRows = rawBudgets.map((b) => ({
        ...b,
        budget_items: itemRows.filter((i) => i.budgetId === b.id),
      }))

      obraRows = await db
        .select()
        .from(obras)
        .where(
          or(eq(obras.clientId, userId), eq(obras.createdBy, userId), eq(obras.assignedTo, userId)),
        )
        .orderBy(desc(obras.createdAt))

      visitaRows = await db.select().from(visitas).orderBy(desc(visitas.date))

      notificationRows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(50)

      analiseRows = await db
        .select()
        .from(analiseSaved)
        .where(eq(analiseSaved.userId, userId))
        .orderBy(desc(analiseSaved.createdAt))
    }

    // Fetch all profiles for admin view
    const profileRows = await db.select().from(profiles).orderBy(asc(profiles.name))

    return NextResponse.json({
      success: true,
      data: {
        materials: materialRows.map((m) => ({
          id: m.id,
          name: m.name,
          unit: m.unit,
          price: Number(m.minPrice ?? m.avgPrice ?? 0),
          priceMax: Number(m.maxPrice ?? m.avgPrice ?? 0),
          category: m.category,
          type: "material",
          region: m.region || "Nacional",
          lastUpdated: m.lastUpdated?.toISOString() || m.createdAt?.toISOString(),
        })),
        budgets: budgetRows.map((b) => ({
          id: b.id,
          name: b.name,
          obraId: b.obraId,
          obraName: obraRows.find((o) => o.id === b.obraId)?.title || "Obra",
          userId: b.uploadedBy,
          createdDate: b.createdAt?.toISOString(),
          status: b.status,
          items: b.budget_items,
          totalValue: Number(b.totalValue ?? 0),
          analysisVariance: null,
        })),
        obras: obraRows.map((o) => ({
          id: o.id,
          title: o.title,
          client: o.clientName,
          location: o.location,
          category: o.category,
          budget: Number(o.budget ?? 0),
          startDate: o.startDate,
          endDate: o.endDate,
          status: o.status,
          description: o.description,
          area: o.area,
          type: o.type,
          timeline: o.timeline,
          contact: {
            name: o.contactName,
            email: o.contactEmail,
            phone: o.contactPhone,
          },
          progress: o.progress || 0,
          createdAt: o.createdAt?.toISOString(),
          updatedAt: o.updatedAt?.toISOString(),
        })),
        visitas: visitaRows.map((v) => ({
          id: v.id,
          obraId: v.obraId,
          obraName: obraRows.find((o) => o.id === v.obraId)?.title || "Obra",
          date: v.date,
          time: v.time,
          type: v.type,
          contactName: v.contactName,
          contactPhone: v.contactPhone,
          notes: v.notes,
          status: v.status,
        })),
        notifications: notificationRows.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          description: n.description,
          timestamp: n.createdAt?.toISOString(),
          read: n.read,
          link: n.link,
        })),
        users: profileRows.map((p) => ({
          id: p.id,
          name: p.name || "User",
          email: p.email,
          role: p.role || "cliente",
          company: p.company || "",
          avatar: p.avatarUrl || "/placeholder.svg",
          online: false,
          joinDate: p.createdAt?.toISOString(),
        })),
        analises: analiseRows.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          uploadDate: a.createdAt?.toISOString(),
          region: a.region,
          totalBudget: Number(a.totalBudget ?? 0),
          totalReference: Number(a.totalReference ?? 0),
          overallVariance: Number(a.overallVariance ?? 0),
          overallRating: a.overallRating,
          items: a.items || [],
          stats: a.stats || {},
          categoryBreakdown: a.categoryBreakdown || [],
          recommendations: a.recommendations || [],
          qualityScore: a.qualityScore != null ? Number(a.qualityScore) : null,
        })),
      },
    })
  } catch (error) {
    console.error("Data sync error:", error)
    return NextResponse.json({ success: false, error: "Failed to sync data" }, { status: 500 })
  }
}

// Save data to Neon
export async function POST(req: Request) {
  try {
    const session = await getApiSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      )
    }

    const userId = session.userId
    const body = await req.json()
    const { type, data } = body

    switch (type) {
      case "material": {
        const price = Number(data.price ?? 0)
        const priceMax = Number(data.priceMax ?? data.price ?? 0)
        const values = {
          name: data.name,
          unit: data.unit,
          minPrice: String(price),
          avgPrice: String((price + priceMax) / 2),
          maxPrice: String(priceMax),
          category: data.category,
          region: data.region || "Nacional",
          createdBy: userId,
          lastUpdated: new Date(),
        }
        const id = asUuid(data.id)
        if (id) {
          await db
            .insert(materials)
            .values({ id, ...values })
            .onConflictDoUpdate({ target: materials.id, set: values })
        } else {
          await db.insert(materials).values(values)
        }
        break
      }

      case "budget": {
        const values = {
          name: data.name,
          obraId: asUuid(data.obraId) ?? null,
          uploadedBy: userId,
          status: data.status,
          totalValue: data.totalValue != null ? String(data.totalValue) : null,
          totalItems: data.items?.length || 0,
          updatedAt: new Date(),
        }
        const id = asUuid(data.id)
        if (id) {
          await db
            .insert(budgets)
            .values({ id, ...values })
            .onConflictDoUpdate({ target: budgets.id, set: values })
        } else {
          await db.insert(budgets).values(values)
        }
        break
      }

      case "obra": {
        const values = {
          title: data.title,
          clientName: data.client,
          clientId: userId,
          location: data.location,
          category: data.category,
          description: data.description,
          area: data.area,
          type: data.type,
          budget: data.budget != null ? String(data.budget) : null,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          timeline: data.timeline,
          status: data.status,
          progress: data.progress || 0,
          contactName: data.contact?.name,
          contactEmail: data.contact?.email,
          contactPhone: data.contact?.phone,
          createdBy: userId,
          updatedAt: new Date(),
        }
        const id = asUuid(data.id)
        if (id) {
          await db
            .insert(obras)
            .values({ id, ...values })
            .onConflictDoUpdate({ target: obras.id, set: values })
        } else {
          await db.insert(obras).values(values)
        }
        break
      }

      case "visita": {
        const values = {
          obraId: asUuid(data.obraId) ?? null,
          date: data.date || null,
          time: data.time,
          type: data.type,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          notes: data.notes,
          status: data.status,
          createdBy: userId,
        }
        const id = asUuid(data.id)
        if (id) {
          await db
            .insert(visitas)
            .values({ id, ...values })
            .onConflictDoUpdate({ target: visitas.id, set: values })
        } else {
          await db.insert(visitas).values(values)
        }
        break
      }

      case "notification": {
        await db.insert(notifications).values({
          userId,
          type: data.type,
          title: data.title,
          description: data.description,
          link: data.link,
          read: false,
        })
        break
      }

      case "analysis": {
        const values = {
          userId,
          fileName: data.fileName,
          region: data.region,
          totalBudget: data.totalBudget != null ? String(data.totalBudget) : null,
          totalReference: data.totalReference != null ? String(data.totalReference) : null,
          overallVariance: data.overallVariance != null ? String(data.overallVariance) : null,
          overallRating: data.overallRating,
          qualityScore: data.qualityScore != null ? String(data.qualityScore) : null,
          matchRate: data.stats?.matchRate != null ? String(data.stats.matchRate) : null,
          potentialSavings:
            data.stats?.potentialSavings != null ? String(data.stats.potentialSavings) : null,
          riskItems: data.stats?.riskItems ?? null,
          stats: data.stats,
          categoryBreakdown: data.categoryBreakdown,
          recommendations: data.recommendations,
          items: data.items,
          submissionStatus: "draft",
          updatedAt: new Date(),
        }
        const id = asUuid(data.id)
        if (id) {
          await db
            .insert(analiseSaved)
            .values({ id, ...values })
            .onConflictDoUpdate({ target: analiseSaved.id, set: values })
        } else {
          await db.insert(analiseSaved).values(values)
        }
        break
      }

      case "mark_notification_read": {
        const id = asUuid(data.id)
        if (id) {
          await db
            .update(notifications)
            .set({ read: true })
            .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        }
        break
      }

      case "delete_notification": {
        const id = asUuid(data.id)
        if (id) {
          await db
            .delete(notifications)
            .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        }
        break
      }

      case "delete": {
        const { table, id } = data
        const uuid = asUuid(id)
        if (!uuid) break
        // Whitelisted tables only (prevents arbitrary table access)
        switch (table) {
          case "materials":
            if (session.role === "admin") await db.delete(materials).where(eq(materials.id, uuid))
            break
          case "budgets":
            await db
              .delete(budgets)
              .where(and(eq(budgets.id, uuid), eq(budgets.uploadedBy, userId)))
            break
          case "obras":
            await db
              .delete(obras)
              .where(
                and(
                  eq(obras.id, uuid),
                  or(eq(obras.createdBy, userId), eq(obras.clientId, userId)),
                ),
              )
            break
          case "visitas":
            await db
              .delete(visitas)
              .where(and(eq(visitas.id, uuid), eq(visitas.createdBy, userId)))
            break
          case "analise_saved":
            await db
              .delete(analiseSaved)
              .where(and(eq(analiseSaved.id, uuid), eq(analiseSaved.userId, userId)))
            break
          default:
            return NextResponse.json(
              { success: false, error: "Unknown table" },
              { status: 400 },
            )
        }
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: "Unknown operation type" },
          { status: 400 },
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Data save error:", error)
    return NextResponse.json({ success: false, error: "Failed to save data" }, { status: 500 })
  }
}
