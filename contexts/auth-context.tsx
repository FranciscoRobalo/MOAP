"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { authClient } from "@/lib/auth-client"
import {
  getMyProfile,
  createMyProfile,
  listPendingProfiles,
  approveProfile,
  rejectProfile,
  type ProfileData,
} from "@/app/actions/auth"

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
  refreshPendingRegistrations: () => Promise<void>
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

function profileToUser(p: ProfileData): User {
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    role: p.role,
    company: p.company ?? undefined,
    phone: p.phone ?? undefined,
    avatar_url: p.avatarUrl ?? undefined,
    createdAt: p.createdAt,
  }
}

function profileToPending(p: ProfileData): PendingRegistration {
  return {
    id: p.id,
    data: {
      name: p.name,
      email: p.email,
      password: "",
      company: p.company ?? undefined,
      phone: p.phone ?? undefined,
      role: p.role,
    },
    status: "pending",
    createdAt: p.createdAt ?? new Date().toISOString(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([])

  const loadPendingRegistrations = useCallback(async () => {
    try {
      const pending = await listPendingProfiles()
      setPendingRegistrations(pending.map(profileToPending))
    } catch {
      // Not an admin or not signed in - nothing to load
      setPendingRegistrations([])
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getMyProfile()
      if (profile) {
        setUser(profileToUser(profile))
        if (profile.role === "admin") {
          await loadPendingRegistrations()
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Refresh user error:", error)
      setUser(null)
    }
  }, [loadPendingRegistrations])

  // Initialize auth state on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await refreshUser()
      } finally {
        setIsLoading(false)
      }
    }
    initialize()
  }, [refreshUser])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.toLowerCase().trim()

    try {
      const { error } = await authClient.signIn.email({
        email: normalizedEmail,
        password,
      })

      if (error) {
        return { success: false, error: error.message || "Credenciais inválidas" }
      }

      const profile = await getMyProfile()

      if (!profile) {
        await authClient.signOut()
        return { success: false, error: "Perfil não encontrado. Contacte o administrador." }
      }

      if (!profile.approved) {
        await authClient.signOut()
        return { success: false, error: "A sua conta aguarda aprovação pelo administrador." }
      }

      setUser(profileToUser(profile))
      if (profile.role === "admin") {
        await loadPendingRegistrations()
      }
      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Ocorreu um erro durante o login" }
    }
  }

  const logout = async () => {
    try {
      await authClient.signOut()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      setPendingRegistrations([])
    }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    try {
      // Create the auth user via Better Auth
      const { error } = await authClient.signUp.email({
        email: data.email.toLowerCase().trim(),
        password: data.password,
        name: data.name,
      })

      if (error) {
        if (error.message?.toLowerCase().includes("exist")) {
          return { success: false, message: "emailExists" }
        }
        return { success: false, message: "registrationFailed" }
      }

      // Create the app profile (starts unapproved; first user becomes admin)
      const profile = await createMyProfile({
        role: data.role === "admin" ? "cliente" : data.role,
        company: data.company,
        phone: data.phone,
      })

      if (profile.approved) {
        // First user (bootstrap admin) - signed in and ready
        setUser(profileToUser(profile))
        return { success: true, message: "registrationApproved" }
      }

      // Regular flow: sign out until an admin approves the account
      await authClient.signOut()
      return { success: true, message: "registrationPending" }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, message: "registrationFailed" }
    }
  }

  const approveRegistration = async (id: string) => {
    await approveProfile(id)
    setPendingRegistrations((prev) => prev.filter((r) => r.id !== id))
  }

  const rejectRegistration = async (id: string) => {
    await rejectProfile(id)
    setPendingRegistrations((prev) => prev.filter((r) => r.id !== id))
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
        refreshPendingRegistrations: loadPendingRegistrations,
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
