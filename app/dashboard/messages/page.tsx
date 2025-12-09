"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Search, MoreVertical, Phone, Video, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"

export default function MessagesPage() {
  const { user } = useAuth()
  const { conversations, messages, sendMessage, markConversationAsRead } = useData()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(conversations[0]?.id || null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId)
  const conversationMessages = selectedConversationId ? messages[selectedConversationId] || [] : []

  const filteredConversations = conversations.filter((conv) =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatTime = (timeString: string) => {
    if (timeString.includes(":") && timeString.length <= 5) {
      return timeString
    }
    const date = new Date(timeString)
    if (isNaN(date.getTime())) {
      return timeString
    }
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

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      return timestamp
    }
    return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId) return
    sendMessage(selectedConversationId, newMessage)
    setNewMessage("")
  }

  const selectConversation = (convId: string) => {
    setSelectedConversationId(convId)
    markConversationAsRead(convId)
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
                    onClick={() => selectConversation(conv.id)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors",
                      selectedConversationId === conv.id ? "bg-accent" : "hover:bg-accent/50",
                    )}
                  >
                    <div className="relative">
                      <img
                        src={conv.participantAvatar || "/placeholder.svg"}
                        alt={conv.participantName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card",
                          conv.online ? "bg-price-below" : "bg-muted-foreground",
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{conv.participantName}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(conv.lastMessageTime)}</span>
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
                      src={selectedConversation.participantAvatar || "/placeholder.svg"}
                      alt={selectedConversation.participantName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card",
                        selectedConversation.online ? "bg-price-below" : "bg-muted-foreground",
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{selectedConversation.participantName}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.participantRole} - {selectedConversation.online ? "Online" : "Offline"}
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
                  {conversationMessages.map((message) => {
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
                    handleSendMessage()
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
