import { and, eq } from "drizzle-orm"
import { initialMaterials } from "../contexts/data-context"
import { db, pool } from "../lib/db"
import { materials } from "../lib/db/schema"

const STOP_WORDS = new Set([
  "com", "das", "dos", "para", "por", "uma", "preco", "medio", "standard",
])

function keywordsFor(name: string): string[] {
  return [...new Set(name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word)))]
    .slice(0, 16)
}

function money(value: number): string {
  return Math.max(0, value).toFixed(2)
}

async function seedCatalogue() {
  const connectionAvailable = Boolean(
    process.env.NEON_POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NEON_POSTGRES_URL_NO_SSL ||
    process.env.DATABASE_URL,
  )

  if (!connectionAvailable) {
    throw new Error("Configure NEON_POSTGRES_URL, NEON_DATABASE_URL ou DATABASE_URL antes de executar o seed.")
  }

  let inserted = 0
  let updated = 0
  const referenceDate = new Date("2026-07-01T00:00:00.000Z")

  for (const entry of initialMaterials) {
    const min = entry.price
    const max = entry.priceMax && entry.priceMax >= min ? entry.priceMax : min * 1.2
    const avg = (min + max) / 2
    const [existing] = await db
      .select({ id: materials.id })
      .from(materials)
      .where(and(eq(materials.name, entry.name), eq(materials.unit, entry.unit)))
      .limit(1)

    const values = {
      name: entry.name,
      category: entry.category || "Geral",
      unit: entry.unit,
      minPrice: money(min),
      avgPrice: money(avg),
      maxPrice: money(max),
      supplier: "Referência MOAP — mercado português (intervalo indicativo)",
      region: entry.region || "Portugal",
      description: "Preço de referência indicativo; validar com fornecedores e condições específicas da obra.",
      keywords: keywordsFor(entry.name),
      lastUpdated: referenceDate,
    }

    if (existing) {
      await db.update(materials).set(values).where(eq(materials.id, existing.id))
      updated += 1
    } else {
      await db.insert(materials).values(values)
      inserted += 1
    }
  }

  console.log(`Catálogo MOAP atualizado: ${inserted} inseridos, ${updated} atualizados, ${initialMaterials.length} referências.`)
}

seedCatalogue()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
