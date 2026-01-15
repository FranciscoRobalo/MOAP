"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type Language = "pt" | "en" | "es"

type TranslationKey = keyof typeof translations.pt

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const translations = {
  pt: {
    // Common
    search: "Pesquisar...",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    add: "Adicionar",
    close: "Fechar",
    loading: "A carregar...",
    success: "Sucesso",
    error: "Erro",
    confirm: "Confirmar",
    back: "Voltar",
    next: "Seguinte",
    previous: "Anterior",
    finish: "Terminar",
    skip: "Saltar",

    // Auth
    login: "Entrar",
    logout: "Sair",
    username: "Utilizador",
    password: "Palavra-passe",
    loginTitle: "Iniciar Sessão",
    loginSubtitle: "Aceda à sua conta para gerir orçamentos",
    loginButton: "Entrar na Plataforma",
    invalidCredentials: "Credenciais inválidas",

    // Header & Navigation
    features: "Funcionalidades",
    howItWorks: "Como Funciona",
    report: "Relatório",
    uploadDocument: "Carregar Documento",
    dashboard: "Painel",
    startNow: "Começar Agora",

    // Sidebar Navigation
    overview: "Visão Geral",
    newProject: "Nova Obra",
    projects: "Obras",
    preValidation: "Pré-Validação",
    scheduleVisit: "Agendar Visita",
    publicTenders: "Concursos",
    budgets: "Orçamentos",
    budgetAnalysis: "Análise de Orçamentos",
    importDocuments: "Importar Documentos",
    materialPrices: "Preços de Materiais",
    uploadDocuments: "Carregar Documentos",
    proposals: "Propostas",
    messages: "Mensagens",
    users: "Utilizadores",
    invite: "Convidar",
    notifications: "Notificações",
    settings: "Definições",
    analytics: "Estatísticas",
    help: "Ajuda",

    // Dashboard
    welcomeBack: "Bem-vindo de volta",
    dashboardSubtitle: "Aqui está um resumo da sua atividade",
    analyzedDocuments: "Documentos Analisados",
    approvedProposals: "Propostas Aprovadas",
    priceAlerts: "Alertas de Preços",
    estimatedSavings: "Poupança Estimada",
    recentDocuments: "Documentos Recentes",
    quickActions: "Ações Rápidas",
    newBudget: "Novo Orçamento",
    analyzeBudget: "Analisar Orçamento",
    viewReports: "Ver Relatórios",

    // Projects (Obras)
    projectName: "Nome da Obra",
    projectType: "Tipo de Obra",
    projectDescription: "Descrição",
    projectLocation: "Localização",
    projectBudget: "Orçamento Previsto",
    projectDeadline: "Prazo de Execução",
    projectStatus: "Estado",
    createProject: "Criar Obra",
    projectCreated: "Obra criada com sucesso",

    // Project Types
    newConstruction: "Construção Nova",
    renovation: "Remodelação",
    rehabilitation: "Reabilitação",
    extension: "Ampliação",

    // Status
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
    inAnalysis: "Em Análise",
    additionalInfo: "Info Adicional",

    // Budget Analysis
    uploadCSV: "Carregar ficheiro CSV",
    dragDropCSV: "Arraste e solte o ficheiro CSV aqui",
    orClickToSelect: "ou clique para selecionar",
    csvFormat: "Formato esperado: Nome;Unidade;Quantidade;Preço",
    analyzingBudget: "A analisar orçamento...",
    analysisResults: "Resultados da Análise",
    totalItems: "Total de Itens",
    totalValue: "Valor Total",
    averageVariance: "Variação Média",
    itemsWithReference: "Itens com Referência",

    // Price Classifications
    belowAverage: "Abaixo da Média",
    average: "Na Média",
    aboveAverage: "Acima da Média",
    critical: "Crítico",
    noReference: "Sem Referência",

    // Materials & Works
    materials: "Materiais",
    works: "Trabalhos",
    unit: "Unidade",
    quantity: "Quantidade",
    price: "Preço",
    minPrice: "Preço Mínimo",
    maxPrice: "Preço Máximo",
    category: "Categoria",
    region: "Região",
    addMaterial: "Adicionar Material",
    addWork: "Adicionar Trabalho",
    syncPrices: "Sincronizar Preços",
    syncingPrices: "A sincronizar preços...",
    pricesUpdated: "Preços atualizados",

    // Messages
    newMessage: "Nova Mensagem",
    typeMessage: "Escreva uma mensagem...",
    sendMessage: "Enviar",
    noMessages: "Sem mensagens",
    online: "Online",
    offline: "Offline",

    // Settings
    profile: "Perfil",
    preferences: "Preferências",
    security: "Segurança",
    language: "Idioma",
    theme: "Tema",
    darkTheme: "Escuro",
    lightTheme: "Claro",
    systemTheme: "Sistema",
    currency: "Moeda",
    saveChanges: "Guardar Alterações",
    changesSaved: "Alterações guardadas",

    // Notifications
    markAllRead: "Marcar todas como lidas",
    noNotifications: "Sem notificações",
    newNotification: "Nova notificação",

    // Visits
    scheduleNewVisit: "Agendar Nova Visita",
    visitDate: "Data da Visita",
    visitTime: "Hora",
    visitNotes: "Notas",
    visitScheduled: "Visita agendada",
    upcomingVisits: "Próximas Visitas",
    pastVisits: "Visitas Anteriores",

    // Invitations
    inviteUsers: "Convidar Utilizadores",
    inviteByEmail: "Convidar por Email",
    invitationSent: "Convite enviado",
    pendingInvitations: "Convites Pendentes",

    // Tutorial
    tutorialWelcome: "Bem-vindo ao MOAP!",
    tutorialWelcomeDesc: "Vamos mostrar-lhe como utilizar a plataforma.",
    tutorialStart: "Iniciar Tutorial",
    tutorialSkip: "Saltar Tutorial",
    tutorialRestart: "Reiniciar Tutorial",

    // Landing Page - Hero
    heroTitle: "Orçamentos que fazem",
    heroTitleHighlight: "todo o sentido",
    heroSubtitle:
      "Compare os seus orçamentos de construção com a nossa base de dados inteligente. Descubra se os preços apresentados estão de acordo com o mercado.",
    heroBadge: "Análise Inteligente de Orçamentos",
    heroUploadButton: "Carregar Orçamento",
    heroLearnMore: "Saiba Mais",
    heroStat1Value: "10K+",
    heroStat1Label: "Orçamentos Analisados",
    heroStat2Value: "98%",
    heroStat2Label: "Precisão na Análise",
    heroStat3Value: "500+",
    heroStat3Label: "Empresas Confiam",
    heroStat4Value: "24h",
    heroStat4Label: "Suporte Técnico",

    // Landing Page - Features
    featuresTitle: "Funcionalidades Poderosas",
    featuresSubtitle: "Tecnologia avançada para análise precisa de orçamentos de construção",
    feature1Title: "Interpretação Inteligente",
    feature1Desc:
      "O nosso algoritmo interpreta descritivos de trabalhos, soluções construtivas e descrições técnicas automaticamente.",
    feature2Title: "Categorização Automática",
    feature2Desc: "Segmentação automática dos capítulos: Estrutura, Instalações Técnicas, Alvenarias e muito mais.",
    feature3Title: "Análise Geográfica",
    feature3Desc: "Comparação de preços considerando a região geográfica da obra e a idade dos dados.",
    feature4Title: "Verificação de Unidades",
    feature4Desc: "Validação automática de compatibilidade entre unidades de medida nos orçamentos.",
    feature5Title: "Análise de Materiais",
    feature5Desc: "Identificação se o descritivo inclui ou não materiais através de 'Fornecimento e Aplicação'.",
    feature6Title: "Base de Dados Robusta",
    feature6Desc: "Milhares de registos de trabalhos com preços unitários verificados e atualizados.",

    // Landing Page - How It Works
    howItWorksTitle: "Como Funciona",
    howItWorksSubtitle: "Três passos simples para analisar o seu orçamento",
    step1Number: "01",
    step1Title: "Carregue o Orçamento",
    step1Desc:
      "Faça upload do seu orçamento em formato PDF, Excel ou CSV. O sistema aceita diversos formatos e estruturas.",
    step2Number: "02",
    step2Title: "Análise Automática",
    step2Desc:
      "O nosso algoritmo interpreta os descritivos, categoriza os trabalhos e compara com a nossa base de dados.",
    step3Number: "03",
    step3Title: "Relatório Detalhado",
    step3Desc:
      "Receba um relatório completo com a análise de cada item e a comparação com os valores médios do mercado.",

    // Landing Page - Report Legend
    reportTitle: "Relatório MOAP",
    reportSubtitle:
      "O relatório analisa os custos dos serviços de construção e compara com a média da nossa base de dados. A classificação é baseada na variação entre o preço unitário e o valor médio.",
    reportVarianceTitle: "Variação em Relação à Média",
    reportVarianceSubtitle:
      "Os dados de comparação são relativos à região da obra com ponderação sobre a idade dos dados",
    reportBelowAvg: "Abaixo da Média",
    reportBelowAvgDesc: "Preço unitário com uma variação de pelo menos -10% do valor médio",
    reportAvg: "Na Média",
    reportAvgDesc: "Preço unitário com uma variação entre -9% e +10% do valor médio",
    reportAboveAvg: "Acima da Média",
    reportAboveAvgDesc: "Preço unitário com uma variação entre +11% e +49% do valor médio",
    reportMuchAbove: "Muito Acima",
    reportMuchAboveDesc: "Preço unitário com uma variação superior a +50% do valor médio",
    reportNoData: "Sem Dados",
    reportNoDataDesc: "Não foi possível analisar devido a falta de informação",
    reportExampleTitle: "Exemplo de Análise",
    reportExampleSubtitle: "Visualização do formato de orçamento e análise",
    reportTableNo: "Nº",
    reportTableDesc: "Descritivo do Trabalho",
    reportTableQty: "Qtd.",
    reportTableUnit: "Un.",
    reportTablePrice: "P. Unit.",
    reportTableAnalysis: "Análise",

    // Landing Page - Upload Section
    uploadTitle: "Carregar Documento",
    uploadSubtitle: "Faça upload do seu orçamento para análise automática",
    uploadYourBudget: "O Seu Orçamento",
    uploadAcceptedFormats: "Formatos aceites: PDF, Excel (.xlsx, .xls), CSV",
    uploadDragHere: "Arraste o ficheiro aqui",
    uploadOrClick: "ou clique para selecionar",
    uploadRemove: "Remover",
    uploadRegion: "Região da Obra",
    uploadSelectRegion: "Selecione a região",
    uploadYear: "Ano do Orçamento",
    uploadSelectYear: "Selecione o ano",
    uploadEmail: "Email para Receber o Relatório",
    uploadProcessing: "A processar...",
    uploadSent: "Documento Enviado!",
    uploadAnalyze: "Analisar Orçamento",
    uploadSuccess: "O seu relatório será enviado para o email indicado em breve.",

    // Landing Page - Footer
    footerDescription:
      "Plataforma inteligente para análise de orçamentos de construção. Compare preços unitários com a média do mercado e tome decisões informadas.",
    footerPlatform: "Plataforma",
    footerCompany: "Empresa",
    footerAboutUs: "Sobre Nós",
    footerContact: "Contacto",
    footerPrivacy: "Privacidade",
    footerTerms: "Termos de Uso",
    footerRights: "Todos os direitos reservados",

    // Regions
    regionNorth: "Norte",
    regionCenter: "Centro",
    regionLisbon: "Lisboa e Vale do Tejo",
    regionAlentejo: "Alentejo",
    regionAlgarve: "Algarve",
    regionAzores: "Açores",
    regionMadeira: "Madeira",
  },
  en: {
    // Common
    search: "Search...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    close: "Close",
    loading: "Loading...",
    success: "Success",
    error: "Error",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    previous: "Previous",
    finish: "Finish",
    skip: "Skip",

    // Auth
    login: "Login",
    logout: "Logout",
    username: "Username",
    password: "Password",
    loginTitle: "Sign In",
    loginSubtitle: "Access your account to manage budgets",
    loginButton: "Sign In to Platform",
    invalidCredentials: "Invalid credentials",

    // Header & Navigation
    features: "Features",
    howItWorks: "How It Works",
    report: "Report",
    uploadDocument: "Upload Document",
    dashboard: "Dashboard",
    startNow: "Start Now",

    // Sidebar Navigation
    overview: "Overview",
    newProject: "New Project",
    projects: "Projects",
    preValidation: "Pre-Validation",
    scheduleVisit: "Schedule Visit",
    publicTenders: "Public Tenders",
    budgets: "Budgets",
    budgetAnalysis: "Budget Analysis",
    importDocuments: "Import Documents",
    materialPrices: "Material Prices",
    uploadDocuments: "Upload Documents",
    proposals: "Proposals",
    messages: "Messages",
    users: "Users",
    invite: "Invite",
    notifications: "Notifications",
    settings: "Settings",
    analytics: "Analytics",
    help: "Help",

    // Dashboard
    welcomeBack: "Welcome back",
    dashboardSubtitle: "Here's a summary of your activity",
    analyzedDocuments: "Analyzed Documents",
    approvedProposals: "Approved Proposals",
    priceAlerts: "Price Alerts",
    estimatedSavings: "Estimated Savings",
    recentDocuments: "Recent Documents",
    quickActions: "Quick Actions",
    newBudget: "New Budget",
    analyzeBudget: "Analyze Budget",
    viewReports: "View Reports",

    // Projects (Obras)
    projectName: "Project Name",
    projectType: "Project Type",
    projectDescription: "Description",
    projectLocation: "Location",
    projectBudget: "Estimated Budget",
    projectDeadline: "Deadline",
    projectStatus: "Status",
    createProject: "Create Project",
    projectCreated: "Project created successfully",

    // Project Types
    newConstruction: "New Construction",
    renovation: "Renovation",
    rehabilitation: "Rehabilitation",
    extension: "Extension",

    // Status
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    inAnalysis: "In Analysis",
    additionalInfo: "Additional Info",

    // Budget Analysis
    uploadCSV: "Upload CSV file",
    dragDropCSV: "Drag and drop CSV file here",
    orClickToSelect: "or click to select",
    csvFormat: "Expected format: Name;Unit;Quantity;Price",
    analyzingBudget: "Analyzing budget...",
    analysisResults: "Analysis Results",
    totalItems: "Total Items",
    totalValue: "Total Value",
    averageVariance: "Average Variance",
    itemsWithReference: "Items with Reference",

    // Price Classifications
    belowAverage: "Below Average",
    average: "Average",
    aboveAverage: "Above Average",
    critical: "Critical",
    noReference: "No Reference",

    // Materials & Works
    materials: "Materials",
    works: "Works",
    unit: "Unit",
    quantity: "Quantity",
    price: "Price",
    minPrice: "Minimum Price",
    maxPrice: "Maximum Price",
    category: "Category",
    region: "Region",
    addMaterial: "Add Material",
    addWork: "Add Work",
    syncPrices: "Sync Prices",
    syncingPrices: "Syncing prices...",
    pricesUpdated: "Prices updated",

    // Messages
    newMessage: "New Message",
    typeMessage: "Type a message...",
    sendMessage: "Send",
    noMessages: "No messages",
    online: "Online",
    offline: "Offline",

    // Settings
    profile: "Profile",
    preferences: "Preferences",
    security: "Security",
    language: "Language",
    theme: "Theme",
    darkTheme: "Dark",
    lightTheme: "Light",
    systemTheme: "System",
    currency: "Currency",
    saveChanges: "Save Changes",
    changesSaved: "Changes saved",

    // Notifications
    markAllRead: "Mark all as read",
    noNotifications: "No notifications",
    newNotification: "New notification",

    // Visits
    scheduleNewVisit: "Schedule New Visit",
    visitDate: "Visit Date",
    visitTime: "Time",
    visitNotes: "Notes",
    visitScheduled: "Visit scheduled",
    upcomingVisits: "Upcoming Visits",
    pastVisits: "Past Visits",

    // Invitations
    inviteUsers: "Invite Users",
    inviteByEmail: "Invite by Email",
    invitationSent: "Invitation sent",
    pendingInvitations: "Pending Invitations",

    // Tutorial
    tutorialWelcome: "Welcome to MOAP!",
    tutorialWelcomeDesc: "Let us show you how to use the platform.",
    tutorialStart: "Start Tutorial",
    tutorialSkip: "Skip Tutorial",
    tutorialRestart: "Restart Tutorial",

    // Landing Page - Hero
    heroTitle: "Budgets that make",
    heroTitleHighlight: "complete sense",
    heroSubtitle:
      "Compare your construction budgets with our intelligent database. Find out if the prices presented are in line with the market.",
    heroBadge: "Intelligent Budget Analysis",
    heroUploadButton: "Upload Budget",
    heroLearnMore: "Learn More",
    heroStat1Value: "10K+",
    heroStat1Label: "Budgets Analyzed",
    heroStat2Value: "98%",
    heroStat2Label: "Analysis Accuracy",
    heroStat3Value: "500+",
    heroStat3Label: "Companies Trust Us",
    heroStat4Value: "24h",
    heroStat4Label: "Technical Support",

    // Landing Page - Features
    featuresTitle: "Powerful Features",
    featuresSubtitle: "Advanced technology for precise construction budget analysis",
    feature1Title: "Intelligent Interpretation",
    feature1Desc:
      "Our algorithm automatically interprets work descriptions, construction solutions and technical descriptions.",
    feature2Title: "Automatic Categorization",
    feature2Desc: "Automatic segmentation of chapters: Structure, Technical Installations, Masonry and much more.",
    feature3Title: "Geographic Analysis",
    feature3Desc: "Price comparison considering the geographic region of the work and the age of the data.",
    feature4Title: "Unit Verification",
    feature4Desc: "Automatic validation of unit compatibility in budgets.",
    feature5Title: "Material Analysis",
    feature5Desc: "Identification of whether the description includes materials through 'Supply and Application'.",
    feature6Title: "Robust Database",
    feature6Desc: "Thousands of work records with verified and updated unit prices.",

    // Landing Page - How It Works
    howItWorksTitle: "How It Works",
    howItWorksSubtitle: "Three simple steps to analyze your budget",
    step1Number: "01",
    step1Title: "Upload Budget",
    step1Desc: "Upload your budget in PDF, Excel or CSV format. The system accepts various formats and structures.",
    step2Number: "02",
    step2Title: "Automatic Analysis",
    step2Desc: "Our algorithm interprets the descriptions, categorizes the work and compares with our database.",
    step3Number: "03",
    step3Title: "Detailed Report",
    step3Desc: "Receive a complete report with the analysis of each item and comparison with market average values.",

    // Landing Page - Report Legend
    reportTitle: "MOAP Report",
    reportSubtitle:
      "The report analyzes the costs of construction services and compares with the average of our database. The classification is based on the variance between the unit price and the average value.",
    reportVarianceTitle: "Variance from Average",
    reportVarianceSubtitle: "Comparison data is relative to the region of the work with weighting on data age",
    reportBelowAvg: "Below Average",
    reportBelowAvgDesc: "Unit price with a variance of at least -10% from average value",
    reportAvg: "Average",
    reportAvgDesc: "Unit price with a variance between -9% and +10% from average value",
    reportAboveAvg: "Above Average",
    reportAboveAvgDesc: "Unit price with a variance between +11% and +49% from average value",
    reportMuchAbove: "Much Above",
    reportMuchAboveDesc: "Unit price with a variance greater than +50% from average value",
    reportNoData: "No Data",
    reportNoDataDesc: "Could not analyze due to lack of information",
    reportExampleTitle: "Analysis Example",
    reportExampleSubtitle: "Budget format and analysis visualization",
    reportTableNo: "No.",
    reportTableDesc: "Work Description",
    reportTableQty: "Qty.",
    reportTableUnit: "Unit",
    reportTablePrice: "Unit P.",
    reportTableAnalysis: "Analysis",

    // Landing Page - Upload Section
    uploadTitle: "Upload Document",
    uploadSubtitle: "Upload your budget for automatic analysis",
    uploadYourBudget: "Your Budget",
    uploadAcceptedFormats: "Accepted formats: PDF, Excel (.xlsx, .xls), CSV",
    uploadDragHere: "Drag file here",
    uploadOrClick: "or click to select",
    uploadRemove: "Remove",
    uploadRegion: "Work Region",
    uploadSelectRegion: "Select region",
    uploadYear: "Budget Year",
    uploadSelectYear: "Select year",
    uploadEmail: "Email to Receive Report",
    uploadProcessing: "Processing...",
    uploadSent: "Document Sent!",
    uploadAnalyze: "Analyze Budget",
    uploadSuccess: "Your report will be sent to the indicated email shortly.",

    // Landing Page - Footer
    footerDescription:
      "Intelligent platform for construction budget analysis. Compare unit prices with market averages and make informed decisions.",
    footerPlatform: "Platform",
    footerCompany: "Company",
    footerAboutUs: "About Us",
    footerContact: "Contact",
    footerPrivacy: "Privacy",
    footerTerms: "Terms of Use",
    footerRights: "All rights reserved",

    // Regions
    regionNorth: "North",
    regionCenter: "Center",
    regionLisbon: "Lisbon and Tagus Valley",
    regionAlentejo: "Alentejo",
    regionAlgarve: "Algarve",
    regionAzores: "Azores",
    regionMadeira: "Madeira",
  },
  es: {
    // Common
    search: "Buscar...",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    add: "Añadir",
    close: "Cerrar",
    loading: "Cargando...",
    success: "Éxito",
    error: "Error",
    confirm: "Confirmar",
    back: "Volver",
    next: "Siguiente",
    previous: "Anterior",
    finish: "Terminar",
    skip: "Saltar",

    // Auth
    login: "Entrar",
    logout: "Salir",
    username: "Usuario",
    password: "Contraseña",
    loginTitle: "Iniciar Sesión",
    loginSubtitle: "Acceda a su cuenta para gestionar presupuestos",
    loginButton: "Entrar en la Plataforma",
    invalidCredentials: "Credenciales inválidas",

    // Header & Navigation
    features: "Funcionalidades",
    howItWorks: "Cómo Funciona",
    report: "Informe",
    uploadDocument: "Cargar Documento",
    dashboard: "Panel",
    startNow: "Empezar Ahora",

    // Sidebar Navigation
    overview: "Visión General",
    newProject: "Nueva Obra",
    projects: "Obras",
    preValidation: "Pre-Validación",
    scheduleVisit: "Agendar Visita",
    publicTenders: "Concursos",
    budgets: "Presupuestos",
    budgetAnalysis: "Análisis de Presupuestos",
    importDocuments: "Importar Documentos",
    materialPrices: "Precios de Materiales",
    uploadDocuments: "Cargar Documentos",
    proposals: "Propuestas",
    messages: "Mensajes",
    users: "Usuarios",
    invite: "Invitar",
    notifications: "Notificaciones",
    settings: "Configuración",
    analytics: "Análisis",
    help: "Ayuda",

    // Dashboard
    welcomeBack: "Bienvenido de nuevo",
    dashboardSubtitle: "Aquí hay un resumen de su actividad",
    analyzedDocuments: "Documentos Analizados",
    approvedProposals: "Propuestas Aprobadas",
    priceAlerts: "Alertas de Precios",
    estimatedSavings: "Ahorro Estimado",
    recentDocuments: "Documentos Recientes",
    quickActions: "Acciones Rápidas",
    newBudget: "Nuevo Presupuesto",
    analyzeBudget: "Analizar Presupuesto",
    viewReports: "Ver Informes",

    // Projects (Obras)
    projectName: "Nombre de la Obra",
    projectType: "Tipo de Obra",
    projectDescription: "Descripción",
    projectLocation: "Ubicación",
    projectBudget: "Presupuesto Previsto",
    projectDeadline: "Plazo de Ejecución",
    projectStatus: "Estado",
    createProject: "Crear Obra",
    projectCreated: "Obra creada con éxito",

    // Project Types
    newConstruction: "Construcción Nueva",
    renovation: "Remodelación",
    rehabilitation: "Rehabilitación",
    extension: "Ampliación",

    // Status
    pending: "Pendiente",
    approved: "Aprobado",
    rejected: "Rechazado",
    inAnalysis: "En Análisis",
    additionalInfo: "Info Adicional",

    // Budget Analysis
    uploadCSV: "Cargar archivo CSV",
    dragDropCSV: "Arrastre y suelte el archivo CSV aquí",
    orClickToSelect: "o haga clic para seleccionar",
    csvFormat: "Formato esperado: Nombre;Unidad;Cantidad;Precio",
    analyzingBudget: "Analizando presupuesto...",
    analysisResults: "Resultados del Análisis",
    totalItems: "Total de Artículos",
    totalValue: "Valor Total",
    averageVariance: "Variación Media",
    itemsWithReference: "Artículos con Referencia",

    // Price Classifications
    belowAverage: "Por Debajo de la Media",
    average: "En la Media",
    aboveAverage: "Por Encima de la Media",
    critical: "Crítico",
    noReference: "Sin Referencia",

    // Materials & Works
    materials: "Materiales",
    works: "Trabajos",
    unit: "Unidad",
    quantity: "Cantidad",
    price: "Precio",
    minPrice: "Precio Mínimo",
    maxPrice: "Precio Máximo",
    category: "Categoría",
    region: "Región",
    addMaterial: "Añadir Material",
    addWork: "Añadir Trabajo",
    syncPrices: "Sincronizar Precios",
    syncingPrices: "Sincronizando precios...",
    pricesUpdated: "Precios actualizados",

    // Messages
    newMessage: "Nuevo Mensaje",
    typeMessage: "Escriba un mensaje...",
    sendMessage: "Enviar",
    noMessages: "Sin mensajes",
    online: "En línea",
    offline: "Desconectado",

    // Settings
    profile: "Perfil",
    preferences: "Preferencias",
    security: "Seguridad",
    language: "Idioma",
    theme: "Tema",
    darkTheme: "Oscuro",
    lightTheme: "Claro",
    systemTheme: "Sistema",
    currency: "Moneda",
    saveChanges: "Guardar Cambios",
    changesSaved: "Cambios guardados",

    // Notifications
    markAllRead: "Marcar todas como leídas",
    noNotifications: "Sin notificaciones",
    newNotification: "Nueva notificación",

    // Visits
    scheduleNewVisit: "Agendar Nueva Visita",
    visitDate: "Fecha de Visita",
    visitTime: "Hora",
    visitNotes: "Notas",
    visitScheduled: "Visita agendada",
    upcomingVisits: "Próximas Visitas",
    pastVisits: "Visitas Anteriores",

    // Invitations
    inviteUsers: "Invitar Usuarios",
    inviteByEmail: "Invitar por Email",
    invitationSent: "Invitación enviada",
    pendingInvitations: "Invitaciones Pendientes",

    // Tutorial
    tutorialWelcome: "¡Bienvenido a MOAP!",
    tutorialWelcomeDesc: "Le mostraremos cómo usar la plataforma.",
    tutorialStart: "Iniciar Tutorial",
    tutorialSkip: "Saltar Tutorial",
    tutorialRestart: "Reiniciar Tutorial",

    // Landing Page - Hero
    heroTitle: "Presupuestos que tienen",
    heroTitleHighlight: "todo el sentido",
    heroSubtitle:
      "Compare sus presupuestos de construcción con nuestra base de datos inteligente. Descubra si los precios presentados están de acuerdo con el mercado.",
    heroBadge: "Análisis Inteligente de Presupuestos",
    heroUploadButton: "Cargar Presupuesto",
    heroLearnMore: "Saber Más",
    heroStat1Value: "10K+",
    heroStat1Label: "Presupuestos Analizados",
    heroStat2Value: "98%",
    heroStat2Label: "Precisión en el Análisis",
    heroStat3Value: "500+",
    heroStat3Label: "Empresas Confían",
    heroStat4Value: "24h",
    heroStat4Label: "Soporte Técnico",

    // Landing Page - Features
    featuresTitle: "Funcionalidades Poderosas",
    featuresSubtitle: "Tecnología avanzada para análisis preciso de presupuestos de construcción",
    feature1Title: "Interpretación Inteligente",
    feature1Desc:
      "Nuestro algoritmo interpreta automáticamente descripciones de trabajos, soluciones constructivas y descripciones técnicas.",
    feature2Title: "Categorización Automática",
    feature2Desc: "Segmentación automática de capítulos: Estructura, Instalaciones Técnicas, Albañilería y mucho más.",
    feature3Title: "Análisis Geográfico",
    feature3Desc: "Comparación de precios considerando la región geográfica de la obra y la antigüedad de los datos.",
    feature4Title: "Verificación de Unidades",
    feature4Desc: "Validación automática de compatibilidad entre unidades de medida en los presupuestos.",
    feature5Title: "Análisis de Materiales",
    feature5Desc: "Identificación de si la descripción incluye materiales a través de 'Suministro y Aplicación'.",
    feature6Title: "Base de Datos Robusta",
    feature6Desc: "Miles de registros de trabajos con precios unitarios verificados y actualizados.",

    // Landing Page - How It Works
    howItWorksTitle: "Cómo Funciona",
    howItWorksSubtitle: "Tres pasos simples para analizar su presupuesto",
    step1Number: "01",
    step1Title: "Cargue el Presupuesto",
    step1Desc: "Suba su presupuesto en formato PDF, Excel o CSV. El sistema acepta diversos formatos y estructuras.",
    step2Number: "02",
    step2Title: "Análisis Automático",
    step2Desc:
      "Nuestro algoritmo interpreta las descripciones, categoriza los trabajos y compara con nuestra base de datos.",
    step3Number: "03",
    step3Title: "Informe Detallado",
    step3Desc:
      "Reciba un informe completo con el análisis de cada artículo y la comparación con los valores medios del mercado.",

    // Landing Page - Report Legend
    reportTitle: "Informe MOAP",
    reportSubtitle:
      "El informe analiza los costos de los servicios de construcción y compara con la media de nuestra base de datos. La clasificación se basa en la variación entre el precio unitario y el valor medio.",
    reportVarianceTitle: "Variación Respecto a la Media",
    reportVarianceSubtitle:
      "Los datos de comparación son relativos a la región de la obra con ponderación sobre la antigüedad de los datos",
    reportBelowAvg: "Por Debajo de la Media",
    reportBelowAvgDesc: "Precio unitario con una variación de al menos -10% del valor medio",
    reportAvg: "En la Media",
    reportAvgDesc: "Precio unitario con una variación entre -9% y +10% del valor medio",
    reportAboveAvg: "Por Encima de la Media",
    reportAboveAvgDesc: "Precio unitario con una variación entre +11% y +49% del valor medio",
    reportMuchAbove: "Muy Por Encima",
    reportMuchAboveDesc: "Precio unitario con una variación superior a +50% del valor medio",
    reportNoData: "Sin Datos",
    reportNoDataDesc: "No fue posible analizar debido a falta de información",
    reportExampleTitle: "Ejemplo de Análisis",
    reportExampleSubtitle: "Visualización del formato de presupuesto y análisis",
    reportTableNo: "Nº",
    reportTableDesc: "Descripción del Trabajo",
    reportTableQty: "Cant.",
    reportTableUnit: "Un.",
    reportTablePrice: "P. Unit.",
    reportTableAnalysis: "Análisis",

    // Landing Page - Upload Section
    uploadTitle: "Cargar Documento",
    uploadSubtitle: "Suba su presupuesto para análisis automático",
    uploadYourBudget: "Su Presupuesto",
    uploadAcceptedFormats: "Formatos aceptados: PDF, Excel (.xlsx, .xls), CSV",
    uploadDragHere: "Arrastre el archivo aquí",
    uploadOrClick: "o haga clic para seleccionar",
    uploadRemove: "Eliminar",
    uploadRegion: "Región de la Obra",
    uploadSelectRegion: "Seleccione la región",
    uploadYear: "Año del Presupuesto",
    uploadSelectYear: "Seleccione el año",
    uploadEmail: "Email para Recibir el Informe",
    uploadProcessing: "Procesando...",
    uploadSent: "¡Documento Enviado!",
    uploadAnalyze: "Analizar Presupuesto",
    uploadSuccess: "Su informe será enviado al email indicado en breve.",

    // Landing Page - Footer
    footerDescription:
      "Plataforma inteligente para análisis de presupuestos de construcción. Compare precios unitarios con la media del mercado y tome decisiones informadas.",
    footerPlatform: "Plataforma",
    footerCompany: "Empresa",
    footerAboutUs: "Sobre Nosotros",
    footerContact: "Contacto",
    footerPrivacy: "Privacidad",
    footerTerms: "Términos de Uso",
    footerRights: "Todos los derechos reservados",

    // Regions
    regionNorth: "Norte",
    regionCenter: "Centro",
    regionLisbon: "Lisboa y Valle del Tajo",
    regionAlentejo: "Alentejo",
    regionAlgarve: "Algarve",
    regionAzores: "Azores",
    regionMadeira: "Madeira",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("moap_language") as Language
    if (savedLanguage && ["pt", "en", "es"].includes(savedLanguage)) {
      setLanguageState(savedLanguage)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("moap_language", lang)
  }

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.pt[key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
