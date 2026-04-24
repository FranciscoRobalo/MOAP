"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import type { AssignmentRow, DecisionRow, ObraStatus } from "@/lib/aprovacoes/types"

export function useAprovacoesWorkspace() {
  const [assignments, setAssignments] = useState<Record<string, AssignmentRow>>({})
  const [decisions, setDecisions] = useState<DecisionRow[]>([])
  const [loading, setLoading] = useState(false)

  const loadAssignments = useCallback(async () => {
    try {
      const res = await fetch("/api/aprovacoes/assignments")
      if (!res.ok) return
      const { assignments } = (await res.json()) as { assignments: AssignmentRow[] }
      const map: Record<string, AssignmentRow> = {}
      for (const a of assignments ?? []) map[a.obra_id] = a
      setAssignments(map)
    } catch {}
  }, [])

  const loadDecisions = useCallback(async () => {
    try {
      const res = await fetch("/api/aprovacoes/decisions")
      if (!res.ok) return
      const { decisions } = (await res.json()) as { decisions: DecisionRow[] }
      setDecisions(decisions ?? [])
    } catch {}
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadAssignments(), loadDecisions()]).finally(() => setLoading(false))
  }, [loadAssignments, loadDecisions])

  const logDecision = useCallback(
    async (input: {
      obraId: string
      obraTitle?: string
      previousStatus?: string | null
      newStatus: ObraStatus
      reason?: string
      authorName?: string | null
    }) => {
      try {
        const res = await fetch("/api/aprovacoes/decisions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: "Erro" }))
          throw new Error(error || "Erro")
        }
        const { decision } = (await res.json()) as { decision: DecisionRow }
        setDecisions((prev) => [decision, ...prev])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro a registar decisão")
      }
    },
    [],
  )

  const assignReviewer = useCallback(
    async (obraId: string, reviewerName: string | null, reviewerId?: string | null) => {
      try {
        const res = await fetch("/api/aprovacoes/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ obraId, reviewerName, reviewerId: reviewerId ?? null }),
        })
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: "Erro" }))
          throw new Error(error || "Erro")
        }
        const { assignment } = (await res.json()) as { assignment: AssignmentRow }
        setAssignments((prev) => ({ ...prev, [obraId]: assignment }))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro a atribuir")
      }
    },
    [],
  )

  const clearReviewer = useCallback(async (obraId: string) => {
    try {
      const res = await fetch(`/api/aprovacoes/assignments?obraId=${encodeURIComponent(obraId)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      setAssignments((prev) => {
        const next = { ...prev }
        delete next[obraId]
        return next
      })
    } catch {
      toast.error("Erro a remover atribuição")
    }
  }, [])

  const decisionsByObra = useMemo(() => {
    const map = new Map<string, DecisionRow[]>()
    for (const d of decisions) {
      const arr = map.get(d.obra_id) ?? []
      arr.push(d)
      map.set(d.obra_id, arr)
    }
    return map
  }, [decisions])

  return {
    loading,
    assignments,
    decisions,
    decisionsByObra,
    logDecision,
    assignReviewer,
    clearReviewer,
    refreshDecisions: loadDecisions,
  }
}
