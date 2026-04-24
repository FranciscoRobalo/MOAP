"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Eye, EyeOff, AlertCircle, Upload, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { BlueprintBackdrop } from "@/components/landing/blueprint-backdrop"

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-semibold tracking-tight">MOAP</span>
        </div>
        <div className="rounded-2xl border hairline bg-card p-8">
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginPageContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const redirectTo = searchParams.get("redirect") || "/dashboard"
  const hasPendingFile = searchParams.get("pending_file") === "1"
  const forceLogin = searchParams.get("force") === "1"

  useEffect(() => {
    // If force login is requested, clear any existing session
    if (forceLogin) {
      document.cookie = "moap_dev_user=; path=/; max-age=0"
    }
  }, [forceLogin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await login(email, password)

      if (result.success) {
        router.push(redirectTo)
      } else {
        setError(result.error || t("invalidCredentials"))
      }
    } catch (err) {
      console.error("[v0] Login exception:", err)
      setError("An unexpected error occurred")
    }

    setIsLoading(false)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <BlueprintBackdrop />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-primary">
            <FileText className="relative z-10 h-5 w-5 text-primary-foreground" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary to-amber opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-sans text-base font-semibold tracking-tight text-foreground">MOAP</span>
            <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Orçamentos
            </span>
          </div>
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Eyebrow */}
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <span className="eyebrow-strong">Iniciar sessão</span>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
            {t("welcomeBack")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">{t("loginSubtitle")}</p>

          {/* Card */}
          <div className="bp-bracket mt-10 rounded-2xl border hairline bg-card/80 p-6 backdrop-blur-xl sm:p-8">
            {hasPendingFile && (
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
                <Upload className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  O seu ficheiro está guardado. Após iniciar sessão, a análise começará automaticamente.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="eyebrow">
                  {t("email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-input/50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="eyebrow">
                    {t("password")}
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-input/50 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar password" : "Mostrar password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="h-12 w-full rounded-full text-sm font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    {t("loading")}
                  </span>
                ) : (
                  t("loginButton")
                )}
              </Button>
            </form>

            <div className="mt-8 border-t hairline pt-5 text-center">
              <p className="text-sm text-muted-foreground">
                {t("noAccount")}{" "}
                <Link
                  href={`/register${hasPendingFile ? "?redirect=/dashboard/analise&pending_file=1" : ""}`}
                  className="font-medium text-primary hover:underline"
                >
                  {t("registerHere")}
                </Link>
              </p>
            </div>
          </div>

          {/* Back link */}
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("back")}
          </Link>
        </div>
      </div>
    </div>
  )
}
