"use client"

import { useEffect, useState } from "react"
import { ContactForm } from "@/components/contact-form"

export function ContactPageClient() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
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
  )
}
