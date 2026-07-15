// Seeds the full materials list (extracted from contexts/data-context.tsx)
// into the Neon database. Run with:
//   node --env-file-if-exists=/vercel/share/.env.project scripts/seed-materials-neon.mjs
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import pg from "pg"

const __dirname = dirname(fileURLToPath(import.meta.url))

const connectionString =
  process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.NEON_POSTGRES_URL

if (!connectionString) {
  console.error("No DATABASE_URL / NEON_DATABASE_URL in environment")
  process.exit(2)
}

// --- Extract the initialMaterials array from the data context (full dataset) ---
const source = readFileSync(join(__dirname, "..", "contexts", "data-context.tsx"), "utf8")
const startMarker = "export const initialMaterials: Material[] = ["
const start = source.indexOf(startMarker)
if (start < 0) {
  console.error("Could not find initialMaterials in data-context.tsx")
  process.exit(1)
}
const arrayStart = start + startMarker.length - 1 // position of "["
const end = source.indexOf("\n]", arrayStart)
if (end < 0) {
  console.error("Could not find end of initialMaterials array")
  process.exit(1)
}
const arrayLiteral = source.slice(arrayStart, end + 2)

// Evaluate the plain object-literal array (entries contain no TS-only syntax)
const materials = new Function(`return ${arrayLiteral}`)()
console.log(`Extracted ${materials.length} materials from data-context.tsx`)

// --- Insert into Neon ---
const pool = new pg.Pool({ connectionString })
const client = await pool.connect()
try {
  const existing = await client.query("SELECT count(*)::int AS n FROM materials")
  console.log(`Existing rows in Neon materials table: ${existing.rows[0].n}`)
  if (existing.rows[0].n >= materials.length) {
    console.log("Materials already seeded, skipping.")
    process.exit(0)
  }

  await client.query("BEGIN")
  await client.query("TRUNCATE materials")

  const batchSize = 100
  for (let i = 0; i < materials.length; i += batchSize) {
    const batch = materials.slice(i, i + batchSize)
    const values = []
    const params = []
    batch.forEach((m, j) => {
      const base = j * 8
      const avg = typeof m.price === "number" ? m.price : 0
      const max = typeof m.priceMax === "number" ? m.priceMax : Math.round(avg * 1.2 * 100) / 100
      const min = Math.round(avg * 0.8 * 100) / 100
      values.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`,
      )
      params.push(
        m.name,
        m.category || "Sem categoria",
        m.type || "material",
        m.unit || "un",
        min,
        avg,
        max,
        m.region || "Portugal",
      )
    })
    await client.query(
      `INSERT INTO materials (name, category, subcategory, unit, min_price, avg_price, max_price, region) VALUES ${values.join(", ")}`,
      params,
    )
    console.log(`Inserted ${Math.min(i + batchSize, materials.length)}/${materials.length}`)
  }

  await client.query("COMMIT")
  const final = await client.query("SELECT count(*)::int AS n FROM materials")
  console.log(`Done. Neon materials table now has ${final.rows[0].n} rows.`)
} catch (err) {
  await client.query("ROLLBACK").catch(() => {})
  console.error("Seed failed:", err.message)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
