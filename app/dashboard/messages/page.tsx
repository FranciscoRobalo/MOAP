"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Search, MoreVertical, Phone, Video, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

interface Message {
  id: string
  content: string
  senderId: string
  timestamp: Date
}

interface Conversation {
  id: string
  user: {
    id: string
    name: string
    avatar: string
    status: "online" | "offline" | "away"
  }
  lastMessage: string
  timestamp: Date
  unread: number
  messages: Message[]
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    user: {
      id: "2",
      name: "João Silva",
      avatar: "/professional-man.png",
      status: "online",
    },
    lastMessage: "O orçamento já está pronto para revisão.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    unread: 2,
    messages: [
      {
        id: "1",
        content: "Bom dia! Como está o projeto?",
        senderId: "2",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: "2",
        content: "Bom dia! Está a correr bem, estamos a finalizar.",
        senderId: "1",
        timestamp: new Date(Date.now() - 1000 * 60 * 25),
      },
      {
        id: "3",
        content: "Ótimo! Quando posso esperar o relatório?",
        senderId: "2",
        timestamp: new Date(Date.now() - 1000 * 60 * 20),
      },
      {
        id: "4",
        content: "Deve estar pronto até ao final do dia.",
        senderId: "1",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
      },
      {
        id: "5",
        content: "O orçamento já está pronto para revisão.",
        senderId: "2",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
      },
    ],
  },
  {
    id: "2",
    user: {
      id: "3",
      name: "Maria Santos",
      avatar: "/professional-woman.png",
      status: "away",
    },
    lastMessage: "Preciso de ajuda com a análise de preços.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    unread: 0,
    messages: [
      { id: "1", content: "Olá! Pode ajudar-me?", senderId: "3", timestamp: new Date(Date.now() - 1000 * 60 * 90) },
      {
        id: "2",
        content: "Claro, em que posso ajudar?",
        senderId: "1",
        timestamp: new Date(Date.now() - 1000 * 60 * 85),
      },
      {
        id: "3",
        content: "Preciso de ajuda com a análise de preços.",
        senderId: "3",
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
      },
    ],
  },
  {
    id: "3",
    user: {
      id: "4",
      name: "Pedro Costa",
      avatar: "/man-construction.jpg",
      status: "offline",
    },
    lastMessage: "Obrigado pela análise detalhada!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    unread: 0,
    messages: [
      {
        id: "1",
        content: "Recebi o relatório, muito obrigado!",
        senderId: "4",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
      {
        id: "2",
        content: "De nada! Se precisar de mais alguma coisa, estou disponível.",
        senderId: "1",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3.5),
      },
      {
        id: "3",
        content: "Obrigado pela análise detalhada!",
        senderId: "4",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
    ],
  },
  {
    id: "4",
    user: {
      id: "5",
      name: "Ana Ferreira",
      avatar: "/woman-architect.png",
      status: "online",
    },
    lastMessage: "Vamos agendar uma reunião?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unread: 1,
    messages: [
      {
        id: "1",
        content: "Olá! Gostaria de discutir o projeto.",
        senderId: "5",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25),
      },
      {
        id: "2",
        content: "Vamos agendar uma reunião?",
        senderId: "5",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
    ],
  },
]

export default function MessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState(mockConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = diff / (1000 * 60 * 60)

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `${minutes}m`
    } else if (hours < 24) {
      return `${Math.floor(hours)}h`
    } else {
      return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })
    }
  }

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      content: newMessage,
      senderId: user?.id || "1",
      timestamp: new Date(),
    }

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, message],
              lastMessage: newMessage,
              timestamp: new Date(),
            }
          : conv,
      ),
    )

    setSelectedConversation((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, message],
            lastMessage: newMessage,
            timestamp: new Date(),
          }
        : null,
    )

    setNewMessage("")
  }

  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    // Mark as read
    setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, unread: 0 } : c)))
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Mensagens</h1>
        <p className="text-muted-foreground">Comunique com outros utilizadores.</p>
      </div>

      <Card className="h-[calc(100%-4rem)] bg-card/50 overflow-hidden">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-80 border-r border-border flex flex-col">
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
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors",
                      selectedConversation?.id === conv.id ? "bg-accent" : "hover:bg-accent/50",
                    )}
                  >
                    <div className="relative">
                      <img
                        src={conv.user.avatar || "/placeholder.svg"}
                        alt={conv.user.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card",
                          conv.user.status === "online" && "bg-price-below",
                          conv.user.status === "away" && "bg-price-average",
                          conv.user.status === "offline" && "bg-muted-foreground",
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{conv.user.name}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(conv.timestamp)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {conv.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          {selectedConversation ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={selectedConversation.user.avatar || "/placeholder.svg"}
                      alt={selectedConversation.user.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card",
                        selectedConversation.user.status === "online" && "bg-price-below",
                        selectedConversation.user.status === "away" && "bg-price-average",
                        selectedConversation.user.status === "offline" && "bg-muted-foreground",
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{selectedConversation.user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {selectedConversation.user.status === "online"
                        ? "Online"
                        : selectedConversation.user.status === "away"
                          ? "Ausente"
                          : "Offline"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => {
                    const isOwn = message.senderId === user?.id || message.senderId === "1"
                    return (
                      <div key={message.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2",
                            isOwn ? "bg-primary text-primary-foreground" : "bg-accent",
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
                            )}
                          >
                            {formatMessageTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t border-border p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    sendMessage()
                  }}
                  className="flex items-center gap-3"
                >
                  <Button type="button" variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Escreva uma mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-input/50"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Selecione uma conversa para começar
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
