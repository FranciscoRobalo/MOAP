"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Mail, Send, UserPlus, Clock, CheckCircle, XCircle, Copy, Trash2, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Invitation {
  id: string
  email: string
  name?: string
  sentDate: string
  status: "pendente" | "aceite" | "expirado"
  message?: string
}

const mockInvitations: Invitation[] = [
  {
    id: "1",
    email: "joao.silva@construcoes.pt",
    name: "João Silva",
    sentDate: "2024-01-25",
    status: "aceite",
    message: "Olá João, venho convidar-te para a plataforma MOAP.",
  },
  {
    id: "2",
    email: "maria.costa@buildtech.pt",
    name: "Maria Costa",
    sentDate: "2024-01-27",
    status: "pendente",
    message: "Convidamos a BuildTech a juntar-se à nossa rede.",
  },
  {
    id: "3",
    email: "antonio@obras.pt",
    sentDate: "2024-01-20",
    status: "expirado",
  },
  {
    id: "4",
    email: "carla.santos@empresa.pt",
    name: "Carla Santos",
    sentDate: "2024-01-28",
    status: "pendente",
  },
]

export default function ConvidarPage() {
  const [invitations, setInvitations] = useState<Invitation[]>(mockInvitations)
  const [emailList, setEmailList] = useState("")
  const [personalMessage, setPersonalMessage] = useState("")
  const [singleEmail, setSingleEmail] = useState("")
  const [singleName, setSingleName] = useState("")
  const [copiedLink, setCopiedLink] = useState(false)

  const inviteLink = "https://moap.pt/convite/abc123xyz"

  const statusConfig = {
    pendente: { label: "Pendente", color: "bg-price-average text-white", icon: Clock },
    aceite: { label: "Aceite", color: "bg-price-below text-white", icon: CheckCircle },
    expirado: { label: "Expirado", color: "bg-muted text-muted-foreground", icon: XCircle },
  }

  const handleSingleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (singleEmail) {
      const newInvitation: Invitation = {
        id: Math.random().toString(36).substr(2, 9),
        email: singleEmail,
        name: singleName || undefined,
        sentDate: new Date().toISOString().split("T")[0],
        status: "pendente",
        message: personalMessage || undefined,
      }
      setInvitations((prev) => [newInvitation, ...prev])
      setSingleEmail("")
      setSingleName("")
      setPersonalMessage("")
      alert(`Convite enviado para ${singleEmail}!`)
    }
  }

  const handleBulkInvite = () => {
    const emails = emailList
      .split(/[\n,;]/)
      .map((e) => e.trim())
      .filter((e) => e && e.includes("@"))

    if (emails.length > 0) {
      const newInvitations: Invitation[] = emails.map((email) => ({
        id: Math.random().toString(36).substr(2, 9),
        email,
        sentDate: new Date().toISOString().split("T")[0],
        status: "pendente" as const,
        message: personalMessage || undefined,
      }))
      setInvitations((prev) => [...newInvitations, ...prev])
      setEmailList("")
      setPersonalMessage("")
      alert(`${emails.length} convites enviados!`)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleResend = (id: string) => {
    setInvitations((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, sentDate: new Date().toISOString().split("T")[0], status: "pendente" as const } : inv,
      ),
    )
    alert("Convite reenviado!")
  }

  const handleDelete = (id: string) => {
    setInvitations((prev) => prev.filter((inv) => inv.id !== id))
  }

  const stats = {
    total: invitations.length,
    pendente: invitations.filter((i) => i.status === "pendente").length,
    aceite: invitations.filter((i) => i.status === "aceite").length,
    expirado: invitations.filter((i) => i.status === "expirado").length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Convidar para a Plataforma</h1>
        <p className="text-muted-foreground">
          Convide colegas, parceiros e fornecedores para se juntarem à plataforma MOAP.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Convites</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-price-average/10">
                <Clock className="h-5 w-5 text-price-average" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{stats.pendente}</p>
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
                <p className="text-sm text-muted-foreground">Aceites</p>
                <p className="text-2xl font-bold">{stats.aceite}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-muted">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expirados</p>
                <p className="text-2xl font-bold">{stats.expirado}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invite Form */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Enviar Convites
            </CardTitle>
            <CardDescription>Convide pessoas por email ou partilhe o link de convite</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="single">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="single">Individual</TabsTrigger>
                <TabsTrigger value="bulk">Em Massa</TabsTrigger>
                <TabsTrigger value="link">Link</TabsTrigger>
              </TabsList>

              <TabsContent value="single">
                <form onSubmit={handleSingleInvite} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        placeholder="email@exemplo.pt"
                        value={singleEmail}
                        onChange={(e) => setSingleEmail(e.target.value)}
                        className="bg-input/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome (opcional)</Label>
                      <Input
                        placeholder="Nome da pessoa"
                        value={singleName}
                        onChange={(e) => setSingleName(e.target.value)}
                        className="bg-input/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mensagem Personalizada (opcional)</Label>
                    <Textarea
                      placeholder="Adicione uma mensagem pessoal ao convite..."
                      value={personalMessage}
                      onChange={(e) => setPersonalMessage(e.target.value)}
                      className="bg-input/50"
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Convite
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="bulk">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Lista de Emails</Label>
                    <Textarea
                      placeholder="Insira os emails separados por vírgula, ponto-e-vírgula ou nova linha:&#10;&#10;email1@exemplo.pt&#10;email2@exemplo.pt&#10;email3@exemplo.pt"
                      value={emailList}
                      onChange={(e) => setEmailList(e.target.value)}
                      className="bg-input/50 min-h-[120px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {emailList
                        .split(/[\n,;]/)
                        .map((e) => e.trim())
                        .filter((e) => e && e.includes("@")).length || 0}{" "}
                      emails válidos detetados
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Mensagem (opcional)</Label>
                    <Textarea
                      placeholder="Mensagem para todos os convites..."
                      value={personalMessage}
                      onChange={(e) => setPersonalMessage(e.target.value)}
                      className="bg-input/50"
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleBulkInvite} className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Convites em Massa
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="link">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Link de Convite</Label>
                    <p className="text-sm text-muted-foreground">
                      Partilhe este link para convidar pessoas para a plataforma.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="bg-input/50 font-mono text-sm" />
                    <Button variant="outline" onClick={handleCopyLink}>
                      {copiedLink ? <CheckCircle className="h-4 w-4 text-price-below" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Partilhar via:</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyLink}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`mailto:?subject=Convite MOAP&body=Junta-te à MOAP: ${inviteLink}`)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Invitations List */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Convites Enviados
            </CardTitle>
            <CardDescription>Histórico e estado dos convites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {invitations.map((invitation) => {
                const status = statusConfig[invitation.status]
                const StatusIcon = status.icon

                return (
                  <div
                    key={invitation.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/50 bg-background/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{invitation.name || invitation.email}</p>
                        <Badge className={`${status.color} text-xs`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      {invitation.name && <p className="text-xs text-muted-foreground truncate">{invitation.email}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        Enviado: {new Date(invitation.sentDate).toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {invitation.status !== "aceite" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleResend(invitation.id)}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(invitation.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}

              {invitations.length === 0 && (
                <div className="text-center py-8">
                  <UserPlus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhum convite enviado ainda.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
