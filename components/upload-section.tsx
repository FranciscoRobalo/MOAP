"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUp, Upload, FileText, X, CheckCircle2 } from "lucide-react"

export function UploadSection() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [region, setRegion] = useState("")
  const [year, setYear] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setUploadComplete(false)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadComplete(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setUploadComplete(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsUploading(false)
    setUploadComplete(true)
  }

  const regions = ["Norte", "Centro", "Lisboa e Vale do Tejo", "Alentejo", "Algarve", "Açores", "Madeira"]

  const years = ["2024", "2023", "2022", "2021", "2020"]

  return (
    <section id="carregar" className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Carregar Documento</h2>
          <p className="mt-4 text-muted-foreground">Faça upload do seu orçamento para análise automática</p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-primary" />O Seu Orçamento
              </CardTitle>
              <CardDescription>Formatos aceites: PDF, Excel (.xlsx, .xls), CSV</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                    isDragging ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/60"
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile()
                        }}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Arraste o ficheiro aqui</p>
                        <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="region">Região da Obra</Label>
                    <Select value={region} onValueChange={setRegion}>
                      <SelectTrigger id="region">
                        <SelectValue placeholder="Selecione a região" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Ano do Orçamento</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger id="year">
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email para Receber o Relatório</Label>
                  <Input id="email" type="email" placeholder="exemplo@email.com" className="bg-background/50" />
                </div>

                <Button type="submit" size="lg" className="w-full gap-2" disabled={!file || isUploading}>
                  {isUploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      A processar...
                    </>
                  ) : uploadComplete ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Documento Enviado!
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Analisar Orçamento
                    </>
                  )}
                </Button>

                {uploadComplete && (
                  <p className="text-center text-sm text-chart-1">
                    O seu relatório será enviado para o email indicado em breve.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
