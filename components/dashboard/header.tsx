"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { NotificationsDropdown } from "./notifications-dropdown"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

export function DashboardHeader() {
  const { user } = useAuth()
  const { t, language } = useLanguage()

  const openCommandPalette = () => {
    // Dispatch keyboard event to open command palette
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4 flex-1 max-w-md ml-12 lg:ml-0">
          <Button
            variant="outline"
            className="relative flex-1 justify-start text-muted-foreground bg-input/50 hover:bg-input/80"
            onClick={openCommandPalette}
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="flex-1 text-left">{t("search")}</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher variant="compact" />
          <NotificationsDropdown />
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
