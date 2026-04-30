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
  HelpCircle, Lightbulb, Minus, MapPin, Info, Pencil, Search as SearchIcon, Save, X
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
  const { pendingRegistrations, approveRegistration, rejectRegistration, user, refreshPendingRegistrations } = useAuth()
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
  
  // Item editing state
  const [editingItem, setEditingItem] = useState<{ budgetId: string; itemIndex: number; item: any } | null>(null)
  const [analyzingItemId, setAnalyzingItemId] = useState<string | null>(null)
  const [itemAnalysisResult, setItemAnalysisResult] = useState<{
    budgetId: string
    itemId: string
    originalName: string
    matchedMaterials: { name: string; price: number; priceMax?: number; category: string; confidence: number }[]
    referencePrice: number | null
    variance: number | null
    recommendation: string
  } | null>(null)
  
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

  const handleRegistrationAction = async () => {
    console.log("[v0] handleRegistrationAction called", { selectedRegistration, actionType })
    if (!selectedRegistration || !actionType) {
      console.log("[v0] Missing selectedRegistration or actionType")
      return
    }
    
    try {
      if (actionType === "approve") {
        console.log("[v0] Calling approveRegistration with id:", selectedRegistration)
        await approveRegistration(selectedRegistration)
        console.log("[v0] approveRegistration completed successfully")
        toast.success("Registo aprovado com sucesso!", {
          description: "O utilizador pode agora aceder a plataforma."
        })
      } else {
        console.log("[v0] Calling rejectRegistration with id:", selectedRegistration)
        await rejectRegistration(selectedRegistration)
        console.log("[v0] rejectRegistration completed successfully")
        toast.success("Registo rejeitado.", {
          description: "O utilizador foi notificado."
        })
      }
      // Refresh registrations from database after action
      console.log("[v0] Refreshing pending registrations...")
      await refreshPendingRegistrations()
    } catch (error) {
      console.error("[v0] Registration action error:", error)
      toast.error("Erro ao processar registo", {
        description: error instanceof Error ? error.message : "Por favor tente novamente."
      })
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
    // IMPORTANT: Compare unit prices, not total prices, and match units properly
    const itemAnalysis = budget.items.map(item => {
      // Normalize unit for comparison (m2, m², M2 -> m2)
      const normalizeUnit = (unit: string) => {
        return unit.toLowerCase()
          .replace(/²/g, '2')
          .replace(/³/g, '3')
          .replace(/\s/g, '')
      }
      
      const itemUnit = normalizeUnit(item.unit || '')
      
      // Find matching material - prioritize same unit matches
      const matchedMaterial = materials.find(m => {
        const materialUnit = normalizeUnit(m.unit || '')
        const nameMatch = m.name.toLowerCase().includes(item.materialName.toLowerCase().split(' ')[0]) ||
          item.materialName.toLowerCase().includes(m.name.toLowerCase().split(' ')[0])
        // Prefer exact unit match for area/volume units
        const isAreaVolumeUnit = ['m2', 'm3', 'l', 'kg', 'ton'].some(u => itemUnit.includes(u) || materialUnit.includes(u))
        if (isAreaVolumeUnit) {
          return nameMatch && materialUnit === itemUnit
        }
        return nameMatch
      }) || materials.find(m => 
        m.name.toLowerCase().includes(item.materialName.toLowerCase().split(' ')[0]) ||
        item.materialName.toLowerCase().includes(m.name.toLowerCase().split(' ')[0])
      )
      
      // Compare UNIT prices, not total prices
      // The item.unitPrice is already per-unit, compare with material reference per-unit
      const referenceAvgPrice = matchedMaterial ? (matchedMaterial.price + (matchedMaterial.priceMax || matchedMaterial.price)) / 2 : null
      
      // Calculate variance based on unit price comparison
      const variance = referenceAvgPrice ? ((item.unitPrice - referenceAvgPrice) / referenceAvgPrice) * 100 : null
      
      let rating: "below" | "average" | "above" | "critical" | "unknown" = "unknown"
      if (variance !== null) {
        if (variance < -10) rating = "below"
        else if (variance <= 10) rating = "average"
        else if (variance <= 49) rating = "above"
        else rating = "critical"
      }
      
      // Check if units match for confidence
      const unitsMatch = matchedMaterial ? normalizeUnit(matchedMaterial.unit || '') === itemUnit : false
      
      return {
        id: item.id,
        originalName: item.materialName,
        matchedName: matchedMaterial?.name || null,
        referenceMinPrice: matchedMaterial?.price || null,
        referenceMaxPrice: matchedMaterial?.priceMax || null,
        referenceAvgPrice,
        variance,
        rating,
        matchConfidence: matchedMaterial ? (unitsMatch ? 85 + Math.random() * 15 : 60 + Math.random() * 20) : 0,
        matchDetails: matchedMaterial 
          ? `${matchedMaterial.category}${!unitsMatch && matchedMaterial.unit ? ` (Unidade ref: ${matchedMaterial.unit})` : ''}`
          : undefined
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
  
  // Handle individual item AI analysis
  const handleAnalyzeItem = async (budgetId: string, item: any) => {
    const itemKey = `${budgetId}-${item.id}`
    setAnalyzingItemId(itemKey)
    
    try {
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Find matching materials
      const matchedMaterials = materials
        .filter(m => 
          m.name.toLowerCase().includes(item.materialName.toLowerCase().split(' ')[0]) ||
          item.materialName.toLowerCase().includes(m.name.toLowerCase().split(' ')[0])
        )
        .slice(0, 5)
        .map(m => ({
          name: m.name,
          price: m.price,
          priceMax: m.priceMax,
          category: m.category,
          confidence: 70 + Math.random() * 30
        }))
      
      const referencePrice = matchedMaterials.length > 0 
        ? matchedMaterials.reduce((sum, m) => sum + m.price, 0) / matchedMaterials.length
        : null
      
      const variance = referencePrice 
        ? ((item.unitPrice - referencePrice) / referencePrice) * 100
        : null
      
      // Generate recommendation
      let recommendation = ""
      if (variance === null) {
        recommendation = "Nao foi possivel encontrar referencias de mercado para este item. Considere adicionar manualmente a base de dados."
      } else if (variance < -20) {
        recommendation = `Preco ${Math.abs(variance).toFixed(0)}% abaixo do mercado. Verifique a qualidade e especificacoes do material.`
      } else if (variance < 10) {
        recommendation = "Preco dentro da media de mercado. Valor adequado."
      } else if (variance < 50) {
        recommendation = `Preco ${variance.toFixed(0)}% acima do mercado. Considere renegociar com o fornecedor.`
      } else {
        recommendation = `ALERTA: Preco ${variance.toFixed(0)}% acima do mercado! Recomendamos fortemente renegociacao ou alternativas.`
      }
      
      setItemAnalysisResult({
        budgetId,
        itemId: item.id,
        originalName: item.materialName,
        matchedMaterials,
        referencePrice,
        variance,
        recommendation
      })
    } catch (error) {
      console.error("[v0] Item analysis error:", error)
      toast.error("Erro ao analisar item")
    } finally {
      setAnalyzingItemId(null)
    }
  }
  
  // Handle item update
  const handleUpdateItem = (budgetId: string, itemIndex: number, updates: Partial<any>) => {
    const budget = budgets.find(b => b.id === budgetId)
    if (!budget) return
    
    const updatedItems = budget.items.map((item, idx) => 
      idx === itemIndex ? { ...item, ...updates } : item
    )
    
    updateBudget(budgetId, { items: updatedItems })
    toast.success("Item atualizado com sucesso!")
    setEditingItem(null)
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
      <div className="space-y-4 animate-fade-in-up overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Meus Orcamentos</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Submeta orcamentos para aprovacao.</p>
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
    <div className="space-y-4 animate-fade-in-up overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Aprovacoes</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Gerir orcamentos e registos pendentes.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {pendingBudgets.length > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 gap-1 px-2 py-0.5 text-[10px]">
              <Calculator className="h-3 w-3" />
              {pendingBudgets.length} orc.
            </Badge>
          )}
          {pendingRegCount > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 gap-1 px-2 py-0.5 text-[10px]">
              <User className="h-3 w-3" />
              {pendingRegCount} reg.
            </Badge>
          )}
        </div>
      </div>

      {/* Main Tabs: Budgets vs Users */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-sm h-auto">
          <TabsTrigger value="budgets" className="gap-1 text-xs py-1.5 px-2">
            <Calculator className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">Orcamentos</span>
            {pendingBudgets.length > 0 && (
              <Badge className="ml-1 bg-yellow-500/20 text-yellow-500 text-[10px]">{pendingBudgets.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1 text-xs py-1.5 px-2">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">Utilizadores</span>
            {pendingRegCount > 0 && (
              <Badge className="ml-1 bg-yellow-500/20 text-yellow-500 text-[10px]">{pendingRegCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* BUDGETS TAB */}
        <TabsContent value="budgets" className="space-y-3">
          {/* Budget Stats - Compact inline */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
              <Clock className="h-3 w-3 inline mr-1" />{pendingBudgets.length} pend.
            </span>
            <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 border border-green-500/30">
              <CheckCircle2 className="h-3 w-3 inline mr-1" />{approvedBudgets.length} aprov.
            </span>
            <span className="px-2 py-1 rounded bg-destructive/10 text-destructive border border-destructive/30">
              <XCircle className="h-3 w-3 inline mr-1" />{rejectedBudgets.length} rej.
            </span>
          </div>

          {/* Budget List */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm">Orcamentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-3 pb-3">
              {budgets.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum orcamento submetido.</p>
                </div>
              ) : (
                <Tabs defaultValue="pendente" className="space-y-2">
                  <TabsList className="flex-wrap h-auto gap-0.5 p-1">
                    <TabsTrigger value="pendente" className="text-[10px] px-2 py-1">Pend. ({pendingBudgets.length})</TabsTrigger>
                    <TabsTrigger value="aprovado" className="text-[10px] px-2 py-1">Aprov. ({approvedBudgets.length})</TabsTrigger>
                    <TabsTrigger value="rejeitado" className="text-[10px] px-2 py-1">Rej. ({rejectedBudgets.length})</TabsTrigger>
                    <TabsTrigger value="todos" className="text-[10px] px-2 py-1">Todos ({budgets.length})</TabsTrigger>
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
                                <CardContent className="border-t bg-muted/30 space-y-3 px-2 sm:px-4 py-3 overflow-hidden">
                                  {/* ========== COMPACT SUMMARY ROW ========== */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2 rounded-lg bg-card border text-center">
                                      <p className="text-base font-bold">{totalValue.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}</p>
                                      <p className="text-[10px] text-muted-foreground">Total Orc.</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
                                      <p className="text-base font-bold text-primary">
                                        {(budget.totalReference || totalValue / (1 + (budget.analysisVariance || 0) / 100)).toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">Ref. Mercado</p>
                                    </div>
                                    <div className={cn("p-2 rounded-lg border text-center",
                                      (budget.analysisVariance || 0) > 10 ? "bg-destructive/10 border-destructive/30" : 
                                      (budget.analysisVariance || 0) < -10 ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"
                                    )}>
                                      <p className={cn("text-base font-bold",
                                        (budget.analysisVariance || 0) > 10 ? "text-destructive" : 
                                        (budget.analysisVariance || 0) < -10 ? "text-green-500" : "text-yellow-500"
                                      )}>
                                        {(budget.analysisVariance || 0) > 0 ? "+" : ""}{(budget.analysisVariance || 0).toFixed(1)}%
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">Variacao</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-card border text-center">
                                      <p className="text-base font-bold">{budget.qualityScore || 0}/100</p>
                                      <p className="text-[10px] text-muted-foreground">Qualidade</p>
                                    </div>
                                  </div>

                                  {/* ========== COMPACT STATS ROW ========== */}
                                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                      {budget.analysisStats?.matchRate?.toFixed(0) || 0}% corresp.
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500">
                                      {(budget.analysisStats?.potentialSavings || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })} poupanca
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                                      {budget.analysisStats?.riskItems || 0} risco
                                    </span>
                                  </div>

                                  {/* ========== ITEM DISTRIBUTION BAR ========== */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                                      <span>Distribuicao: {budget.analysisStats?.belowAverage || 0} abaixo, {budget.analysisStats?.average || 0} media, {budget.analysisStats?.aboveAverage || 0} acima, {budget.analysisStats?.critical || 0} critico, {budget.analysisStats?.unknown || 0} s/ref</span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden flex bg-muted">
                                      {(budget.analysisStats?.belowAverage || 0) > 0 && (
                                        <div className="bg-green-500 h-full" style={{ width: `${((budget.analysisStats?.belowAverage || 0) / Math.max(budget.items.length, 1)) * 100}%` }} title="Abaixo da media" />
                                      )}
                                      {(budget.analysisStats?.average || 0) > 0 && (
                                        <div className="bg-yellow-500 h-full" style={{ width: `${((budget.analysisStats?.average || 0) / Math.max(budget.items.length, 1)) * 100}%` }} title="Na media" />
                                      )}
                                      {(budget.analysisStats?.aboveAverage || 0) > 0 && (
                                        <div className="bg-orange-500 h-full" style={{ width: `${((budget.analysisStats?.aboveAverage || 0) / Math.max(budget.items.length, 1)) * 100}%` }} title="Acima da media" />
                                      )}
                                      {(budget.analysisStats?.critical || 0) > 0 && (
                                        <div className="bg-red-500 h-full" style={{ width: `${((budget.analysisStats?.critical || 0) / Math.max(budget.items.length, 1)) * 100}%` }} title="Critico" />
                                      )}
                                      {(budget.analysisStats?.unknown || 0) > 0 && (
                                        <div className="bg-gray-400 h-full" style={{ width: `${((budget.analysisStats?.unknown || 0) / Math.max(budget.items.length, 1)) * 100}%` }} title="Sem referencia" />
                                      )}
                                    </div>
                                  </div>

                                  {/* ========== HIGH VARIANCE WARNING (Compact) ========== */}
                                  {(() => {
                                    const highVarianceItems = budget.itemAnalysis?.filter(i => i.variance !== null && Math.abs(i.variance) > 65) || []
                                    if (highVarianceItems.length === 0) return null
                                    
                                    return (
                                      <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
                                        <div className="flex items-center gap-2 text-destructive font-medium">
                                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                          <span>{highVarianceItems.length} itens com variacao {">"}65%</span>
                                        </div>
                                      </div>
                                    )
                                  })()}

                                  {/* ========== AI RECOMMENDATIONS (Compact) ========== */}
                                  {budget.recommendations && budget.recommendations.length > 0 && (
                                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                      <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                                        <Lightbulb className="h-3 w-3" /> Recomendacoes IA
                                      </p>
                                      <ul className="text-xs text-muted-foreground space-y-0.5">
                                        {budget.recommendations.slice(0, 3).map((rec, idx) => (
                                          <li key={idx} className="truncate">• {rec}</li>
                                        ))}
                                      </ul>
                                    </div>
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

                                  {/* ========== ITEMS LIST (Compact) ========== */}
                                  <div className="space-y-1.5">
                                    <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                      <FileText className="h-3 w-3" />
                                      {budget.items.length} itens
                                    </p>
                                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                                      {budget.items.map((item, idx) => {
                                        const analysis = budget.itemAnalysis?.find(a => a.id === item.id || a.originalName === item.materialName)
                                        const margin = item.adminMarginPercent || 0
                                        const baseTotal = item.quantity * item.unitPrice
                                        const totalWithMargin = baseTotal + (baseTotal * margin / 100)
                                        const rating = analysis?.rating || "unknown"
                                        const RatingIcon = ratingConfig[rating]?.icon || HelpCircle
                                        
                                        return (
                                          <div 
                                            key={idx} 
                                            className={cn(
                                              "p-2 rounded-lg border bg-card text-xs",
                                              analysis?.variance && Math.abs(analysis.variance) > 65 && "border-destructive/50 bg-destructive/5"
                                            )}
                                          >
                                            {/* Row 1: Name + Badge + Actions */}
                                            <div className="flex items-center justify-between gap-1 mb-1.5">
                                              <p className="font-medium truncate flex-1 text-sm" title={item.materialName}>{item.materialName}</p>
                                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                                <Badge className={cn("text-[9px] px-1 py-0", ratingConfig[rating]?.bg, ratingConfig[rating]?.color)}>
                                                  {ratingConfig[rating]?.shortLabel}
                                                </Badge>
                                                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => setEditingItem({ budgetId: budget.id, itemIndex: idx, item })}>
                                                  <Pencil className="h-2.5 w-2.5" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-primary" onClick={() => handleAnalyzeItem(budget.id, item)} disabled={analyzingItemId === `${budget.id}-${item.id}`}>
                                                  {analyzingItemId === `${budget.id}-${item.id}` ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                                                </Button>
                                              </div>
                                            </div>
                                            
                                            {/* Row 2: Compact price info */}
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                              <span>{item.quantity} {item.unit} × €{item.unitPrice.toFixed(2)}</span>
                                              <span>Ref: {analysis?.referenceAvgPrice ? `€${analysis.referenceAvgPrice.toFixed(2)}` : "-"}</span>
                                              <span className={cn("font-medium", ratingConfig[rating]?.color)}>
                                                {analysis?.variance !== null && analysis?.variance !== undefined ? `${analysis.variance > 0 ? "+" : ""}${analysis.variance.toFixed(0)}%` : "-"}
                                              </span>
                                              <span className="font-medium text-primary">€{totalWithMargin.toFixed(2)}</span>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                  
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
      
      {/* Item Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Item
            </DialogTitle>
            <DialogDescription>
              Atualize os dados do item do orcamento.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleUpdateItem(editingItem.budgetId, editingItem.itemIndex, {
                  materialName: formData.get("materialName") as string,
                  quantity: parseFloat(formData.get("quantity") as string) || 1,
                  unit: formData.get("unit") as string,
                  unitPrice: parseFloat(formData.get("unitPrice") as string) || 0,
                  category: formData.get("category") as string,
                })
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="materialName">Nome do Material/Servico</Label>
                <Input
                  id="materialName"
                  name="materialName"
                  defaultValue={editingItem.item.materialName}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editingItem.item.quantity}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade</Label>
                  <Input
                    id="unit"
                    name="unit"
                    defaultValue={editingItem.item.unit}
                    placeholder="un, m2, kg..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Preco Unitario (EUR)</Label>
                  <Input
                    id="unitPrice"
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editingItem.item.unitPrice}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    name="category"
                    defaultValue={editingItem.item.category || "Geral"}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Item AI Analysis Result Dialog */}
      <Dialog open={!!itemAnalysisResult} onOpenChange={() => setItemAnalysisResult(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Analise IA do Item
            </DialogTitle>
            <DialogDescription>
              Resultados da analise de mercado para este item.
            </DialogDescription>
          </DialogHeader>
          {itemAnalysisResult && (
            <div className="space-y-3">
              {/* Item Name */}
              <div className="p-2 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Item analisado:</p>
                <p className="font-semibold text-sm">{itemAnalysisResult.originalName}</p>
              </div>
              
              {/* Variance Summary */}
              <div className="grid grid-cols-2 gap-2">
                <Card className={cn(
                  "p-3",
                  itemAnalysisResult.variance === null ? "bg-muted" :
                  itemAnalysisResult.variance < -10 ? "bg-green-500/10 border-green-500/30" :
                  itemAnalysisResult.variance < 10 ? "bg-yellow-500/10 border-yellow-500/30" :
                  itemAnalysisResult.variance < 50 ? "bg-orange-500/10 border-orange-500/30" :
                  "bg-destructive/10 border-destructive/30"
                )}>
                  <p className="text-[10px] text-muted-foreground mb-1">Variacao vs Mercado</p>
                  <p className={cn("text-xl font-bold",
                    itemAnalysisResult.variance === null ? "text-muted-foreground" :
                    itemAnalysisResult.variance < -10 ? "text-green-500" :
                    itemAnalysisResult.variance < 10 ? "text-yellow-500" :
                    itemAnalysisResult.variance < 50 ? "text-orange-500" :
                    "text-destructive"
                  )}>
                    {itemAnalysisResult.variance !== null 
                      ? `${itemAnalysisResult.variance > 0 ? "+" : ""}${itemAnalysisResult.variance.toFixed(1)}%`
                      : "N/A"
                    }
                  </p>
                </Card>
                <Card className="p-3 bg-primary/10 border-primary/30">
                  <p className="text-[10px] text-muted-foreground mb-1">Preco Referencia</p>
                  <p className="text-xl font-bold text-primary">
                    {itemAnalysisResult.referencePrice !== null
                      ? `€${itemAnalysisResult.referencePrice.toFixed(2)}`
                      : "Sem dados"
                    }
                  </p>
                </Card>
              </div>
              
              {/* Recommendation */}
              <Card className={cn("p-3",
                itemAnalysisResult.variance === null ? "bg-muted" :
                itemAnalysisResult.variance > 50 ? "bg-destructive/10 border-destructive/30" :
                itemAnalysisResult.variance > 10 ? "bg-orange-500/10 border-orange-500/30" :
                "bg-green-500/10 border-green-500/30"
              )}>
                <div className="flex items-start gap-2">
                  <Lightbulb className={cn("h-4 w-4 mt-0.5",
                    itemAnalysisResult.variance === null ? "text-muted-foreground" :
                    itemAnalysisResult.variance > 50 ? "text-destructive" :
                    itemAnalysisResult.variance > 10 ? "text-orange-500" :
                    "text-green-500"
                  )} />
                  <div>
                    <p className="font-medium text-xs">Recomendacao</p>
                    <p className="text-xs text-muted-foreground">{itemAnalysisResult.recommendation}</p>
                  </div>
                </div>
              </Card>
              
              {/* Matched Materials */}
              {itemAnalysisResult.matchedMaterials.length > 0 && (
                <Card>
                  <CardHeader className="pb-1 pt-2 px-3">
                    <CardTitle className="text-xs font-medium">Materiais Correspondentes</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-2">
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {itemAnalysisResult.matchedMaterials.map((mat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-1.5 bg-muted/50 rounded text-xs">
                          <div>
                            <p className="font-medium">{mat.name}</p>
                            <p className="text-[10px] text-muted-foreground">{mat.category}</p>
                          </div>
                          <p className="font-medium">€{mat.price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {itemAnalysisResult.matchedMaterials.length === 0 && (
                <Card className="p-3 bg-yellow-500/10 border-yellow-500/30">
                  <div className="flex items-center gap-2 text-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-xs">Nenhum material correspondente encontrado.</p>
                  </div>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemAnalysisResult(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
