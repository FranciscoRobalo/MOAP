"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

export type UserRole = "admin" | "cliente" | "tecnico"

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  company?: string
  phone?: string
  avatar_url?: string
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>
  pendingRegistrations: PendingRegistration[]
  approveRegistration: (id: string) => Promise<void>
  rejectRegistration: (id: string) => Promise<void>
  refreshUser: () => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  password: string
  company?: string
  phone?: string
  role: UserRole
}

interface PendingRegistration {
  id: string
  data: RegisterData
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Development fallback users - these work when Supabase auth fails
const DEV_USERS: Record<string, { password: string; user: User }> = {
  "admin": {
    password: "admin",
    user: {
      id: "dev-admin-1",
      email: "admin@moap.pt",
      name: "Administrador",
      role: "admin",
      company: "MOAP",
    },
  },
  "admin@moap.pt": {
    password: "admin",
    user: {
      id: "dev-admin-1",
      email: "admin@moap.pt",
      name: "Administrador",
      role: "admin",
      company: "MOAP",
    },
  },
  "tecnico": {
    password: "tecnico",
    user: {
      id: "dev-tecnico-1",
      email: "tecnico@moap.pt",
      name: "Tecnico MOAP",
      role: "tecnico",
      company: "MOAP",
    },
  },
  "tecnico@moap.pt": {
    password: "tecnico",
    user: {
      id: "dev-tecnico-1",
      email: "tecnico@moap.pt",
      name: "Tecnico MOAP",
      role: "tecnico",
      company: "MOAP",
    },
  },
  "cliente": {
    password: "cliente",
    user: {
      id: "dev-cliente-1",
      email: "cliente@moap.pt",
      name: "Cliente Demo",
      role: "cliente",
    },
  },
  "cliente@moap.pt": {
    password: "cliente",
    user: {
      id: "dev-cliente-1",
      email: "cliente@moap.pt",
      name: "Cliente Demo",
      role: "cliente",
    },
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([])
  const supabase = createClient()

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // Fetch user profile from database
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role as UserRole,
              company: profile.company,
              phone: profile.phone,
              avatar_url: profile.avatar_url,
            })
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role as UserRole,
              company: profile.company,
              phone: profile.phone,
              avatar_url: profile.avatar_url,
            })
          }
        } else {
          setUser(null)
        }
      })

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // First try Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data.session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.session.user.id)
          .single()

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role as UserRole,
            company: profile.company,
            phone: profile.phone,
            avatar_url: profile.avatar_url,
          })
        }

        return { success: true }
      }

      // If Supabase fails, try development fallback users
      const devUser = DEV_USERS[email.toLowerCase()]
      if (devUser && devUser.password === password) {
        setUser(devUser.user)
        return { success: true }
      }

      return { success: false, error: "Invalid login credentials" }
    } catch (error) {
      console.error("Login error:", error)
      
      // On error, still try development fallback
      const devUser = DEV_USERS[email.toLowerCase()]
      if (devUser && devUser.password === password) {
        setUser(devUser.user)
        return { success: true }
      }
      
      return { success: false, error: "An error occurred during login" }
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
      setUser(null)
    }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/dashboard`,
          data: {
            name: data.name,
            role: data.role,
            company: data.company,
            phone: data.phone,
          },
        },
      })

      if (authError) {
        if (authError.message.includes("already registered")) {
          return { success: false, message: "emailExists" }
        }
        return { success: false, message: "registrationFailed" }
      }

      // Create pending registration record
      const registration: PendingRegistration = {
        id: `reg_${Date.now()}`,
        data,
        status: "pending",
        createdAt: new Date().toISOString(),
      }

      const newPending = [...pendingRegistrations, registration]
      setPendingRegistrations(newPending)
      localStorage.setItem("moap_pending_registrations", JSON.stringify(newPending))

      return { success: true, message: "registrationPending" }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, message: "registrationFailed" }
    }
  }

  const approveRegistration = async (id: string) => {
    try {
      const registration = pendingRegistrations.find((r) => r.id === id)
      if (!registration) return

      // Update profile role in database
      await supabase
        .from("profiles")
        .update({ role: registration.data.role })
        .eq("email", registration.data.email)

      const newPending = pendingRegistrations.map((r) =>
        r.id === id ? { ...r, status: "approved" as const } : r
      )
      setPendingRegistrations(newPending)
      localStorage.setItem("moap_pending_registrations", JSON.stringify(newPending))
    } catch (error) {
      console.error("Approval error:", error)
    }
  }

  const rejectRegistration = async (id: string) => {
    try {
      const newPending = pendingRegistrations.map((r) =>
        r.id === id ? { ...r, status: "rejected" as const } : r
      )
      setPendingRegistrations(newPending)
      localStorage.setItem("moap_pending_registrations", JSON.stringify(newPending))
    } catch (error) {
      console.error("Rejection error:", error)
    }
  }

  const refreshUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role as UserRole,
            company: profile.company,
            phone: profile.phone,
            avatar_url: profile.avatar_url,
          })
        }
      }
    } catch (error) {
      console.error("Refresh user error:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        register,
        pendingRegistrations,
        approveRegistration,
        rejectRegistration,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
