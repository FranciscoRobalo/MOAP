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
  participant_1: string
  participant_2: string
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
  last_message_at: string
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
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from("conversations")
        .select(`
          *,
          participant1:profiles!conversations_participant_1_fkey(id, name, avatar_url),
          participant2:profiles!conversations_participant_2_fkey(id, name, avatar_url)
        `)
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order("last_message_at", { ascending: false })

      if (fetchError) throw fetchError

      // Transform data to match our interface
      const transformedConversations: ChatConversation[] = (data || []).map((conv: any) => ({
        id: conv.id,
        participant_1: conv.participant_1,
        participant_2: conv.participant_2,
        participant1: conv.participant1 || { id: conv.participant_1, name: "User", avatar_url: null },
        participant2: conv.participant2 || { id: conv.participant_2, name: "User", avatar_url: null },
        last_message: "",
        last_message_at: conv.last_message_at,
        unread_count: 0,
      }))

      setConversations(transformedConversations)
    } catch (err) {
      console.error("Error fetching conversations:", err)
      setError("Failed to load conversations")
    } finally {
      setIsLoading(false)
    }
  }, [userId, supabase])

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!supabase) return
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(name, avatar_url)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (fetchError) throw fetchError

      const transformedMessages: ChatMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        sender: msg.sender || { name: "User", avatar_url: null },
        content: msg.content,
        read: msg.read,
        created_at: msg.created_at,
      }))

      setMessages(transformedMessages)

      // Mark messages as read
      if (userId) {
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("conversation_id", conversationId)
          .neq("sender_id", userId)
      }
    } catch (err) {
      console.error("Error fetching messages:", err)
      setError("Failed to load messages")
    } finally {
      setIsLoading(false)
    }
  }, [supabase, userId])

  // Send a message
  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!userId || !supabase || !content.trim()) return false

    try {
      const { data: newMessage, error: sendError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: content.trim(),
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(name, avatar_url)
        `)
        .single()

      if (sendError) throw sendError

      // Update conversation's last message time
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversationId)

      // Add message to local state immediately
      if (newMessage) {
        const transformedMessage: ChatMessage = {
          id: newMessage.id,
          conversation_id: newMessage.conversation_id,
          sender_id: newMessage.sender_id,
          sender: newMessage.sender || { name: "User", avatar_url: null },
          content: newMessage.content,
          read: newMessage.read,
          created_at: newMessage.created_at,
        }
        setMessages(prev => [...prev, transformedMessage])
      }

      return true
    } catch (err) {
      console.error("Error sending message:", err)
      setError("Failed to send message")
      return false
    }
  }, [userId, supabase])

  // Create a new conversation
  const createConversation = useCallback(async (otherUserId: string) => {
    if (!userId || !supabase) return null

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant_1.eq.${userId},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${userId})`)
        .single()

      if (existing) {
        setActiveConversation(existing.id)
        await fetchMessages(existing.id)
        return existing.id
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from("conversations")
        .insert({
          participant_1: userId,
          participant_2: otherUserId,
        })
        .select()
        .single()

      if (createError) throw createError

      await fetchConversations()
      setActiveConversation(newConv.id)
      return newConv.id
    } catch (err) {
      console.error("Error creating conversation:", err)
      setError("Failed to create conversation")
      return null
    }
  }, [userId, supabase, fetchConversations, fetchMessages])

  // Set up real-time subscription
  useEffect(() => {
    if (!userId || !supabase) return

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new as any

          // Check if message is for a conversation we're part of
          const relevantConv = conversations.find(c => c.id === newMessage.conversation_id)
          if (relevantConv) {
            // If we're viewing this conversation, add the message
            if (activeConversation === newMessage.conversation_id) {
              // Fetch the sender info
              const { data: sender } = await supabase
                .from("profiles")
                .select("name, avatar_url")
                .eq("id", newMessage.sender_id)
                .single()

              const transformedMessage: ChatMessage = {
                id: newMessage.id,
                conversation_id: newMessage.conversation_id,
                sender_id: newMessage.sender_id,
                sender: sender || { name: "User", avatar_url: null },
                content: newMessage.content,
                read: newMessage.read,
                created_at: newMessage.created_at,
              }

              setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.id === transformedMessage.id)) return prev
                return [...prev, transformedMessage]
              })
            }

            // Update conversations list
            await fetchConversations()
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [userId, supabase, conversations, activeConversation, fetchConversations])

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchConversations()
    }
  }, [userId, fetchConversations])

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation)
    } else {
      setMessages([])
    }
  }, [activeConversation, fetchMessages])

  // Get the other participant in a conversation
  const getOtherParticipant = useCallback((conversation: ChatConversation) => {
    if (!userId) return conversation.participant1
    return conversation.participant_1 === userId
      ? conversation.participant2
      : conversation.participant1
  }, [userId])

  return {
    conversations,
    messages,
    activeConversation,
    setActiveConversation,
    sendMessage,
    createConversation,
    fetchConversations,
    getOtherParticipant,
    isLoading,
    error,
  }
}
