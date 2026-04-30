"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Search, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useChat } from "@/hooks/use-chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function MessagesPage() {
  const { user } = useAuth()
  const { conversations, messages, activeConversation, setActiveConversation, sendMessage, fetchConversations, isLoading, error, useMockData } = useChat(user?.id || null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const selectedConversation = conversations.find((c) => c.id === activeConversation)
  const filteredConversations = conversations.filter((conv) => {
    const otherParticipant = conv.participant1_id === user?.id ? conv.participant2 : conv.participant1
    return otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || isSending) return

    setIsSending(true)
    await sendMessage(activeConversation, newMessage)
    setNewMessage("")
    setIsSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getOtherParticipant = (conv: (typeof conversations)[0]) => {
    return conv.participant1_id === user?.id ? conv.participant2 : conv.participant1
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mensagens</h1>
          <p className="text-muted-foreground">Comunique com outros utilizadores em tempo real.</p>
        </div>
        {useMockData && (
          <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-1 rounded-full">
            Modo Demo
          </span>
        )}
      </div>

      <Card className="h-[calc(100%-4rem)] bg-card/50 overflow-hidden flex">
        {/* Conversations List */}
        <div className="w-80 border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-input/50"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {isLoading ? (
                <div className="flex items-center justify-center p-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Carregando...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {conversations.length === 0 ? "Nenhuma conversa ainda" : "Nenhuma conversa encontrada"}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const otherParticipant = getOtherParticipant(conv)
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversation(conv.id)}
                      className={cn(
                        "w-full flex items-start gap-3 rounded-lg p-3 text-left transition-colors mb-2 hover:bg-accent/50",
                        activeConversation === conv.id ? "bg-accent" : ""
                      )}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={otherParticipant?.avatar_url || ""} alt={otherParticipant?.name || "User"} />
                        <AvatarFallback>{(otherParticipant?.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{otherParticipant?.name || "Usuário"}</p>
                        <p className="text-xs text-muted-foreground truncate">{conv.last_message || "Sem mensagens"}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={getOtherParticipant(selectedConversation)?.avatar_url || ""} />
                    <AvatarFallback>{(getOtherParticipant(selectedConversation)?.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{getOtherParticipant(selectedConversation)?.name || "Usuário"}</h3>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Nenhuma mensagem ainda. Comece a conversa!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn("flex gap-3", msg.sender_id === user?.id ? "justify-end" : "justify-start")}
                      >
                        {msg.sender_id !== user?.id && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={msg.sender?.avatar_url || ""} alt={msg.sender?.name || "User"} />
                            <AvatarFallback>{(msg.sender?.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                            msg.sender_id === user?.id
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted text-muted-foreground rounded-bl-none"
                          )}
                        >
                          <p className="break-words">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString("pt-PT", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                    className="bg-input/50"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isSending} size="icon">
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Selecione uma conversa para começar</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
