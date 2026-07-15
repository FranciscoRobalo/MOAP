"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles, user as userTable } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { headers } from "next/headers"

export interface ProfileData {
  id: string
  email: string
  name: string
  role: "admin" | "tecnico" | "cliente"
  company?: string | null
  phone?: string | null
  avatarUrl?: string | null
  approved: boolean
  createdAt?: string
}

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user
}

async function requireAdmin() {
  const sessionUser = await getSessionUser()
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, sessionUser.id))
  if (!profile || profile.role !== "admin") throw new Error("Forbidden")
  return sessionUser
}

function mapProfile(p: typeof profiles.$inferSelect): ProfileData {
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    role: p.role as ProfileData["role"],
    company: p.company,
    phone: p.phone,
    avatarUrl: p.avatarUrl,
    approved: p.approved ?? false,
    createdAt: p.createdAt?.toISOString(),
  }
}

// Get the profile of the currently signed-in user (or null)
export async function getMyProfile(): Promise<ProfileData | null> {
  try {
    const sessionUser = await getSessionUser()
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, sessionUser.id))
    if (!profile) return null
    return mapProfile(profile)
  } catch {
    return null
  }
}

// Called right after Better Auth sign-up to create the app profile.
// New registrations start unapproved (except the very first user, who
// becomes an approved admin so the system is bootstrappable).
export async function createMyProfile(data: {
  role: "tecnico" | "cliente"
  company?: string
  phone?: string
}): Promise<ProfileData> {
  const sessionUser = await getSessionUser()

  const [existing] = await db.select().from(profiles).where(eq(profiles.id, sessionUser.id))
  if (existing) return mapProfile(existing)

  const [{ count }] = await db
    .select({ count: profiles.id })
    .from(profiles)
    .limit(1)
    .then((rows) => [{ count: rows.length }])

  const isFirstUser = count === 0

  const [created] = await db
    .insert(profiles)
    .values({
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
      role: isFirstUser ? "admin" : data.role,
      company: data.company || null,
      phone: data.phone || null,
      approved: isFirstUser,
    })
    .returning()

  return mapProfile(created)
}

// Admin: list registrations awaiting approval
export async function listPendingProfiles(): Promise<ProfileData[]> {
  await requireAdmin()
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.approved, false))
    .orderBy(desc(profiles.createdAt))
  return rows.map(mapProfile)
}

// Admin: approve a registration
export async function approveProfile(id: string): Promise<void> {
  const admin = await requireAdmin()
  await db
    .update(profiles)
    .set({ approved: true, approvedBy: admin.id, approvedAt: new Date(), updatedAt: new Date() })
    .where(eq(profiles.id, id))
}

// Admin: reject a registration (removes profile and auth user)
export async function rejectProfile(id: string): Promise<void> {
  await requireAdmin()
  await db.delete(profiles).where(eq(profiles.id, id))
  await db.delete(userTable).where(eq(userTable.id, id))
}

// Update own profile fields
export async function updateMyProfile(data: {
  name?: string
  company?: string
  phone?: string
  avatarUrl?: string
}): Promise<ProfileData | null> {
  const sessionUser = await getSessionUser()
  const [updated] = await db
    .update(profiles)
    .set({
      ...(data.name ? { name: data.name } : {}),
      ...(data.company !== undefined ? { company: data.company } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, sessionUser.id))
    .returning()
  return updated ? mapProfile(updated) : null
}
