"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash2, Save, X } from "lucide-react"
import { useData, type Material } from "@/contexts/data-context"

const materialCategories = [
  "Estrutura",
  "Alvenaria",
  "Revestimentos",
  "Pavimentos",
  "Isolamentos",
  "Pinturas",
  "Instalações",
  "Carpintarias",
  "Caixilharias",
  "Loiças",
  "Equipamentos",
  "Tetos",
]

const workCategories = [
  "Demolições",
  "Estaleiro",
  "Estrutura",
  "Alvenaria",
  "Revestimentos",
  "Pavimentos",
  "Isolamentos",
  "Coberturas",
  "Impermeabilizações",
  "Carpintarias",
  "Caixilharias",
  "Pinturas",
  "Instalações Elétricas",
  "Instalações Águas",
  "Instalações Esgotos",
  "Instalações AVAC",
  "Equipamentos",
  "Arranjos Exteriores",
  "Limpezas",
]

export default function PricesPage() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useData()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Material>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    name: "",
    unit: "",
    price: 0,
    category: "",
    type: "material",
  })
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<"materials" | "works">("materials")

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
        category: newMaterial.category || "",
        type: activeTab === "materials" ? "material" : "work",
        region: "Nacional",
        lastUpdated: new Date().toISOString().split("T")[0],
      })
      setNewMaterial({
        name: "",
        unit: "",
        price: 0,
        category: "",
        type: activeTab === "materials" ? "material" : "work",
      })
      setIsAdding(false)
    }
  }

  const filteredItems = materials
    .filter((m) => m.type === activeTab.slice(0, -1)) // 'materials' -> 'material', 'works' -> 'work'
    .filter((m) => (filterCategory === "all" ? true : m.category === filterCategory))

  const currentCategories = activeTab === "materials" ? materialCategories : workCategories

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Preços de Materiais e Trabalhos</h1>
          <p className="text-muted-foreground">Gerir preços de referência para análise de orçamentos.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar {activeTab === "materials" ? "Material" : "Trabalho"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "materials" | "works")} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="materials">Materiais</TabsTrigger>
          <TabsTrigger value="works">Trabalhos</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filtrar por categoria:</label>
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

          {/* Add Form */}
          {isAdding && (
            <Card className="bg-card/50 border-primary/50">
              <CardHeader>
                <CardTitle className="text-lg">Novo {activeTab === "materials" ? "Material" : "Trabalho"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <Input
                    placeholder={activeTab === "materials" ? "Nome do material" : "Nome do trabalho"}
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-input/50"
                  />
                  <Input
                    placeholder="Unidade (kg, m², un, vg)"
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial((prev) => ({ ...prev, unit: e.target.value }))}
                    className="bg-input/50"
                  />
                  <Input
                    type="number"
                    placeholder="Preço (€)"
                    value={newMaterial.price || ""}
                    onChange={(e) =>
                      setNewMaterial((prev) => ({
                        ...prev,
                        price: Number.parseFloat(e.target.value) || 0,
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
                  <div className="flex gap-2">
                    <Button onClick={handleAddMaterial} className="flex-1">
                      <Save className="mr-2 h-4 w-4" />
                      Guardar
                    </Button>
                    <Button variant="ghost" onClick={() => setIsAdding(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items Table */}
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
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Preço</th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Categoria</th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Região</th>
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
                                className="h-8 w-24 bg-input/50"
                              />
                            </td>
                            <td className="py-3">
                              <Input
                                type="number"
                                value={editForm.price}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    price: Number.parseFloat(e.target.value) || 0,
                                  }))
                                }
                                className="h-8 w-24 bg-input/50"
                              />
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
                            <td className="py-3">
                              <Input
                                value={editForm.region || ""}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    region: e.target.value,
                                  }))
                                }
                                className="h-8 w-32 bg-input/50"
                              />
                            </td>
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
                            <td className="py-3 font-medium">{material.name}</td>
                            <td className="py-3 text-muted-foreground">{material.unit}</td>
                            <td className="py-3">€{material.price.toFixed(2)}</td>
                            <td className="py-3">
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                                {material.category}
                              </span>
                            </td>
                            <td className="py-3 text-muted-foreground text-sm">{material.region || "N/A"}</td>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
