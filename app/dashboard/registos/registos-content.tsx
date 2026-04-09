"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { useData } from "@/contexts/data-context"
import { useLanguage } from "@/contexts/language-context"
import { toast } from "sonner"
import { 
  Search, CheckCircle2, XCircle, Clock, User, Mail, Building2, Phone, Calendar, 
  FileText, Calculator, Database, Sparkles, Loader2, ChevronDown, ChevronUp, Euro
} from "lucide-react"

export default function RegistosContent() {
  const { pendingRegistrations, approveRegistration, rejectRegistration, user } = useAuth()
  const { budgets, updateBudget, importBudgetItems } = useData()
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegistration, setSelectedRegistration] = useState<string | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [mainTab, setMainTab] = useState("budgets")
  const [expandedBudget, setExpandedBudget] = useState<string | null>(null)
  const [isReanalyzing, setIsReanalyzing] = useState<string | null>(null)
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null)
  const [budgetActionType, setBudgetActionType] = useState<"approve" | "reject" | null>(null)

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

  // Filter registrations
  const filteredRegistrations = pendingRegistrations.filter((reg) => {
    const query = searchQuery.toLowerCase()
    return (
      reg.data.name.toLowerCase().includes(query) ||
      reg.data.email.toLowerCase().includes(query) ||
      reg.data.username.toLowerCase().includes(query) ||
      (reg.data.company && reg.data.company.toLowerCase().includes(query))
    )
  })

  // Budget counts
  const pendingBudgets = budgets.filter((b) => b.status === "pendente")
  const approvedBudgets = budgets.filter((b) => b.status === "aprovado")
  const rejectedBudgets = budgets.filter((b) => b.status === "rejeitado")

  // Registration counts
  const pendingRegCount = pendingRegistrations.filter((r) => r.status === "pending").length
  const approvedRegCount = pendingRegistrations.filter((r) => r.status === "approved").length
  const rejectedRegCount = pendingRegistrations.filter((r) => r.status === "rejected").length

  const handleRegistrationAction = () => {
    if (!selectedRegistration || !actionType) return

    if (actionType === "approve") {
      approveRegistration(selectedRegistration)
    } else {
      rejectRegistration(selectedRegistration)
    }

    setSelectedRegistration(null)
    setActionType(null)
  }

  const handleBudgetAction = () => {
    if (!selectedBudget || !budgetActionType) return

    const isApproved = budgetActionType === "approve"
    updateBudget(selectedBudget, { 
      status: isApproved ? "aprovado" : "rejeitado",
      visibleToClient: isApproved, // Only make visible to client when approved
      approvedBy: user?.id,
      approvedAt: new Date().toISOString(),
    })
    
    toast.success(
      isApproved 
        ? "Orcamento aprovado e visivel para o cliente!" 
        : "Orcamento rejeitado"
    )

    setSelectedBudget(null)
    setBudgetActionType(null)
  }

  const handleImportToDatabase = (budget: typeof budgets[0]) => {
    const itemsToImport = budget.items.map(item => ({
      name: item.materialName,
      unit: item.unit,
      priceMin: item.unitPrice * 0.9,
      priceMax: item.unitPrice * 1.1,
      category: item.category || "Geral",
      type: "material" as const
    }))
    const importedCount = importBudgetItems(itemsToImport, "Importado de Orçamento")
    toast.success(`${importedCount} itens importados para a base de dados!`)
  }

  const handleAIReanalyze = async (budgetId: string) => {
    setIsReanalyzing(budgetId)
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.success("Análise IA concluída!")
    setIsReanalyzing(null)
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

  const getBudgetStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="h-3 w-3 mr-1" /> Pendente
          </Badge>
        )
      case "aprovado":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Aprovado
          </Badge>
        )
      case "rejeitado":
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" /> Rejeitado
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aprovações</h1>
          <p className="text-muted-foreground">Gerir orçamentos e registos de utilizadores pendentes de aprovação.</p>
        </div>
        <div className="flex gap-2">
          {pendingBudgets.length > 0 && (
            <Badge className="bg-yellow-500 text-white gap-1 px-3 py-1 text-sm">
              <Calculator className="h-3.5 w-3.5" />
              {pendingBudgets.length} orçamento{pendingBudgets.length !== 1 ? "s" : ""} pendente{pendingBudgets.length !== 1 ? "s" : ""}
            </Badge>
          )}
          {pendingRegCount > 0 && (
            <Badge className="bg-yellow-500 text-white gap-1 px-3 py-1 text-sm">
              <User className="h-3.5 w-3.5" />
              {pendingRegCount} registo{pendingRegCount !== 1 ? "s" : ""} pendente{pendingRegCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Tabs: Budgets vs Users */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="budgets" className="gap-2">
            <Calculator className="h-4 w-4" />
            Aprovacao de Orcamentos
            {pendingBudgets.length > 0 && (
              <Badge className="ml-1 bg-yellow-500 text-white animate-pulse">{pendingBudgets.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <User className="h-4 w-4" />
            Registos de Utilizadores
            {pendingRegCount > 0 && (
              <Badge className="ml-1 bg-yellow-500 text-white animate-pulse">{pendingRegCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* BUDGETS TAB */}
        <TabsContent value="budgets" className="space-y-6">
          {/* Budget Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{pendingBudgets.length}</div>
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{approvedBudgets.length}</div>
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{rejectedBudgets.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Budget List */}
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos para Aprovação</CardTitle>
              <CardDescription>Orçamentos submetidos por utilizadores aguardando aprovação.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum orçamento submetido.</p>
                </div>
              ) : (
                <Tabs defaultValue="pendente" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="pendente">Pendentes ({pendingBudgets.length})</TabsTrigger>
                    <TabsTrigger value="aprovado">Aprovados ({approvedBudgets.length})</TabsTrigger>
                    <TabsTrigger value="rejeitado">Rejeitados ({rejectedBudgets.length})</TabsTrigger>
                    <TabsTrigger value="todos">Todos ({budgets.length})</TabsTrigger>
                  </TabsList>

                  {["pendente", "aprovado", "rejeitado", "todos"].map((tabValue) => (
                    <TabsContent key={tabValue} value={tabValue} className="space-y-3">
                      {budgets
                        .filter((b) => tabValue === "todos" || b.status === tabValue)
                        .map((budget) => {
                          const isExpanded = expandedBudget === budget.id
                          const totalValue = budget.items.reduce(
                            (sum, item) => sum + item.quantity * item.unitPrice, 0
                          )
                          
                          return (
                            <Card key={budget.id} className="overflow-hidden hover-lift">
                              <CardHeader 
                                className="cursor-pointer py-3"
                                onClick={() => setExpandedBudget(isExpanded ? null : budget.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <div>
                                      <CardTitle className="text-base">{budget.name}</CardTitle>
                                      <CardDescription className="text-xs">
                                        {budget.obraName} • {budget.createdDate} • {budget.items.length} itens
                                      </CardDescription>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="font-semibold text-lg">€{totalValue.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</p>
                                      {budget.analysisVariance !== undefined && (
                                        <p className={`text-xs ${
                                          budget.analysisVariance > 10 ? "text-red-500" : 
                                          budget.analysisVariance < -10 ? "text-green-500" : 
                                          "text-yellow-500"
                                        }`}>
                                          {budget.analysisVariance > 0 ? "+" : ""}{budget.analysisVariance.toFixed(1)}% vs mercado
                                        </p>
                                      )}
                                    </div>
                                    {getBudgetStatusBadge(budget.status)}
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </div>
                                </div>
                              </CardHeader>
                              
                              {isExpanded && (
                                <CardContent className="border-t bg-muted/30 space-y-4">
                                  {/* Action Buttons for Pending Budgets */}
                                  {budget.status === "pendente" && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      <Button
                                        className="bg-green-500 hover:bg-green-600"
                                        onClick={() => {
                                          setSelectedBudget(budget.id)
                                          setBudgetActionType("approve")
                                        }}
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Aprovar
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => {
                                          setSelectedBudget(budget.id)
                                          setBudgetActionType("reject")
                                        }}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Rejeitar
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border-blue-500/30"
                                        onClick={() => handleImportToDatabase(budget)}
                                      >
                                        <Database className="h-4 w-4 mr-2" />
                                        Importar BD
                                      </Button>
                                      <Button
                                        variant="outline"
                                        disabled={isReanalyzing === budget.id}
                                        onClick={() => handleAIReanalyze(budget.id)}
                                      >
                                        {isReanalyzing === budget.id ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <Sparkles className="h-4 w-4 mr-2" />
                                        )}
                                        Analisar IA
                                      </Button>
                                    </div>
                                  )}

                                  {/* Budget Items Table with Admin Margin */}
                                  <div className="rounded-lg border overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Material/Serviço</TableHead>
                                          <TableHead className="text-right">Qtd.</TableHead>
                                          <TableHead className="text-right">Un.</TableHead>
                                          <TableHead className="text-right">Preço Unit.</TableHead>
                                          <TableHead className="text-right text-primary">Margem %</TableHead>
                                          <TableHead className="text-right text-primary">Total c/ Margem</TableHead>
                                          <TableHead className="text-right">Total Cliente</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {budget.items.slice(0, 10).map((item, idx) => {
                                          const margin = item.adminMarginPercent || 0
                                          const baseTotal = item.quantity * item.unitPrice
                                          const marginValue = baseTotal * (margin / 100)
                                          const totalWithMargin = baseTotal + marginValue
                                          
                                          return (
                                            <TableRow key={idx}>
                                              <TableCell className="font-medium">{item.materialName}</TableCell>
                                              <TableCell className="text-right">{item.quantity}</TableCell>
                                              <TableCell className="text-right">{item.unit}</TableCell>
                                              <TableCell className="text-right">€{item.unitPrice.toFixed(2)}</TableCell>
                                              <TableCell className="text-right">
                                                <Input
                                                  type="number"
                                                  min="0"
                                                  max="100"
                                                  step="0.5"
                                                  defaultValue={margin}
                                                  onChange={(e) => {
                                                    const newMargin = parseFloat(e.target.value) || 0
                                                    // Update the item margin in the budget
                                                    const updatedItems = budget.items.map((i, index) => 
                                                      index === idx 
                                                        ? { ...i, adminMarginPercent: newMargin, adminMarginValue: baseTotal * (newMargin / 100) }
                                                        : i
                                                    )
                                                    updateBudget(budget.id, { items: updatedItems })
                                                  }}
                                                  className="w-16 h-7 text-right text-xs bg-primary/10 border-primary/30"
                                                />
                                              </TableCell>
                                              <TableCell className="text-right font-medium text-primary">
                                                €{totalWithMargin.toFixed(2)}
                                              </TableCell>
                                              <TableCell className="text-right font-medium">
                                                €{baseTotal.toFixed(2)}
                                              </TableCell>
                                            </TableRow>
                                          )
                                        })}
                                        {budget.items.length > 10 && (
                                          <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                              ... e mais {budget.items.length - 10} itens
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                  
                                  {/* Margin Summary for Admin */}
                                  <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Euro className="h-4 w-4 text-primary" />
                                        <span className="font-medium">Resumo de Margens (Visivel apenas para Admin)</span>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Total Cliente: €{totalValue.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</p>
                                        <p className="text-lg font-bold text-primary">
                                          Total c/ Margens: €{budget.items.reduce((sum, item) => {
                                            const base = item.quantity * item.unitPrice
                                            const margin = item.adminMarginPercent || 0
                                            return sum + base + (base * margin / 100)
                                          }, 0).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          )
                        })}
                      {budgets.filter((b) => tabValue === "todos" || b.status === tabValue).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum orçamento nesta categoria.</p>
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users" className="space-y-6">
          {/* User Registration Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{pendingRegCount}</div>
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{approvedRegCount}</div>
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{rejectedRegCount}</div>
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

          {/* User Tabs */}
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">Pendentes ({pendingRegCount})</TabsTrigger>
              <TabsTrigger value="approved">Aprovados ({approvedRegCount})</TabsTrigger>
              <TabsTrigger value="rejected">Rejeitados ({rejectedRegCount})</TabsTrigger>
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
        </TabsContent>
      </Tabs>

      {/* User Registration Confirmation Dialog */}
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
              onClick={handleRegistrationAction}
              className={actionType === "approve" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
            >
              {actionType === "approve" ? "Aprovar" : "Rejeitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Budget Confirmation Dialog */}
      <AlertDialog
        open={!!selectedBudget && !!budgetActionType}
        onOpenChange={() => {
          setSelectedBudget(null)
          setBudgetActionType(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{budgetActionType === "approve" ? "Aprovar Orçamento" : "Rejeitar Orçamento"}</AlertDialogTitle>
            <AlertDialogDescription>
              {budgetActionType === "approve"
                ? "Tem a certeza que deseja aprovar este orçamento? O cliente será notificado e poderá prosseguir."
                : "Tem a certeza que deseja rejeitar este orçamento? O cliente será notificado."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBudgetAction}
              className={budgetActionType === "approve" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
            >
              {budgetActionType === "approve" ? "Aprovar" : "Rejeitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
