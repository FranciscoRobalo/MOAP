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

export function useChat(userId: string | null) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Fetch conversations for current user
  const fetchConversations = useCallback(async () => {
    if (!userId || !supabase) return
    setIsLoading(true)

    try {
      const { data, error: fetchError } = await supabase
        .from("conversations")
        .select("*, participant1:profiles!conversations_participant1_id_fkey(id, name, avatar_url), participant2:profiles!conversations_participant2_id_fkey(id, name, avatar_url)")
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order("last_message_time", { ascending: false })

      if (fetchError) throw fetchError

      if (data) {
        setConversations(
          data.map((conv) => ({
            ...conv,
            messages_count: 0,
            unread_count: 0,
          }))
        )
      }
    } catch (err) {
      console.error("Error fetching conversations:", err)
      setError("Failed to load conversations")
    } finally {
      setIsLoading(false)
    }
  }, [userId, supabase])

  // Fetch messages for active conversation
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      setIsLoading(true)

      try {
        const { data, error: fetchError } = await supabase
          .from("messages")
          .select("*, sender:profiles(name, avatar_url)")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })

        if (fetchError) throw fetchError

        if (data) {
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
        }
      } catch (err) {
        console.error("Error fetching messages:", err)
        setError("Failed to load messages")
      } finally {
        setIsLoading(false)
      }
    },
    [supabase]
  )

  // Send message
  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!userId || !content.trim()) return

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
    [userId, supabase]
  )

  // Create or get conversation
  const getOrCreateConversation = useCallback(
    async (otherUserId: string) => {
      if (!userId) return null

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
    [userId, supabase]
  )

  // Mark messages as read
  const markAsRead = useCallback(
    async (conversationId: string) => {
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
    [supabase]
  )

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!activeConversation) return

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
  }, [activeConversation, userId, supabase, fetchMessages, markAsRead])

  // Subscribe to conversation updates
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`user:${userId}:conversations`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `participant1_id=eq.${userId} OR participant2_id=eq.${userId}`,
        },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, fetchConversations])

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
  }
}
