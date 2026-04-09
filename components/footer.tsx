"use client"

import Link from "next/link"
import { FileText } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="border-t border-border/40 bg-card/30 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">MOAP</span>
            </Link>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">{t("footerDescription")}</p>
          </div>

          <div>
            <h4 className="font-semibold">{t("footerPlatform")}</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#funcionalidades" className="hover:text-foreground">
                  {t("features")}
                </Link>
              </li>
              <li>
                <Link href="#como-funciona" className="hover:text-foreground">
                  {t("howItWorks")}
                </Link>
              </li>
              <li>
                <Link href="#relatorio" className="hover:text-foreground">
                  {t("report")}
                </Link>
              </li>
              <li>
                <Link href="#carregar" className="hover:text-foreground">
                  {t("uploadDocument")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">{t("footerCompany")}</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground">
                  {t("footerAboutUs")}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  {t("footerContact")}
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-foreground">
                  {t("footerPrivacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  {t("footerTerms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} MOAP. {t("footerRights")}.
          </p>
        </div>
      </div>
    </footer>
  )
}
