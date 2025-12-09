"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, User, Plus, Trash2, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Visit {
  id: string
  obraName: string
  address: string
  date: string
  time: string
  duration: string
  contactPerson: string
  contactPhone: string
  status: "agendada" | "concluida" | "cancelada"
  notes?: string
}

const timeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
]

const durations = ["30 minutos", "1 hora", "1h30", "2 horas", "3 horas", "Meio dia"]

const mockVisits: Visit[] = [
  {
    id: "1",
    obraName: "Edifício Residencial Sol Nascente",
    address: "Rua das Flores, 123, Lisboa",
    date: "2024-02-10",
    time: "10:00",
    duration: "2 horas",
    contactPerson: "João Silva",
    contactPhone: "+351 912 345 678",
    status: "agendada",
    notes: "Levar equipamento de medição.",
  },
  {
    id: "2",
    obraName: "Renovação Hotel Mar Azul",
    address: "Av. da Liberdade, 45, Faro",
    date: "2024-02-08",
    time: "14:00",
    duration: "3 horas",
    contactPerson: "Maria Costa",
    contactPhone: "+351 923 456 789",
    status: "concluida",
  },
  {
    id: "3",
    obraName: "Ampliação Escola Primária",
    address: "Rua do Parque, 78, Porto",
    date: "2024-02-15",
    time: "09:00",
    duration: "1h30",
    contactPerson: "António Ferreira",
    contactPhone: "+351 934 567 890",
    status: "agendada",
  },
]

const mockObras = [
  "Edifício Residencial Sol Nascente",
  "Renovação Hotel Mar Azul",
  "Ampliação Escola Primária",
  "Reabilitação Centro Histórico",
  "Centro Comercial Norte",
]

export default function VisitasPage() {
  const [visits, setVisits] = useState<Visit[]>(mockVisits)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newVisit, setNewVisit] = useState({
    obraName: "",
    address: "",
    date: "",
    time: "",
    duration: "",
    contactPerson: "",
    contactPhone: "",
    notes: "",
  })

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault()
    const visit: Visit = {
      id: Math.random().toString(36).substr(2, 9),
      ...newVisit,
      status: "agendada",
    }
    setVisits((prev) => [...prev, visit])
    setNewVisit({
      obraName: "",
      address: "",
      date: "",
      time: "",
      duration: "",
      contactPerson: "",
      contactPhone: "",
      notes: "",
    })
    setIsDialogOpen(false)
  }

  const deleteVisit = (id: string) => {
    setVisits((prev) => prev.filter((v) => v.id !== id))
  }

  const markAsComplete = (id: string) => {
    setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, status: "concluida" as const } : v)))
  }

  const upcomingVisits = visits.filter((v) => v.status === "agendada")
  const completedVisits = visits.filter((v) => v.status === "concluida")

  const statusColors = {
    agendada: "bg-primary text-primary-foreground",
    concluida: "bg-price-below text-white",
    cancelada: "bg-price-critical text-white",
  }

  const statusLabels = {
    agendada: "Agendada",
    concluida: "Concluída",
    cancelada: "Cancelada",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agendar Visita à Obra</h1>
          <p className="text-muted-foreground">Gerir e agendar visitas técnicas às suas obras.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Visita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Agendar Nova Visita</DialogTitle>
              <DialogDescription>Preencha os detalhes para agendar uma visita técnica.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddVisit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Obra *</Label>
                <Select value={newVisit.obraName} onValueChange={(v) => setNewVisit((p) => ({ ...p, obraName: v }))}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue placeholder="Selecione a obra" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockObras.map((obra) => (
                      <SelectItem key={obra} value={obra}>
                        {obra}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Morada da Visita *</Label>
                <Input
                  placeholder="Rua, número, cidade"
                  value={newVisit.address}
                  onChange={(e) => setNewVisit((p) => ({ ...p, address: e.target.value }))}
                  className="bg-input/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={newVisit.date}
                    onChange={(e) => setNewVisit((p) => ({ ...p, date: e.target.value }))}
                    className="bg-input/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora *</Label>
                  <Select value={newVisit.time} onValueChange={(v) => setNewVisit((p) => ({ ...p, time: v }))}>
                    <SelectTrigger className="bg-input/50">
                      <SelectValue placeholder="Hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duração Estimada</Label>
                <Select value={newVisit.duration} onValueChange={(v) => setNewVisit((p) => ({ ...p, duration: v }))}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue placeholder="Selecione a duração" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pessoa de Contacto</Label>
                  <Input
                    placeholder="Nome"
                    value={newVisit.contactPerson}
                    onChange={(e) => setNewVisit((p) => ({ ...p, contactPerson: e.target.value }))}
                    className="bg-input/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    placeholder="+351 900 000 000"
                    value={newVisit.contactPhone}
                    onChange={(e) => setNewVisit((p) => ({ ...p, contactPhone: e.target.value }))}
                    className="bg-input/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Observações adicionais..."
                  value={newVisit.notes}
                  onChange={(e) => setNewVisit((p) => ({ ...p, notes: e.target.value }))}
                  className="bg-input/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Agendar Visita</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Próximas Visitas</p>
                <p className="text-2xl font-bold">{upcomingVisits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-price-below/10">
                <CheckCircle className="h-5 w-5 text-price-below" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{completedVisits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Visitas</p>
                <p className="text-2xl font-bold">{visits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Visits */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Visitas Agendadas</CardTitle>
          <CardDescription>Próximas visitas técnicas às obras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingVisits.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma visita agendada.</p>
            ) : (
              upcomingVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-lg border border-border/50 bg-background/50"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{visit.obraName}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {visit.address}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(visit.date).toLocaleDateString("pt-PT")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {visit.time} ({visit.duration})
                          </span>
                          {visit.contactPerson && (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {visit.contactPerson}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={statusColors[visit.status]}>{statusLabels[visit.status]}</Badge>
                    </div>
                    {visit.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">{visit.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => markAsComplete(visit.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Concluir
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteVisit(visit.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Completed Visits */}
      {completedVisits.length > 0 && (
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Visitas Concluídas</CardTitle>
            <CardDescription>Histórico de visitas realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 opacity-75"
                >
                  <div>
                    <h3 className="font-semibold">{visit.obraName}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(visit.date).toLocaleDateString("pt-PT")}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {visit.address}
                      </span>
                    </div>
                  </div>
                  <Badge className={statusColors[visit.status]}>{statusLabels[visit.status]}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
