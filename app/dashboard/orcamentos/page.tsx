"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Save, FileText, Calculator, Copy, Download, X, ChevronDown, ChevronUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface BudgetItem {
  id: string
  materialId: string
  materialName: string
  unit: string
  quantity: number
  unitPrice: number
  category: string
}

interface Budget {
  id: string
  name: string
  obraName: string
  createdDate: string
  status: "rascunho" | "finalizado" | "enviado"
  items: BudgetItem[]
}

const availableMaterials = [
  { id: "1", name: "Cimento Portland", unit: "kg", price: 0.15, category: "Estrutura" },
  { id: "2", name: "Tijolo Cerâmico", unit: "un", price: 0.45, category: "Alvenaria" },
  { id: "3", name: "Areia Grossa", unit: "m³", price: 45.0, category: "Estrutura" },
  { id: "4", name: "Ferro CA-50 10mm", unit: "kg", price: 4.2, category: "Estrutura" },
  { id: "5", name: "Azulejo 30x30", unit: "m²", price: 18.5, category: "Revestimentos" },
  { id: "6", name: "Tinta Acrílica", unit: "L", price: 12.0, category: "Acabamentos" },
  { id: "7", name: "Betão C25/30", unit: "m³", price: 85.0, category: "Estrutura" },
  { id: "8", name: "Tubo PVC 110mm", unit: "m", price: 8.5, category: "Instalações" },
  { id: "9", name: "Cabo Elétrico 2.5mm", unit: "m", price: 1.2, category: "Instalações" },
  { id: "10", name: "Porta Interior", unit: "un", price: 120.0, category: "Acabamentos" },
]

const mockBudgets: Budget[] = [
  {
    id: "1",
    name: "Orçamento Inicial",
    obraName: "Edifício Residencial Sol Nascente",
    createdDate: "2024-01-20",
    status: "finalizado",
    items: [
      {
        id: "1",
        materialId: "1",
        materialName: "Cimento Portland",
        unit: "kg",
        quantity: 5000,
        unitPrice: 0.15,
        category: "Estrutura",
      },
      {
        id: "2",
        materialId: "3",
        materialName: "Areia Grossa",
        unit: "m³",
        quantity: 120,
        unitPrice: 45.0,
        category: "Estrutura",
      },
      {
        id: "3",
        materialId: "4",
        materialName: "Ferro CA-50 10mm",
        unit: "kg",
        quantity: 2500,
        unitPrice: 4.2,
        category: "Estrutura",
      },
    ],
  },
  {
    id: "2",
    name: "Revisão Março",
    obraName: "Renovação Hotel Mar Azul",
    createdDate: "2024-01-25",
    status: "rascunho",
    items: [
      {
        id: "1",
        materialId: "5",
        materialName: "Azulejo 30x30",
        unit: "m²",
        quantity: 450,
        unitPrice: 18.5,
        category: "Revestimentos",
      },
      {
        id: "2",
        materialId: "6",
        materialName: "Tinta Acrílica",
        unit: "L",
        quantity: 200,
        unitPrice: 12.0,
        category: "Acabamentos",
      },
    ],
  },
]

const obras = [
  "Edifício Residencial Sol Nascente",
  "Renovação Hotel Mar Azul",
  "Ampliação Escola Primária",
  "Reabilitação Centro Histórico",
]

