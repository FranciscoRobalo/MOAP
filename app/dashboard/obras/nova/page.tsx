"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useData } from "@/contexts/data-context"
import { Building2, MapPin, Calendar, Euro, FileText, Send, CheckCircle } from "lucide-react"

const projectTypes = [
  "Construção Nova",
  "Renovação",
  "Ampliação",
  "Reabilitação",
  "Demolição",
  "Infraestruturas",
  "Paisagismo",
]

const regions = ["Norte", "Centro", "Lisboa e Vale do Tejo", "Alentejo", "Algarve", "Açores", "Madeira"]

const urgencyLevels = [
  { value: "baixa", label: "Baixa - Sem urgência" },
  { value: "media", label: "Média - Próximos 3 meses" },
  { value: "alta", label: "Alta - Próximas semanas" },
  { value: "urgente", label: "Urgente - Imediato" },
]

export default function NovaObraPage() {
  const router = useRouter()
  const { addObra } = useData()
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    region: "",
    address: "",
    estimatedBudget: "",
    startDate: "",
    endDate: "",
    urgency: "",
    description: "",
    requirements: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    addObra({
      name: formData.name,
      type: formData.type,
      region: formData.region,
      address: formData.address,
      estimatedBudget: Number(formData.estimatedBudget) || 0,
      startDate: formData.startDate,
      endDate: formData.endDate,
      urgency: formData.urgency,
      description: formData.description,
      requirements: formData.requirements,
      contactName: formData.contactName,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
    })

    setSubmitted(true)
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="bg-card/50 max-w-md w-full text-center">
          <CardContent className="pt-10 pb-10">
            <div className="mx-auto w-16 h-16 bg-price-below/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-price-below" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Obra Submetida!</h2>
            <p className="text-muted-foreground mb-6">
              A sua solicitação foi recebida com sucesso. Iremos analisar os detalhes e entrar em contacto brevemente.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setSubmitted(false)}>
                Submeter Nova Obra
              </Button>
              <Button onClick={() => router.push("/dashboard/obras")}>Ver Minhas Obras</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova Obra</h1>
        <p className="text-muted-foreground">
          Preencha o formulário abaixo para nos ajudar a entender as suas necessidades.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Info */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Informação do Projeto
            </CardTitle>
            <CardDescription>Detalhes básicos sobre a obra</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Projeto *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Edifício Residencial Sol Nascente"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="bg-input/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Obra *</Label>
                <Select value={formData.type} onValueChange={(value) => updateField("type", value)}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Localização
            </CardTitle>
            <CardDescription>Onde será realizada a obra</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="region">Região *</Label>
                <Select value={formData.region} onValueChange={(value) => updateField("region", value)}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue placeholder="Selecione a região" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Morada Completa</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, código postal, cidade"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="bg-input/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Budget */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Cronograma e Orçamento
            </CardTitle>
            <CardDescription>Datas previstas e investimento estimado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                  className="bg-input/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Conclusão</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                  className="bg-input/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedBudget">Orçamento Estimado (€)</Label>
                <Input
                  id="estimatedBudget"
                  type="number"
                  placeholder="150000"
                  value={formData.estimatedBudget}
                  onChange={(e) => updateField("estimatedBudget", e.target.value)}
                  className="bg-input/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgência</Label>
                <Select value={formData.urgency} onValueChange={(value) => updateField("urgency", value)}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Descrição do Projeto
            </CardTitle>
            <CardDescription>Descreva em detalhe o que pretende</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição Geral *</Label>
              <Textarea
                id="description"
                placeholder="Descreva o projeto, incluindo área total, número de pisos, materiais preferenciais, etc."
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="bg-input/50 min-h-[120px]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirements">Requisitos Específicos</Label>
              <Textarea
                id="requirements"
                placeholder="Certificações necessárias, requisitos de sustentabilidade, normas específicas, etc."
                value={formData.requirements}
                onChange={(e) => updateField("requirements", e.target.value)}
                className="bg-input/50 min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-primary" />
              Contacto
            </CardTitle>
            <CardDescription>Informações para entrarmos em contacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="contactName">Nome *</Label>
                <Input
                  id="contactName"
                  placeholder="Nome completo"
                  value={formData.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                  className="bg-input/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefone</Label>
                <Input
                  id="contactPhone"
                  placeholder="+351 912 345 678"
                  value={formData.contactPhone}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                  className="bg-input/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="email@exemplo.pt"
                  value={formData.contactEmail}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                  className="bg-input/50"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg">
            <Send className="mr-2 h-4 w-4" />
            Submeter Obra
          </Button>
        </div>
      </form>
    </div>
  )
}
