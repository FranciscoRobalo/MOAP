"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, FileSpreadsheet, FileText, CheckCircle, AlertCircle, Plus, Trash2 } from "lucide-react"

interface ExtractedMaterial {
  id: string
  name: string
  unit: string
  quantity: number
  unitPrice: number
  category: string
  selected: boolean
  status: "novo" | "existente" | "atualizar"
}

interface ImportedDocument {
  id: string
  fileName: string
  uploadDate: string
  status: "processando" | "concluido" | "erro"
  materialsCount: number
  materials: ExtractedMaterial[]
}

const mockDocuments: ImportedDocument[] = [
  {
    id: "1",
    fileName: "Orçamento_Fornecedor_A.xlsx",
    uploadDate: "2024-01-28",
    status: "concluido",
    materialsCount: 8,
    materials: [
      {
        id: "1",
        name: "Cimento Portland CP-II",
        unit: "kg",
        quantity: 5000,
        unitPrice: 0.18,
        category: "Estrutura",
        selected: true,
        status: "atualizar",
      },
      {
        id: "2",
        name: "Brita 1",
        unit: "m³",
        quantity: 50,
        unitPrice: 55.0,
        category: "Estrutura",
        selected: true,
        status: "novo",
      },
      {
        id: "3",
        name: "Areia Fina",
        unit: "m³",
        quantity: 30,
        unitPrice: 42.0,
        category: "Estrutura",
        selected: true,
        status: "novo",
      },
      {
        id: "4",
        name: "Tijolo Cerâmico 9x19x29",
        unit: "un",
        quantity: 10000,
        unitPrice: 0.52,
        category: "Alvenaria",
        selected: false,
        status: "existente",
      },
    ],
  },
  {
    id: "2",
    fileName: "Lista_Precos_Fornecedor_B.pdf",
    uploadDate: "2024-01-25",
    status: "concluido",
    materialsCount: 12,
    materials: [
      {
        id: "5",
        name: "Piso Cerâmico 60x60",
        unit: "m²",
        quantity: 500,
        unitPrice: 28.5,
        category: "Revestimentos",
        selected: true,
        status: "novo",
      },
      {
        id: "6",
        name: "Argamassa Colante AC-III",
        unit: "kg",
        quantity: 200,
        unitPrice: 1.8,
        category: "Revestimentos",
        selected: true,
        status: "novo",
      },
    ],
  },
]

