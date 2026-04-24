"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Menu, X, ArrowUpRight } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cn } from "@/lib/utils"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const navLinks = [
    { href: "/#funcionalidades", label: t("features") },
    { href: "/#como-funciona", label: t("howItWorks") },
    { href: "/#relatorio", label: t("report") },
    { href: "/#carregar", label: t("uploadDocument") },
    { href: "/contacto", label: "Contacto" },
  ]

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b hairline bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-primary">
            <FileText className="relative z-10 h-5 w-5 text-primary-foreground" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary to-amber opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-sans text-base font-semibold tracking-tight text-foreground">MOAP</span>
            <span className="mt-0.5 hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:inline">
              Orçamentos
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border hairline bg-background/50 px-2 py-1.5 backdrop-blur-xl lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <Link
            href="/login?action=budget-request"
            className="group hidden items-center gap-1.5 rounded-full border hairline px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground transition-all hover:border-primary/50 hover:bg-secondary lg:inline-flex"
          >
            {t("heroBudgetRequest")}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
          {user ? (
            <Link href="/dashboard">
              <Button size="sm" className="rounded-full">
                {t("dashboard")}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login?force=1" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="rounded-full">
                  {t("login")}
                </Button>
              </Link>
              <Link href="/login?force=1">
                <Button size="sm" className="rounded-full">
                  {t("startNow")}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile cluster */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher variant="compact" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t hairline bg-background/95 px-4 py-5 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            <Link
              href="/login?action=budget-request"
              className="mt-2 flex items-center justify-between rounded-lg border hairline px-3 py-2.5 text-sm font-medium text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("heroBudgetRequest")}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <div className="mt-4 flex flex-col gap-2">
              {user ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full rounded-full">
                    {t("dashboard")}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login?force=1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full rounded-full">
                      {t("login")}
                    </Button>
                  </Link>
                  <Link href="/login?force=1" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full rounded-full">
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