export default function OrcamentosPage() {
  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [expandedBudget, setExpandedBudget] = useState<string | null>(null)

  const [newBudget, setNewBudget] = useState({
    name: "",
    obraName: "",
  })

  const [newItem, setNewItem] = useState({
    materialId: "",
    quantity: 0,
  })

  const statusConfig = {
    rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
    finalizado: { label: "Finalizado", color: "bg-price-below text-white" },
    enviado: { label: "Enviado", color: "bg-primary text-primary-foreground" },
  }

  const calculateTotal = (items: BudgetItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const handleCreateBudget = () => {
    if (newBudget.name && newBudget.obraName) {
      const budget: Budget = {
        id: Math.random().toString(36).substr(2, 9),
        name: newBudget.name,
        obraName: newBudget.obraName,
        createdDate: new Date().toISOString().split("T")[0],
        status: "rascunho",
        items: [],
      }
      setBudgets((prev) => [...prev, budget])
      setSelectedBudget(budget)
      setNewBudget({ name: "", obraName: "" })
      setIsCreating(false)
    }
  }

  const handleAddItem = () => {
    if (selectedBudget && newItem.materialId && newItem.quantity > 0) {
      const material = availableMaterials.find((m) => m.id === newItem.materialId)
      if (material) {
        const item: BudgetItem = {
          id: Math.random().toString(36).substr(2, 9),
          materialId: material.id,
          materialName: material.name,
          unit: material.unit,
          quantity: newItem.quantity,
          unitPrice: material.price,
          category: material.category,
        }

        const updatedBudget = {
          ...selectedBudget,
          items: [...selectedBudget.items, item],
        }

        setBudgets((prev) => prev.map((b) => (b.id === selectedBudget.id ? updatedBudget : b)))
        setSelectedBudget(updatedBudget)
        setNewItem({ materialId: "", quantity: 0 })
      }
    }
  }

  const handleRemoveItem = (itemId: string) => {
    if (selectedBudget) {
      const updatedBudget = {
        ...selectedBudget,
        items: selectedBudget.items.filter((i) => i.id !== itemId),
      }
      setBudgets((prev) => prev.map((b) => (b.id === selectedBudget.id ? updatedBudget : b)))
      setSelectedBudget(updatedBudget)
    }
  }

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (selectedBudget) {
      const updatedBudget = {
        ...selectedBudget,
        items: selectedBudget.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
      }
      setBudgets((prev) => prev.map((b) => (b.id === selectedBudget.id ? updatedBudget : b)))
      setSelectedBudget(updatedBudget)
    }
  }

  const handleUpdatePrice = (itemId: string, unitPrice: number) => {
    if (selectedBudget) {
      const updatedBudget = {
        ...selectedBudget,
        items: selectedBudget.items.map((i) => (i.id === itemId ? { ...i, unitPrice } : i)),
      }
      setBudgets((prev) => prev.map((b) => (b.id === selectedBudget.id ? updatedBudget : b)))
      setSelectedBudget(updatedBudget)
    }
  }

  const handleFinalizeBudget = () => {
    if (selectedBudget) {
      const updatedBudget = { ...selectedBudget, status: "finalizado" as const }
      setBudgets((prev) => prev.map((b) => (b.id === selectedBudget.id ? updatedBudget : b)))
      setSelectedBudget(updatedBudget)
    }
  }

  const handleDuplicateBudget = (budget: Budget) => {
    const newBudgetCopy: Budget = {
      ...budget,
      id: Math.random().toString(36).substr(2, 9),
      name: `${budget.name} (Cópia)`,
      createdDate: new Date().toISOString().split("T")[0],
      status: "rascunho",
      items: budget.items.map((item) => ({ ...item, id: Math.random().toString(36).substr(2, 9) })),
    }
    setBudgets((prev) => [...prev, newBudgetCopy])
  }

  const handleDeleteBudget = (budgetId: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId))
    if (selectedBudget?.id === budgetId) {
      setSelectedBudget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground">Crie e gerencie orçamentos com base nos materiais da plataforma.</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Orçamento</DialogTitle>
              <DialogDescription>Preencha os detalhes para criar um novo orçamento.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome do Orçamento *</Label>
                <Input
                  placeholder="Ex: Orçamento Fase 1"
                  value={newBudget.name}
                  onChange={(e) => setNewBudget((p) => ({ ...p, name: e.target.value }))}
                  className="bg-input/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Obra *</Label>
                <Select value={newBudget.obraName} onValueChange={(v) => setNewBudget((p) => ({ ...p, obraName: v }))}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue placeholder="Selecione a obra" />
                  </SelectTrigger>
                  <SelectContent>
                    {obras.map((obra) => (
                      <SelectItem key={obra} value={obra}>
                        {obra}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateBudget}>Criar Orçamento</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Budget List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Orçamentos</CardTitle>
              <CardDescription>{budgets.length} orçamentos criados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {budgets.map((budget) => {
                const status = statusConfig[budget.status]
                const isExpanded = expandedBudget === budget.id

                return (
                  <div key={budget.id} className="border rounded-lg overflow-hidden">
                    <div
                      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedBudget?.id === budget.id ? "bg-primary/10 border-l-2 border-l-primary" : ""
                      }`}
                      onClick={() => setSelectedBudget(budget)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{budget.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">{budget.obraName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(budget.createdDate).toLocaleDateString("pt-PT")}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
                          <span className="text-sm font-semibold">
                            €{calculateTotal(budget.items).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{budget.items.length} itens</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedBudget(isExpanded ? null : budget.id)
                          }}
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t px-3 py-2 bg-muted/30 flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleDuplicateBudget(budget)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteBudget(budget.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}

              {budgets.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">Nenhum orçamento criado.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Budget Editor */}
        <div className="lg:col-span-2">
          {selectedBudget ? (
            <Card className="bg-card/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      {selectedBudget.name}
                    </CardTitle>
                    <CardDescription>{selectedBudget.obraName}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusConfig[selectedBudget.status].color}>
                      {statusConfig[selectedBudget.status].label}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedBudget(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Item */}
                {selectedBudget.status === "rascunho" && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-3">Adicionar Material</h4>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <Select
                          value={newItem.materialId}
                          onValueChange={(v) => setNewItem((p) => ({ ...p, materialId: v }))}
                        >
                          <SelectTrigger className="bg-input/50">
                            <SelectValue placeholder="Selecione um material" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableMaterials.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name} - €{m.price.toFixed(2)}/{m.unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Qtd"
                          value={newItem.quantity || ""}
                          onChange={(e) => setNewItem((p) => ({ ...p, quantity: Number(e.target.value) }))}
                          className="bg-input/50"
                        />
                        <Button onClick={handleAddItem}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Material</th>
                        <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Categoria</th>
                        <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Qtd</th>
                        <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Preço Unit.</th>
                        <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Total</th>
                        {selectedBudget.status === "rascunho" && (
                          <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedBudget.items.map((item) => (
                        <tr key={item.id} className="group">
                          <td className="py-3">
                            <div>
                              <p className="font-medium">{item.materialName}</p>
                              <p className="text-xs text-muted-foreground">{item.unit}</p>
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          </td>
                          <td className="py-3 text-right">
                            {selectedBudget.status === "rascunho" ? (
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(item.id, Number(e.target.value))}
                                className="w-20 h-8 text-right bg-input/50"
                              />
                            ) : (
                              item.quantity
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {selectedBudget.status === "rascunho" ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdatePrice(item.id, Number(e.target.value))}
                                className="w-24 h-8 text-right bg-input/50"
                              />
                            ) : (
                              `€${item.unitPrice.toFixed(2)}`
                            )}
                          </td>
                          <td className="py-3 text-right font-medium">
                            €{(item.quantity * item.unitPrice).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                          </td>
                          {selectedBudget.status === "rascunho" && (
                            <td className="py-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2">
                        <td colSpan={4} className="py-4 text-right font-semibold">
                          Total:
                        </td>
                        <td className="py-4 text-right text-lg font-bold text-primary">
                          €{calculateTotal(selectedBudget.items).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                        </td>
                        {selectedBudget.status === "rascunho" && <td />}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedBudget.items.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum item adicionado. Adicione materiais ao orçamento.
                  </p>
                )}

                {/* Actions */}
                {selectedBudget.status === "rascunho" && selectedBudget.items.length > 0 && (
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline">
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                    <Button onClick={handleFinalizeBudget}>
                      <FileText className="h-4 w-4 mr-2" />
                      Finalizar Orçamento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/50">
              <CardContent className="py-16 text-center">
                <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Selecione um Orçamento</h3>
                <p className="text-muted-foreground">
                  Escolha um orçamento da lista ou crie um novo para começar a editar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
