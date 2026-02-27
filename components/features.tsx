"use client"

import { Brain, Database, MapPin, Layers, Scale, FileSearch } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { useEffect, useState, useRef } from "react"

export function Features() {
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

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
    },
    {
      icon: Layers,
      title: t("feature2Title"),
      description: t("feature2Desc"),
    },
    {
      icon: MapPin,
      title: t("feature3Title"),
      description: t("feature3Desc"),
    },
    {
      icon: Scale,
      title: t("feature4Title"),
      description: t("feature4Desc"),
    },
    {
      icon: FileSearch,
      title: t("feature5Title"),
      description: t("feature5Desc"),
    },
    {
      icon: Database,
      title: t("feature6Title"),
      description: t("feature6Desc"),
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

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className={`border-border/40 bg-card/50 backdrop-blur-sm card-hover group cursor-pointer transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                  <feature.icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
