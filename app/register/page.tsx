"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Eye, EyeOff, AlertCircle, CheckCircle2, Building2, User, Mail, Phone, Lock } from "lucide-react"
import { useAuth, type UserRole } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"

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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-10 w-full bg-muted animate-pulse rounded" />
              </div>
            ))}
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
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
  const [isVisible, setIsVisible] = useState(false)
  const { register } = useAuth()
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
      // Do NOT redirect to dashboard - user needs admin approval first
      // They will see a success message with instructions
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-green-500/10 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px] animate-float animate-delay-300" />
        </div>

        <Card className="max-w-md w-full border-border/50 bg-card/50 backdrop-blur glass animate-fade-in-up">
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center animate-bounce-subtle">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("registrationSubmitted")}</h2>
            <p className="text-muted-foreground mb-6">{t("registrationPendingMessage")}</p>
            <p className="text-sm text-muted-foreground mb-6">
              {t("contactEmail")}: <span className="text-primary font-medium">webmaster@moap.com</span>
            </p>
            <Button asChild className="w-full">
              <Link href="/login">{t("backToLogin")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-chart-1/10 blur-[100px] animate-float animate-delay-300" />
      </div>

      <div className="w-full max-w-lg">
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
            <CardTitle className="text-2xl">{t("createAccount")}</CardTitle>
            <CardDescription>{t("registerSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive animate-fade-in-down">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("fullName")} *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t("fullNamePlaceholder")}
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                    className="bg-input/50 transition-all duration-300 focus:scale-[1.01]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("username")} *
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={t("usernamePlaceholder")}
                    value={formData.username}
                    onChange={(e) => updateField("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
                    required
                    className="bg-input/50 transition-all duration-300 focus:scale-[1.01]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("email")} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                  className="bg-input/50 transition-all duration-300 focus:scale-[1.01]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t("company")}
                  </Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder={t("companyPlaceholder")}
                    value={formData.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    className="bg-input/50 transition-all duration-300 focus:scale-[1.01]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t("phone")}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t("phonePlaceholder")}
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="bg-input/50 transition-all duration-300 focus:scale-[1.01]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t("accountType")} *</Label>
                <Select value={formData.role} onValueChange={(value) => updateField("role", value)}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue placeholder={t("selectAccountType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">{t("publicUser")}</SelectItem>
                    <SelectItem value="tecnico">{t("technician")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
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
                      className="bg-input/50 pr-10 transition-all duration-300 focus:scale-[1.01]"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

              <Button type="submit" className="w-full btn-ripple hover-glow" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {t("loading")}
                  </span>
                ) : (
                  t("submitRegistration")
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t("alreadyHaveAccount")}{" "}
              <Link href="/login" className="text-primary hover:underline">
                {t("loginHere")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
