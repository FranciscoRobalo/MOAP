"use client"

import { FileUp, Cpu, FileBarChart, Sparkles, TrendingUp } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useEffect, useState, useRef } from "react"

export function HowItWorks() {
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

  const steps = [
    {
      icon: FileUp,
      number: t("step1Number"),
      title: t("step1Title"),
      description: t("step1Desc"),
    },
    {
      icon: Sparkles,
      number: "02",
      title: "IA Extrai Dados",
      description: "GPT-4 Turbo analisa e extrai com precisão 99%+ de todos os itens, quantidades e unidades",
    },
    {
      icon: Cpu,
      number: "03",
      title: "Análise Inteligente",
      description: "NER matching com base de dados de 50k+ materiais. Identificação de outliers e riscos",
    },
    {
      icon: TrendingUp,
      number: "04",
      title: "Comparação de Preços",
      description: "Análise de mercado regional com previsão de tendências e potencial de poupança",
    },
    {
      icon: FileBarChart,
      number: t("step3Number"),
      title: t("step3Title"),
      description: t("step3Desc"),
    },
  ]

  return (
    <section ref={sectionRef} id="como-funciona" className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`mx-auto max-w-2xl text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("howItWorksTitle")}</h2>
          <p className="mt-4 text-muted-foreground">{t("howItWorksSubtitle")}</p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-5">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`relative transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${300 + index * 150}ms` }}
            >
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-16 left-1/2 hidden h-0.5 w-full bg-gradient-to-r from-border/60 to-transparent lg:block transition-all duration-1000 origin-left ${
                    isVisible ? "scale-x-100" : "scale-x-0"
                  }`}
                  style={{ transitionDelay: `${1000 + index * 150}ms` }}
                />
              )}
              <div className="relative flex flex-col items-center text-center group">
                <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-2xl border border-border/60 bg-card transition-all duration-300 group-hover:border-primary/60 group-hover:shadow-lg group-hover:shadow-primary/10 hover-lift">
                  <span className="text-xs font-medium text-primary">{step.number}</span>
                  <step.icon className="mt-1 h-10 w-10 text-foreground transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
