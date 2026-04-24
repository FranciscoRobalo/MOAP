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
import { useData } from "@/contexts/data-context"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { DashboardStatCard } from "@/components/dashboard/stat-card"
import { Calendar, Clock, User, Plus, Trash2, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

const visitTypes = ["Vistoria Técnica", "Reunião com Cliente", "Inspeção de Segurança", "Medições", "Entrega de Obra"]

export default function VisitasPage() {
  const { visitas, obras, addVisita, updateVisita, deleteVisita } = useData()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newVisit, setNewVisit] = useState({
    obraId: "",
    obraName: "",
    date: "",
    time: "",
    type: "",
    contactName: "",
    contactPhone: "",
    notes: "",
  })

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault()

    const selectedObra = obras.find((o) => o.id === newVisit.obraId)

    addVisita({
      obraId: newVisit.obraId,
      obraName: selectedObra?.name || newVisit.obraName,
      date: newVisit.date,
      time: newVisit.time,
      type: newVisit.type,
      contactName: newVisit.contactName,
      contactPhone: newVisit.contactPhone,
      notes: newVisit.notes,
    })

    setNewVisit({
      obraId: "",
      obraName: "",
      date: "",
      time: "",
      type: "",
      contactName: "",
      contactPhone: "",
      notes: "",
    })
    setIsDialogOpen(false)
  }

  const handleDeleteVisit = (id: string) => {
    deleteVisita(id)
  }

  const markAsComplete = (id: string) => {
    updateVisita(id, { status: "realizada" })
  }

  const upcomingVisits = visitas.filter((v) => v.status === "agendada")
  const completedVisits = visitas.filter((v) => v.status === "realizada")

  const statusColors = {
    agendada: "bg-primary/20 text-primary",
    realizada: "bg-price-below/20 text-price-below",
    cancelada: "bg-price-high/20 text-price-high",
  }

  const statusLabels = {
    agendada: "Agendada",
    realizada: "Realizada",
    cancelada: "Cancelada",
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Operações / Visitas"
        title="Agendar Visita à Obra"
        description="Gerir e agendar visitas técnicas às suas obras."
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full gap-2">
                <Plus className="h-4 w-4" />
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
                <Select
                  value={newVisit.obraId}
                  onValueChange={(v) => {
                    const obra = obras.find((o) => o.id === v)
                    setNewVisit((p) => ({ ...p, obraId: v, obraName: obra?.name || "" }))
                  }}
                >
                  <SelectTrigger className="border-border/60 bg-background/60">
                    <SelectValue placeholder="Selecione a obra" />
                  </SelectTrigger>
                  <SelectContent>
                    {obras.map((obra) => (
                      <SelectItem key={obra.id} value={obra.id}>
                        {obra.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Visita *</Label>
                <Select value={newVisit.type} onValueChange={(v) => setNewVisit((p) => ({ ...p, type: v }))}>
                  <SelectTrigger className="border-border/60 bg-background/60">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {visitTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={newVisit.date}
                    onChange={(e) => setNewVisit((p) => ({ ...p, date: e.target.value }))}
                    className="border-border/60 bg-background/60"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora *</Label>
                  <Select value={newVisit.time} onValueChange={(v) => setNewVisit((p) => ({ ...p, time: v }))}>
                    <SelectTrigger className="border-border/60 bg-background/60">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pessoa de Contacto</Label>
                  <Input
                    placeholder="Nome"
                    value={newVisit.contactName}
                    onChange={(e) => setNewVisit((p) => ({ ...p, contactName: e.target.value }))}
                    className="border-border/60 bg-background/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    placeholder="+351 900 000 000"
                    value={newVisit.contactPhone}
                    onChange={(e) => setNewVisit((p) => ({ ...p, contactPhone: e.target.value }))}
                    className="border-border/60 bg-background/60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Observações adicionais..."
                  value={newVisit.notes}
                  onChange={(e) => setNewVisit((p) => ({ ...p, notes: e.target.value }))}
                  className="border-border/60 bg-background/60"
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
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard
          eyebrow="Próximas Visitas"
          value={upcomingVisits.length}
          icon={Calendar}
          tone="primary"
        />
        <DashboardStatCard
          eyebrow="Realizadas"
          value={completedVisits.length}
          icon={CheckCircle}
        />
        <DashboardStatCard
          eyebrow="Total de Visitas"
          value={visitas.length}
          icon={Clock}
          tone="muted"
        />
      </div>

      {/* Upcoming Visits */}
      <Card className="bp-bracket relative overflow-hidden border-border/60 bg-card/30">
        <CardHeader>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Agenda · Próximas</p>
          <CardTitle className="font-display text-xl font-medium tracking-tight">Visitas Agendadas</CardTitle>
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
                  className="flex flex-col gap-4 rounded-md border border-border/60 bg-background/40 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{visit.obraName}</h3>
                        <p className="text-sm text-muted-foreground">{visit.type}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(visit.date).toLocaleDateString("pt-PT")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {visit.time}
                          </span>
                          {visit.contactName && (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {visit.contactName}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={statusColors[visit.status as keyof typeof statusColors] || "bg-muted text-muted-foreground"}>{statusLabels[visit.status as keyof typeof statusLabels] || visit.status}</Badge>
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
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteVisit(visit.id)}>
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
        <Card className="bp-bracket relative overflow-hidden border-border/60 bg-card/30">
          <CardHeader>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Agenda · Histórico</p>
            <CardTitle className="font-display text-xl font-medium tracking-tight">Visitas Realizadas</CardTitle>
            <CardDescription>Histórico de visitas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 p-4 opacity-75"
                >
                  <div>
                    <h3 className="font-semibold">{visit.obraName}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(visit.date).toLocaleDateString("pt-PT")}
                      </span>
                      <span>{visit.type}</span>
                    </div>
                  </div>
                  <Badge className={statusColors[visit.status as keyof typeof statusColors] || "bg-muted text-muted-foreground"}>{statusLabels[visit.status as keyof typeof statusLabels] || visit.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
