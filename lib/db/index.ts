import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

// Prefer Neon-specific URLs; fall back to generic DATABASE_URL.
// NOTE: POSTGRES_URL in this project resolves to Supabase — do not use it.
const connectionString =
  process.env.NEON_POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.NEON_POSTGRES_URL_NO_SSL ||
  process.env.DATABASE_URL

export const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes("sslmode=require") || connectionString?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,
})
export const db = drizzle(pool, { schema })
