"use client"

import { FileUp, Cpu, FileBarChart } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function HowItWorks() {
  const { t } = useLanguage()

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
    <section id="como-funciona" className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("howItWorksTitle")}</h2>
          <p className="mt-4 text-muted-foreground">{t("howItWorksSubtitle")}</p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {index < steps.length - 1 && (
                <div className="absolute top-16 left-1/2 hidden h-0.5 w-full bg-border/60 lg:block" />
              )}
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-2xl border border-border/60 bg-card">
                  <span className="text-xs font-medium text-primary">{step.number}</span>
                  <step.icon className="mt-1 h-10 w-10 text-foreground" />
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
