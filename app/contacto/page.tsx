import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactForm } from "@/components/contact-form"
import { ContactPageClient } from "@/components/contact-page-client"

export const metadata = {
  title: "Contacte-nos | MOAP",
  description: "Entre em contacto com a equipa MOAP. Estamos aqui para ajudar com qualquer questão sobre orçamentos.",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <ContactPageClient />
        </div>
      </div>
      <Footer />
    </main>
  )
}
