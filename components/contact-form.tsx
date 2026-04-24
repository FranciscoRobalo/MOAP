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
    <div className="min-h-screen bg-background py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Entre em Contacto</h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Tem questões sobre a MOAP? Gostaríamos de ouvir de si. Envie-nos uma mensagem e responderemos o mais breve possível.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-3 mb-16">
          {contactInfo.map((info) => {
            const Icon = info.icon
            return (
              <a key={info.label} href={info.href} className="group">
                <Card className="border-border/40 bg-card/50 hover:bg-card/70 transition-colors h-full">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="mt-4 font-semibold">{info.label}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{info.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            )
          })}
        </div>

        <Card className="border-border/40 bg-card/50 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Envie-nos uma Mensagem</CardTitle>
            <CardDescription>Preencha o formulário abaixo e entraremos em contacto consigo.</CardDescription>
          </CardHeader>
          <CardContent>
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

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
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
