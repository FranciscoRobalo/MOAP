"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender: {
    name: string
    avatar_url?: string
  }
  content: string
  read: boolean
  created_at: string
}

export interface ChatConversation {
  id: string
  participant1_id: string
  participant2_id: string
  participant1: {
    id: string
    name: string
    avatar_url?: string
  }
  participant2: {
    id: string
    name: string
    avatar_url?: string
  }
  last_message: string
  last_message_time: string
  messages_count: number
  unread_count: number
}

// Mock data for development/fallback
const MOCK_USERS = {
  "1": { id: "1", name: "Administrador", avatar_url: "" },
  "2": { id: "2", name: "Cliente Demo", avatar_url: "" },
  "3": { id: "3", name: "Técnico MOAP", avatar_url: "" },
}

const getMockConversations = (userId: string): ChatConversation[] => {
  if (userId === "1") {
    return [
      {
        id: "conv-1",
        participant1_id: "1",
        participant2_id: "3",
        participant1: MOCK_USERS["1"],
        participant2: MOCK_USERS["3"],
        last_message: "A análise do orçamento está pronta.",
        last_message_time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        messages_count: 5,
        unread_count: 1,
      },
      {
        id: "conv-2",
        participant1_id: "1",
        participant2_id: "2",
        participant1: MOCK_USERS["1"],
        participant2: MOCK_USERS["2"],
        last_message: "Obrigado pela aprovação!",
        last_message_time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        messages_count: 3,
        unread_count: 0,
      },
    ]
  } else if (userId === "3") {
    return [
      {
        id: "conv-1",
        participant1_id: "1",
        participant2_id: "3",
        participant1: MOCK_USERS["1"],
        participant2: MOCK_USERS["3"],
        last_message: "A análise do orçamento está pronta.",
        last_message_time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        messages_count: 5,
        unread_count: 0,
      },
      {
        id: "conv-3",
        participant1_id: "2",
        participant2_id: "3",
        participant1: MOCK_USERS["2"],
        participant2: MOCK_USERS["3"],
        last_message: "Quando pode visitar a obra?",
        last_message_time: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        messages_count: 2,
        unread_count: 1,
      },
    ]
  } else {
    return [
      {
        id: "conv-2",
        participant1_id: "1",
        participant2_id: "2",
        participant1: MOCK_USERS["1"],
        participant2: MOCK_USERS["2"],
        last_message: "Obrigado pela aprovação!",
        last_message_time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        messages_count: 3,
        unread_count: 0,
      },
      {
        id: "conv-3",
        participant1_id: "2",
        participant2_id: "3",
        participant1: MOCK_USERS["2"],
        participant2: MOCK_USERS["3"],
        last_message: "Quando pode visitar a obra?",
        last_message_time: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        messages_count: 2,
        unread_count: 0,
      },
    ]
  }
}

const getMockMessages = (conversationId: string, userId: string): ChatMessage[] => {
  const now = Date.now()
  
  if (conversationId === "conv-1") {
    return [
      {
        id: "msg-1",
        conversation_id: "conv-1",
        sender_id: "1",
        sender: MOCK_USERS["1"],
        content: "Bom dia! Já receberam o orçamento da obra do Porto?",
        read: true,
        created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: "msg-2",
        conversation_id: "conv-1",
        sender_id: "3",
        sender: MOCK_USERS["3"],
        content: "Sim, já estou a analisar. Parece que alguns itens estão acima do preço de mercado.",
        read: true,
        created_at: new Date(now - 1000 * 60 * 60).toISOString(),
      },
      {
        id: "msg-3",
        conversation_id: "conv-1",
        sender_id: "1",
        sender: MOCK_USERS["1"],
        content: "Pode preparar um relatório detalhado?",
        read: true,
        created_at: new Date(now - 1000 * 60 * 45).toISOString(),
      },
      {
        id: "msg-4",
        conversation_id: "conv-1",
        sender_id: "3",
        sender: MOCK_USERS["3"],
        content: "Claro, vou enviar ainda hoje.",
        read: true,
        created_at: new Date(now - 1000 * 60 * 40).toISOString(),
      },
      {
        id: "msg-5",
        conversation_id: "conv-1",
        sender_id: "3",
        sender: MOCK_USERS["3"],
        content: "A análise do orçamento está pronta.",
        read: userId !== "1",
        created_at: new Date(now - 1000 * 60 * 30).toISOString(),
      },
    ]
  } else if (conversationId === "conv-2") {
    return [
      {
        id: "msg-6",
        conversation_id: "conv-2",
        sender_id: "2",
        sender: MOCK_USERS["2"],
        content: "Olá, gostaria de submeter um novo orçamento para análise.",
        read: true,
        created_at: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
      },
      {
        id: "msg-7",
        conversation_id: "conv-2",
        sender_id: "1",
        sender: MOCK_USERS["1"],
        content: "Claro! Pode fazer o upload na secção de Análise.",
        read: true,
        created_at: new Date(now - 1000 * 60 * 60 * 2.5).toISOString(),
      },
      {
        id: "msg-8",
        conversation_id: "conv-2",
        sender_id: "2",
        sender: MOCK_USERS["2"],
        content: "Obrigado pela aprovação!",
        read: true,
        created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      },
    ]
  } else if (conversationId === "conv-3") {
    return [
      {
        id: "msg-9",
        conversation_id: "conv-3",
        sender_id: "2",
        sender: MOCK_USERS["2"],
        content: "Olá! Preciso de agendar uma visita técnica.",
        read: true,
        created_at: new Date(now - 1000 * 60 * 90).toISOString(),
      },
      {
        id: "msg-10",
        conversation_id: "conv-3",
        sender_id: "2",
        sender: MOCK_USERS["2"],
        content: "Quando pode visitar a obra?",
        read: userId !== "3",
        created_at: new Date(now - 1000 * 60 * 60).toISOString(),
      },
    ]
  }
  
  return []
}

