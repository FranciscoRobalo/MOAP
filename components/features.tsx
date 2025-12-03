import { Brain, Database, MapPin, Layers, Scale, FileSearch } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Brain,
    title: "Interpretação Inteligente",
    description:
      "O nosso algoritmo interpreta descritivos de trabalhos, soluções construtivas e descrições técnicas automaticamente.",
  },
  {
    icon: Layers,
    title: "Categorização Automática",
    description: "Segmentação automática dos capítulos: Estrutura, Instalações Técnicas, Alvenarias e muito mais.",
  },
  {
    icon: MapPin,
    title: "Análise Geográfica",
    description: "Comparação de preços considerando a região geográfica da obra e a idade dos dados.",
  },
  {
    icon: Scale,
    title: "Verificação de Unidades",
    description: "Validação automática de compatibilidade entre unidades de medida nos orçamentos.",
  },
  {
    icon: FileSearch,
    title: "Análise de Materiais",
    description: "Identificação se o descritivo inclui ou não materiais através de 'Fornecimento e Aplicação'.",
  },
  {
    icon: Database,
    title: "Base de Dados Robusta",
    description: "Milhares de registos de trabalhos com preços unitários verificados e atualizados.",
  },
]

export function Features() {
  return (
    <section id="funcionalidades" className="border-t border-border/40 bg-card/30 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Funcionalidades Poderosas</h2>
          <p className="mt-4 text-muted-foreground">
            Tecnologia avançada para análise precisa de orçamentos de construção
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-border/40 bg-card/50 backdrop-blur-sm transition-colors hover:border-primary/40"
            >
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
