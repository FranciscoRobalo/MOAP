"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { Search, CheckCircle2, XCircle, Clock, User, Mail, Building2, Phone, Calendar } from "lucide-react"

export default function RegistosContent() {
  const { pendingRegistrations, approveRegistration, rejectRegistration, user } = useAuth()
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegistration, setSelectedRegistration] = useState<string | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)

  // Only admin can access this page
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">Apenas administradores podem aceder a esta página.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredRegistrations = pendingRegistrations.filter((reg) => {
    const query = searchQuery.toLowerCase()
    return (
      reg.data.name.toLowerCase().includes(query) ||
      reg.data.email.toLowerCase().includes(query) ||
      reg.data.username.toLowerCase().includes(query) ||
      (reg.data.company && reg.data.company.toLowerCase().includes(query))
    )
  })

  const pendingCount = pendingRegistrations.filter((r) => r.status === "pending").length
  const approvedCount = pendingRegistrations.filter((r) => r.status === "approved").length
  const rejectedCount = pendingRegistrations.filter((r) => r.status === "rejected").length

  const handleAction = () => {
    if (!selectedRegistration || !actionType) return

    if (actionType === "approve") {
      approveRegistration(selectedRegistration)
    } else {
      rejectRegistration(selectedRegistration)
    }

    setSelectedRegistration(null)
    setActionType(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" /> Pendente
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Aprovado
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" /> Rejeitado
          </Badge>
        )
      default:
        return null
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "public":
        return <Badge variant="secondary">Público</Badge>
      case "tecnico":
        return <Badge variant="default">Técnico</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("budgetApproval")}</h1>
        <p className="text-muted-foreground">Gerir orçamentos pendentes de aprovação na plataforma.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome, email, utilizador ou empresa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({pendingCount})</TabsTrigger>
          <TabsTrigger value="approved">Aprovados ({approvedCount})</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados ({rejectedCount})</TabsTrigger>
          <TabsTrigger value="all">Todos ({pendingRegistrations.length})</TabsTrigger>
        </TabsList>

        {["pending", "approved", "rejected", "all"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                {filteredRegistrations.filter((r) => tabValue === "all" || r.status === tabValue).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum registo encontrado.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilizador</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRegistrations
                        .filter((r) => tabValue === "all" || r.status === tabValue)
                        .map((registration) => (
                          <TableRow key={registration.id} className="hover-lift">
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  {registration.data.name}
                                </div>
                                <div className="text-sm text-muted-foreground">@{registration.data.username}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  {registration.data.email}
                                </div>
                                {registration.data.company && (
                                  <div className="text-sm flex items-center gap-2 text-muted-foreground">
                                    <Building2 className="h-3 w-3" />
                                    {registration.data.company}
                                  </div>
                                )}
                                {registration.data.phone && (
                                  <div className="text-sm flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {registration.data.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(registration.data.role)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(registration.createdAt).toLocaleDateString("pt-PT")}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(registration.status)}</TableCell>
                            <TableCell className="text-right">
                              {registration.status === "pending" && (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-500 hover:text-green-600 hover:bg-green-500/10 bg-transparent"
                                    onClick={() => {
                                      setSelectedRegistration(registration.id)
                                      setActionType("approve")
                                    }}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10 bg-transparent"
                                    onClick={() => {
                                      setSelectedRegistration(registration.id)
                                      setActionType("reject")
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Rejeitar
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!selectedRegistration && !!actionType}
        onOpenChange={() => {
          setSelectedRegistration(null)
          setActionType(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionType === "approve" ? "Aprovar Registo" : "Rejeitar Registo"}</AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? "Tem a certeza que deseja aprovar este registo? O utilizador receberá um email de confirmação e poderá aceder à plataforma."
                : "Tem a certeza que deseja rejeitar este registo? O utilizador será notificado por email."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={actionType === "approve" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
            >
              {actionType === "approve" ? "Aprovar" : "Rejeitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
