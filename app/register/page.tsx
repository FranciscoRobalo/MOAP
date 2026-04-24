"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"
import { useAuth, type UserRole } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { BlueprintBackdrop } from "@/components/landing/blueprint-backdrop"

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageSkeleton />}>
      <RegisterPageContent />
    </Suspense>
  )
}

function RegisterPageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-semibold tracking-tight">MOAP</span>
        </div>
        <div className="rounded-2xl border hairline bg-card p-8">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function RegisterPageContent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    company: "",
    phone: "",
    role: "public" as UserRole,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const redirectTo = searchParams.get("redirect") || "/dashboard"
  const hasPendingFile = searchParams.get("pending_file") === "1"

  useEffect(() => {}, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(t("passwordsDoNotMatch"))
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError(t("passwordTooShort"))
      setIsLoading(false)
      return
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      username: formData.username,
      password: formData.password,
      company: formData.company,
      phone: formData.phone,
      role: formData.role,
    })

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        router.push(redirectTo)
      }, 1500)
    } else {
      setError(t(result.message as any))
    }

    setIsLoading(false)
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background">
        <BlueprintBackdrop />
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
          <div className="bp-bracket w-full max-w-md rounded-2xl border hairline bg-card/80 p-8 backdrop-blur-xl">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border hairline bg-primary/10">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div className="text-center">
              <span className="eyebrow-strong">Registo submetido</span>
              <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground">
                {t("registrationSubmitted")}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">{t("registrationPendingMessage")}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                {t("contactEmail")}:{" "}
                <span className="font-mono text-primary">webmaster@moap.com</span>
              </p>
              <Button asChild className="mt-6 h-11 w-full rounded-full">
                <Link href="/login">{t("backToLogin")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
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

      <div className="relative z-10 flex min-h-[calc(100vh-72px)] items-start justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <span className="eyebrow-strong">Criar conta</span>
          </div>

          <h1 className="font-display text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
            {t("createAccount")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">{t("registerSubtitle")}</p>

          <div className="bp-bracket mt-10 rounded-2xl border hairline bg-card/80 p-6 backdrop-blur-xl sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="eyebrow">
                    {t("fullName")} *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t("fullNamePlaceholder")}
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                    className="h-11 border-border/60 bg-background/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="eyebrow">
                    {t("username")} *
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={t("usernamePlaceholder")}
                    value={formData.username}
                    onChange={(e) => updateField("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
                    required
                    className="h-11 border-border/60 bg-background/60 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="eyebrow">
                  {t("email")} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                  className="h-11 border-border/60 bg-background/60"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company" className="eyebrow">
                    {t("company")}
                  </Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder={t("companyPlaceholder")}
                    value={formData.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    className="h-11 border-border/60 bg-background/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="eyebrow">
                    {t("phone")}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t("phonePlaceholder")}
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="h-11 border-border/60 bg-background/60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="eyebrow">
                  {t("accountType")} *
                </Label>
                <Select value={formData.role} onValueChange={(value) => updateField("role", value)}>
                  <SelectTrigger className="h-11 border-border/60 bg-background/60">
                    <SelectValue placeholder={t("selectAccountType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">{t("publicUser")}</SelectItem>
                    <SelectItem value="tecnico">{t("technician")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password" className="eyebrow">
                    {t("password")} *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("passwordPlaceholder")}
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      required
                      className="h-11 border-border/60 bg-background/60 pr-10"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="eyebrow">
                    {t("confirmPassword")} *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("confirmPasswordPlaceholder")}
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      required
                      className="h-11 border-border/60 bg-background/60 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Ocultar password" : "Mostrar password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">{t("registrationNote")}</p>

              <Button type="submit" className="h-12 w-full rounded-full text-sm font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    {t("loading")}
                  </span>
                ) : (
                  t("submitRegistration")
                )}
              </Button>
            </form>

            <div className="mt-8 border-t hairline pt-5 text-center">
              <p className="text-sm text-muted-foreground">
                {t("alreadyHaveAccount")}{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  {t("loginHere")}
                </Link>
              </p>
            </div>
          </div>

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
