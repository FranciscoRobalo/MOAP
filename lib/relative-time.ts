/**
 * Compact relative-time helpers for chat UI.
 * All strings are pt-PT.
 *
 * Defensive input handling:
 *   These helpers are fed timestamps coming from several sources (local cache,
 *   Supabase rows, in-memory mock data). A missing/undefined timestamp must
 *   NOT crash the app — we coerce anything falsy or non-Date/string to an
 *   "invalid" Date and return "" from the formatter, matching the behaviour
 *   of a NaN getTime().
 */

type MaybeDateInput = string | number | Date | null | undefined

function toDate(input: MaybeDateInput): Date {
  if (input instanceof Date) return input
  if (typeof input === "string" || typeof input === "number") return new Date(input)
  // Return a Date object that reports NaN from getTime(), so the checks below
  // short-circuit cleanly instead of throwing on undefined.getTime().
  return new Date(Number.NaN)
}

export function formatRelativeTime(input: MaybeDateInput): string {
  const date = toDate(input)
  if (Number.isNaN(date.getTime())) return ""
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHr = Math.round(diffMin / 60)

  if (diffSec < 45) return "agora"
  if (diffMin < 1) return "agora"
  if (diffMin < 60) return `${diffMin} min`
  if (diffHr < 24) return `${diffHr} h`

  // Same calendar day already covered; check "yesterday" vs day-of-week vs date
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msInDay = 24 * 60 * 60 * 1000
  const daysDiff = Math.floor((startOfToday.getTime() - date.getTime()) / msInDay)

  if (daysDiff === 0) return `${diffHr} h`
  if (daysDiff === 1) return "Ontem"
  if (daysDiff < 7) {
    return date.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", "")
  }
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })
}

/**
 * Short HH:MM for individual message timestamps.
 */
export function formatMessageTime(input: MaybeDateInput): string {
  const date = toDate(input)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
}

/**
 * Day-separator label: "Hoje", "Ontem" or a full date.
 */
export function formatDaySeparator(input: MaybeDateInput): string {
  const date = toDate(input)
  if (Number.isNaN(date.getTime())) return ""
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msInDay = 24 * 60 * 60 * 1000
  const daysDiff = Math.floor((startOfToday.getTime() - date.getTime()) / msInDay)

  if (daysDiff <= 0) return "Hoje"
  if (daysDiff === 1) return "Ontem"
  if (daysDiff < 7) {
    return date
      .toLocaleDateString("pt-PT", { weekday: "long" })
      .replace(/^./, (c) => c.toUpperCase())
  }
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })
}

/**
 * YYYY-MM-DD key to group messages by day.
 */
export function dayKey(input: MaybeDateInput): string {
  const date = toDate(input)
  if (Number.isNaN(date.getTime())) return ""
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
