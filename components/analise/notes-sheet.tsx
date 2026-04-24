"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { pt } from "date-fns/locale"
import { Trash2, StickyNote } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useItemNotes } from "@/hooks/use-analise-workspace"
import type { BudgetItem } from "@/lib/analise/types"

interface NotesSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysisId: string | null
  item: BudgetItem | null
}

export function NotesSheet({ open, onOpenChange, analysisId, item }: NotesSheetProps) {
  const [draft, setDraft] = useState("")
  const { notes, addNote, deleteNote, isLoading } = useItemNotes(analysisId, item?.id ?? null)

  const handleAdd = async () => {
    if (!draft.trim()) return
    await addNote(draft)
    setDraft("")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60 bg-card/30 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Anotações · item
          </p>
          <SheetTitle className="font-display text-xl font-medium tracking-tight">
            {item ? item.matchedName ?? item.originalName : "Item"}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {item
              ? `${item.quantity} ${item.unit} · €${item.budgetPrice.toFixed(2)} / ${item.unit}`
              : "Sem item selecionado"}
          </SheetDescription>
        </SheetHeader>

        {!analysisId && (
          <div className="border-b border-border/60 bg-background/40 px-6 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Aviso
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Guarde a análise primeiro para persistir anotações.
            </p>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-6 py-4">
            {isLoading && (
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                A carregar…
              </p>
            )}
            {!isLoading && notes.length === 0 && (
              <div className="rounded-md border border-dashed border-border/60 bg-background/40 px-4 py-8 text-center">
                <StickyNote className="mx-auto h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Sem notas
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Adicione observações, riscos ou lembretes para este item.
                </p>
              </div>
            )}
            <ul className="space-y-3">
              {notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-md border border-border/60 bg-background/40 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteNote(n.id)}
                      className="text-muted-foreground/70 hover:text-destructive"
                      aria-label="Eliminar nota"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{n.body}</p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>

        <div className="border-t border-border/60 bg-card/30 p-4">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escreva uma nota para este item…"
            disabled={!analysisId}
            rows={3}
            className="border-border/60 bg-background/60"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {draft.length}/2000
            </p>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!analysisId || !draft.trim()}
              className="rounded-full"
            >
              Adicionar nota
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
