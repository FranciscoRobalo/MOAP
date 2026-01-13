"use client"

import { Brain, Database, MapPin, Layers, Scale, FileSearch } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"

export function Features() {
  const { t } = useLanguage()

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
    <section id="funcionalidades" className="border-t border-border/40 bg-card/30 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("featuresTitle")}</h2>
          <p className="mt-4 text-muted-foreground">{t("featuresSubtitle")}</p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-border/40 bg-card/50 backdrop-blur-sm transition-colors hover:border-primary/40"
            >
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
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
