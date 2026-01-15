"use client"

import { FileUp, Cpu, FileBarChart } from "lucide-react"
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
      icon: Cpu,
      number: t("step2Number"),
      title: t("step2Title"),
      description: t("step2Desc"),
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

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`relative transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${300 + index * 200}ms` }}
            >
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-16 left-1/2 hidden h-0.5 w-full bg-border/60 lg:block transition-all duration-1000 origin-left ${
                    isVisible ? "scale-x-100" : "scale-x-0"
                  }`}
                  style={{ transitionDelay: `${800 + index * 200}ms` }}
                />
              )}
              <div className="relative flex flex-col items-center text-center group">
                <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-2xl border border-border/60 bg-card transition-all duration-300 group-hover:border-primary/60 group-hover:shadow-lg group-hover:shadow-primary/10 hover-lift">
                  <span className="text-xs font-medium text-primary">{step.number}</span>
                  <step.icon className="mt-1 h-10 w-10 text-foreground transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
