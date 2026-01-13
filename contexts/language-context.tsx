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

    // Landing Page
    heroTitle: "Orçamentos que fazem todo o sentido",
    heroSubtitle:
      "Analise orçamentos de construção com inteligência artificial. Compare preços com a média do mercado português.",
    getStarted: "Começar Agora",
    learnMore: "Saber Mais",

    // Footer
    allRightsReserved: "Todos os direitos reservados",
    privacyPolicy: "Política de Privacidade",
    termsOfService: "Termos de Serviço",
    contact: "Contacto",
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
    startNow: "Get Started",

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
    projectDeadline: "Execution Deadline",
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
    minPrice: "Min Price",
    maxPrice: "Max Price",
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

    // Landing Page
    heroTitle: "Budgets that make complete sense",
    heroSubtitle:
      "Analyze construction budgets with artificial intelligence. Compare prices with the Portuguese market average.",
    getStarted: "Get Started",
    learnMore: "Learn More",

    // Footer
    allRightsReserved: "All rights reserved",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    contact: "Contact",
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
    finish: "Finalizar",
    skip: "Saltar",

    // Auth
    login: "Iniciar sesión",
    logout: "Cerrar sesión",
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
    uploadDocument: "Subir Documento",
    dashboard: "Panel",
    startNow: "Empezar Ahora",

    // Sidebar Navigation
    overview: "Visión General",
    newProject: "Nueva Obra",
    projects: "Obras",
    preValidation: "Pre-Validación",
    scheduleVisit: "Programar Visita",
    publicTenders: "Concursos",
    budgets: "Presupuestos",
    budgetAnalysis: "Análisis de Presupuestos",
    importDocuments: "Importar Documentos",
    materialPrices: "Precios de Materiales",
    uploadDocuments: "Subir Documentos",
    proposals: "Propuestas",
    messages: "Mensajes",
    users: "Usuarios",
    invite: "Invitar",
    notifications: "Notificaciones",
    settings: "Configuración",

    // Dashboard
    welcomeBack: "Bienvenido de nuevo",
    dashboardSubtitle: "Aquí está un resumen de su actividad",
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
    uploadCSV: "Subir archivo CSV",
    dragDropCSV: "Arrastre y suelte el archivo CSV aquí",
    orClickToSelect: "o haga clic para seleccionar",
    csvFormat: "Formato esperado: Nombre;Unidad;Cantidad;Precio",
    analyzingBudget: "Analizando presupuesto...",
    analysisResults: "Resultados del Análisis",
    totalItems: "Total de Ítems",
    totalValue: "Valor Total",
    averageVariance: "Variación Media",
    itemsWithReference: "Ítems con Referencia",

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
    scheduleNewVisit: "Programar Nueva Visita",
    visitDate: "Fecha de Visita",
    visitTime: "Hora",
    visitNotes: "Notas",
    visitScheduled: "Visita programada",
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

    // Landing Page
    heroTitle: "Presupuestos que tienen todo el sentido",
    heroSubtitle:
      "Analice presupuestos de construcción con inteligencia artificial. Compare precios con la media del mercado portugués.",
    getStarted: "Empezar Ahora",
    learnMore: "Saber Más",

    // Footer
    allRightsReserved: "Todos los derechos reservados",
    privacyPolicy: "Política de Privacidad",
    termsOfService: "Términos de Servicio",
    contact: "Contacto",
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

export { translations }
