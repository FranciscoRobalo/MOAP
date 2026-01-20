"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useData } from "@/contexts/data-context"
import { useLanguage } from "@/contexts/language-context"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, Building2, Calculator, Euro, Calendar } from "lucide-react"

export default function AnalyticsPage() {
  const { obras, budgets, materials, visitas } = useData()
  const { language } = useLanguage()

  const labels = {
    title:
      language === "pt"
        ? "Análise e Estatísticas"
        : language === "es"
          ? "Análisis y Estadísticas"
          : "Analytics & Statistics",
    subtitle:
      language === "pt"
        ? "Visão geral do desempenho da plataforma"
        : language === "es"
          ? "Visión general del rendimiento de la plataforma"
          : "Platform performance overview",
    overview: language === "pt" ? "Visão Geral" : language === "es" ? "Visión General" : "Overview",
    projects: language === "pt" ? "Obras" : language === "es" ? "Obras" : "Projects",
    budgetsTab: language === "pt" ? "Orçamentos" : language === "es" ? "Presupuestos" : "Budgets",
    prices: language === "pt" ? "Preços" : language === "es" ? "Precios" : "Prices",
    totalProjects: language === "pt" ? "Total de Obras" : language === "es" ? "Total de Obras" : "Total Projects",
    totalBudgets:
      language === "pt" ? "Total de Orçamentos" : language === "es" ? "Total de Presupuestos" : "Total Budgets",
    totalValue: language === "pt" ? "Valor Total" : language === "es" ? "Valor Total" : "Total Value",
    scheduledVisits:
      language === "pt" ? "Visitas Agendadas" : language === "es" ? "Visitas Programadas" : "Scheduled Visits",
    projectsByStatus:
      language === "pt" ? "Obras por Estado" : language === "es" ? "Obras por Estado" : "Projects by Status",
    budgetsByMonth:
      language === "pt" ? "Orçamentos por Mês" : language === "es" ? "Presupuestos por Mes" : "Budgets by Month",
    priceDistribution:
      language === "pt"
        ? "Distribuição de Preços"
        : language === "es"
          ? "Distribución de Precios"
          : "Price Distribution",
    categoryBreakdown: language === "pt" ? "Por Categoria" : language === "es" ? "Por Categoría" : "By Category",
    approved: language === "pt" ? "Aprovado" : language === "es" ? "Aprobado" : "Approved",
    pending: language === "pt" ? "Pendente" : language === "es" ? "Pendiente" : "Pending",
    inAnalysis: language === "pt" ? "Em Análise" : language === "es" ? "En Análisis" : "In Analysis",
    rejected: language === "pt" ? "Rejeitado" : language === "es" ? "Rechazado" : "Rejected",
    materials: language === "pt" ? "Materiais" : language === "es" ? "Materiales" : "Materials",
    works: language === "pt" ? "Trabalhos" : language === "es" ? "Trabajos" : "Works",
    avgPrice: language === "pt" ? "Preço Médio" : language === "es" ? "Precio Medio" : "Average Price",
    projectTrend: language === "pt" ? "Tendência de Obras" : language === "es" ? "Tendencia de Obras" : "Project Trend",
    budgetTrend:
      language === "pt" ? "Tendência de Orçamentos" : language === "es" ? "Tendencia de Presupuestos" : "Budget Trend",
  }

  // Calculate statistics
  const statusCounts = {
    aprovado: obras.filter((o) => o.status === "aprovado").length,
    pendente: obras.filter((o) => o.status === "pendente").length,
    em_analise: obras.filter((o) => o.status === "em_analise").length,
    rejeitado: obras.filter((o) => o.status === "rejeitado").length,
  }

  const totalBudgetValue = budgets.reduce(
    (sum, b) => sum + b.items.reduce((itemSum, item) => itemSum + item.quantity * item.unitPrice, 0),
    0,
  )

  const scheduledVisitsCount = visitas.filter((v) => v.status === "agendada").length

  const materialsCount = materials.filter((m) => m.type === "material").length
  const worksCount = materials.filter((m) => m.type === "work").length

  // Pie chart data for project status - always keep at least one item to prevent empty chart errors
  const statusDataRaw = [
    { name: labels.approved, value: statusCounts.aprovado, color: "#22c55e" },
    { name: labels.pending, value: statusCounts.pendente, color: "#eab308" },
    { name: labels.inAnalysis, value: statusCounts.em_analise, color: "#3b82f6" },
    { name: labels.rejected, value: statusCounts.rejeitado, color: "#ef4444" },
  ].filter((d) => d.value > 0)
  
  // Ensure we always have data to prevent undefined color errors
  const statusData = statusDataRaw.length > 0 
    ? statusDataRaw 
    : [{ name: language === "pt" ? "Sem dados" : language === "es" ? "Sin datos" : "No data", value: 1, color: "#6b7280" }]

  // Monthly data simulation
  const monthlyData = [
    { month: "Jan", obras: 3, orcamentos: 5, valor: 45000 },
    { month: "Fev", obras: 5, orcamentos: 8, valor: 72000 },
    { month: "Mar", obras: 4, orcamentos: 6, valor: 58000 },
    { month: "Abr", obras: 7, orcamentos: 12, valor: 95000 },
    { month: "Mai", obras: 6, orcamentos: 9, valor: 82000 },
    { month: "Jun", obras: 8, orcamentos: 15, valor: 120000 },
  ]

  // Category breakdown for materials
  const categoryData = materials.reduce(
    (acc, m) => {
      const cat = m.category
      if (!acc[cat]) {
        acc[cat] = { count: 0, avgPrice: 0, totalPrice: 0 }
      }
      acc[cat].count++
      // Use price and priceMax (matching Material interface)
      const minPrice = m.price || 0
      const maxPrice = m.priceMax || m.price || 0
      acc[cat].totalPrice += (minPrice + maxPrice) / 2
      acc[cat].avgPrice = acc[cat].totalPrice / acc[cat].count
      return acc
    },
    {} as Record<string, { count: number; avgPrice: number; totalPrice: number }>,
  )

  const categoryChartData = Object.entries(categoryData)
    .map(([name, data]) => ({
      name: name.length > 15 ? name.substring(0, 15) + "..." : name,
      count: data.count,
      avgPrice: Math.round(data.avgPrice * 100) / 100,
    }))
    .slice(0, 10)

  // Materials vs Works distribution - use hex colors and ensure we have data
  const typeDistributionRaw = [
    { name: labels.materials, value: materialsCount, color: "#3b82f6" },
    { name: labels.works, value: worksCount, color: "#22c55e" },
  ].filter((d) => d.value > 0)
  
  const typeDistribution = typeDistributionRaw.length > 0
    ? typeDistributionRaw
    : [{ name: language === "pt" ? "Sem dados" : language === "es" ? "Sin datos" : "No data", value: 1, color: "#6b7280" }]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{labels.title}</h1>
        <p className="text-muted-foreground">{labels.subtitle}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{labels.totalProjects}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{obras.length}</div>
            <div className="flex items-center gap-1 text-xs text-price-below">
              <TrendingUp className="h-3 w-3" />+{statusCounts.aprovado} {labels.approved.toLowerCase()}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{labels.totalBudgets}</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgets.length}</div>
            <div className="flex items-center gap-1 text-xs text-price-below">
              <TrendingUp className="h-3 w-3" />
              {budgets.filter((b) => b.status === "finalizado").length} finalizados
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{labels.totalValue}</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{(totalBudgetValue / 1000).toFixed(0)}k</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {language === "pt" ? "em orçamentos" : language === "es" ? "en presupuestos" : "in budgets"}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{labels.scheduledVisits}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledVisitsCount}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {visitas.filter((v) => v.status === "realizada").length}{" "}
              {language === "pt" ? "realizadas" : language === "es" ? "realizadas" : "completed"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{labels.overview}</TabsTrigger>
          <TabsTrigger value="projects">{labels.projects}</TabsTrigger>
          <TabsTrigger value="budgets">{labels.budgetsTab}</TabsTrigger>
          <TabsTrigger value="prices">{labels.prices}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Project Status Pie Chart */}
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle>{labels.projectsByStatus}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Materials vs Works Distribution */}
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle>{labels.priceDistribution}</CardTitle>
                <CardDescription>
                  {materialsCount + worksCount}{" "}
                  {language === "pt"
                    ? "itens na base de dados"
                    : language === "es"
                      ? "artículos en la base de datos"
                      : "items in database"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {typeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>{labels.projectTrend}</CardTitle>
              <CardDescription>
                {language === "pt"
                  ? "Evolução mensal de obras submetidas"
                  : language === "es"
                    ? "Evolución mensual de obras enviadas"
                    : "Monthly evolution of submitted projects"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="obras"
                      stroke="hsl(221, 83%, 53%)"
                      fill="hsl(221, 83%, 53%)"
                      fillOpacity={0.3}
                      name={labels.projects}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>{labels.budgetTrend}</CardTitle>
              <CardDescription>
                {language === "pt"
                  ? "Orçamentos e valores por mês"
                  : language === "es"
                    ? "Presupuestos y valores por mes"
                    : "Budgets and values by month"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="orcamentos"
                      stroke="hsl(221, 83%, 53%)"
                      strokeWidth={2}
                      name={labels.budgetsTab}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="valor"
                      stroke="hsl(142, 76%, 36%)"
                      strokeWidth={2}
                      name={`${labels.totalValue} (€)`}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices" className="space-y-4">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>{labels.categoryBreakdown}</CardTitle>
              <CardDescription>
                {language === "pt"
                  ? "Número de itens e preço médio por categoria"
                  : language === "es"
                    ? "Número de artículos y precio medio por categoría"
                    : "Number of items and average price by category"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [
                        name === "count" ? value : `€${value.toFixed(2)}`,
                        name === "count"
                          ? language === "pt"
                            ? "Itens"
                            : language === "es"
                              ? "Artículos"
                              : "Items"
                          : labels.avgPrice,
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="count"
                      fill="hsl(221, 83%, 53%)"
                      name={language === "pt" ? "Itens" : language === "es" ? "Artículos" : "Items"}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
