"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Mail, Phone, MapPin, Loader2, ArrowUpRight, Send } from "lucide-react"
import { BlueprintBackdrop } from "@/components/landing/blueprint-backdrop"

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

      toast.success("Mensagem enviada", {
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
      toast.error("Falha no envio", {
        description: "Não foi possível enviar a mensagem. Tente novamente.",
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
      href: "tel:+351000000000",
    },
    {
      icon: MapPin,
      label: "Localização",
      value: "Portugal",
      href: "#",
    },
  ]

  return (
    <section className="relative overflow-hidden pb-16">
      <BlueprintBackdrop variant="subtle" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[5fr_7fr] lg:gap-16 lg:px-8">
        {/* Left column — editorial copy + contact lines */}
        <aside className="reveal-up">
          <div className="eyebrow-strong">// Contacto / 01</div>
          <h1 className="mt-3 display text-5xl sm:text-6xl lg:text-7xl">
            Vamos
            <br />
            <span className="italic text-primary">conversar.</span>
          </h1>
          <p className="mt-6 max-w-md text-pretty text-muted-foreground leading-relaxed">
            Tem um projeto, um orçamento para analisar, ou quer uma demonstração? Diga-nos
            quem é e em que podemos ajudar — respondemos em poucas horas úteis.
          </p>

          <div className="mt-10 space-y-4">
            {contactInfo.map((info) => {
              const Icon = info.icon
              return (
                <a
                  key={info.label}
                  href={info.href}
                  className="group flex items-center justify-between border-t border-hairline py-4 transition-colors hover:border-primary/60"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-secondary text-primary transition-colors group-hover:border-primary/50 group-hover:bg-primary/10">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="eyebrow">{info.label}</div>
                      <div className="mt-0.5 font-medium">{info.value}</div>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </a>
              )
            })}
          </div>

          <div className="mt-10 rounded-2xl border border-hairline bg-secondary/30 p-5">
            <div className="eyebrow">Horário</div>
            <div className="mt-2 text-sm text-foreground">
              Segunda — Sexta{" "}
              <span className="font-mono text-muted-foreground">09:00 — 18:00 WET</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Resposta média em 4h em dias úteis.
            </div>
          </div>
        </aside>

        {/* Right column — form card */}
        <div className="relative reveal-up">
          <div className="relative overflow-hidden rounded-3xl border border-hairline bg-card noise-overlay">
            {/* decorative eyebrow row */}
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="text-primary">{"> form / send-message"}</span>
              <span>{new Date().toISOString().slice(0, 10)}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nome" required>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="O seu nome"
                    required
                    className="h-11 rounded-xl border-hairline bg-background"
                  />
                </Field>
                <Field label="Email" required>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="voce@exemplo.pt"
                    required
                    className="h-11 rounded-xl border-hairline bg-background"
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Telefone">
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+351 …"
                    className="h-11 rounded-xl border-hairline bg-background"
                  />
                </Field>
                <Field label="Empresa">
                  <Input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Opcional"
                    className="h-11 rounded-xl border-hairline bg-background"
                  />
                </Field>
              </div>

              <Field label="Assunto" required>
                <Input
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Sobre o que é?"
                  required
                  className="h-11 rounded-xl border-hairline bg-background"
                />
              </Field>

              <Field label="Mensagem" required>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Escreva a sua mensagem…"
                  rows={6}
                  required
                  className="resize-none rounded-xl border-hairline bg-background"
                />
              </Field>

              <div className="flex flex-col-reverse items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Ao enviar, concorda com a nossa{" "}
                  <a href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
                    Política de Privacidade
                  </a>
                  .
                </p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="group h-12 rounded-full px-6 font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A enviar…
                    </>
                  ) : (
                    <>
                      Enviar mensagem
                      <Send className="ml-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        {required ? <span className="text-primary">*</span> : null}
      </Label>
      {children}
    </div>
  )
}
