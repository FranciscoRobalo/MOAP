import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

export interface SessionInfo {
  userId: string
  email: string
  name: string
  role: "admin" | "tecnico" | "cliente"
}

// Returns the signed-in user's session + profile role, or null.
export async function getApiSession(): Promise<SessionInfo | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return null

    const [profile] = await db.select().from(profiles).where(eq(profiles.id, session.user.id))

    return {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: (profile?.role as SessionInfo["role"]) || "cliente",
    }
  } catch {
    return null
  }
}
