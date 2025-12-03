import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, FileUp } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
      {/* Background gradient effect */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-primary" />
            Análise Inteligente de Orçamentos
          </div>

          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
            Orçamentos que fazem <span className="text-primary">todo o sentido</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground lg:text-xl">
            Compare os seus orçamentos de construção com a nossa base de dados inteligente. Descubra se os preços
            apresentados estão de acordo com o mercado.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2">
              <FileUp className="h-5 w-5" />
              Carregar Orçamento
            </Button>
            <Button size="lg" variant="outline" className="gap-2 bg-transparent">
              Saiba Mais
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-8 lg:grid-cols-4">
          {[
            { value: "10K+", label: "Orçamentos Analisados" },
            { value: "98%", label: "Precisão na Análise" },
            { value: "500+", label: "Empresas Confiam" },
            { value: "24h", label: "Suporte Técnico" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-primary lg:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
