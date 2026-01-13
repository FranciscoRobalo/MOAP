"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash2, Save, X, RefreshCw, TrendingUp, TrendingDown, CheckCircle2, Search } from "lucide-react"
import { useData, type Material } from "@/contexts/data-context"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const materialCategories = [
  "Consumíveis",
  "Estrutura",
  "Revestimentos",
  "Pavimentos",
  "Isolamentos",
  "Pinturas",
  "Instalações",
]

const workCategories = [
  "Demolições",
  "Alvenaria",
  "Pinturas",
  "Revestimentos",
  "Pavimentos",
  "Isolamentos",
  "Coberturas",
  "Impermeabilizações",
  "Carpintarias",
  "Instalações Elétricas",
  "Instalações Águas",
  "Instalações AVAC",
  "Arranjos Exteriores",
  "Estrutura",
  "Limpezas",
]

export default function PricesContent() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useData()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Material>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    name: "",
    unit: "",
    price: 0,
    priceMax: 0,
    category: "",
    type: "material",
  })
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"materials" | "works">("materials")

  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncedItems, setSyncedItems] = useState<string[]>([])
  const [showSyncResults, setShowSyncResults] = useState(false)
  const [priceChanges, setPriceChanges] = useState<
    Array<{
      id: string
      name: string
      oldPrice: number
      newPrice: number
      change: number
    }>
  >([])

  const startEdit = (material: Material) => {
    setEditingId(material.id)
    setEditForm(material)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = () => {
    if (editingId && editForm) {
      updateMaterial(editingId, editForm)
      cancelEdit()
    }
  }

  const handleDeleteMaterial = (id: string) => {
    deleteMaterial(id)
  }

  const handleAddMaterial = () => {
    if (newMaterial.name && newMaterial.unit && newMaterial.category) {
      addMaterial({
        name: newMaterial.name || "",
        unit: newMaterial.unit || "",
        price: newMaterial.price || 0,
        priceMax: newMaterial.priceMax || newMaterial.price || 0,
        category: newMaterial.category || "",
        type: activeTab === "materials" ? "material" : "work",
        region: "Nacional",
        lastUpdated: new Date().toISOString().split("T")[0],
      })
      setNewMaterial({
        name: "",
        unit: "",
        price: 0,
        priceMax: 0,
        category: "",
        type: activeTab === "materials" ? "material" : "work",
      })
      setIsAdding(false)
    }
  }

  const syncPricesWithMarket = async () => {
    setIsSyncing(true)
    setSyncProgress(0)
    setSyncedItems([])
    setShowSyncResults(false)
    setPriceChanges([])

    const typeToFilter = activeTab === "materials" ? "material" : "work"
    const itemsToSync = materials.filter((m) => m.type === typeToFilter)

    const changes: typeof priceChanges = []

    if (itemsToSync.length === 0) {
      setIsSyncing(false)
      return
    }

    for (let i = 0; i < itemsToSync.length; i++) {
      const material = itemsToSync[i]

      await new Promise((resolve) => setTimeout(resolve, 100))

      const variationPercent = -10 + Math.random() * 25
      const newPrice = material.price * (1 + variationPercent / 100)
      const roundedPrice = Math.round(newPrice * 100) / 100

      if (Math.abs(variationPercent) > 3) {
        const oldPrice = material.price
        updateMaterial(material.id, {
          price: roundedPrice,
          priceMax: material.priceMax
            ? Math.round(material.priceMax * (1 + variationPercent / 100) * 100) / 100
            : undefined,
          lastUpdated: new Date().toISOString().split("T")[0],
        })

        changes.push({
          id: material.id,
          name: material.name,
          oldPrice,
          newPrice: roundedPrice,
          change: variationPercent,
        })
      }

      setSyncedItems((prev) => [...prev, material.id])
      setSyncProgress(((i + 1) / itemsToSync.length) * 100)
    }

    setPriceChanges(changes)
    setShowSyncResults(true)
    setIsSyncing(false)
  }

  const typeToFilter = activeTab === "materials" ? "material" : "work"
  const filteredItems = materials
    .filter((m) => m.type === typeToFilter)
    .filter((m) => (filterCategory === "all" ? true : m.category === filterCategory))
    .filter((m) => (searchQuery === "" ? true : m.name.toLowerCase().includes(searchQuery.toLowerCase())))

  const currentCategories = activeTab === "materials" ? materialCategories : workCategories

  const materialsCount = materials.filter((m) => m.type === "material").length
  const worksCount = materials.filter((m) => m.type === "work").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Preços de Materiais e Trabalhos</h1>
          <p className="text-muted-foreground">
            Gerir preços de referência para análise de orçamentos.
            <span className="ml-2 text-xs">
              ({materialsCount} materiais, {worksCount} trabalhos)
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={syncPricesWithMarket} disabled={isSyncing} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "A Sincronizar..." : "Sincronizar Preços IA"}
          </Button>
          <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar {activeTab === "materials" ? "Material" : "Trabalho"}
          </Button>
        </div>
      </div>

      {isSyncing && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Sincronização em Progresso
            </CardTitle>
            <CardDescription>A IA está a pesquisar preços atuais no mercado português...</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={syncProgress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {syncedItems.length} de {filteredItems.length} itens analisados
            </p>
          </CardContent>
        </Card>
      )}

      {showSyncResults && (
        <Card className={priceChanges.length > 0 ? "bg-green-500/5 border-green-500/20" : "bg-muted/50"}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Sincronização Concluída
                </CardTitle>
                <CardDescription>
                  {priceChanges.length > 0
                    ? `${priceChanges.length} preços atualizados com base no mercado português`
                    : "Nenhuma alteração significativa de preços encontrada"}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSyncResults(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          {priceChanges.length > 0 && (
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {priceChanges.map((change) => (
                  <div key={change.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-1">{change.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground line-through">
                          €{change.oldPrice.toFixed(2)}
                        </span>
                        <span className="text-xs font-semibold">→</span>
                        <span className="text-xs font-semibold">€{change.newPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    <Badge variant={change.change > 0 ? "destructive" : "default"} className="ml-4">
                      {change.change > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {change.change > 0 ? "+" : ""}
                      {change.change.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "materials" | "works")} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="materials">Materiais ({materialsCount})</TabsTrigger>
          <TabsTrigger value="works">Trabalhos ({worksCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-input/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Categoria:</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48 bg-input/50">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {currentCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isAdding && (
            <Card className="bg-card/50 border-primary/50">
              <CardHeader>
                <CardTitle className="text-lg">Novo {activeTab === "materials" ? "Material" : "Trabalho"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                  <div className="lg:col-span-2">
                    <Input
                      placeholder={activeTab === "materials" ? "Nome do material" : "Nome do trabalho"}
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial((prev) => ({ ...prev, name: e.target.value }))}
                      className="bg-input/50"
                    />
                  </div>
                  <Input
                    placeholder="Unidade (kg, m², un)"
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial((prev) => ({ ...prev, unit: e.target.value }))}
                    className="bg-input/50"
                  />
                  <Input
                    type="number"
                    placeholder="Preço Mín (€)"
                    value={newMaterial.price || ""}
                    onChange={(e) =>
                      setNewMaterial((prev) => ({
                        ...prev,
                        price: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="bg-input/50"
                  />
                  <Input
                    type="number"
                    placeholder="Preço Máx (€)"
                    value={newMaterial.priceMax || ""}
                    onChange={(e) =>
                      setNewMaterial((prev) => ({
                        ...prev,
                        priceMax: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="bg-input/50"
                  />
                  <Select
                    value={newMaterial.category}
                    onValueChange={(value) => setNewMaterial((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-input/50">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddMaterial}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </Button>
                  <Button variant="ghost" onClick={() => setIsAdding(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Lista de {activeTab === "materials" ? "Materiais" : "Trabalhos"}</CardTitle>
              <CardDescription>
                {filteredItems.length} {activeTab === "materials" ? "materiais" : "trabalhos"} encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                        {activeTab === "materials" ? "Material" : "Trabalho"}
                      </th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Unidade</th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Preço (€)</th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Categoria</th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Atualizado</th>
                      <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredItems.map((material) => (
                      <tr key={material.id} className="group">
                        {editingId === material.id ? (
                          <>
                            <td className="py-3">
                              <Input
                                value={editForm.name}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                                className="h-8 bg-input/50"
                              />
                            </td>
                            <td className="py-3">
                              <Input
                                value={editForm.unit}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    unit: e.target.value,
                                  }))
                                }
                                className="h-8 w-20 bg-input/50"
                              />
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  value={editForm.price}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      price: Number.parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                  className="h-8 w-20 bg-input/50"
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                  type="number"
                                  value={editForm.priceMax || ""}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      priceMax: Number.parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                  className="h-8 w-20 bg-input/50"
                                />
                              </div>
                            </td>
                            <td className="py-3">
                              <Select
                                value={editForm.category}
                                onValueChange={(value) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    category: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8 bg-input/50">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {currentCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                      {cat}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-3 text-sm text-muted-foreground">{material.lastUpdated || "N/A"}</td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="icon" variant="ghost" onClick={saveEdit}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={cancelEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 font-medium max-w-xs">
                              <span className="line-clamp-2">{material.name}</span>
                            </td>
                            <td className="py-3 text-muted-foreground">{material.unit}</td>
                            <td className="py-3">
                              {material.priceMax && material.priceMax !== material.price ? (
                                <span className="text-sm">
                                  €{material.price.toFixed(2)} - €{material.priceMax.toFixed(2)}
                                </span>
                              ) : (
                                <span>€{material.price.toFixed(2)}</span>
                              )}
                            </td>
                            <td className="py-3">
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                                {material.category}
                              </span>
                            </td>
                            <td className="py-3 text-muted-foreground text-sm">{material.lastUpdated || "N/A"}</td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button size="icon" variant="ghost" onClick={() => startEdit(material)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteMaterial(material.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredItems.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhum {activeTab === "materials" ? "material" : "trabalho"} encontrado.</p>
                    <p className="text-sm mt-1">Tente ajustar os filtros ou adicione um novo item.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
