"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Eye, EyeOff, AlertCircle, Upload } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"

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
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary animate-pulse">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight">MOAP</span>
        </div>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="h-7 w-32 mx-auto bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 mx-auto bg-muted animate-pulse rounded mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
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
  const [isVisible, setIsVisible] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const redirectTo = searchParams.get("redirect") || "/dashboard"
  const hasPendingFile = searchParams.get("pending_file") === "1"

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Login attempt with:", email, password)
    setError("")
    setIsLoading(true)

    try {
      console.log("[v0] Calling login function...")
      const result = await login(email, password)
      console.log("[v0] Login result:", result)

      if (result.success) {
        console.log("[v0] Login successful, redirecting to:", redirectTo)
        router.push(redirectTo)
      } else {
        console.log("[v0] Login failed:", result.error)
        setError(result.error || t("invalidCredentials"))
      }
    } catch (err) {
      console.error("[v0] Login exception:", err)
      setError("An unexpected error occurred")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-chart-1/10 blur-[100px] animate-float animate-delay-300" />
      </div>

      <div className="w-full max-w-md">
        <div
          className={`flex justify-end mb-4 transition-all duration-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <LanguageSwitcher />
        </div>

        <Link
          href="/"
          className={`flex items-center justify-center gap-2 mb-8 transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary animate-pulse-glow">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight">MOAP</span>
        </Link>

        <Card
          className={`border-border/50 bg-card/50 backdrop-blur glass transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("welcomeBack")}</CardTitle>
            <CardDescription>{t("loginSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {hasPendingFile && (
              <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3 mb-4 text-sm text-primary">
                <Upload className="h-4 w-4 mt-0.5 shrink-0" />
                <span>O seu ficheiro esta guardado. Apos iniciar sessao, a analise comecara automaticamente.</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive animate-fade-in-down">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div
                className={`space-y-2 transition-all duration-500 delay-300 ${
                  isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
              >
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input/50 transition-all duration-300 focus:scale-[1.01]"
                />
              </div>

              <div
                className={`space-y-2 transition-all duration-500 delay-400 ${
                  isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
              >
                <Label htmlFor="password">{t("password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-input/50 pr-10 transition-all duration-300 focus:scale-[1.01]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className={`w-full btn-ripple hover-glow transition-all duration-500 delay-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {t("loading")}
                  </span>
                ) : (
                  t("loginButton")
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("noAccount")}{" "}
                <Link href={`/register${hasPendingFile ? "?redirect=/dashboard/analise&pending_file=1" : ""}`} className="text-primary hover:underline font-medium">
                  {t("registerHere")}
                </Link>
              </p>
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-scale inline-block"
              >
                {t("back")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
