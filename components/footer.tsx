"use client"

import Link from "next/link"
import { FileText, ArrowUpRight } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Marquee } from "@/components/landing/marquee"

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="relative overflow-hidden border-t hairline bg-background">
      {/* Marquee band */}
      <div className="border-b hairline py-5">
        <Marquee speed="slow">
          {[
            "ORÇAMENTOS INTELIGENTES",
            "CONSTRUÇÃO CIVIL",
            "ANÁLISE DE CUSTOS",
            "BASE DE DADOS PT",
            "RELATÓRIOS EDITORIAIS",
            "MOAP · 2026",
          ].map((item, i) => (
            <div key={`${item}-${i}`} className="flex items-center gap-6 px-6">
              <span className="font-display text-2xl italic text-foreground/80">{item}</span>
              <span className="text-primary">◆</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-semibold tracking-tight">MOAP</span>
                <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Orçamentos
                </span>
              </div>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("footerDescription")}
            </p>

            <Link
              href="/contacto"
              className="group mt-8 inline-flex items-center gap-2 rounded-full border hairline px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground transition-all hover:border-primary/50 hover:bg-secondary"
            >
              Fale connosco
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Platform */}
          <div className="lg:col-span-3">
            <p className="eyebrow-strong">Plataforma</p>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                { href: "/#funcionalidades", label: t("features") },
                { href: "/#como-funciona", label: t("howItWorks") },
                { href: "/#relatorio", label: t("report") },
                { href: "/#carregar", label: t("uploadDocument") },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <span className="h-px w-3 bg-hairline transition-all group-hover:w-5 group-hover:bg-primary" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <p className="eyebrow-strong">Empresa</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href="/contacto" className="text-muted-foreground hover:text-foreground">
                  {t("footerContact")}
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground">
                  {t("footerPrivacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  {t("footerTerms")}
                </Link>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="lg:col-span-2">
            <p className="eyebrow-strong">Começar</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href="/login?force=1" className="text-muted-foreground hover:text-foreground">
                  {t("startNow")}
                </Link>
              </li>
              <li>
                <Link
                  href="/login?action=budget-request"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("heroBudgetRequest")}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                  {t("dashboard")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Giant wordmark */}
        <div className="mt-20 overflow-hidden">
          <p
            className="wordmark-giant text-[22vw] leading-[0.8] lg:text-[18rem]"
            aria-hidden="true"
          >
            MOAP
          </p>
        </div>

        {/* Bottom row */}
        <div className="mt-8 flex flex-col items-start gap-3 border-t hairline pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono">
            © {new Date().getFullYear()} MOAP. {t("footerRights")}.
          </p>
          <p className="font-mono uppercase tracking-[0.18em]">
            Feito em Portugal · Orçamentos com método
          </p>
        </div>
      </div>
    </footer>
  )
}
