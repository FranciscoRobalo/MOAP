"use client"

import { Brain, Database, MapPin, Layers, Scale, FileSearch, BarChart3, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { useEffect, useState, useRef } from "react"

export function Features() {
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLSection>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const features = [
    {
      icon: Brain,
      title: t("feature1Title"),
      description: t("feature1Desc"),
      badge: "Inteligente"
    },
    {
      icon: FileSearch,
      title: t("feature5Title"),
      description: t("feature5Desc"),
      badge: "Parsing Avançado"
    },
    {
      icon: MapPin,
      title: t("feature3Title"),
      description: t("feature3Desc"),
      badge: "Localização"
    },
    {
      icon: Scale,
      title: t("feature4Title"),
      description: t("feature4Desc"),
      badge: "Análise Completa"
    },
    {
      icon: BarChart3,
      title: "Análise de Preços",
      description: "Comparação detalhada com base de dados de mercado regional",
      badge: "Preços Atualizados"
    },
    {
      icon: Layers,
      title: t("feature2Title"),
      description: t("feature2Desc"),
      badge: "Multi-Formato"
    },
    {
      icon: Shield,
      title: "Segurança Empresarial",
      description: "Criptografia end-to-end e conformidade GDPR completa",
      badge: "GDPR"
    },
    {
      icon: Database,
      title: t("feature6Title"),
      description: t("feature6Desc"),
      badge: "50k+ Itens"
    },
  ]

  return (
    <section ref={sectionRef} id="funcionalidades" className="border-t border-border/40 bg-card/30 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`mx-auto max-w-2xl text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("features")}</h2>
          <p className="mt-4 text-muted-foreground">{t("featuresSubtitle")}</p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className={`border-border/40 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-enhanced hover-neon group cursor-pointer transition-all duration-500 relative overflow-hidden ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${200 + index * 75}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute -right-10 -top-10 h-20 w-20 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader>
                <div className="flex items-start justify-between relative z-10">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 transition-all duration-300 group-hover:from-primary/40 group-hover:to-primary/20 group-hover:scale-110 shadow-lg">
                    <feature.icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-125 group-hover:animate-float-rotate" />
                  </div>
                  {feature.badge && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30 group-hover:from-primary/30 group-hover:to-accent/30 transition-all">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent transition-all">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground group-hover:text-foreground transition-colors">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
