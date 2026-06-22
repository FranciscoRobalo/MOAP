import { createClient } from "@supabase/supabase-js"
import { initialMaterials } from "../contexts/data-context"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Portuguese stopwords to drop from keyword extraction
const STOP = new Set([
  "de","da","do","das","dos","e","a","o","as","os","para","com","em","no","na",
  "nos","nas","por","ao","aos","um","uma","the","of","standard","preço","medio","médio",
])

function makeKeywords(name: string): string[] {
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const words = normalized.split(" ").filter((w) => w.length >= 3 && !STOP.has(w))
  return Array.from(new Set(words)).slice(0, 12)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

async function main() {
  console.log(`Seeding ${initialMaterials.length} materials...`)

  // Clear existing rows first to avoid duplicates
  const { error: delError } = await supabase.from("materials").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  if (delError) {
    console.error("Error clearing materials:", delError.message)
  } else {
    console.log("Cleared existing materials.")
  }

  const rows = initialMaterials.map((m) => {
    const min = m.price
    const max = m.priceMax && m.priceMax > m.price ? m.priceMax : round2(m.price * 1.2)
    const avg = round2((min + max) / 2)
    return {
      name: m.name,
      category: m.category,
      unit: m.unit,
      min_price: round2(min),
      avg_price: avg,
      max_price: round2(max),
      region: m.region || "Nacional",
      keywords: makeKeywords(m.name),
      last_updated: new Date().toISOString(),
    }
  })

  const BATCH = 100
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase.from("materials").insert(batch)
    if (error) {
      console.error(`Batch ${i / BATCH + 1} failed:`, error.message)
      process.exit(1)
    }
    inserted += batch.length
    console.log(`Inserted ${inserted}/${rows.length}`)
  }

  const { count } = await supabase.from("materials").select("*", { count: "exact", head: true })
  console.log(`Done. Materials in DB: ${count}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
