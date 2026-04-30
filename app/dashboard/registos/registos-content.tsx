"use client"

import { useState, useRef } from "react"
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
  FileText, Calculator, Database, Sparkles, Loader2, ChevronDown, ChevronUp, Euro,
  Upload, AlertTriangle, Eye, TrendingUp, TrendingDown, BarChart3, Target, Zap,
  HelpCircle, Lightbulb, Minus, MapPin, Info
} from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

// Rating configuration for budget items
const ratingConfig = {
  below: {
    label: "Abaixo da Media",
    shortLabel: "< -10%",
    color: "text-green-600",
    bg: "bg-green-100",
    border: "border-green-500",
    icon: TrendingDown,
  },
  average: {
    label: "Na Media",
    shortLabel: "-10% a +10%",
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    border: "border-yellow-500",
    icon: Minus,
  },
  above: {
    label: "Acima da Media",
    shortLabel: "+11% a +49%",
    color: "text-orange-600",
    bg: "bg-orange-100",
    border: "border-orange-500",
    icon: TrendingUp,
  },
  critical: {
    label: "Muito Acima",
    shortLabel: "> +50%",
    color: "text-red-600",
    bg: "bg-red-100",
    border: "border-red-500",
    icon: AlertTriangle,
  },
  unknown: {
    label: "Sem Referencia",
    shortLabel: "N/A",
    color: "text-gray-500",
    bg: "bg-gray-100",
    border: "border-gray-400",
    icon: HelpCircle,
  },
}

const CHART_COLORS = ["#22c55e", "#eab308", "#f97316", "#ef4444", "#6b7280"]