export default function ImportarPage() {
  const [documents, setDocuments] = useState<ImportedDocument[]>(mockDocuments)
  const [selectedDocument, setSelectedDocument] = useState<ImportedDocument | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Simulate file upload
    simulateUpload("Documento_Importado.xlsx")
  }, [])

  const simulateUpload = (fileName: string) => {
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 0
        if (prev >= 100) {
          clearInterval(interval)
          // Add new document
          const newDoc: ImportedDocument = {
            id: Math.random().toString(36).substr(2, 9),
            fileName,
            uploadDate: new Date().toISOString().split("T")[0],
            status: "processando",
            materialsCount: 0,
            materials: [],
          }
          setDocuments((prev) => [newDoc, ...prev])

          // Simulate processing
          setTimeout(() => {
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === newDoc.id
                  ? {
                      ...d,
                      status: "concluido" as const,
                      materialsCount: 5,
                      materials: [
                        {
                          id: "new1",
                          name: "Material Importado 1",
                          unit: "un",
                          quantity: 100,
                          unitPrice: 15.0,
                          category: "Geral",
                          selected: true,
                          status: "novo" as const,
                        },
                        {
                          id: "new2",
                          name: "Material Importado 2",
                          unit: "m²",
                          quantity: 50,
                          unitPrice: 25.0,
                          category: "Revestimentos",
                          selected: true,
                          status: "novo" as const,
                        },
                      ],
                    }
                  : d,
              ),
            )
          }, 2000)

          setUploadProgress(null)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const toggleMaterialSelection = (docId: string, materialId: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              materials: d.materials.map((m) => (m.id === materialId ? { ...m, selected: !m.selected } : m)),
            }
          : d,
      ),
    )
    if (selectedDocument?.id === docId) {
      setSelectedDocument((prev) =>
        prev
          ? {
              ...prev,
              materials: prev.materials.map((m) => (m.id === materialId ? { ...m, selected: !m.selected } : m)),
            }
          : null,
      )
    }
  }

  const updateMaterialPrice = (docId: string, materialId: string, price: number) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              materials: d.materials.map((m) => (m.id === materialId ? { ...m, unitPrice: price } : m)),
            }
          : d,
      ),
    )
    if (selectedDocument?.id === docId) {
      setSelectedDocument((prev) =>
        prev
          ? {
              ...prev,
              materials: prev.materials.map((m) => (m.id === materialId ? { ...m, unitPrice: price } : m)),
            }
          : null,
      )
    }
  }

  const handleAddToMaterials = () => {
    if (selectedDocument) {
      const selectedMaterials = selectedDocument.materials.filter((m) => m.selected)
      alert(`${selectedMaterials.length} materiais adicionados à lista de preços!`)
    }
  }

  const statusConfig = {
    processando: { label: "A Processar", color: "bg-price-average text-white", icon: AlertCircle },
    concluido: { label: "Concluído", color: "bg-price-below text-white", icon: CheckCircle },
    erro: { label: "Erro", color: "bg-price-critical text-white", icon: AlertCircle },
  }

  const materialStatusConfig = {
    novo: { label: "Novo", color: "bg-price-below/20 text-price-below" },
    existente: { label: "Existente", color: "bg-muted text-muted-foreground" },
    atualizar: { label: "Atualizar", color: "bg-price-average/20 text-price-average" },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar Documentos</h1>
        <p className="text-muted-foreground">
          Carregue orçamentos e extraia automaticamente os materiais para adicionar à lista de preços.
        </p>
      </div>

      {/* Upload Area */}
      <Card
        className={`bg-card/50 border-2 border-dashed transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Carregar Documento</h3>
            <p className="text-muted-foreground mb-4">
              Arraste e solte ficheiros PDF, Excel ou CSV com orçamentos de fornecedores
            </p>

            {uploadProgress !== null ? (
              <div className="w-full max-w-xs">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">A processar... {uploadProgress}%</p>
              </div>
            ) : (
              <Button onClick={() => simulateUpload("Documento_Manual.xlsx")}>
                <Upload className="mr-2 h-4 w-4" />
                Selecionar Ficheiro
              </Button>
            )}

            <p className="text-xs text-muted-foreground mt-4">Suportados: PDF, XLSX, XLS, CSV (máx. 10MB)</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Documents List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Documentos Importados</CardTitle>
              <CardDescription>{documents.length} documentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {documents.map((doc) => {
                const status = statusConfig[doc.status]
                const StatusIcon = status.icon

                return (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedDocument?.id === doc.id ? "bg-primary/10 border-primary" : "border-border/50"
                    }`}
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {doc.fileName.endsWith(".pdf") ? (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.uploadDate).toLocaleDateString("pt-PT")}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`${status.color} text-xs`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          {doc.status === "concluido" && (
                            <span className="text-xs text-muted-foreground">{doc.materialsCount} materiais</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {documents.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">Nenhum documento importado.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Materials Extraction */}
        <div className="lg:col-span-2">
          {selectedDocument ? (
            <Card className="bg-card/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      {selectedDocument.fileName}
                    </CardTitle>
                    <CardDescription>
                      Materiais extraídos do documento - selecione os que deseja adicionar
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedDocument(null)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDocument.status === "processando" ? (
                  <div className="py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">A extrair materiais do documento...</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="pb-3 text-left w-8">
                              <Checkbox
                                checked={selectedDocument.materials.every((m) => m.selected)}
                                onCheckedChange={() => {
                                  const allSelected = selectedDocument.materials.every((m) => m.selected)
                                  setDocuments((prev) =>
                                    prev.map((d) =>
                                      d.id === selectedDocument.id
                                        ? {
                                            ...d,
                                            materials: d.materials.map((m) => ({ ...m, selected: !allSelected })),
                                          }
                                        : d,
                                    ),
                                  )
                                  setSelectedDocument((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          materials: prev.materials.map((m) => ({ ...m, selected: !allSelected })),
                                        }
                                      : null,
                                  )
                                }}
                              />
                            </th>
                            <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Material</th>
                            <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Un.</th>
                            <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Preço</th>
                            <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedDocument.materials.map((material) => {
                            const matStatus = materialStatusConfig[material.status]
                            return (
                              <tr key={material.id} className="group">
                                <td className="py-3">
                                  <Checkbox
                                    checked={material.selected}
                                    onCheckedChange={() => toggleMaterialSelection(selectedDocument.id, material.id)}
                                  />
                                </td>
                                <td className="py-3">
                                  <div>
                                    <p className="font-medium">{material.name}</p>
                                    <p className="text-xs text-muted-foreground">{material.category}</p>
                                  </div>
                                </td>
                                <td className="py-3 text-muted-foreground">{material.unit}</td>
                                <td className="py-3 text-right">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={material.unitPrice}
                                    onChange={(e) =>
                                      updateMaterialPrice(selectedDocument.id, material.id, Number(e.target.value))
                                    }
                                    className="w-24 h-8 text-right bg-input/50"
                                  />
                                </td>
                                <td className="py-3">
                                  <Badge className={matStatus.color}>{matStatus.label}</Badge>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {selectedDocument.materials.filter((m) => m.selected).length} de{" "}
                        {selectedDocument.materials.length} materiais selecionados
                      </p>
                      <Button
                        onClick={handleAddToMaterials}
                        disabled={!selectedDocument.materials.some((m) => m.selected)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar à Lista de Preços
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/50">
              <CardContent className="py-16 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Selecione um Documento</h3>
                <p className="text-muted-foreground">
                  Escolha um documento da lista para ver os materiais extraídos e adicioná-los à sua lista de preços.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
