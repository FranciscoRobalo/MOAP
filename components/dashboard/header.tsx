"use client"

import { Search } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { NotificationsDropdown } from "./notifications-dropdown"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

export function DashboardHeader() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const openCommandPalette = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-hairline/80 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center gap-4 px-4 sm:px-6">
        {/* Search trigger — editorial pill with mono kbd hint */}
        <div className="ml-12 flex flex-1 items-center lg:ml-0">
          <button
            type="button"
            onClick={openCommandPalette}
            className="group flex h-9 w-full max-w-md items-center gap-2 rounded-full border border-hairline/80 bg-background/50 px-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary/50 hover:text-foreground"
            aria-label={t("search")}
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground" />
            <span className="flex-1 truncate">{t("search")}</span>
            <kbd className="kbd hidden items-center gap-0.5 sm:inline-flex">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <LanguageSwitcher variant="compact" />
          <NotificationsDropdown />
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-hairline/80 bg-primary/10 text-xs font-semibold text-primary">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt={user?.name ?? ""} className="h-full w-full object-cover" />
            ) : (
              <span>{user?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