export default function RegistosContent() {
  const { pendingRegistrations, approveRegistration, rejectRegistration, user } = useAuth()
  const { budgets, updateBudget, importBudgetItems, addBudget, materials } = useData()
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegistration, setSelectedRegistration] = useState<string | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [mainTab, setMainTab] = useState("budgets")
  const [expandedBudget, setExpandedBudget] = useState<string | null>(null)
  const [isReanalyzing, setIsReanalyzing] = useState<string | null>(null)
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null)
  const [budgetActionType, setBudgetActionType] = useState<"approve" | "reject" | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const isAdmin = user?.role === "admin"
  
  // Filter budgets for clients - only show their own budgets that are visible
  const clientBudgets = budgets.filter(b => 
    b.userId === user?.id || b.visibleToClient === true
  )

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
    const budget = budgets.find(b => b.id === budgetId)
    if (!budget) {
      setIsReanalyzing(null)
      return
    }

    // Simulate AI analysis with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    // Generate comprehensive analysis data
    const totalBudget = budget.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
    
    // Generate item analysis by matching with materials database
    const itemAnalysis = budget.items.map(item => {
      const matchedMaterial = materials.find(m => 
        m.name.toLowerCase().includes(item.materialName.toLowerCase().split(' ')[0]) ||
        item.materialName.toLowerCase().includes(m.name.toLowerCase().split(' ')[0])
      )
      
      const referenceAvgPrice = matchedMaterial ? (matchedMaterial.price + (matchedMaterial.priceMax || matchedMaterial.price)) / 2 : null
      const variance = referenceAvgPrice ? ((item.unitPrice - referenceAvgPrice) / referenceAvgPrice) * 100 : null
      
      let rating: "below" | "average" | "above" | "critical" | "unknown" = "unknown"
      if (variance !== null) {
        if (variance < -10) rating = "below"
        else if (variance <= 10) rating = "average"
        else if (variance <= 49) rating = "above"
        else rating = "critical"
      }
      
      return {
        id: item.id,
        originalName: item.materialName,
        matchedName: matchedMaterial?.name || null,
        referenceMinPrice: matchedMaterial?.price || null,
        referenceMaxPrice: matchedMaterial?.priceMax || null,
        referenceAvgPrice,
        variance,
        rating,
        matchConfidence: matchedMaterial ? 75 + Math.random() * 25 : 0,
        matchDetails: matchedMaterial ? `Correspondido com ${matchedMaterial.category}` : undefined
      }
    })
    
    // Calculate statistics
    const matchedItems = itemAnalysis.filter(i => i.matchedName !== null).length
    const belowAverage = itemAnalysis.filter(i => i.rating === "below").length
    const average = itemAnalysis.filter(i => i.rating === "average").length
    const aboveAverage = itemAnalysis.filter(i => i.rating === "above").length
    const critical = itemAnalysis.filter(i => i.rating === "critical").length
    const unknown = itemAnalysis.filter(i => i.rating === "unknown").length
    
    const matchRate = (matchedItems / budget.items.length) * 100
    const avgConfidence = itemAnalysis.reduce((sum, i) => sum + i.matchConfidence, 0) / itemAnalysis.length
    
    // Calculate totals
    const totalReference = itemAnalysis.reduce((sum, i) => {
      const item = budget.items.find(bi => bi.id === i.id || bi.materialName === i.originalName)
      return sum + (i.referenceAvgPrice ? item!.quantity * i.referenceAvgPrice : 0)
    }, 0)
    
    const overallVariance = totalReference > 0 ? ((totalBudget - totalReference) / totalReference) * 100 : 0
    
    // Potential savings calculation (sum of items above market)
    const potentialSavings = itemAnalysis.reduce((sum, i) => {
      if (i.variance && i.variance > 10) {
        const item = budget.items.find(bi => bi.id === i.id || bi.materialName === i.originalName)
        const savings = item ? item.quantity * item.unitPrice * (i.variance / 100) * 0.7 : 0
        return sum + savings
      }
      return sum
    }, 0)
    
    // Overall rating
    let overallRating: "below" | "average" | "above" | "critical" = "average"
    if (overallVariance < -10) overallRating = "below"
    else if (overallVariance <= 10) overallRating = "average"
    else if (overallVariance <= 49) overallRating = "above"
    else overallRating = "critical"
    
    // Quality score
    const qualityScore = Math.round(
      (matchRate * 0.4) + 
      (avgConfidence * 0.3) + 
      (Math.min((budget.items.length / 50) * 15, 15)) +
      ((1 - critical / Math.max(budget.items.length, 1)) * 15)
    )
    
    // Category breakdown
    const categories = [...new Set(budget.items.map(i => i.category || "Outros"))]
    const categoryBreakdown = categories.map(cat => {
      const catItems = budget.items.filter(i => (i.category || "Outros") === cat)
      const catAnalysis = itemAnalysis.filter(ia => catItems.some(ci => ci.id === ia.id || ci.materialName === ia.originalName))
      const total = catItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
      const avgVariance = catAnalysis.length > 0 
        ? catAnalysis.reduce((sum, i) => sum + (i.variance || 0), 0) / catAnalysis.length 
        : 0
      return { category: cat, total, count: catItems.length, variance: avgVariance }
    })
    
    // Recommendations
    const recommendations: string[] = []
    if (critical > 0) {
      recommendations.push(`${critical} itens com precos criticos (>50% acima do mercado) - recomenda-se renegociacao.`)
    }
    if (potentialSavings > 500) {
      recommendations.push(`Potencial de poupanca de ${potentialSavings.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })} otimizando itens acima do mercado.`)
    }
    if (unknown > budget.items.length * 0.3) {
      recommendations.push(`${unknown} itens sem referencia de mercado - considere adicionar a base de dados.`)
    }
    if (overallVariance > 20) {
      recommendations.push(`Orcamento ${overallVariance.toFixed(1)}% acima do mercado - revise precos com fornecedores.`)
    }
    if (matchRate < 70) {
      recommendations.push(`Taxa de correspondencia baixa (${matchRate.toFixed(0)}%) - alguns itens podem necessitar verificacao manual.`)
    }
    if (belowAverage > 5) {
      recommendations.push(`${belowAverage} itens abaixo do mercado - verifique qualidade/especificacoes.`)
    }
    
    // Update budget with all analysis data
    updateBudget(budgetId, {
      analysisVariance: overallVariance,
      totalReference,
      overallRating,
      region: "Lisboa e Vale do Tejo",
      qualityScore,
      analysisStats: {
        totalItems: budget.items.length,
        matchedItems,
        belowAverage,
        average,
        aboveAverage,
        critical,
        unknown,
        matchRate,
        avgConfidence,
        potentialSavings,
        riskItems: critical + Math.floor(aboveAverage / 2)
      },
      categoryBreakdown,
      recommendations,
      itemAnalysis
    })
    
    toast.success("Analise IA concluida com sucesso!")
    setIsReanalyzing(null)
  }
  
  // Client file upload handler
  const handleClientUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    
    try {
      // Parse the file (simplified - in production would use the full parser)
      const formData = new FormData()
      formData.append("file", file)
      
      // Call the parse API
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData
      })
      
      let items: Array<{ name: string; unit: string; quantity: number; price: number }> = []
      
      if (response.ok) {
        const data = await response.json()
        items = data.items || []
      }
      
      // Create a new budget submission
      const budgetItems = items.map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        materialId: "",
        materialName: item.name,
        unit: item.unit || "un",
        quantity: item.quantity || 1,
        unitPrice: item.price || 0,
        category: "Geral"
      }))
      
      addBudget({
        name: file.name.replace(/\.(pdf|xlsx|xls|csv)$/i, ""),
        obraId: "",
        obraName: "Submissao Cliente",
        userId: user?.id,
        createdDate: new Date().toISOString().split("T")[0],
        status: "pendente",
        items: budgetItems,
        totalValue: budgetItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
        visibleToClient: false // Will be visible after admin approval
      })
      
      toast.success("Orcamento submetido com sucesso!", {
        description: "O seu orcamento foi enviado para aprovacao. Sera notificado quando for analisado."
      })
      
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Erro ao submeter orcamento", {
        description: "Por favor tente novamente ou contacte o suporte."
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
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

  // CLIENT VIEW - Simplified upload and status view
  if (!isAdmin) {
    const myPendingBudgets = clientBudgets.filter(b => b.status === "pendente" && b.userId === user?.id)
    const myApprovedBudgets = clientBudgets.filter(b => b.status === "aprovado")
    const myRejectedBudgets = clientBudgets.filter(b => b.status === "rejeitado" && b.userId === user?.id)
    
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Meus Orcamentos</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Submeta orcamentos para aprovacao e acompanhe o estado.</p>
          </div>
        </div>
        
        {/* Upload Section for Clients */}
        <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Submeter Novo Orcamento
            </CardTitle>
            <CardDescription>
              Carregue o seu orcamento em PDF, Excel ou CSV para ser analisado e aprovado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              onChange={handleClientUpload}
              className="hidden"
              id="client-upload"
            />
            <label htmlFor="client-upload">
              <Button
                asChild
                size="lg"
                className="w-full h-20 text-lg cursor-pointer"
                disabled={isUploading}
              >
                <span>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                      A processar...
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mr-2" />
                      Carregar Orcamento
                    </>
                  )}
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Formatos aceites: PDF, Excel (.xlsx, .xls), CSV
            </p>
          </CardContent>
        </Card>
        
        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Analise</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{myPendingBudgets.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando aprovacao</p>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{myApprovedBudgets.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Prontos para pagamento</p>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{myRejectedBudgets.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Necessitam revisao</p>
            </CardContent>
          </Card>
        </div>
        
        {/* My Budgets List */}
        <Card>
          <CardHeader>
            <CardTitle>Historico de Orcamentos</CardTitle>
            <CardDescription>Acompanhe o estado dos seus orcamentos submetidos.</CardDescription>
          </CardHeader>
          <CardContent>
            {clientBudgets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ainda nao submeteu nenhum orcamento.</p>
                <p className="text-sm mt-2">Utilize o botao acima para submeter o seu primeiro orcamento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clientBudgets.map((budget) => {
                  const totalValue = budget.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
                  
                  return (
                    <Card key={budget.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <h4 className="font-medium">{budget.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {budget.createdDate} • {budget.items.length} itens
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-semibold">{totalValue.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</p>
                            </div>
                            {getBudgetStatusBadge(budget.status)}
                          </div>
                        </div>
                        
                        {/* Status Messages */}
                        {budget.status === "pendente" && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                            <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-800">
                              <p className="font-medium">Em analise</p>
                              <p className="text-xs mt-0.5">O seu orcamento esta a ser analisado pela nossa equipa. Sera notificado quando houver uma decisao.</p>
                            </div>
                          </div>
                        )}
                        
                        {budget.status === "aprovado" && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-green-800">
                              <p className="font-medium">Aprovado</p>
                              <p className="text-xs mt-0.5">O seu orcamento foi aprovado! Pode agora proceder ao pagamento.</p>
                              <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700">
                                Proceder ao Pagamento
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {budget.status === "rejeitado" && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-red-800">
                              <p className="font-medium">Rejeitado</p>
                              <p className="text-xs mt-0.5">{budget.adminNotes || "O seu orcamento foi rejeitado. Por favor reveja e submeta novamente."}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // ADMIN VIEW - Full analysis tools, AI prices, percentages
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Aprovacoes (Admin)</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Gerir orcamentos e registos de utilizadores pendentes de aprovacao.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pendingBudgets.length > 0 && (
            <Badge className="bg-yellow-500 text-white gap-1 px-3 py-1 text-xs sm:text-sm">
              <Calculator className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {pendingBudgets.length} orcamento{pendingBudgets.length !== 1 ? "s" : ""} pendente{pendingBudgets.length !== 1 ? "s" : ""}
            </Badge>
          )}
          {pendingRegCount > 0 && (
            <Badge className="bg-yellow-500 text-white gap-1 px-3 py-1 text-xs sm:text-sm">
              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {pendingRegCount} registo{pendingRegCount !== 1 ? "s" : ""} pendente{pendingRegCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Tabs: Budgets vs Users */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md h-auto">
          <TabsTrigger value="budgets" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-4">
            <Calculator className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">Aprovacao de Orcamentos</span>
            {pendingBudgets.length > 0 && (
              <Badge className="ml-1 bg-yellow-500 text-white animate-pulse text-[10px] sm:text-xs">{pendingBudgets.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-4">
            <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">Registos de Utilizadores</span>
            {pendingRegCount > 0 && (
              <Badge className="ml-1 bg-yellow-500 text-white animate-pulse text-[10px] sm:text-xs">{pendingRegCount}</Badge>
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
                  <TabsList className="flex-wrap h-auto gap-1">
                    <TabsTrigger value="pendente" className="text-xs sm:text-sm">Pendentes ({pendingBudgets.length})</TabsTrigger>
                    <TabsTrigger value="aprovado" className="text-xs sm:text-sm">Aprovados ({approvedBudgets.length})</TabsTrigger>
                    <TabsTrigger value="rejeitado" className="text-xs sm:text-sm">Rejeitados ({rejectedBudgets.length})</TabsTrigger>
                    <TabsTrigger value="todos" className="text-xs sm:text-sm">Todos ({budgets.length})</TabsTrigger>
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
                                className="cursor-pointer py-3 px-3 sm:px-6"
                                onClick={() => setExpandedBudget(isExpanded ? null : budget.id)}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                                    <div className="min-w-0">
                                      <CardTitle className="text-sm sm:text-base truncate">{budget.name}</CardTitle>
                                      <CardDescription className="text-xs truncate">
                                        {budget.obraName} • {budget.createdDate} • {budget.items.length} itens
                                      </CardDescription>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                                    <div className="text-left sm:text-right">
                                      <p className="font-semibold text-base sm:text-lg">€{totalValue.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</p>
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
                                    <div className="flex items-center gap-2">
                                      {getBudgetStatusBadge(budget.status)}
                                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              
                              {isExpanded && (
                                <CardContent className="border-t bg-muted/30 space-y-6 px-3 sm:px-6 py-6">
                                  {/* ========== SECTION 1: Main Metrics Summary ========== */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card className="bg-card/50">
                                      <CardContent className="pt-4 pb-3">
                                        <div className="text-xl font-bold">{totalValue.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</div>
                                        <p className="text-xs text-muted-foreground">Total Orcamento</p>
                                      </CardContent>
                                    </Card>
                                    <Card className="bg-card/50">
                                      <CardContent className="pt-4 pb-3">
                                        <div className="text-xl font-bold text-blue-600">
                                          {budget.totalReference 
                                            ? budget.totalReference.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })
                                            : (totalValue / (1 + (budget.analysisVariance || 0) / 100)).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })
                                          }
                                        </div>
                                        <p className="text-xs text-muted-foreground">Total Referencia Mercado</p>
                                      </CardContent>
                                    </Card>
                                    <Card className="bg-card/50">
                                      <CardContent className="pt-4 pb-3">
                                        <div className={cn("text-xl font-bold flex items-center gap-1", 
                                          (budget.analysisVariance || 0) > 10 ? "text-red-500" : 
                                          (budget.analysisVariance || 0) < -10 ? "text-green-500" : "text-yellow-500"
                                        )}>
                                          {(budget.analysisVariance || 0) > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                          {(budget.analysisVariance || 0) > 0 ? "+" : ""}{(budget.analysisVariance || 0).toFixed(1)}%
                                        </div>
                                        <p className="text-xs text-muted-foreground">Variacao Global</p>
                                      </CardContent>
                                    </Card>
                                    <Card className={cn("bg-card/50", budget.overallRating && ratingConfig[budget.overallRating]?.bg)}>
                                      <CardContent className="pt-4 pb-3">
                                        <div className={cn("text-xl font-bold", budget.overallRating && ratingConfig[budget.overallRating]?.color)}>
                                          {budget.overallRating ? ratingConfig[budget.overallRating]?.label : "A Analisar"}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Classificacao Geral</p>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* ========== SECTION 2: Quality Score & Region ========== */}
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                                      <CardContent className="pt-4">
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-2">Pontuacao de Qualidade</p>
                                            <div className="flex items-baseline gap-2">
                                              <div className="text-3xl font-bold text-primary">{budget.qualityScore || 0}</div>
                                              <span className="text-muted-foreground">/100</span>
                                            </div>
                                            <Progress value={budget.qualityScore || 0} className="w-32 h-1.5 mt-3" />
                                          </div>
                                          <Target className="h-8 w-8 text-primary/50" />
                                        </div>
                                      </CardContent>
                                    </Card>
                                    <Card className="bg-card/50">
                                      <CardContent className="pt-4">
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-2">Regiao</p>
                                            <div className="text-xl font-bold">{budget.region || "Nacional"}</div>
                                            <p className="text-xs text-muted-foreground mt-1">Precos ajustados a regiao</p>
                                          </div>
                                          <MapPin className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* ========== SECTION 3: Detailed Statistics ========== */}
                                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <Card className="bg-card/50 border-l-4 border-l-primary">
                                      <CardContent className="pt-4">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="text-xl font-bold">{budget.analysisStats?.matchRate?.toFixed(0) || 0}%</div>
                                            <p className="text-xs text-muted-foreground">Taxa de Correspondencia</p>
                                          </div>
                                          <BarChart3 className="h-8 w-8 text-primary/50" />
                                        </div>
                                      </CardContent>
                                    </Card>
                                    <Card className="bg-card/50 border-l-4 border-l-green-500">
                                      <CardContent className="pt-4">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="text-xl font-bold">{budget.analysisStats?.avgConfidence?.toFixed(0) || 0}%</div>
                                            <p className="text-xs text-muted-foreground">Confianca Media</p>
                                          </div>
                                          <Zap className="h-8 w-8 text-green-500/50" />
                                        </div>
                                      </CardContent>
                                    </Card>
                                    <Card className="bg-card/50 border-l-4 border-l-orange-500">
                                      <CardContent className="pt-4">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="text-xl font-bold text-orange-600">
                                              {(budget.analysisStats?.potentialSavings || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Poupanca Potencial</p>
                                          </div>
                                          <TrendingDown className="h-8 w-8 text-orange-500/50" />
                                        </div>
                                      </CardContent>
                                    </Card>
                                    <Card className="bg-card/50 border-l-4 border-l-red-500">
                                      <CardContent className="pt-4">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="text-xl font-bold text-red-600">{budget.analysisStats?.riskItems || 0}</div>
                                            <p className="text-xs text-muted-foreground">Itens de Risco</p>
                                          </div>
                                          <AlertTriangle className="h-8 w-8 text-red-500/50" />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* ========== SECTION 4: Item Distribution ========== */}
                                  <Card className="bg-card/50">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" />
                                        Distribuicao dos Itens por Classificacao
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-5 gap-2 text-center">
                                        <div className="p-2 rounded bg-green-100">
                                          <div className="text-lg font-bold text-green-600">{budget.analysisStats?.belowAverage || 0}</div>
                                          <p className="text-xs text-green-700">Abaixo</p>
                                        </div>
                                        <div className="p-2 rounded bg-yellow-100">
                                          <div className="text-lg font-bold text-yellow-600">{budget.analysisStats?.average || 0}</div>
                                          <p className="text-xs text-yellow-700">Media</p>
                                        </div>
                                        <div className="p-2 rounded bg-orange-100">
                                          <div className="text-lg font-bold text-orange-600">{budget.analysisStats?.aboveAverage || 0}</div>
                                          <p className="text-xs text-orange-700">Acima</p>
                                        </div>
                                        <div className="p-2 rounded bg-red-100">
                                          <div className="text-lg font-bold text-red-600">{budget.analysisStats?.critical || 0}</div>
                                          <p className="text-xs text-red-700">Critico</p>
                                        </div>
                                        <div className="p-2 rounded bg-gray-100">
                                          <div className="text-lg font-bold text-gray-600">{budget.analysisStats?.unknown || 0}</div>
                                          <p className="text-xs text-gray-700">S/ Ref</p>
                                        </div>
                                      </div>
                                      {/* Visual bar */}
                                      <div className="mt-3 h-3 rounded-full overflow-hidden flex">
                                        {(budget.analysisStats?.belowAverage || 0) > 0 && (
                                          <div className="bg-green-500 h-full" style={{ width: `${((budget.analysisStats?.belowAverage || 0) / budget.items.length) * 100}%` }} />
                                        )}
                                        {(budget.analysisStats?.average || 0) > 0 && (
                                          <div className="bg-yellow-500 h-full" style={{ width: `${((budget.analysisStats?.average || 0) / budget.items.length) * 100}%` }} />
                                        )}
                                        {(budget.analysisStats?.aboveAverage || 0) > 0 && (
                                          <div className="bg-orange-500 h-full" style={{ width: `${((budget.analysisStats?.aboveAverage || 0) / budget.items.length) * 100}%` }} />
                                        )}
                                        {(budget.analysisStats?.critical || 0) > 0 && (
                                          <div className="bg-red-500 h-full" style={{ width: `${((budget.analysisStats?.critical || 0) / budget.items.length) * 100}%` }} />
                                        )}
                                        {(budget.analysisStats?.unknown || 0) > 0 && (
                                          <div className="bg-gray-400 h-full" style={{ width: `${((budget.analysisStats?.unknown || 0) / budget.items.length) * 100}%` }} />
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* ========== SECTION 5: Category Breakdown ========== */}
                                  {budget.categoryBreakdown && budget.categoryBreakdown.length > 0 && (
                                    <Card className="bg-card/50">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                          <Calculator className="h-4 w-4" />
                                          Analise por Categoria
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-3">
                                          {budget.categoryBreakdown.map((cat, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                              <div className="flex-1">
                                                <p className="font-medium text-sm">{cat.category}</p>
                                                <p className="text-xs text-muted-foreground">{cat.count} itens</p>
                                              </div>
                                              <div className="text-right">
                                                <p className="font-medium">{cat.total.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</p>
                                                <p className={cn("text-xs font-medium", cat.variance > 10 ? "text-red-500" : cat.variance < -10 ? "text-green-500" : "text-yellow-500")}>
                                                  {cat.variance > 0 ? "+" : ""}{cat.variance.toFixed(1)}%
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}

                                  {/* ========== SECTION 6: High Variance Warning ========== */}
                                  {(() => {
                                    const highVarianceItems = budget.itemAnalysis?.filter(i => i.variance !== null && Math.abs(i.variance) > 65) || []
                                    if (highVarianceItems.length === 0) return null
                                    
                                    return (
                                      <Card className="bg-orange-50 border-orange-300 border-2">
                                        <CardHeader className="pb-2">
                                          <CardTitle className="flex items-center gap-2 text-orange-700">
                                            <AlertTriangle className="h-5 w-5 animate-pulse" />
                                            Alerta: {highVarianceItems.length} itens com variacao superior a 65%
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                          <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {highVarianceItems.slice(0, 5).map((item) => (
                                              <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border border-orange-200">
                                                <p className="text-sm font-medium truncate flex-1">{item.originalName}</p>
                                                <span className="text-sm font-bold text-orange-600 ml-2">
                                                  {item.variance && item.variance > 0 ? "+" : ""}{item.variance?.toFixed(1)}%
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    )
                                  })()}

                                  {/* ========== SECTION 7: AI Recommendations ========== */}
                                  {budget.recommendations && budget.recommendations.length > 0 && (
                                    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-blue-700">
                                          <Lightbulb className="h-5 w-5" />
                                          Recomendacoes da Analise IA
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <ul className="space-y-2">
                                          {budget.recommendations.map((rec, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                              <span>{rec}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </CardContent>
                                    </Card>
                                  )}

                                  {/* ========== SECTION 8: Action Buttons ========== */}
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

                                  {/* ========== SECTION 9: Full Items Table with Analysis ========== */}
                                  <Card className="bg-card/50">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Analise Detalhada dos Itens ({budget.items.length} itens)
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="rounded-lg border overflow-x-auto">
                                        <Table className="min-w-[1000px]">
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="min-w-[200px]">Material/Servico</TableHead>
                                              <TableHead className="min-w-[150px]">Correspondencia</TableHead>
                                              <TableHead className="text-right w-16">Qtd.</TableHead>
                                              <TableHead className="text-right w-12">Un.</TableHead>
                                              <TableHead className="text-right w-24">Preco Orc.</TableHead>
                                              <TableHead className="text-right w-24">Preco Ref.</TableHead>
                                              <TableHead className="text-right w-20">Variacao</TableHead>
                                              <TableHead className="text-center w-24">Estado</TableHead>
                                              <TableHead className="text-right w-20">Margem %</TableHead>
                                              <TableHead className="text-right w-28">Total c/ Margem</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {budget.items.map((item, idx) => {
                                              const analysis = budget.itemAnalysis?.find(a => a.id === item.id || a.originalName === item.materialName)
                                              const margin = item.adminMarginPercent || 0
                                              const baseTotal = item.quantity * item.unitPrice
                                              const totalWithMargin = baseTotal + (baseTotal * margin / 100)
                                              const rating = analysis?.rating || "unknown"
                                              const RatingIcon = ratingConfig[rating]?.icon || HelpCircle
                                              
                                              return (
                                                <TableRow key={idx} className={cn(
                                                  analysis?.variance && Math.abs(analysis.variance) > 65 && "bg-orange-50"
                                                )}>
                                                  <TableCell className="font-medium max-w-[200px]">
                                                    <span className="truncate block" title={item.materialName}>{item.materialName}</span>
                                                  </TableCell>
                                                  <TableCell className="text-xs text-muted-foreground max-w-[150px]">
                                                    <span className="truncate block" title={analysis?.matchedName || "-"}>
                                                      {analysis?.matchedName || "-"}
                                                    </span>
                                                    {analysis?.matchConfidence && (
                                                      <span className="text-xs text-blue-500">({analysis.matchConfidence.toFixed(0)}%)</span>
                                                    )}
                                                  </TableCell>
                                                  <TableCell className="text-right">{item.quantity}</TableCell>
                                                  <TableCell className="text-right">{item.unit}</TableCell>
                                                  <TableCell className="text-right">€{item.unitPrice.toFixed(2)}</TableCell>
                                                  <TableCell className="text-right text-blue-600">
                                                    {analysis?.referenceAvgPrice ? `€${analysis.referenceAvgPrice.toFixed(2)}` : "-"}
                                                  </TableCell>
                                                  <TableCell className={cn("text-right font-medium", ratingConfig[rating]?.color)}>
                                                    {analysis?.variance !== null && analysis?.variance !== undefined
                                                      ? `${analysis.variance > 0 ? "+" : ""}${analysis.variance.toFixed(1)}%`
                                                      : "-"
                                                    }
                                                  </TableCell>
                                                  <TableCell className="text-center">
                                                    <Badge className={cn("gap-1", ratingConfig[rating]?.bg, ratingConfig[rating]?.color)}>
                                                      <RatingIcon className="h-3 w-3" />
                                                      {ratingConfig[rating]?.shortLabel}
                                                    </Badge>
                                                  </TableCell>
                                                  <TableCell className="text-right">
                                                    <Input
                                                      type="number"
                                                      min="0"
                                                      max="100"
                                                      step="0.5"
                                                      defaultValue={margin}
                                                      onChange={(e) => {
                                                        const newMargin = parseFloat(e.target.value) || 0
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
                                                </TableRow>
                                              )
                                            })}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  {/* ========== SECTION 10: Margin Summary ========== */}
                                  <Card className="bg-primary/5 border-primary/20">
                                    <CardContent className="py-4">
                                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                          <Euro className="h-5 w-5 text-primary" />
                                          <span className="font-semibold">Resumo Financeiro (Admin)</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                          <div>
                                            <p className="text-xs text-muted-foreground">Total Cliente</p>
                                            <p className="font-bold">{totalValue.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Total Referencia</p>
                                            <p className="font-bold text-blue-600">
                                              {(budget.totalReference || totalValue / (1 + (budget.analysisVariance || 0) / 100)).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Total Margens</p>
                                            <p className="font-bold text-green-600">
                                              {budget.items.reduce((sum, item) => {
                                                const base = item.quantity * item.unitPrice
                                                const margin = item.adminMarginPercent || 0
                                                return sum + (base * margin / 100)
                                              }, 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Total c/ Margens</p>
                                            <p className="font-bold text-primary text-lg">
                                              {budget.items.reduce((sum, item) => {
                                                const base = item.quantity * item.unitPrice
                                                const margin = item.adminMarginPercent || 0
                                                return sum + base + (base * margin / 100)
                                              }, 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
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
