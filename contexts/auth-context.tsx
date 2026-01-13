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
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USERS: Record<string, { password: string; user: User }> = {
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

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("moap_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
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

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
