import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingDown, Minus, TrendingUp, AlertTriangle, HelpCircle } from "lucide-react"

const priceIndicators = [
  {
    icon: TrendingDown,
    label: "< -10%",
    title: "Abaixo da Média",
    description: "Preço unitário com uma variação de pelo menos -10% do valor médio",
    color: "bg-chart-1",
    textColor: "text-chart-1",
  },
  {
    icon: Minus,
    label: "-9% a +10%",
    title: "Na Média",
    description: "Preço unitário com uma variação entre -9% e +10% do valor médio",
    color: "bg-chart-2",
    textColor: "text-chart-2",
  },
  {
    icon: TrendingUp,
    label: "+11% a +49%",
    title: "Acima da Média",
    description: "Preço unitário com uma variação entre +11% e +49% do valor médio",
    color: "bg-chart-3",
    textColor: "text-chart-3",
  },
  {
    icon: AlertTriangle,
    label: "> +50%",
    title: "Muito Acima",
    description: "Preço unitário com uma variação superior a +50% do valor médio",
    color: "bg-chart-4",
    textColor: "text-chart-4",
  },
  {
    icon: HelpCircle,
    label: "N/A",
    title: "Sem Dados",
    description: "Não foi possível analisar devido a falta de informação",
    color: "bg-chart-5",
    textColor: "text-chart-5",
  },
]

export function ReportLegend() {
  return (
    <section id="relatorio" className="border-t border-border/40 bg-card/30 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Relatório MOAP</h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            O relatório analisa os custos dos serviços de construção e compara com a média da nossa base de dados. A
            classificação é baseada na variação entre o preço unitário e o valor médio.
          </p>
        </div>

        <div className="mt-16">
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="text-center">
              <CardTitle>Variação em Relação à Média</CardTitle>
              <CardDescription>
                Os dados de comparação são relativos à região da obra com ponderação sobre a idade dos dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {priceIndicators.map((indicator) => (
                  <div
                    key={indicator.label}
                    className="flex flex-col items-center rounded-xl border border-border/40 bg-background/50 p-4 text-center"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${indicator.color}`}>
                      <indicator.icon className="h-6 w-6 text-background" />
                    </div>
                    <span className={`mt-3 text-lg font-bold ${indicator.textColor}`}>{indicator.label}</span>
                    <span className="mt-1 font-medium">{indicator.title}</span>
                    <p className="mt-2 text-xs text-muted-foreground">{indicator.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Example Table */}
        <div className="mt-12">
          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <CardTitle>Exemplo de Análise</CardTitle>
              <CardDescription>Visualização do formato de orçamento e análise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nº</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descritivo do Trabalho</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Qtd.</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Un.</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">P. Unit.</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Análise</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/40">
                      <td className="px-4 py-3">1</td>
                      <td className="px-4 py-3">Fornecimento e instalação de nova clarabóia em vidro temperado</td>
                      <td className="px-4 py-3 text-center">4</td>
                      <td className="px-4 py-3 text-center">UN.</td>
                      <td className="px-4 py-3 text-right">€44,99</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-chart-1">
                          <TrendingDown className="h-4 w-4 text-background" />
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/40">
                      <td className="px-4 py-3">2</td>
                      <td className="px-4 py-3">Aplicação de tinta de esmalte aquoso acetinado em paredes</td>
                      <td className="px-4 py-3 text-center">120</td>
                      <td className="px-4 py-3 text-center">m²</td>
                      <td className="px-4 py-3 text-right">€8,50</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-chart-2">
                          <Minus className="h-4 w-4 text-background" />
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/40">
                      <td className="px-4 py-3">3</td>
                      <td className="px-4 py-3">Fornecimento e montagem de tubagem multicamadas</td>
                      <td className="px-4 py-3 text-center">45</td>
                      <td className="px-4 py-3 text-center">ml</td>
                      <td className="px-4 py-3 text-right">€28,00</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-chart-3">
                          <TrendingUp className="h-4 w-4 text-background" />
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">4</td>
                      <td className="px-4 py-3">Estrutura metálica para cobertura</td>
                      <td className="px-4 py-3 text-center">1</td>
                      <td className="px-4 py-3 text-center">VG</td>
                      <td className="px-4 py-3 text-right">€15.000,00</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-chart-5">
                          <HelpCircle className="h-4 w-4 text-background" />
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
