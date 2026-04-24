"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileUp, Upload, FileText, X, AlertCircle, ArrowUpRight, ShieldCheck } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

const ACCEPTED_EXTENSIONS = [".pdf", ".xlsx", ".xls", ".csv"]
const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/csv",
])
const MAX_FILE_SIZE_MB = 20

export function UploadSection() {
  const { t } = useLanguage()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [region, setRegion] = useState("")
  const [year, setYear] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (candidate: File): string | null => {
    const name = candidate.name.toLowerCase()
    const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
    const hasValidMime = ACCEPTED_MIME_TYPES.has(candidate.type)
    if (!hasValidExt && !hasValidMime) {
      return "Formato não suportado. Use PDF, XLSX, XLS ou CSV."
    }
    const sizeMb = candidate.size / (1024 * 1024)
    if (sizeMb > MAX_FILE_SIZE_MB) {
      return `Ficheiro demasiado grande (${sizeMb.toFixed(1)} MB). Máximo ${MAX_FILE_SIZE_MB} MB.`
    }
    if (candidate.size === 0) {
      return "O ficheiro está vazio."
    }
    return null
  }

  const acceptFile = useCallback((candidate: File) => {
    const err = validateFile(candidate)
    if (err) {
      setError(err)
      setFile(null)
      return
    }
    setError(null)
    setFile(candidate)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files?.[0]
      if (droppedFile) acceptFile(droppedFile)
    },
    [acceptFile],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) acceptFile(selectedFile)
  }

  const removeFile = () => {
    setFile(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Selecione um ficheiro para continuar.")
      return
    }
    setError(null)
    setIsLoading(true)

    try {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        sessionStorage.setItem("pending_budget_file", base64)
        sessionStorage.setItem("pending_budget_name", file.name)
        sessionStorage.setItem("pending_budget_type", file.type)
        sessionStorage.setItem("pending_budget_region", region)
        sessionStorage.setItem("pending_budget_year", year)
        router.push("/login?redirect=/dashboard/analise&pending_file=1")
      }
      reader.onerror = () => {
        setError("Não foi possível ler o ficheiro. Tente novamente.")
        setIsLoading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setError("Ocorreu um erro inesperado. Tente novamente.")
      setIsLoading(false)
    }
  }

  const regions = [
    { value: "norte", label: t("regionNorth") },
    { value: "centro", label: t("regionCenter") },
    { value: "lisboa", label: t("regionLisbon") },
    { value: "alentejo", label: t("regionAlentejo") },
    { value: "algarve", label: t("regionAlgarve") },
    { value: "acores", label: t("regionAzores") },
    { value: "madeira", label: t("regionMadeira") },
  ]
  const years = ["2024", "2023", "2022", "2021", "2020"]

  return (
    <section
      id="carregar"
      className="relative overflow-hidden border-t hairline py-24 lg:py-32"
    >
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="aurora-blob"
          style={{
            top: "10%",
            left: "10%",
            width: "40vw",
            height: "40vw",
            background:
              "radial-gradient(circle at 40% 40%, hsl(166 76% 47% / 0.18), transparent 60%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-6 border-b hairline pb-10 md:flex-row md:items-end md:justify-between reveal-up">
          <div>
            <p className="eyebrow-strong">§ 06 — Começar</p>
            <h2 className="mt-4 max-w-3xl text-balance font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {t("uploadTitle")}{" "}
              <span className="font-display font-medium tracking-tight text-primary">em segundos.</span>
            </h2>
          </div>
          <p className="max-w-md text-pretty text-base text-muted-foreground md:text-right">
            {t("uploadSubtitle")}
          </p>
        </div>

        {/* Form layout */}
        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          {/* Left: info column */}
          <aside className="space-y-8 lg:col-span-4">
            <div className="reveal-up">
              <p className="eyebrow mb-3">Formatos aceites</p>
              <div className="flex flex-wrap gap-2">
                {["PDF", "XLSX", "XLS", "CSV"].map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 rounded-full border hairline bg-card px-3 py-1 font-mono text-xs text-foreground"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="reveal-up">
              <p className="eyebrow mb-3">Como funciona</p>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="font-mono text-xs text-primary">01</span>
                  <span>Carregar orçamento em qualquer formato aceite.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-xs text-primary">02</span>
                  <span>Iniciar sessão ou criar conta para continuar.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-xs text-primary">03</span>
                  <span>Receber análise comparada com o mercado.</span>
                </li>
              </ol>
            </div>

            <div className="flex items-start gap-3 rounded-xl border hairline bg-card/50 p-4 reveal-up">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Transmissão protegida</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Todos os ficheiros são transmitidos com encriptação TLS 1.3 e armazenados em
                  conformidade com GDPR.
                </p>
              </div>
            </div>
          </aside>

          {/* Right: dropzone + form */}
          <div className="lg:col-span-8 reveal-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dropzone */}
              <label
                htmlFor="file-input"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`bp-bracket relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border hairline bg-card p-8 text-center transition-all duration-300 ${
                  isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "hover:border-primary/50"
                }`}
              >
                <input
                  ref={inputRef}
                  id="file-input"
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="sr-only"
                />

                {/* Soft gradient backdrop */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber/5 opacity-0 transition-opacity duration-500" />

                {file ? (
                  <div className="relative flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border hairline bg-background">
                      <FileText className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono text-sm text-foreground">{file.name}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                        {file.type || "application/octet-stream"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        removeFile()
                      }}
                      className="gap-1 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                      {t("uploadRemove")}
                    </Button>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center gap-4">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl border hairline transition-all ${
                        isDragging ? "border-primary bg-primary/10" : "bg-background"
                      }`}
                    >
                      <Upload
                        className={`h-7 w-7 transition-all ${
                          isDragging ? "text-primary scale-110" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground">
                        {isDragging ? "Solte aqui o ficheiro" : t("uploadDragHere")}
                      </p>
                      <p className="mt-1.5 text-sm text-muted-foreground">{t("uploadOrClick")}</p>
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Máx. {MAX_FILE_SIZE_MB} MB · PDF, XLSX, XLS, CSV
                    </p>
                  </div>
                )}
              </label>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Metadata fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="region" className="eyebrow">
                    {t("uploadRegion")}
                  </Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger id="region" className="h-11 rounded-xl border-hairline bg-card">
                      <SelectValue placeholder={t("uploadSelectRegion")} />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year" className="eyebrow">
                    {t("uploadYear")}
                  </Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger id="year" className="h-11 rounded-xl border-hairline bg-card">
                      <SelectValue placeholder={t("uploadSelectYear")} />
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

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                disabled={!file || isLoading}
                className="group h-14 w-full gap-3 rounded-full text-base font-semibold shadow-[0_0_0_1px_hsl(166_76%_47%/0.4),0_20px_40px_-20px_hsl(166_76%_47%/0.6)]"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    A guardar ficheiro...
                  </>
                ) : (
                  <>
                    <FileUp className="h-5 w-5" />
                    {t("uploadAnalyze")}
                    <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Ser-lhe-á pedido que inicie sessão ou crie uma conta para continuar a análise.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
