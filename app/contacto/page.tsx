import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactForm } from "@/components/contact-form"

export const metadata = {
  title: "Contacte-nos | MOAP",
  description:
    "Entre em contacto com a equipa MOAP. Estamos aqui para ajudar com qualquer questão sobre orçamentos.",
}

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex-1 pt-32 pb-10 lg:pt-40">
        <ContactForm />
      </div>
      <Footer />
    </main>
  )
}
