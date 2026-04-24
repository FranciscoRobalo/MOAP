"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Mail, Phone, MapPin, Loader2 } from "lucide-react"

export function ContactForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to send message")

      toast.success("Mensagem Enviada", {
        description: "Obrigado por contactar-nos. Responderemos em breve.",
      })

      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        subject: "",
        message: "",
      })
    } catch (error) {
      toast.error("Erro", {
        description: "Falha ao enviar a mensagem. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "contact@moap.pt",
      href: "mailto:contact@moap.pt",
    },
    {
      icon: Phone,
      label: "Telefone",
      value: "+351 XXX XXX XXX",
      href: "tel:+351XXX",
    },
    {
      icon: MapPin,
      label: "Localização",
      value: "Portugal",
      href: "#",
    },
  ]

  return (
    <div className="relative min-h-screen bg-background py-20 lg:py-32 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/3 h-[250px] w-[250px] rounded-full bg-accent/10 blur-[80px] animate-float animate-delay-500" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-2xl text-center mb-16 animate-smooth-enter">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Entre em Contacto</h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Tem questões sobre a MOAP? Gostaríamos de ouvir de si. Envie-nos uma mensagem e responderemos o mais breve possível.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 mb-16">
          {contactInfo.map((info, idx) => {
            const Icon = info.icon
            return (
              <a key={info.label} href={info.href} className="group animate-list-item" style={{ animationDelay: `${idx * 100}ms` }}>
                <Card className="border border-border/40 bg-gradient-to-br from-card/60 to-card/30 hover:from-card/80 hover:to-card/50 transition-all duration-300 h-full hover-neon overflow-hidden">
                  <CardContent className="pt-6 relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex flex-col items-center text-center relative z-10">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/40 group-hover:to-primary/20 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                        <Icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300 group-hover:animate-float-rotate" />
                      </div>
                      <h3 className="mt-4 font-semibold group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent transition-all">{info.label}</h3>
                      <p className="mt-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">{info.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            )
          })}
        </div>

        <Card className="border border-border/40 bg-gradient-to-br from-card/60 to-card/30 max-w-2xl mx-auto backdrop-blur-enhanced overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-primary/10 blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2" />
          <CardHeader className="relative z-10">
            <CardTitle className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Envie-nos uma Mensagem</CardTitle>
            <CardDescription>Preencha o formulário abaixo e entraremos em contacto consigo.</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome Completo</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+351 XXX XXX XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Empresa</label>
                  <Input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Sua empresa"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assunto</label>
                <Input
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Assunto da mensagem"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mensagem</label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Sua mensagem aqui..."
                  rows={6}
                  required
                />
              </div>

              <Button type="submit" size="lg" className="w-full hover-neon hover-lift btn-ripple bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A enviar...
                  </>
                ) : (
                  "Enviar Mensagem"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
