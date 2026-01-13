"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Menu, X } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()
  const { t } = useLanguage()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">MOAP</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#funcionalidades"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("features")}
          </Link>
          <Link href="#como-funciona" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("howItWorks")}
          </Link>
          <Link href="#relatorio" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("report")}
          </Link>
          <Link href="#carregar" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("uploadDocument")}
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {user ? (
            <Link href="/dashboard">
              <Button size="sm">{t("dashboard")}</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t("login")}
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm">{t("startNow")}</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher variant="compact" />
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <Link
              href="#funcionalidades"
              className="text-sm text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("features")}
            </Link>
            <Link
              href="#como-funciona"
              className="text-sm text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("howItWorks")}
            </Link>
            <Link href="#relatorio" className="text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
              {t("report")}
            </Link>
            <Link href="#carregar" className="text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
              {t("uploadDocument")}
            </Link>
            <div className="flex flex-col gap-2 pt-4">
              {user ? (
                <Link href="/dashboard">
                  <Button size="sm" className="w-full">
                    {t("dashboard")}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="w-full">
                      {t("login")}
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm" className="w-full">
                      {t("startNow")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
