"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, X, CheckCircle } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-header"

interface UploadedFile {
  id: string
  name: string
  size: number
  status: "uploading" | "complete" | "error"
  progress: number
}

const regions = ["Lisboa", "Porto", "Faro", "Coimbra", "Braga", "Aveiro", "Setúbal", "Leiria"]

const years = ["2024", "2023", "2022", "2021", "2020"]

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [region, setRegion] = useState("")
  const [year, setYear] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadedFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: "uploading",
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...uploadFiles])

    // Simulate upload progress
    uploadFiles.forEach((file) => {
      simulateUpload(file.id)
    })
  }

  const simulateUpload = (fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress: 100, status: "complete" } : f)))
      } else {
        setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress } : f)))
      }
    }, 500)
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Documentos / Upload"
        title="Carregar Documentos"
        description="Carregue os seus orçamentos para análise automática."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Area */}
        <Card className="bp-bracket relative overflow-hidden border-border/60 bg-card/30 lg:col-span-2">
          <CardHeader>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Dropzone</p>
            <CardTitle className="font-display text-xl font-medium tracking-tight">Área de Upload</CardTitle>
            <CardDescription>Arraste ficheiros ou clique para selecionar</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              className={`relative rounded-md border border-dashed px-6 py-10 text-center transition-colors ${
                isDragging ? "border-primary/60 bg-primary/5" : "border-border/70 bg-background/40 hover:border-primary/50"
              }`}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.csv,.doc,.docx"
                onChange={handleFileInput}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border/60 bg-background/60 text-muted-foreground">
                  <Upload className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Drop · arquivos</p>
                  <p className="mt-1 font-display text-xl font-medium tracking-tight">Arraste ficheiros aqui</p>
                  <p className="mt-1 text-sm text-muted-foreground">PDF · Excel · CSV · Word — máx. 10MB</p>
                </div>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6 space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 rounded-md border border-border/60 bg-background/40 p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border/60 bg-background/60 text-muted-foreground">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        {file.status === "uploading" && <span>{Math.round(file.progress)}%</span>}
                      </div>
                      {file.status === "uploading" && (
                        <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${file.progress}%` }} />
                        </div>
                      )}
                    </div>
                    {file.status === "complete" ? (
                      <CheckCircle className="h-5 w-5 text-price-below" />
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="bp-bracket relative overflow-hidden border-border/60 bg-card/30">
          <CardHeader>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Parâmetros</p>
            <CardTitle className="font-display text-xl font-medium tracking-tight">Configurações</CardTitle>
            <CardDescription>Defina a região e ano para análise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Região</label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="border-border/60 bg-background/60">
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
              <label className="text-sm font-medium">Ano de Referência</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="border-border/60 bg-background/60">
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

            <Button className="w-full" disabled={files.length === 0 || !region || !year}>
              Iniciar Análise
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
