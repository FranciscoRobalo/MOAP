// Seeds the curated materials list into Neon Postgres.
// Run with: node --env-file-if-exists=/vercel/share/.env.project scripts/seed-materials-neon.mjs
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import pg from "pg"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Extract the materials array from the existing seed script (source of truth)
const source = readFileSync(join(__dirname, "seed-materials-to-db.ts"), "utf8")
const match = source.match(/const materials = (\[[\s\S]*?\n\])/)
if (!match) {
  console.error("Could not find materials array in seed-materials-to-db.ts")
  process.exit(1)
}
// eslint-disable-next-line no-new-func
const materials = new Function(`return ${match[1]}`)()
console.log(`Parsed ${materials.length} materials from seed script`)

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

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
      const base = j * 6
      values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`)
      params.push(m.name, m.category, m.unit, m.min_price ?? null, m.avg_price, m.max_price ?? null)
    })
    await client.query(
      `INSERT INTO materials (name, category, unit, min_price, avg_price, max_price) VALUES ${values.join(", ")}`,
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
