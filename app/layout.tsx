import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono, Bricolage_Grotesque } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { DataProvider } from "@/contexts/data-context"
import { TutorialProvider } from "@/contexts/tutorial-context"
import { LanguageProvider } from "@/contexts/language-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { CookieConsent } from "@/components/cookie-consent"
import { CustomCursor } from "@/components/cursor/custom-cursor"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" })
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
})

export const metadata: Metadata = {
  title: "MOAP - Orçamentos que fazem todo o sentido",
  description:
    "Plataforma inteligente para análise de orçamentos de construção. Compare preços unitários com a média do mercado.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt" suppressHydrationWarning className={`${bricolage.variable}`}>
      <body className={`font-sans antialiased bg-background`}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <DataProvider>
                <TutorialProvider>{children}</TutorialProvider>
              </DataProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        <CookieConsent />
        <CustomCursor />
        <Analytics />
      </body>
    </html>
  )
}
