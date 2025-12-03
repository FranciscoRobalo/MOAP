"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Save, X } from "lucide-react"

interface Material {
  id: string
  name: string
  unit: string
  price: number
  category: string
}

const categories = ["Estrutura", "Alvenaria", "Revestimentos", "Instalações", "Acabamentos", "Equipamentos"]

const initialMaterials: Material[] = [
  { id: "1", name: "Cimento Portland", unit: "kg", price: 0.15, category: "Estrutura" },
  { id: "2", name: "Tijolo Cerâmico", unit: "un", price: 0.45, category: "Alvenaria" },
  { id: "3", name: "Areia Grossa", unit: "m³", price: 45.0, category: "Estrutura" },
  { id: "4", name: "Ferro CA-50 10mm", unit: "kg", price: 4.2, category: "Estrutura" },
  { id: "5", name: "Azulejo 30x30", unit: "m²", price: 18.5, category: "Revestimentos" },
  { id: "6", name: "Tinta Acrílica", unit: "L", price: 12.0, category: "Acabamentos" },
]

export default function PricesPage() {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Material>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    name: "",
    unit: "",
    price: 0,
    category: "",
  })
  const [filterCategory, setFilterCategory] = useState<string>("all")

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
      setMaterials((prev) => prev.map((m) => (m.id === editingId ? { ...m, ...editForm } : m)))
      cancelEdit()
    }
  }

  const deleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id))
  }

  const addMaterial = () => {
    if (newMaterial.name && newMaterial.unit && newMaterial.category) {
      const material: Material = {
        id: Math.random().toString(36).substr(2, 9),
        name: newMaterial.name || "",
        unit: newMaterial.unit || "",
        price: newMaterial.price || 0,
        category: newMaterial.category || "",
      }
      setMaterials((prev) => [...prev, material])
      setNewMaterial({ name: "", unit: "", price: 0, category: "" })
      setIsAdding(false)
    }
  }

  const filteredMaterials =
    filterCategory === "all" ? materials : materials.filter((m) => m.category === filterCategory)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Preços de Materiais</h1>
          <p className="text-muted-foreground">Gerir preços de referência para análise de orçamentos.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Material
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Filtrar por categoria:</label>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48 bg-input/50">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((cat) => (
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
            <CardTitle className="text-lg">Novo Material</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Input
                placeholder="Nome do material"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-input/50"
              />
              <Input
                placeholder="Unidade (kg, m², un)"
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
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button onClick={addMaterial} className="flex-1">
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

      {/* Materials Table */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Lista de Materiais</CardTitle>
          <CardDescription>{filteredMaterials.length} materiais encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Material</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Unidade</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Preço</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Categoria</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMaterials.map((material) => (
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
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button size="icon" variant="ghost" onClick={() => startEdit(material)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteMaterial(material.id)}>
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
    </div>
  )
}
