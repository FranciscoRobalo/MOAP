"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"

export function DashboardHeader() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4 flex-1 max-w-md ml-12 lg:ml-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar..." className="pl-9 bg-input/50" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          </Button>
          <div className="h-8 w-8 rounded-full bg-muted overflow-hidden">
            <img
              src={user?.avatar || "/placeholder.svg?height=32&width=32&query=user"}
              alt={user?.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
