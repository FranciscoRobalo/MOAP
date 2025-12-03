"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  username: string
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const VALID_CREDENTIALS = {
  username: "admin",
  password: "admin",
}

const ADMIN_USER: User = {
  id: "1",
  username: "admin",
  name: "Administrador",
  email: "admin@moap.pt",
  avatar: "/admin-avatar-professional.jpg",
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
    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
      setUser(ADMIN_USER)
      localStorage.setItem("moap_user", JSON.stringify(ADMIN_USER))
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
