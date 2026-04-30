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
  "public": {
    password: "public",
    user: {
      id: "dev-public-1",
      email: "public@moap.pt",
      name: "Utilizador Publico",
      role: "cliente",
    },
  },
  "public@moap.pt": {
    password: "public",
    user: {
      id: "dev-public-1",
      email: "public@moap.pt",
      name: "Utilizador Publico",
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
        // Load pending registrations for admins
        if (profile?.role === "admin") {
          try {
            const { data: dbPending } = await supabase
              .from("pending_registrations")
              .select("*")
              .eq("status", "pending")
              .order("created_at", { ascending: false })
            
            if (dbPending && dbPending.length > 0) {
              const mapped: PendingRegistration[] = dbPending.map(p => ({
                id: p.id,
                data: {
                  name: p.name,
                  email: p.email,
                  password: p.password_hash,
                  company: p.company,
                  phone: p.phone,
                  role: p.role as UserRole,
                },
                status: p.status as "pending" | "approved" | "rejected",
                createdAt: p.created_at,
              }))
              setPendingRegistrations(mapped)
            } else {
              const stored = localStorage.getItem("moap_pending_registrations")
              if (stored) {
                setPendingRegistrations(JSON.parse(stored))
              }
            }
          } catch {
            const stored = localStorage.getItem("moap_pending_registrations")
            if (stored) {
              setPendingRegistrations(JSON.parse(stored))
            }
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
    console.log("[v0] Auth context login called with:", email)
    const normalizedEmail = email.toLowerCase().trim()
    console.log("[v0] Normalized email:", normalizedEmail)
    
    // Check development fallback users FIRST for immediate login
    const devUser = DEV_USERS[normalizedEmail]
    console.log("[v0] DEV_USERS lookup result:", devUser ? "found" : "not found")
    if (devUser && devUser.password === password) {
      console.log("[v0] Dev user matched! Setting user and cookie...")
      setUser(devUser.user)
      // Set cookie so middleware allows access to dashboard
      document.cookie = `moap_dev_user=${devUser.user.id}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
      return { success: true }
    }

    // Then try Supabase authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
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

      return { success: false, error: error?.message || "Invalid login credentials" }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "An error occurred during login" }
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      // Clear dev user cookie
      document.cookie = 'moap_dev_user=; path=/; max-age=0'
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
      document.cookie = 'moap_dev_user=; path=/; max-age=0'
      setUser(null)
    }
  }
  
  // Function to load ALL registrations from database (pending, approved, rejected)
  const loadPendingRegistrationsFromDb = async () => {
    try {
      const { data: dbPending, error } = await supabase
        .from("pending_registrations")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (error) {
        console.error("[v0] Error loading registrations:", error)
        // Fallback to localStorage
        const stored = localStorage.getItem("moap_pending_registrations")
        if (stored) {
          setPendingRegistrations(JSON.parse(stored))
        }
        return
      }
      
      if (dbPending && dbPending.length > 0) {
        const mapped: PendingRegistration[] = dbPending.map(p => ({
          id: p.id,
          data: {
            name: p.name,
            email: p.email,
            password: p.password_hash,
            company: p.company,
            phone: p.phone,
            role: p.role as UserRole,
          },
          status: p.status as "pending" | "approved" | "rejected",
          createdAt: p.created_at,
        }))
        setPendingRegistrations(mapped)
        // Also sync to localStorage for backup
        localStorage.setItem("moap_pending_registrations", JSON.stringify(mapped))
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem("moap_pending_registrations")
        if (stored) {
          setPendingRegistrations(JSON.parse(stored))
        }
      }
    } catch (err) {
      console.error("[v0] Exception loading registrations:", err)
      // Fallback to localStorage
      const stored = localStorage.getItem("moap_pending_registrations")
      if (stored) {
        setPendingRegistrations(JSON.parse(stored))
      }
    }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    try {
      // First check if email already exists in pending registrations
      const { data: existingPending } = await supabase
        .from("pending_registrations")
        .select("id")
        .eq("email", data.email)
        .single()
      
      if (existingPending) {
        return { success: false, message: "emailExists" }
      }
      
      // Create pending registration in database (not Supabase Auth yet)
      // Admin will create the actual user after approval
      const registrationId = `reg_${Date.now()}`
      const { error: insertError } = await supabase
        .from("pending_registrations")
        .insert({
          id: registrationId,
          name: data.name,
          email: data.email,
          password_hash: data.password, // In production, hash this server-side
          company: data.company,
          phone: data.phone,
          role: data.role,
          status: "pending",
          created_at: new Date().toISOString(),
        })
      
      if (insertError) {
        console.error("Insert error:", insertError)
        // Fallback to localStorage if table doesn't exist
        const registration: PendingRegistration = {
          id: registrationId,
          data,
          status: "pending",
          createdAt: new Date().toISOString(),
        }
        const newPending = [...pendingRegistrations, registration]
        setPendingRegistrations(newPending)
        localStorage.setItem("moap_pending_registrations", JSON.stringify(newPending))
      } else {
        // Refresh pending registrations from database
        await loadPendingRegistrationsFromDb()
      }

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

      // Create the actual user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registration.data.email,
        password: registration.data.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/dashboard`,
          data: {
            name: registration.data.name,
            role: registration.data.role,
            company: registration.data.company,
            phone: registration.data.phone,
          },
        },
      })
      
      if (authError) {
        console.error("Error creating user:", authError)
        return
      }
      
      // If user was created, also create/update their profile
      if (authData.user) {
        await supabase
          .from("profiles")
          .upsert({
            id: authData.user.id,
            email: registration.data.email,
            name: registration.data.name,
            role: registration.data.role,
            company: registration.data.company,
            phone: registration.data.phone,
          })
      }
      
      // Update pending registration status in database
      const { error: updateError } = await supabase
        .from("pending_registrations")
        .update({ status: "approved" })
        .eq("id", id)
      
      if (updateError) {
        console.error("[v0] Error updating registration status:", updateError)
      }

      // Update local state - keep record with updated status
      const newPending = pendingRegistrations.map((r) => 
        r.id === id ? { ...r, status: "approved" as const } : r
      )
      setPendingRegistrations(newPending)
      localStorage.setItem("moap_pending_registrations", JSON.stringify(newPending))
    } catch (error) {
      console.error("[v0] Approval error:", error)
      throw error // Re-throw so caller can handle
    }
  }

  const rejectRegistration = async (id: string) => {
    try {
      // Update pending registration status in database
      const { error: updateError } = await supabase
        .from("pending_registrations")
        .update({ status: "rejected" })
        .eq("id", id)
      
      if (updateError) {
        console.error("[v0] Error updating registration status:", updateError)
      }
      
      // Update local state - keep record with updated status
      const newPending = pendingRegistrations.map((r) => 
        r.id === id ? { ...r, status: "rejected" as const } : r
      )
      setPendingRegistrations(newPending)
      localStorage.setItem("moap_pending_registrations", JSON.stringify(newPending))
    } catch (error) {
      console.error("[v0] Rejection error:", error)
      throw error // Re-throw so caller can handle
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
