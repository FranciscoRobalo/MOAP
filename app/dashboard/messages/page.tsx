"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Send,
  Search,
  Loader2,
  AlertCircle,
  Plus,
  ArrowDown,
  Copy,
  Check,
  X,
  ChevronLeft,
  MessageSquare,
  Sparkles,
  CornerDownLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useChat, type ChatMessage } from "@/hooks/use-chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  formatRelativeTime,
  formatMessageTime,
  formatDaySeparator,
  dayKey,
} from "@/lib/relative-time"

const QUICK_REPLIES = [
  "Olá! Como posso ajudar?",
  "Obrigado pela análise.",
  "Pode partilhar o relatório?",
  "Quando podemos agendar uma reunião?",
]

export default function MessagesPage() {
  const { user } = useAuth()
  const {
    conversations,
    messages,
    activeConversation,
    setActiveConversation,
    sendMessage,
    createConversation,
    listCandidateUsers,
    isLoading,
    error,
    useMockData,
  } = useChat(user?.id || null)

  const [draft, setDraft] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [inChatSearch, setInChatSearch] = useState("")
  const [showInChatSearch, setShowInChatSearch] = useState(false)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showMobileList, setShowMobileList] = useState(true)
  const [showNewChat, setShowNewChat] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inChatSearchInputRef = useRef<HTMLInputElement>(null)

  // ---------- Derived ----------
  const selectedConversation = conversations.find((c) => c.id === activeConversation)

  const otherParticipantOf = useCallback(
    (conv: (typeof conversations)[number]) => {
      return conv.participant_1 === user?.id ? conv.participant2 : conv.participant1
    },
    [user?.id]
  )

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => {
      const other = otherParticipantOf(c)
      return (
        other?.name?.toLowerCase().includes(q) ||
        c.last_message?.toLowerCase().includes(q)
      )
    })
  }, [conversations, searchQuery, otherParticipantOf])

  // Group messages by day, filter by in-chat search
  const messageGroups = useMemo(() => {
    const q = inChatSearch.trim().toLowerCase()
    const filtered = q
      ? messages.filter((m) => m.content.toLowerCase().includes(q))
      : messages
    const groups: { key: string; label: string; items: ChatMessage[] }[] = []
    for (const m of filtered) {
      const k = dayKey(m.created_at)
      const last = groups[groups.length - 1]
      if (last && last.key === k) {
        last.items.push(m)
      } else {
        groups.push({ key: k, label: formatDaySeparator(m.created_at), items: [m] })
      }
    }
    return groups
  }, [messages, inChatSearch])

  // ---------- Effects ----------

  // Auto-scroll to bottom on new messages (only if near bottom already)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom < 200) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      setShowScrollDown(false)
    } else {
      setShowScrollDown(true)
    }
  }, [messages])

  // When switching conversation, scroll to bottom instantly
  useEffect(() => {
    if (!activeConversation) return
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
    })
    setShowInChatSearch(false)
    setInChatSearch("")
  }, [activeConversation])

  // Track scroll for the "scroll to bottom" pill
  const onMessagesScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollDown(distanceFromBottom > 200)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "0px"
    const max = 180
    el.style.height = Math.min(el.scrollHeight, max) + "px"
  }, [draft])

  // Mobile: when picking a conversation, hide list
  useEffect(() => {
    if (activeConversation) setShowMobileList(false)
  }, [activeConversation])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable

      // Cmd/Ctrl+F — in-chat search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f" && activeConversation) {
        e.preventDefault()
        setShowInChatSearch(true)
        setTimeout(() => inChatSearchInputRef.current?.focus(), 0)
        return
      }

      // Esc — close in-chat search or go back on mobile
      if (e.key === "Escape") {
        if (showInChatSearch) {
          setShowInChatSearch(false)
          setInChatSearch("")
        } else if (showNewChat) {
          setShowNewChat(false)
        }
        return
      }

      // / — focus composer (when not already typing)
      if (!isTyping && e.key === "/" && activeConversation) {
        e.preventDefault()
        textareaRef.current?.focus()
        return
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [activeConversation, showInChatSearch, showNewChat])

  // ---------- Actions ----------

  const handleSend = async () => {
    const content = draft.trim()
    if (!content || !activeConversation || isSending) return
    setIsSending(true)
    const ok = await sendMessage(activeConversation, content)
    if (ok) setDraft("")
    setIsSending(false)
    // refocus
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const onComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const handleCopy = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content)
      setCopiedId(msg.id)
      setTimeout(() => setCopiedId((c) => (c === msg.id ? null : c)), 1600)
    } catch {
      /* ignore */
    }
  }

  const scrollToBottomNow = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    setShowScrollDown(false)
  }

  // ---------- Render ----------

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Page header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            § Mensagens
          </p>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">
            Conversas
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {useMockData && (
            <span className="rounded-full border border-amber/30 bg-amber/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-amber">
              Modo demo
            </span>
          )}
          <Button
            size="sm"
            onClick={() => setShowNewChat(true)}
            className="gap-2 rounded-full"
          >
            <Plus className="h-4 w-4" />
            Nova conversa
          </Button>
        </div>
      </div>

      {/* Two-pane shell */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card/40 shadow-xl">
        {/* Conversations list */}
        <aside
          className={cn(
            "flex w-full shrink-0 flex-col border-r border-border md:w-80 lg:w-96",
            activeConversation && !showMobileList ? "hidden md:flex" : "flex"
          )}
        >
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-full bg-input/50 pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && conversations.length === 0 ? (
              <ListSkeleton />
            ) : filteredConversations.length === 0 ? (
              <EmptyList
                hasAny={conversations.length > 0}
                onNew={() => setShowNewChat(true)}
              />
            ) : (
              <ul className="space-y-1 p-2">
                {filteredConversations.map((conv) => {
                  const other = otherParticipantOf(conv)
                  const isActive = activeConversation === conv.id
                  return (
                    <li key={conv.id}>
                      <button
                        onClick={() => setActiveConversation(conv.id)}
                        className={cn(
                          "group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors",
                          isActive
                            ? "bg-accent/60"
                            : "hover:bg-accent/30"
                        )}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-11 w-11">
                            <AvatarImage
                              src={other?.avatar_url || ""}
                              alt={other?.name || "Utilizador"}
                            />
                            <AvatarFallback className="bg-secondary font-medium">
                              {(other?.name || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Presence dot (mocked as online for mock users) */}
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-card">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {other?.name || "Utilizador"}
                            </p>
                            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {formatRelativeTime(conv.last_message_at)}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-2">
                            <p
                              className={cn(
                                "truncate text-xs",
                                (conv.unread_count || 0) > 0
                                  ? "font-medium text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              {conv.last_message || "Sem mensagens"}
                            </p>
                            {(conv.unread_count || 0) > 0 && (
                              <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary-foreground">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Conversation pane */}
        <section
          className={cn(
            "relative flex min-w-0 flex-1 flex-col",
            activeConversation && !showMobileList ? "flex" : "hidden md:flex"
          )}
        >
          {selectedConversation ? (
            <>
              {/* Conversation header */}
              <header className="flex items-center justify-between gap-3 border-b border-border bg-background/40 px-4 py-3 backdrop-blur">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent md:hidden"
                    aria-label="Voltar"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="relative shrink-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={otherParticipantOf(selectedConversation)?.avatar_url || ""}
                      />
                      <AvatarFallback className="bg-secondary font-medium">
                        {(otherParticipantOf(selectedConversation)?.name || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-card">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {otherParticipantOf(selectedConversation)?.name || "Utilizador"}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
                      Online
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setShowInChatSearch((v) => !v)
                      if (!showInChatSearch) {
                        setTimeout(() => inChatSearchInputRef.current?.focus(), 0)
                      } else {
                        setInChatSearch("")
                      }
                    }}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                      showInChatSearch && "bg-accent text-foreground"
                    )}
                    aria-label="Pesquisar na conversa"
                    title="Pesquisar (⌘F)"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </header>

              {/* In-chat search bar */}
              {showInChatSearch && (
                <div className="flex items-center gap-2 border-b border-border bg-background/40 px-4 py-2">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    ref={inChatSearchInputRef}
                    value={inChatSearch}
                    onChange={(e) => setInChatSearch(e.target.value)}
                    placeholder="Pesquisar nesta conversa..."
                    className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
                  />
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {inChatSearch
                      ? `${messageGroups.reduce((n, g) => n + g.items.length, 0)} result.`
                      : ""}
                  </span>
                  <button
                    onClick={() => {
                      setShowInChatSearch(false)
                      setInChatSearch("")
                    }}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="Fechar pesquisa"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Messages */}
              <div
                ref={scrollRef}
                onScroll={onMessagesScroll}
                className="relative flex-1 overflow-y-auto px-4 py-6"
              >
                {error && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                {messages.length === 0 ? (
                  <EmptyThread onPick={(t) => setDraft(t)} />
                ) : messageGroups.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Nenhum resultado para &ldquo;{inChatSearch}&rdquo;.
                  </div>
                ) : (
                  <div className="mx-auto max-w-3xl space-y-6">
                    {messageGroups.map((group) => (
                      <DayGroup
                        key={group.key}
                        label={group.label}
                        items={group.items}
                        currentUserId={user?.id || ""}
                        copiedId={copiedId}
                        onCopy={handleCopy}
                        highlight={inChatSearch}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Scroll to bottom pill */}
                {showScrollDown && (
                  <button
                    onClick={scrollToBottomNow}
                    className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs text-foreground shadow-lg backdrop-blur hover:bg-accent"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                    Nova mensagem
                  </button>
                )}
              </div>

              {/* Composer */}
              <div className="border-t border-border bg-background/40 p-3 backdrop-blur">
                <div className="mx-auto max-w-3xl">
                  <div className="flex items-end gap-2 rounded-2xl border border-border bg-card px-3 py-2 focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_hsl(166_76%_47%/0.12)]">
                    <textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={onComposerKeyDown}
                      placeholder="Escreva uma mensagem..."
                      rows={1}
                      disabled={isSending}
                      className="min-h-[28px] max-h-[180px] flex-1 resize-none bg-transparent px-1 py-1.5 text-sm leading-6 placeholder:text-muted-foreground focus:outline-none"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!draft.trim() || isSending}
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-full"
                      aria-label="Enviar mensagem"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between px-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Enter envia · Shift+Enter nova linha
                    </span>
                    <span className="hidden items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-flex">
                      <CornerDownLeft className="h-3 w-3" />
                      {draft.length} chars
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <EmptyPane onNew={() => setShowNewChat(true)} />
          )}
        </section>
      </div>

      {/* New-conversation modal */}
      {showNewChat && (
        <NewConversationDialog
          onClose={() => setShowNewChat(false)}
          listCandidateUsers={listCandidateUsers}
          onPick={async (uid) => {
            const convId = await createConversation(uid)
            setShowNewChat(false)
            if (convId) setActiveConversation(convId)
          }}
        />
      )}
    </div>
  )
}

/* ---------- Sub-components ---------- */

function DayGroup({
  label,
  items,
  currentUserId,
  copiedId,
  onCopy,
  highlight,
}: {
  label: string
  items: ChatMessage[]
  currentUserId: string
  copiedId: string | null
  onCopy: (m: ChatMessage) => void
  highlight: string
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="rounded-full border border-border bg-background px-3 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-1">
        {items.map((msg, i) => {
          const prev = items[i - 1]
          const isMine = msg.sender_id === currentUserId
          const prevSameAuthor =
            prev &&
            prev.sender_id === msg.sender_id &&
            new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() <
              5 * 60 * 1000
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={isMine}
              grouped={!!prevSameAuthor}
              copied={copiedId === msg.id}
              onCopy={() => onCopy(msg)}
              highlight={highlight}
            />
          )
        })}
      </div>
    </div>
  )
}

function MessageBubble({
  msg,
  isMine,
  grouped,
  copied,
  onCopy,
  highlight,
}: {
  msg: ChatMessage
  isMine: boolean
  grouped: boolean
  copied: boolean
  onCopy: () => void
  highlight: string
}) {
  return (
    <div
      className={cn(
        "group flex items-end gap-2",
        isMine ? "justify-end" : "justify-start",
        grouped ? "mt-0.5" : "mt-3"
      )}
    >
      {!isMine && (
        <div className="w-8 shrink-0">
          {!grouped && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={msg.sender?.avatar_url || ""} />
              <AvatarFallback className="bg-secondary text-xs font-medium">
                {(msg.sender?.name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div className={cn("relative flex max-w-[78%] flex-col", isMine ? "items-end" : "items-start")}>
        <div
          className={cn(
            "whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm leading-6",
            isMine
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-foreground",
            isMine
              ? grouped
                ? "rounded-br-md"
                : "rounded-br-sm"
              : grouped
                ? "rounded-bl-md"
                : "rounded-bl-sm"
          )}
        >
          {highlight ? highlightText(msg.content, highlight) : msg.content}
        </div>
        <div
          className={cn(
            "mt-1 flex items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground",
            isMine ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span>{formatMessageTime(msg.created_at)}</span>
          <button
            onClick={onCopy}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100",
              copied && "opacity-100 text-primary"
            )}
            aria-label="Copiar mensagem"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copiar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function highlightText(text: string, needle: string) {
  const q = needle.trim()
  if (!q) return text
  const lower = text.toLowerCase()
  const qLower = q.toLowerCase()
  const parts: React.ReactNode[] = []
  let i = 0
  let idx = lower.indexOf(qLower, i)
  let k = 0
  while (idx !== -1) {
    if (idx > i) parts.push(<span key={`p-${k++}`}>{text.slice(i, idx)}</span>)
    parts.push(
      <mark key={`m-${k++}`} className="rounded bg-amber/30 px-0.5 text-foreground">
        {text.slice(idx, idx + q.length)}
      </mark>
    )
    i = idx + q.length
    idx = lower.indexOf(qLower, i)
  }
  if (i < text.length) parts.push(<span key={`p-${k++}`}>{text.slice(i)}</span>)
  return <>{parts}</>
}

function ListSkeleton() {
  return (
    <ul className="space-y-2 p-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-xl p-3"
          style={{ opacity: 1 - i * 0.15 }}
        >
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-secondary" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-secondary/70" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function EmptyList({ hasAny, onNew }: { hasAny: boolean; onNew: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background">
        <MessageSquare className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm font-medium text-foreground">
        {hasAny ? "Nenhum resultado" : "Sem conversas ainda"}
      </p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        {hasAny
          ? "Tente outro termo de pesquisa."
          : "Comece uma nova conversa para partilhar orçamentos e relatórios."}
      </p>
      {!hasAny && (
        <Button size="sm" onClick={onNew} className="mt-5 gap-2 rounded-full">
          <Plus className="h-4 w-4" />
          Nova conversa
        </Button>
      )}
    </div>
  )
}

function EmptyPane({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background">
        <MessageSquare className="h-6 w-6 text-primary" />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        § Mensagens
      </p>
      <h2 className="mt-2 max-w-md text-balance text-2xl font-semibold tracking-tight text-foreground">
        Selecione uma conversa ou inicie uma nova.
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Partilhe orçamentos, comentários e relatórios de análise em tempo real.
      </p>
      <Button onClick={onNew} className="mt-6 gap-2 rounded-full">
        <Plus className="h-4 w-4" />
        Nova conversa
      </Button>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <ShortcutHint label="Pesquisar" keys={["⌘", "F"]} />
        <ShortcutHint label="Enviar" keys={["Enter"]} />
        <ShortcutHint label="Nova linha" keys={["Shift", "Enter"]} />
        <ShortcutHint label="Focar" keys={["/"]} />
      </div>
    </div>
  )
}

function EmptyThread({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-10 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background">
        <Sparkles className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm font-medium text-foreground">Comece a conversa</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Uma ajuda para arrancar:
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/50 hover:bg-accent"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

function ShortcutHint({ label, keys }: { label: string; keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <span className="inline-flex items-center gap-0.5">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-foreground"
          >
            {k}
          </kbd>
        ))}
      </span>
    </span>
  )
}

function NewConversationDialog({
  onClose,
  listCandidateUsers,
  onPick,
}: {
  onClose: () => void
  listCandidateUsers: () => Promise<{ id: string; name: string; avatar_url?: string | null }[]>
  onPick: (id: string) => void
}) {
  const [users, setUsers] = useState<{ id: string; name: string; avatar_url?: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [picking, setPicking] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const data = await listCandidateUsers()
      if (!cancelled) {
        setUsers(data)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [listCandidateUsers])

  const filtered = q.trim()
    ? users.filter((u) => u.name.toLowerCase().includes(q.trim().toLowerCase()))
    : users

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              § Nova conversa
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
              Escolher destinatário
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Procurar por nome..."
              className="h-10 rounded-full pl-9"
            />
          </div>
          <div className="mt-4 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A carregar...
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum utilizador encontrado.
              </p>
            ) : (
              <ul className="space-y-1">
                {filtered.map((u) => (
                  <li key={u.id}>
                    <button
                      disabled={picking !== null}
                      onClick={async () => {
                        setPicking(u.id)
                        await onPick(u.id)
                      }}
                      className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-accent disabled:opacity-60"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatar_url || ""} />
                        <AvatarFallback className="bg-secondary text-xs font-medium">
                          {u.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate text-sm font-medium text-foreground">
                        {u.name}
                      </span>
                      {picking === u.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
