"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, FileUp } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useEffect, useState } from "react"

export function Hero() {
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const stats = [
    { value: t("heroStat1Value"), label: t("heroStat1Label") },
    { value: t("heroStat2Value"), label: t("heroStat2Label") },
    { value: t("heroStat3Value"), label: t("heroStat3Label") },
    { value: t("heroStat4Value"), label: t("heroStat4Label") },
  ]

  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-1/3 left-1/3 h-[400px] w-[400px] rounded-full bg-chart-1/10 blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-chart-2/10 blur-[80px] animate-float animate-delay-500" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div
            className={`mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
          >
            <BarChart3 className="h-4 w-4 text-primary animate-bounce-subtle" />
            {t("heroBadge")}
          </div>

          <h1
            className={`text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {t("heroTitle")} <span className="text-primary text-gradient-animate">{t("heroTitleHighlight")}</span>
          </h1>

          <p
            className={`mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground lg:text-xl transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {t("heroSubtitle")}
          </p>

          <div
            className={`mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <a href="/dashboard/analise#upload-section">
              <Button size="lg" className="gap-2 btn-ripple hover-lift hover-glow h-16 px-10 text-xl font-semibold">
                <FileUp className="h-7 w-7" />
                {t("heroUploadButton")}
              </Button>
            </a>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`text-center transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${400 + index * 100}ms` }}
            >
              <div className="text-3xl font-bold text-primary lg:text-4xl stat-number">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
