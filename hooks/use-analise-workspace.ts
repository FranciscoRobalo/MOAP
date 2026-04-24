"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import type {
  AnalysisResult,
  DecisionRecord,
  DecisionValue,
  AnaliseNote,
  SavedAnalysisSummary,
} from "@/lib/analise/types"

/**
 * useAnaliseWorkspace
 *   Central client-side state for the current analysis: the Supabase row id
 *   (once persisted), per-item decisions, and recent saved-analysis list.
 *
 *   Keeps everything optimistic so the UI stays instant.
 */
export function useAnaliseWorkspace(analysisResult: AnalysisResult | null) {
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [decisions, setDecisions] = useState<Record<string, DecisionRecord>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState<SavedAnalysisSummary[]>([])
  const [isLoadingSaved, setIsLoadingSaved] = useState(false)
  const fetchedForRef = useRef<string | null>(null)

  // Reset workspace when a new analysis is loaded
  useEffect(() => {
    setAnalysisId(null)
    setDecisions({})
    fetchedForRef.current = null
  }, [analysisResult?.id])

  // Fetch decisions when analysisId is known
  useEffect(() => {
    if (!analysisId || fetchedForRef.current === analysisId) return
    fetchedForRef.current = analysisId
    ;(async () => {
      try {
        const res = await fetch(`/api/analise/decisions?analysisId=${analysisId}`)
        if (!res.ok) return
        const json = (await res.json()) as { decisions: Record<string, DecisionRecord> }
        setDecisions(json.decisions ?? {})
      } catch (err) {
        console.log("[v0] decisions fetch error:", err)
      }
    })()
  }, [analysisId])

  const refreshSaved = useCallback(async () => {
    setIsLoadingSaved(true)
    try {
      const res = await fetch("/api/analise/saved")
      if (!res.ok) return
      const json = (await res.json()) as { items: SavedAnalysisSummary[] }
      setSaved(json.items ?? [])
    } catch (err) {
      console.log("[v0] saved fetch error:", err)
    } finally {
      setIsLoadingSaved(false)
    }
  }, [])

  const saveCurrent = useCallback(
    async (opts?: { obraId?: string; submit?: boolean }) => {
      if (!analysisResult) return null
      setIsSaving(true)
      try {
        const res = await fetch("/api/analise/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            snapshot: analysisResult,
            obraId: opts?.obraId,
            submit: opts?.submit === true,
          }),
        })
        const json = (await res.json()) as {
          id?: string
          submissionStatus?: string
          error?: string
        }
        if (!res.ok || !json.id) {
          toast.error(json.error ?? "Erro ao guardar análise")
          return null
        }
        setAnalysisId(json.id)
        toast.success(
          opts?.submit
            ? "Orçamento submetido para revisão do administrador"
            : "Análise guardada",
        )
        refreshSaved()
        return json.id
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido"
        toast.error(message)
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [analysisResult, refreshSaved],
  )

  /**
   * submitCurrent — submits the current analysis for admin review.
   *
   *   If it hasn't been saved yet, we save + submit in a single POST.
   *   Otherwise we flip the existing draft row to `submitted` via PATCH,
   *   which triggers the admin queue.
   */
  const submitCurrent = useCallback(async () => {
    if (!analysisResult) return false
    if (!analysisId) {
      const newId = await saveCurrent({ submit: true })
      return !!newId
    }
    try {
      const res = await fetch(`/api/analise/saved/${analysisId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao submeter")
        return false
      }
      toast.success("Orçamento submetido para revisão do administrador")
      refreshSaved()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      toast.error(message)
      return false
    }
  }, [analysisId, analysisResult, refreshSaved, saveCurrent])

  const setDecision = useCallback(
    async (itemId: string, decision: DecisionValue, targetPrice: number | null = null) => {
      if (!analysisId) {
        toast.error("Guarde a análise primeiro para registar decisões")
        return
      }
      // Optimistic update
      setDecisions((prev) => ({
        ...prev,
        [itemId]: { decision, targetPrice, updatedAt: new Date().toISOString() },
      }))
      try {
        const res = await fetch("/api/analise/decisions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysisId, itemId, decision, targetPrice }),
        })
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string }
          toast.error(json.error ?? "Erro ao guardar decisão")
        }
      } catch (err) {
        console.log("[v0] decision save error:", err)
      }
    },
    [analysisId],
  )

  const deleteSaved = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/analise/saved/${id}`, { method: "DELETE" })
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string }
          toast.error(json.error ?? "Erro ao eliminar")
          return false
        }
        toast.success("Análise eliminada")
        setSaved((prev) => prev.filter((s) => s.id !== id))
        return true
      } catch (err) {
        console.log("[v0] delete saved error:", err)
        return false
      }
    },
    [],
  )

  return {
    analysisId,
    setAnalysisId,
    decisions,
    setDecision,
    saveCurrent,
    submitCurrent,
    isSaving,
    saved,
    refreshSaved,
    deleteSaved,
    isLoadingSaved,
  }
}

/**
 * useItemNotes — fetch + mutate notes for a single item.
 */
export function useItemNotes(analysisId: string | null, itemId: string | null) {
  const [notes, setNotes] = useState<AnaliseNote[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!analysisId || !itemId) {
      setNotes([])
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/analise/notes?analysisId=${analysisId}&itemId=${encodeURIComponent(itemId)}`,
      )
      if (!res.ok) return
      const json = (await res.json()) as { notes: AnaliseNote[] }
      setNotes(json.notes ?? [])
    } finally {
      setIsLoading(false)
    }
  }, [analysisId, itemId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addNote = useCallback(
    async (body: string) => {
      if (!analysisId || !itemId || !body.trim()) return
      try {
        const res = await fetch("/api/analise/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysisId, itemId, body: body.trim() }),
        })
        const json = (await res.json()) as { note?: AnaliseNote; error?: string }
        if (!res.ok || !json.note) {
          toast.error(json.error ?? "Erro ao guardar nota")
          return
        }
        setNotes((prev) => [json.note as AnaliseNote, ...prev])
      } catch (err) {
        console.log("[v0] addNote error:", err)
      }
    },
    [analysisId, itemId],
  )

  const deleteNote = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/analise/notes?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id))
      }
    } catch (err) {
      console.log("[v0] deleteNote error:", err)
    }
  }, [])

  return { notes, isLoading, addNote, deleteNote, refresh }
}