export function useChat(userId: string | null) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useMockData, setUseMockData] = useState(false)
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const mockMessagesRef = useRef<Map<string, ChatMessage[]>>(new Map())

  // Initialize mock messages storage
  useEffect(() => {
    if (userId) {
      mockMessagesRef.current.set("conv-1", getMockMessages("conv-1", userId))
      mockMessagesRef.current.set("conv-2", getMockMessages("conv-2", userId))
      mockMessagesRef.current.set("conv-3", getMockMessages("conv-3", userId))
    }
  }, [userId])

  // Fetch conversations for current user
  const fetchConversations = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    setError(null)

    // If no Supabase client, use mock data
    if (!supabase) {
      setConversations(getMockConversations(userId))
      setUseMockData(true)
      setIsLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("conversations")
        .select("*, participant1:profiles!conversations_participant1_id_fkey(id, name, avatar_url), participant2:profiles!conversations_participant2_id_fkey(id, name, avatar_url)")
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order("last_message_time", { ascending: false })

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        setConversations(
          data.map((conv) => ({
            ...conv,
            messages_count: 0,
            unread_count: 0,
          }))
        )
        setUseMockData(false)
      } else {
        // No data from Supabase, use mock
        setConversations(getMockConversations(userId))
        setUseMockData(true)
      }
    } catch (err) {
      console.error("Error fetching conversations, using mock data:", err)
      setConversations(getMockConversations(userId))
      setUseMockData(true)
    } finally {
      setIsLoading(false)
    }
  }, [userId, supabase])

  // Fetch messages for active conversation
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!userId) return
      setIsLoading(true)

      // If using mock data, get mock messages
      if (useMockData || !supabase) {
        const mockMsgs = mockMessagesRef.current.get(conversationId) || getMockMessages(conversationId, userId)
        setMessages(mockMsgs)
        setIsLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("messages")
          .select("*, sender:profiles(name, avatar_url)")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })

        if (fetchError) throw fetchError

        if (data && data.length > 0) {
          setMessages(
            data.map((msg) => ({
              id: msg.id,
              conversation_id: msg.conversation_id,
              sender_id: msg.sender_id,
              sender: msg.sender,
              content: msg.content,
              read: msg.read,
              created_at: msg.created_at,
            }))
          )
        } else {
          // No messages from Supabase, use mock
          const mockMsgs = mockMessagesRef.current.get(conversationId) || getMockMessages(conversationId, userId)
          setMessages(mockMsgs)
        }
      } catch (err) {
        console.error("Error fetching messages, using mock data:", err)
        const mockMsgs = mockMessagesRef.current.get(conversationId) || getMockMessages(conversationId, userId)
        setMessages(mockMsgs)
      } finally {
        setIsLoading(false)
      }
    },
    [supabase, useMockData, userId]
  )

  // Send message
  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!userId || !content.trim()) return

      // If using mock data, add to local state
      if (useMockData || !supabase) {
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          conversation_id: conversationId,
          sender_id: userId,
          sender: MOCK_USERS[userId as keyof typeof MOCK_USERS] || { id: userId, name: "Você", avatar_url: "" },
          content: content.trim(),
          read: true,
          created_at: new Date().toISOString(),
        }

        // Update local messages
        setMessages((prev) => [...prev, newMessage])
        
        // Store in ref for persistence
        const existing = mockMessagesRef.current.get(conversationId) || []
        mockMessagesRef.current.set(conversationId, [...existing, newMessage])

        // Update conversation last message
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? { ...conv, last_message: content.trim(), last_message_time: new Date().toISOString() }
              : conv
          )
        )

        return newMessage
      }

      try {
        const { data: message, error: insertError } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            content: content.trim(),
            read: false,
          })
          .select()
          .single()

        if (insertError) throw insertError

        if (message) {
          // Update conversation last message
          await supabase
            .from("conversations")
            .update({
              last_message: content.trim(),
              last_message_time: new Date().toISOString(),
            })
            .eq("id", conversationId)
        }

        return message
      } catch (err) {
        console.error("Error sending message:", err)
        setError("Failed to send message")
      }
    },
    [userId, supabase, useMockData]
  )

  // Create or get conversation
  const getOrCreateConversation = useCallback(
    async (otherUserId: string) => {
      if (!userId) return null

      if (useMockData || !supabase) {
        // Create a mock conversation
        const newConvId = `conv-new-${Date.now()}`
        const newConv: ChatConversation = {
          id: newConvId,
          participant1_id: userId,
          participant2_id: otherUserId,
          participant1: MOCK_USERS[userId as keyof typeof MOCK_USERS] || { id: userId, name: "Você", avatar_url: "" },
          participant2: MOCK_USERS[otherUserId as keyof typeof MOCK_USERS] || { id: otherUserId, name: "Utilizador", avatar_url: "" },
          last_message: "",
          last_message_time: new Date().toISOString(),
          messages_count: 0,
          unread_count: 0,
        }
        setConversations((prev) => [newConv, ...prev])
        return newConvId
      }

      try {
        // Check if conversation already exists
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .or(`and(participant1_id.eq.${userId},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${userId})`)
          .single()

        if (existing) {
          return existing.id
        }

        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from("conversations")
          .insert({
            participant1_id: userId,
            participant2_id: otherUserId,
          })
          .select()
          .single()

        if (createError) throw createError

        return newConv?.id
      } catch (err) {
        console.error("Error getting/creating conversation:", err)
        return null
      }
    },
    [userId, supabase, useMockData]
  )

  // Mark messages as read
  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (useMockData || !supabase) {
        // Update local state for mock data
        setMessages((prev) =>
          prev.map((msg) => (msg.conversation_id === conversationId ? { ...msg, read: true } : msg))
        )
        setConversations((prev) =>
          prev.map((conv) => (conv.id === conversationId ? { ...conv, unread_count: 0 } : conv))
        )
        return
      }

      try {
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("conversation_id", conversationId)
          .eq("read", false)
      } catch (err) {
        console.error("Error marking messages as read:", err)
      }
    },
    [supabase, useMockData]
  )

  // Subscribe to real-time message updates (only if Supabase is available)
  useEffect(() => {
    if (!activeConversation || !supabase || useMockData) {
      if (activeConversation && userId) {
        fetchMessages(activeConversation)
      }
      return
    }

    // Fetch initial messages
    fetchMessages(activeConversation)

    // Subscribe to message changes
    channelRef.current = supabase
      .channel(`conversation:${activeConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversation}`,
        },
        (payload) => {
          const newMessage: ChatMessage = {
            id: payload.new.id,
            conversation_id: payload.new.conversation_id,
            sender_id: payload.new.sender_id,
            sender: { name: "", avatar_url: "" },
            content: payload.new.content,
            read: payload.new.read,
            created_at: payload.new.created_at,
          }

          setMessages((prev) => [...prev, newMessage])

          // Mark as read if it's from another user
          if (payload.new.sender_id !== userId) {
            markAsRead(activeConversation)
          }
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [activeConversation, userId, supabase, useMockData, fetchMessages, markAsRead])

  // Subscribe to conversation updates (only if Supabase is available)
  useEffect(() => {
    if (!userId || !supabase || useMockData) return

    const channel = supabase
      .channel(`user:${userId}:conversations`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, useMockData, fetchConversations])

  return {
    conversations,
    messages,
    activeConversation,
    setActiveConversation,
    isLoading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    getOrCreateConversation,
    markAsRead,
    useMockData,
  }
}
