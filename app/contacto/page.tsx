"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactForm } from "@/components/contact-form"
import { useEffect, useState } from "react"

export const metadata = {
  title: "Contacte-nos | MOAP",
  description: "Entre em contacto com a equipa MOAP. Estamos aqui para ajudar com qualquer questão sobre orçamentos.",
}

export default function ContactPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Contacte-nos</h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Tem dúvidas? Gostaria de saber mais sobre o MOAP? Entre em contacto connosco.
              </p>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
