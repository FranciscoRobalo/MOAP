"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Cookie, Shield, Settings } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("moap_cookie_consent")
    if (!consent) {
      // Delay showing banner for better UX
      setTimeout(() => setShowBanner(true), 1000)
    } else {
      const savedPrefs = JSON.parse(consent)
      setPreferences(savedPrefs)
    }
  }, [])

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem("moap_cookie_consent", JSON.stringify(prefs))
    localStorage.setItem("moap_cookie_consent_date", new Date().toISOString())
    setShowBanner(false)
    setShowSettings(false)
  }

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    }
    setPreferences(allAccepted)
    savePreferences(allAccepted)
  }

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
    }
    setPreferences(necessaryOnly)
    savePreferences(necessaryOnly)
  }

  const saveCustom = () => {
    savePreferences(preferences)
  }

  if (!showBanner) return null

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
            
            <div className="relative p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                      <Cookie className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Cookies & Privacidade</h3>
                      <p className="text-sm text-muted-foreground">Valorizamos a sua privacidade</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                    Utilizamos cookies essenciais para garantir o funcionamento do site e cookies opcionais para 
                    melhorar a sua experiência. Pode escolher quais cookies aceitar.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Link 
                      href="/privacy-policy" 
                      className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                    >
                      Política de Privacidade
                    </Link>
                    <span className="text-muted-foreground">•</span>
                    <Link 
                      href="/terms" 
                      className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                    >
                      Termos de Serviço
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(true)}
                    className="gap-2 border-primary/20 hover:border-primary/40"
                  >
                    <Settings className="h-4 w-4" />
                    Personalizar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={acceptNecessary}
                    className="hover:bg-muted"
                  >
                    Apenas Essenciais
                  </Button>
                  <Button
                    onClick={acceptAll}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Shield className="h-4 w-4" />
                    Aceitar Todos
                  </Button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={acceptNecessary}
                className="absolute top-4 right-4 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Settings className="h-6 w-6 text-primary" />
              Configurações de Cookies
            </DialogTitle>
            <DialogDescription>
              Personalize as suas preferências de cookies. Os cookies essenciais são sempre necessários para o funcionamento do site.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-semibold text-foreground">
                    Cookies Essenciais
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Necessários para o funcionamento básico do site, incluindo autenticação e segurança.
                  </p>
                </div>
                <Switch checked={true} disabled className="data-[state=checked]:bg-primary" />
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="space-y-3 rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="analytics" className="text-base font-semibold text-foreground cursor-pointer">
                    Cookies de Análise
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajudam-nos a entender como utiliza o site para melhorarmos a experiência.
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analytics: checked })
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="space-y-3 rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="marketing" className="text-base font-semibold text-foreground cursor-pointer">
                    Cookies de Marketing
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Utilizados para personalizar anúncios e medir a eficácia das campanhas.
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: checked })
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancelar
            </Button>
            <Button onClick={saveCustom} className="bg-primary hover:bg-primary/90">
              Guardar Preferências
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
