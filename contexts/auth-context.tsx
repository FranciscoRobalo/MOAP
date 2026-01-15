"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type UserRole = "admin" | "public" | "tecnico"

interface User {
  id: string
  username: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  company?: string
  phone?: string
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>
  pendingRegistrations: PendingRegistration[]
  approveRegistration: (id: string) => void
  rejectRegistration: (id: string) => void
}

interface RegisterData {
  name: string
  email: string
  username: string
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

let USERS: Record<string, { password: string; user: User }> = {
  admin: {
    password: "admin",
    user: {
      id: "1",
      username: "admin",
      name: "Administrador",
      email: "admin@moap.pt",
      avatar: "/admin-avatar-professional.jpg",
      role: "admin",
    },
  },
  public: {
    password: "public",
    user: {
      id: "2",
      username: "public",
      name: "Utilizador Público",
      email: "publico@moap.pt",
      avatar: "/user-public.jpg",
      role: "public",
    },
  },
  tecnico: {
    password: "tecnico",
    user: {
      id: "3",
      username: "tecnico",
      name: "Técnico MOAP",
      email: "tecnico@moap.pt",
      avatar: "/diverse-technician-team.png",
      role: "tecnico",
    },
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([])

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("moap_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    // Load registered users from localStorage
    const storedUsers = localStorage.getItem("moap_registered_users")
    if (storedUsers) {
      const registeredUsers = JSON.parse(storedUsers)
      USERS = { ...USERS, ...registeredUsers }
    }

    // Load pending registrations
    const storedPending = localStorage.getItem("moap_pending_registrations")
    if (storedPending) {
      setPendingRegistrations(JSON.parse(storedPending))
    }

    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const userEntry = USERS[username.toLowerCase()]
    if (userEntry && userEntry.password === password) {
      setUser(userEntry.user)
      localStorage.setItem("moap_user", JSON.stringify(userEntry.user))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("moap_user")
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    // Check if username already exists
    if (USERS[data.username.toLowerCase()]) {
      return { success: false, message: "usernameExists" }
    }

    // Check if email already exists
    const emailExists = Object.values(USERS).some((u) => u.user.email.toLowerCase() === data.email.toLowerCase())
    if (emailExists) {
      return { success: false, message: "emailExists" }
    }

    // Create pending registration
    const registration: PendingRegistration = {
      id: `reg_${Date.now()}`,
      data,
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    const newPending = [...pendingRegistrations, registration]
    setPendingRegistrations(newPending)
    localStorage.setItem("moap_pending_registrations", JSON.stringify(newPending))

    // Simulate sending email to webmaster@moap.com
    console.log(`[MOAP] New registration request sent to webmaster@moap.com:`, {
      name: data.name,
      email: data.email,
      username: data.username,
      company: data.company,
      role: data.role,
    })

    return { success: true, message: "registrationPending" }
  }

  const approveRegistration = (id: string) => {
    const registration = pendingRegistrations.find((r) => r.id === id)
    if (!registration) return

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}`,
      username: registration.data.username,
      name: registration.data.name,
      email: registration.data.email,
      role: registration.data.role,
      company: registration.data.company,
      phone: registration.data.phone,
      createdAt: new Date().toISOString(),
    }

    // Add to USERS
    USERS[registration.data.username.toLowerCase()] = {
      password: registration.data.password,
      user: newUser,
    }

    // Save registered users to localStorage
    const registeredUsers = JSON.parse(localStorage.getItem("moap_registered_users") || "{}")
    registeredUsers[registration.data.username.toLowerCase()] = {
      password: registration.data.password,
      user: newUser,
    }
    localStorage.setItem("moap_registered_users", JSON.stringify(registeredUsers))

    // Update pending registrations
    const newPending = pendingRegistrations.map((r) => (r.id === id ? { ...r, status: "approved" as const } : r))
    setPendingRegistrations(newPending)
    localStorage.setItem("moap_pending_registrations", JSON.stringify(newPending))

    console.log(`[MOAP] Registration approved, confirmation email sent to ${registration.data.email}`)
  }

  const rejectRegistration = (id: string) => {
    const registration = pendingRegistrations.find((r) => r.id === id)
    if (!registration) return

    const newPending = pendingRegistrations.map((r) => (r.id === id ? { ...r, status: "rejected" as const } : r))
    setPendingRegistrations(newPending)
    localStorage.setItem("moap_pending_registrations", JSON.stringify(newPending))

    console.log(`[MOAP] Registration rejected, notification email sent to ${registration.data.email}`)
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
