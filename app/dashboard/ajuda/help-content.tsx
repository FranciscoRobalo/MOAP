"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/contexts/language-context"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import {
  Search,
  FileText,
  Calculator,
  BarChart3,
  MessageSquare,
  HelpCircle,
  Mail,
  Phone,
  Clock,
  BookOpen,
  Lightbulb,
} from "lucide-react"

export function HelpContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const { language } = useLanguage()

  const labels = {
    title: language === "pt" ? "Centro de Ajuda" : language === "es" ? "Centro de Ayuda" : "Help Center",
    subtitle:
      language === "pt"
        ? "Encontre respostas para as suas questões"
        : language === "es"
          ? "Encuentre respuestas a sus preguntas"
          : "Find answers to your questions",
    searchPlaceholder:
      language === "pt" ? "Pesquisar na ajuda..." : language === "es" ? "Buscar en la ayuda..." : "Search help...",
    faq: "FAQ",
    guides: language === "pt" ? "Guias" : language === "es" ? "Guías" : "Guides",
    contact: language === "pt" ? "Contacto" : language === "es" ? "Contacto" : "Contact",
    gettingStarted: language === "pt" ? "Primeiros Passos" : language === "es" ? "Primeros Pasos" : "Getting Started",
    budgetAnalysis:
      language === "pt" ? "Análise de Orçamentos" : language === "es" ? "Análisis de Presupuestos" : "Budget Analysis",
    projectManagement:
      language === "pt" ? "Gestão de Obras" : language === "es" ? "Gestión de Obras" : "Project Management",
    accountSettings:
      language === "pt" ? "Definições da Conta" : language === "es" ? "Configuración de Cuenta" : "Account Settings",
    contactSupport:
      language === "pt" ? "Contactar Suporte" : language === "es" ? "Contactar Soporte" : "Contact Support",
    sendMessage: language === "pt" ? "Enviar Mensagem" : language === "es" ? "Enviar Mensaje" : "Send Message",
  }

  const faqs = {
    gettingStarted: [
      {
        q:
          language === "pt"
            ? "Como criar uma conta na plataforma?"
            : language === "es"
              ? "¿Cómo crear una cuenta en la plataforma?"
              : "How to create an account on the platform?",
        a:
          language === "pt"
            ? "Para criar uma conta, clique em 'Começar Agora' na página inicial e preencha o formulário de registo com os seus dados. Receberá um email de confirmação."
            : language === "es"
              ? "Para crear una cuenta, haga clic en 'Empezar Ahora' en la página de inicio y complete el formulario de registro con sus datos. Recibirá un correo de confirmación."
              : "To create an account, click 'Start Now' on the homepage and fill out the registration form with your details. You will receive a confirmation email.",
      },
      {
        q:
          language === "pt"
            ? "Quais são os tipos de utilizador disponíveis?"
            : language === "es"
              ? "¿Cuáles son los tipos de usuario disponibles?"
              : "What user types are available?",
        a:
          language === "pt"
            ? "Existem três tipos: Admin (acesso total), Técnico (gestão de obras e orçamentos), e Público (acesso limitado para submissão de obras)."
            : language === "es"
              ? "Hay tres tipos: Admin (acceso total), Técnico (gestión de obras y presupuestos), y Público (acceso limitado para envío de obras)."
              : "There are three types: Admin (full access), Technician (project and budget management), and Public (limited access for project submission).",
      },
      {
        q:
          language === "pt"
            ? "Como navegar na plataforma?"
            : language === "es"
              ? "¿Cómo navegar en la plataforma?"
              : "How to navigate the platform?",
        a:
          language === "pt"
            ? "Use o menu lateral para aceder às diferentes secções. Pode também usar o atalho Cmd/Ctrl+K para abrir a pesquisa rápida e navegar rapidamente."
            : language === "es"
              ? "Use el menú lateral para acceder a las diferentes secciones. También puede usar el atajo Cmd/Ctrl+K para abrir la búsqueda rápida y navegar rápidamente."
              : "Use the sidebar menu to access different sections. You can also use Cmd/Ctrl+K shortcut to open quick search and navigate quickly.",
      },
    ],
    budgetAnalysis: [
      {
        q:
          language === "pt"
            ? "Como carregar um orçamento para análise?"
            : language === "es"
              ? "¿Cómo cargar un presupuesto para análisis?"
              : "How to upload a budget for analysis?",
        a:
          language === "pt"
            ? "Vá a 'Análise de Orçamentos', clique em 'Carregar CSV', selecione o ficheiro no formato correto (Nome;Unidade;Quantidade;Preço) e clique em 'Analisar'."
            : language === "es"
              ? "Vaya a 'Análisis de Presupuestos', haga clic en 'Cargar CSV', seleccione el archivo en el formato correcto (Nombre;Unidad;Cantidad;Precio) y haga clic en 'Analizar'."
              : "Go to 'Budget Analysis', click 'Upload CSV', select the file in the correct format (Name;Unit;Quantity;Price) and click 'Analyze'.",
      },
      {
        q:
          language === "pt"
            ? "O que significam as cores no relatório?"
            : language === "es"
              ? "¿Qué significan los colores en el informe?"
              : "What do the colors in the report mean?",
        a:
          language === "pt"
            ? "Verde: abaixo da média (-10% ou menos), Amarelo: na média (-9% a +10%), Laranja: acima da média (+11% a +49%), Vermelho: muito acima (+50% ou mais), Cinza: sem referência."
            : language === "es"
              ? "Verde: por debajo de la media (-10% o menos), Amarillo: en la media (-9% a +10%), Naranja: por encima de la media (+11% a +49%), Rojo: muy por encima (+50% o más), Gris: sin referencia."
              : "Green: below average (-10% or less), Yellow: average (-9% to +10%), Orange: above average (+11% to +49%), Red: much above (+50% or more), Gray: no reference.",
      },
      {
        q:
          language === "pt"
            ? "Posso exportar o relatório de análise?"
            : language === "es"
              ? "¿Puedo exportar el informe de análisis?"
              : "Can I export the analysis report?",
        a:
          language === "pt"
            ? "Sim, após a análise pode clicar em 'Exportar CSV' para descarregar o relatório completo com todos os itens e classificações."
            : language === "es"
              ? "Sí, después del análisis puede hacer clic en 'Exportar CSV' para descargar el informe completo con todos los artículos y clasificaciones."
              : "Yes, after analysis you can click 'Export CSV' to download the complete report with all items and classifications.",
      },
    ],
    projectManagement: [
      {
        q:
          language === "pt"
            ? "Como criar uma nova obra?"
            : language === "es"
              ? "¿Cómo crear una nueva obra?"
              : "How to create a new project?",
        a:
          language === "pt"
            ? "Clique em 'Nova Obra' no menu lateral, preencha os detalhes do projeto (nome, tipo, localização, orçamento estimado) e clique em 'Criar Obra'."
            : language === "es"
              ? "Haga clic en 'Nueva Obra' en el menú lateral, complete los detalles del proyecto (nombre, tipo, ubicación, presupuesto estimado) y haga clic en 'Crear Obra'."
              : "Click 'New Project' in the sidebar, fill in project details (name, type, location, estimated budget) and click 'Create Project'.",
      },
      {
        q:
          language === "pt"
            ? "Como acompanhar o estado das obras?"
            : language === "es"
              ? "¿Cómo seguir el estado de las obras?"
              : "How to track project status?",
        a:
          language === "pt"
            ? "Na página 'Obras' pode ver todas as suas obras e o estado atual de cada uma. Clique numa obra para ver detalhes completos."
            : language === "es"
              ? "En la página 'Obras' puede ver todas sus obras y el estado actual de cada una. Haga clic en una obra para ver detalles completos."
              : "On the 'Projects' page you can see all your projects and the current status of each. Click on a project to see full details.",
      },
    ],
    accountSettings: [
      {
        q:
          language === "pt"
            ? "Como alterar o idioma da plataforma?"
            : language === "es"
              ? "¿Cómo cambiar el idioma de la plataforma?"
              : "How to change the platform language?",
        a:
          language === "pt"
            ? "Clique no seletor de idioma no cabeçalho (bandeira) e escolha entre Português, Inglês ou Espanhol."
            : language === "es"
              ? "Haga clic en el selector de idioma en el encabezado (bandera) y elija entre Portugués, Inglés o Español."
              : "Click on the language selector in the header (flag) and choose between Portuguese, English or Spanish.",
      },
      {
        q:
          language === "pt"
            ? "Como ativar o modo escuro?"
            : language === "es"
              ? "¿Cómo activar el modo oscuro?"
              : "How to enable dark mode?",
        a:
          language === "pt"
            ? "Clique no ícone de sol/lua no cabeçalho e selecione 'Escuro', 'Claro' ou 'Sistema' para seguir as preferências do seu dispositivo."
            : language === "es"
              ? "Haga clic en el icono de sol/luna en el encabezado y seleccione 'Oscuro', 'Claro' o 'Sistema' para seguir las preferencias de su dispositivo."
              : "Click on the sun/moon icon in the header and select 'Dark', 'Light' or 'System' to follow your device preferences.",
      },
    ],
  }

  const guides = [
    {
      title:
        language === "pt" ? "Guia de Início Rápido" : language === "es" ? "Guía de Inicio Rápido" : "Quick Start Guide",
      description:
        language === "pt"
          ? "Aprenda os conceitos básicos da plataforma em 5 minutos"
          : language === "es"
            ? "Aprenda los conceptos básicos de la plataforma en 5 minutos"
            : "Learn platform basics in 5 minutes",
      icon: Lightbulb,
      duration: "5 min",
    },
    {
      title:
        language === "pt"
          ? "Análise de Orçamentos"
          : language === "es"
            ? "Análisis de Presupuestos"
            : "Budget Analysis",
      description:
        language === "pt"
          ? "Como carregar e analisar orçamentos de construção"
          : language === "es"
            ? "Cómo cargar y analizar presupuestos de construcción"
            : "How to upload and analyze construction budgets",
      icon: BarChart3,
      duration: "10 min",
    },
    {
      title: language === "pt" ? "Gestão de Preços" : language === "es" ? "Gestión de Precios" : "Price Management",
      description:
        language === "pt"
          ? "Adicionar e gerir preços de materiais e trabalhos"
          : language === "es"
            ? "Añadir y gestionar precios de materiales y trabajos"
            : "Add and manage material and work prices",
      icon: Calculator,
      duration: "8 min",
    },
    {
      title:
        language === "pt"
          ? "Comunicação na Plataforma"
          : language === "es"
            ? "Comunicación en la Plataforma"
            : "Platform Communication",
      description:
        language === "pt"
          ? "Como usar o sistema de mensagens"
          : language === "es"
            ? "Cómo usar el sistema de mensajes"
            : "How to use the messaging system",
      icon: MessageSquare,
      duration: "5 min",
    },
  ]

  const filteredFaqs = (category: keyof typeof faqs) => {
    if (!searchQuery) return faqs[category]
    return faqs[category].filter(
      (faq) =>
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Recursos / FAQ"
        title={labels.title}
        description={labels.subtitle}
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={labels.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="faq" className="space-y-4">
        <TabsList>
          <TabsTrigger value="faq">{labels.faq}</TabsTrigger>
          <TabsTrigger value="guides">{labels.guides}</TabsTrigger>
          <TabsTrigger value="contact">{labels.contact}</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Getting Started */}
            <Card className="bp-bracket relative overflow-hidden border-border/60 bg-card/30">
              <CardHeader>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">§ 01 / Onboarding</p>
                <CardTitle className="flex items-center gap-2 font-display text-xl font-medium tracking-tight">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {labels.gettingStarted}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs("gettingStarted").map((faq, index) => (
                    <AccordionItem key={index} value={`gs-${index}`}>
                      <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Budget Analysis */}
            <Card className="bp-bracket relative overflow-hidden border-border/60 bg-card/30">
              <CardHeader>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">§ 02 / Análise</p>
                <CardTitle className="flex items-center gap-2 font-display text-xl font-medium tracking-tight">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  {labels.budgetAnalysis}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs("budgetAnalysis").map((faq, index) => (
                    <AccordionItem key={index} value={`ba-${index}`}>
                      <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Project Management */}
            <Card className="bp-bracket relative overflow-hidden border-border/60 bg-card/30">
              <CardHeader>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">§ 03 / Projetos</p>
                <CardTitle className="flex items-center gap-2 font-display text-xl font-medium tracking-tight">
                  <FileText className="h-5 w-5 text-primary" />
                  {labels.projectManagement}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs("projectManagement").map((faq, index) => (
                    <AccordionItem key={index} value={`pm-${index}`}>
                      <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="bp-bracket relative overflow-hidden border-border/60 bg-card/30">
              <CardHeader>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">§ 04 / Conta</p>
                <CardTitle className="flex items-center gap-2 font-display text-xl font-medium tracking-tight">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  {labels.accountSettings}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs("accountSettings").map((faq, index) => (
                    <AccordionItem key={index} value={`as-${index}`}>
                      <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="guides" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {guides.map((guide, index) => (
              <Card
                key={index}
                className="bp-bracket group relative cursor-pointer overflow-hidden border-border/60 bg-card/30 transition-colors hover:border-border"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/60 text-primary">
                      <guide.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Guia · {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-0.5 font-display text-lg font-medium tracking-tight">{guide.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{guide.description}</p>
                      <div className="mt-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {guide.duration}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bp-bracket relative overflow-hidden border-border/60 bg-card/30">
              <CardHeader>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Suporte</p>
                <CardTitle className="font-display text-xl font-medium tracking-tight">{labels.contactSupport}</CardTitle>
                <CardDescription>
                  {language === "pt"
                    ? "Envie-nos uma mensagem e responderemos em breve"
                    : language === "es"
                      ? "Envíenos un mensaje y responderemos pronto"
                      : "Send us a message and we'll respond shortly"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {language === "pt" ? "Assunto" : language === "es" ? "Asunto" : "Subject"}
                  </label>
                  <Input
                    placeholder={
                      language === "pt"
                        ? "Descreva brevemente o assunto"
                        : language === "es"
                          ? "Describa brevemente el asunto"
                          : "Briefly describe the subject"
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {language === "pt" ? "Mensagem" : language === "es" ? "Mensaje" : "Message"}
                  </label>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder={
                      language === "pt"
                        ? "Descreva a sua questão em detalhe..."
                        : language === "es"
                          ? "Describa su consulta en detalle..."
                          : "Describe your question in detail..."
                    }
                  />
                </div>
                <Button className="w-full">{labels.sendMessage}</Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="bp-bracket relative overflow-hidden border-border/60 bg-card/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/60 text-primary">
                      <Mail className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Email</p>
                      <p className="mt-0.5 font-display text-base font-medium">suporte@moap.pt</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bp-bracket relative overflow-hidden border-border/60 bg-card/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/60 text-primary">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {language === "pt" ? "Telefone" : language === "es" ? "Teléfono" : "Phone"}
                      </p>
                      <p className="mt-0.5 font-display text-base font-medium">+351 210 000 000</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bp-bracket relative overflow-hidden border-border/60 bg-card/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/60 text-primary">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {language === "pt"
                          ? "Horário de Suporte"
                          : language === "es"
                            ? "Horario de Soporte"
                            : "Support Hours"}
                      </p>
                      <p className="mt-0.5 font-display text-base font-medium">
                        {language === "pt"
                          ? "Seg-Sex: 9h-18h"
                          : language === "es"
                            ? "Lun-Vie: 9h-18h"
                            : "Mon-Fri: 9am-6pm"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
