"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Types
export interface Material {
  id: string
  name: string
  unit: string
  price: number
  category: string
  region?: string
  lastUpdated?: string
}

export interface BudgetItem {
  id: string
  materialId: string
  materialName: string
  unit: string
  quantity: number
  unitPrice: number
  category: string
}

export interface Budget {
  id: string
  name: string
  obraId: string
  obraName: string
  createdDate: string
  status: "rascunho" | "finalizado" | "enviado"
  items: BudgetItem[]
}

export interface Obra {
  id: string
  name: string
  type: string
  region: string
  address: string
  estimatedBudget: number
  startDate: string
  endDate: string
  urgency: string
  description: string
  requirements: string
  contactName: string
  contactPhone: string
  contactEmail: string
  status: "pendente" | "em_analise" | "info_adicional" | "aprovado" | "rejeitado"
  progress: number
  createdDate: string
  assignedUsers: string[]
}

export interface Visita {
  id: string
  obraId: string
  obraName: string
  date: string
  time: string
  type: string
  contactName: string
  contactPhone: string
  notes: string
  status: "agendada" | "realizada" | "cancelada"
}

export interface Concurso {
  id: string
  title: string
  entity: string
  region: string
  category: string
  type: string
  budget: number
  deadline: string
  description: string
  status: "aberto" | "fechado" | "em_avaliacao"
  invitedUsers: string[]
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  receiverId: string
  content: string
  timestamp: string
  read: boolean
}

export interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantAvatar: string
  participantRole: string
  lastMessage: string
  lastMessageTime: string
  unread: number
  online: boolean
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  company: string
  avatar: string
  online: boolean
  joinDate: string
}

export interface Notification {
  id: string
  type: "obra" | "message" | "budget" | "visit" | "concurso" | "system"
  title: string
  description: string
  timestamp: string
  read: boolean
  link?: string
}

export interface Invite {
  id: string
  email: string
  name?: string
  role?: string
  status: "enviado" | "aceite" | "expirado"
  sentDate: string
  sentBy: string
}

interface DataContextType {
  // Materials
  materials: Material[]
  addMaterial: (material: Omit<Material, "id">) => void
  updateMaterial: (id: string, material: Partial<Material>) => void
  deleteMaterial: (id: string) => void

  // Budgets
  budgets: Budget[]
  addBudget: (budget: Omit<Budget, "id">) => void
  updateBudget: (id: string, budget: Partial<Budget>) => void
  deleteBudget: (id: string) => void

  // Obras
  obras: Obra[]
  addObra: (obra: Omit<Obra, "id" | "status" | "progress" | "createdDate" | "assignedUsers">) => void
  updateObra: (id: string, obra: Partial<Obra>) => void
  deleteObra: (id: string) => void

  // Visitas
  visitas: Visita[]
  addVisita: (visita: Omit<Visita, "id" | "status">) => void
  updateVisita: (id: string, visita: Partial<Visita>) => void
  deleteVisita: (id: string) => void

  // Concursos
  concursos: Concurso[]
  inviteUserToConcurso: (concursoId: string, userId: string) => void

  // Messages
  conversations: Conversation[]
  messages: Record<string, Message[]>
  sendMessage: (conversationId: string, content: string) => void
  markConversationAsRead: (conversationId: string) => void

  // Users
  users: User[]

  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  clearNotifications: () => void

  // Invites
  invites: Invite[]
  sendInvite: (email: string, name?: string, role?: string) => void
  sendBulkInvites: (emails: string[]) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

// Initial mock data
const initialMaterials: Material[] = [
  {
    id: "1",
    name: "Cimento Portland",
    unit: "kg",
    price: 0.15,
    category: "Estrutura",
    region: "Nacional",
    lastUpdated: "2024-01-15",
  },
  {
    id: "2",
    name: "Tijolo Cerâmico",
    unit: "un",
    price: 0.45,
    category: "Alvenaria",
    region: "Nacional",
    lastUpdated: "2024-01-15",
  },
  {
    id: "3",
    name: "Areia Grossa",
    unit: "m³",
    price: 45.0,
    category: "Estrutura",
    region: "Lisboa",
    lastUpdated: "2024-01-10",
  },
  {
    id: "4",
    name: "Ferro CA-50 10mm",
    unit: "kg",
    price: 4.2,
    category: "Estrutura",
    region: "Nacional",
    lastUpdated: "2024-01-12",
  },
  {
    id: "5",
    name: "Azulejo 30x30",
    unit: "m²",
    price: 18.5,
    category: "Revestimentos",
    region: "Norte",
    lastUpdated: "2024-01-08",
  },
  {
    id: "6",
    name: "Tinta Acrílica",
    unit: "L",
    price: 12.0,
    category: "Acabamentos",
    region: "Nacional",
    lastUpdated: "2024-01-14",
  },
  {
    id: "7",
    name: "Betão C25/30",
    unit: "m³",
    price: 85.0,
    category: "Estrutura",
    region: "Nacional",
    lastUpdated: "2024-01-11",
  },
  {
    id: "8",
    name: "Tubo PVC 110mm",
    unit: "m",
    price: 8.5,
    category: "Instalações",
    region: "Nacional",
    lastUpdated: "2024-01-09",
  },
  {
    id: "9",
    name: "Cabo Elétrico 2.5mm",
    unit: "m",
    price: 1.2,
    category: "Instalações",
    region: "Nacional",
    lastUpdated: "2024-01-13",
  },
  {
    id: "10",
    name: "Porta Interior",
    unit: "un",
    price: 120.0,
    category: "Acabamentos",
    region: "Nacional",
    lastUpdated: "2024-01-07",
  },
]

const initialObras: Obra[] = [
  {
    id: "1",
    name: "Edifício Residencial Sol Nascente",
    type: "Construção Nova",
    region: "Lisboa e Vale do Tejo",
    address: "Rua das Flores 123, 1200-123 Lisboa",
    estimatedBudget: 2500000,
    startDate: "2024-03-01",
    endDate: "2025-06-30",
    urgency: "media",
    description:
      "Construção de edifício residencial com 24 apartamentos em 6 pisos, incluindo 2 caves para estacionamento.",
    requirements: "Certificação A+ de eficiência energética, painéis solares, materiais sustentáveis.",
    contactName: "João Silva",
    contactPhone: "+351 912 345 678",
    contactEmail: "joao.silva@email.pt",
    status: "aprovado",
    progress: 85,
    createdDate: "2024-01-10",
    assignedUsers: ["2", "3"],
  },
  {
    id: "2",
    name: "Renovação Hotel Mar Azul",
    type: "Renovação",
    region: "Algarve",
    address: "Av. da Praia 456, 8000-456 Faro",
    estimatedBudget: 850000,
    startDate: "2024-04-15",
    endDate: "2024-10-30",
    urgency: "alta",
    description: "Renovação completa de hotel de 50 quartos, incluindo áreas comuns, restaurante e piscina.",
    requirements: "Manter operação parcial durante obras, materiais anti-ruído.",
    contactName: "Maria Santos",
    contactPhone: "+351 923 456 789",
    contactEmail: "maria.santos@email.pt",
    status: "em_analise",
    progress: 45,
    createdDate: "2024-01-12",
    assignedUsers: ["4"],
  },
  {
    id: "3",
    name: "Ampliação Escola Primária",
    type: "Ampliação",
    region: "Norte",
    address: "Rua da Educação 789, 4000-789 Porto",
    estimatedBudget: 450000,
    startDate: "2024-07-01",
    endDate: "2024-12-15",
    urgency: "media",
    description: "Ampliação de escola primária com novas salas de aula, ginásio e cantina.",
    requirements: "Obras durante período de férias escolares, acessibilidade total.",
    contactName: "Ana Ferreira",
    contactPhone: "+351 934 567 890",
    contactEmail: "ana.ferreira@email.pt",
    status: "pendente",
    progress: 20,
    createdDate: "2024-01-15",
    assignedUsers: [],
  },
  {
    id: "4",
    name: "Reabilitação Centro Histórico",
    type: "Reabilitação",
    region: "Centro",
    address: "Praça Velha 12, 3000-012 Coimbra",
    estimatedBudget: 1200000,
    startDate: "2024-05-01",
    endDate: "2025-03-30",
    urgency: "baixa",
    description:
      "Reabilitação de edifício histórico para uso misto: comércio no piso térreo e habitação nos pisos superiores.",
    requirements: "Aprovação DGPC, técnicas de restauro tradicionais, materiais compatíveis.",
    contactName: "Pedro Costa",
    contactPhone: "+351 945 678 901",
    contactEmail: "pedro.costa@email.pt",
    status: "info_adicional",
    progress: 60,
    createdDate: "2024-01-08",
    assignedUsers: ["2"],
  },
]

const initialBudgets: Budget[] = [
  {
    id: "1",
    name: "Orçamento Inicial",
    obraId: "1",
    obraName: "Edifício Residencial Sol Nascente",
    createdDate: "2024-01-20",
    status: "finalizado",
    items: [
      {
        id: "1",
        materialId: "1",
        materialName: "Cimento Portland",
        unit: "kg",
        quantity: 5000,
        unitPrice: 0.15,
        category: "Estrutura",
      },
      {
        id: "2",
        materialId: "3",
        materialName: "Areia Grossa",
        unit: "m³",
        quantity: 120,
        unitPrice: 45.0,
        category: "Estrutura",
      },
      {
        id: "3",
        materialId: "4",
        materialName: "Ferro CA-50 10mm",
        unit: "kg",
        quantity: 2500,
        unitPrice: 4.2,
        category: "Estrutura",
      },
    ],
  },
  {
    id: "2",
    name: "Revisão Março",
    obraId: "2",
    obraName: "Renovação Hotel Mar Azul",
    createdDate: "2024-01-25",
    status: "rascunho",
    items: [
      {
        id: "1",
        materialId: "5",
        materialName: "Azulejo 30x30",
        unit: "m²",
        quantity: 450,
        unitPrice: 18.5,
        category: "Revestimentos",
      },
      {
        id: "2",
        materialId: "6",
        materialName: "Tinta Acrílica",
        unit: "L",
        quantity: 200,
        unitPrice: 12.0,
        category: "Acabamentos",
      },
    ],
  },
]

const initialVisitas: Visita[] = [
  {
    id: "1",
    obraId: "1",
    obraName: "Edifício Residencial Sol Nascente",
    date: "2024-02-05",
    time: "10:00",
    type: "Vistoria Técnica",
    contactName: "João Silva",
    contactPhone: "+351 912 345 678",
    notes: "Verificar progresso da fundação",
    status: "agendada",
  },
  {
    id: "2",
    obraId: "2",
    obraName: "Renovação Hotel Mar Azul",
    date: "2024-01-28",
    time: "14:30",
    type: "Reunião com Cliente",
    contactName: "Maria Santos",
    contactPhone: "+351 923 456 789",
    notes: "Apresentar propostas de acabamentos",
    status: "realizada",
  },
]

const initialConcursos: Concurso[] = [
  {
    id: "1",
    title: "Construção de Centro de Saúde",
    entity: "Câmara Municipal de Lisboa",
    region: "Lisboa e Vale do Tejo",
    category: "Saúde",
    type: "Concurso Público",
    budget: 3500000,
    deadline: "2024-02-28",
    description: "Construção de novo centro de saúde com 20 gabinetes médicos, laboratório e zona de urgência.",
    status: "aberto",
    invitedUsers: [],
  },
  {
    id: "2",
    title: "Requalificação Parque Urbano",
    entity: "Câmara Municipal do Porto",
    region: "Norte",
    category: "Infraestruturas",
    type: "Concurso Limitado",
    budget: 1200000,
    deadline: "2024-03-15",
    description: "Requalificação de parque urbano incluindo caminhos pedonais, iluminação e mobiliário urbano.",
    status: "aberto",
    invitedUsers: ["2"],
  },
  {
    id: "3",
    title: "Ampliação Biblioteca Municipal",
    entity: "Câmara Municipal de Coimbra",
    region: "Centro",
    category: "Educação",
    type: "Concurso Público",
    budget: 800000,
    deadline: "2024-02-10",
    description: "Ampliação de biblioteca municipal com nova ala de arquivo e auditório.",
    status: "em_avaliacao",
    invitedUsers: ["3", "4"],
  },
]

const initialUsers: User[] = [
  {
    id: "1",
    name: "Administrador",
    email: "admin@moap.pt",
    role: "Admin",
    company: "MOAP",
    avatar: "/admin-avatar-professional.jpg",
    online: true,
    joinDate: "2023-01-01",
  },
  {
    id: "2",
    name: "Carlos Mendes",
    email: "carlos.mendes@construcao.pt",
    role: "Engenheiro Civil",
    company: "Construções Mendes",
    avatar: "/professional-man.png",
    online: true,
    joinDate: "2023-06-15",
  },
  {
    id: "3",
    name: "Sofia Almeida",
    email: "sofia.almeida@arquitetura.pt",
    role: "Arquiteta",
    company: "Atelier Almeida",
    avatar: "/professional-woman.png",
    online: false,
    joinDate: "2023-08-20",
  },
  {
    id: "4",
    name: "Ricardo Pereira",
    email: "ricardo.pereira@obras.pt",
    role: "Gestor de Obra",
    company: "Obras & Projetos",
    avatar: "/man-construction.jpg",
    online: true,
    joinDate: "2023-10-01",
  },
  {
    id: "5",
    name: "Marta Rodrigues",
    email: "marta.rodrigues@design.pt",
    role: "Designer de Interiores",
    company: "MR Design",
    avatar: "/woman-architect.png",
    online: false,
    joinDate: "2023-11-15",
  },
]

const initialConversations: Conversation[] = [
  {
    id: "conv-2",
    participantId: "2",
    participantName: "Carlos Mendes",
    participantAvatar: "/professional-man.png",
    participantRole: "Engenheiro Civil",
    lastMessage: "Os materiais já chegaram à obra?",
    lastMessageTime: "10:30",
    unread: 2,
    online: true,
  },
  {
    id: "conv-3",
    participantId: "3",
    participantName: "Sofia Almeida",
    participantAvatar: "/professional-woman.png",
    participantRole: "Arquiteta",
    lastMessage: "Enviei as alterações ao projeto",
    lastMessageTime: "Ontem",
    unread: 0,
    online: false,
  },
  {
    id: "conv-4",
    participantId: "4",
    participantName: "Ricardo Pereira",
    participantAvatar: "/man-construction.jpg",
    participantRole: "Gestor de Obra",
    lastMessage: "Reunião confirmada para amanhã",
    lastMessageTime: "09:15",
    unread: 1,
    online: true,
  },
]

const initialMessages: Record<string, Message[]> = {
  "conv-2": [
    {
      id: "m1",
      senderId: "2",
      senderName: "Carlos Mendes",
      senderAvatar: "/professional-man.png",
      receiverId: "1",
      content: "Bom dia! Gostaria de discutir o orçamento da obra Sol Nascente.",
      timestamp: "2024-01-28T09:00:00",
      read: true,
    },
    {
      id: "m2",
      senderId: "1",
      senderName: "Administrador",
      senderAvatar: "/admin-avatar-professional.jpg",
      receiverId: "2",
      content: "Bom dia Carlos! Claro, podemos agendar uma reunião?",
      timestamp: "2024-01-28T09:15:00",
      read: true,
    },
    {
      id: "m3",
      senderId: "2",
      senderName: "Carlos Mendes",
      senderAvatar: "/professional-man.png",
      receiverId: "1",
      content: "Os materiais já chegaram à obra?",
      timestamp: "2024-01-28T10:30:00",
      read: false,
    },
  ],
  "conv-3": [
    {
      id: "m4",
      senderId: "3",
      senderName: "Sofia Almeida",
      senderAvatar: "/professional-woman.png",
      receiverId: "1",
      content: "Enviei as alterações ao projeto",
      timestamp: "2024-01-27T16:00:00",
      read: true,
    },
  ],
  "conv-4": [
    {
      id: "m5",
      senderId: "4",
      senderName: "Ricardo Pereira",
      senderAvatar: "/man-construction.jpg",
      receiverId: "1",
      content: "Reunião confirmada para amanhã",
      timestamp: "2024-01-28T09:15:00",
      read: false,
    },
  ],
}

const initialNotifications: Notification[] = [
  {
    id: "n1",
    type: "obra",
    title: "Obra Aprovada",
    description: "Edifício Residencial Sol Nascente foi aprovado.",
    timestamp: "2024-01-28T10:00:00",
    read: false,
    link: "/dashboard/obras/1",
  },
  {
    id: "n2",
    type: "message",
    title: "Nova Mensagem",
    description: "Carlos Mendes enviou uma mensagem.",
    timestamp: "2024-01-28T10:30:00",
    read: false,
    link: "/dashboard/messages",
  },
  {
    id: "n3",
    type: "concurso",
    title: "Novo Concurso",
    description: "Novo concurso público disponível na sua região.",
    timestamp: "2024-01-27T14:00:00",
    read: true,
    link: "/dashboard/concursos",
  },
]

const initialInvites: Invite[] = [
  {
    id: "i1",
    email: "jose.ferreira@construcao.pt",
    name: "José Ferreira",
    role: "Empreiteiro",
    status: "enviado",
    sentDate: "2024-01-25",
    sentBy: "Administrador",
  },
  {
    id: "i2",
    email: "ana.costa@arquitetura.pt",
    name: "Ana Costa",
    role: "Arquiteta",
    status: "aceite",
    sentDate: "2024-01-20",
    sentBy: "Administrador",
  },
]

export function DataProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets)
  const [obras, setObras] = useState<Obra[]>(initialObras)
  const [visitas, setVisitas] = useState<Visita[]>(initialVisitas)
  const [concursos, setConcursos] = useState<Concurso[]>(initialConcursos)
  const [users] = useState<User[]>(initialUsers)
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [messages, setMessages] = useState<Record<string, Message[]>>(initialMessages)
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [invites, setInvites] = useState<Invite[]>(initialInvites)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("moap_data")
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.materials) setMaterials(data.materials)
        if (data.budgets) setBudgets(data.budgets)
        if (data.obras) setObras(data.obras)
        if (data.visitas) setVisitas(data.visitas)
        if (data.notifications) setNotifications(data.notifications)
        if (data.invites) setInvites(data.invites)
      } catch (e) {
        console.error("Error loading data:", e)
      }
    }
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("moap_data", JSON.stringify({ materials, budgets, obras, visitas, notifications, invites }))
  }, [materials, budgets, obras, visitas, notifications, invites])

  const generateId = () => Math.random().toString(36).substr(2, 9)

  // Materials
  const addMaterial = (material: Omit<Material, "id">) => {
    const newMaterial = { ...material, id: generateId() }
    setMaterials((prev) => [...prev, newMaterial])
    addNotification({
      type: "system",
      title: "Material Adicionado",
      description: `${material.name} foi adicionado à lista.`,
    })
  }

  const updateMaterial = (id: string, material: Partial<Material>) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...material } : m)))
  }

  const deleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id))
  }

  // Budgets
  const addBudget = (budget: Omit<Budget, "id">) => {
    const newBudget = { ...budget, id: generateId() }
    setBudgets((prev) => [...prev, newBudget])
    addNotification({ type: "budget", title: "Orçamento Criado", description: `${budget.name} foi criado.` })
  }

  const updateBudget = (id: string, budget: Partial<Budget>) => {
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...budget } : b)))
  }

  const deleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id))
  }

  // Obras
  const addObra = (obra: Omit<Obra, "id" | "status" | "progress" | "createdDate" | "assignedUsers">) => {
    const newObra: Obra = {
      ...obra,
      id: generateId(),
      status: "pendente",
      progress: 0,
      createdDate: new Date().toISOString().split("T")[0],
      assignedUsers: [],
    }
    setObras((prev) => [...prev, newObra])
    addNotification({
      type: "obra",
      title: "Nova Obra Submetida",
      description: `${obra.name} foi submetida para análise.`,
    })
  }

  const updateObra = (id: string, obra: Partial<Obra>) => {
    setObras((prev) => prev.map((o) => (o.id === id ? { ...o, ...obra } : o)))
  }

  const deleteObra = (id: string) => {
    setObras((prev) => prev.filter((o) => o.id !== id))
  }

  // Visitas
  const addVisita = (visita: Omit<Visita, "id" | "status">) => {
    const newVisita: Visita = { ...visita, id: generateId(), status: "agendada" }
    setVisitas((prev) => [...prev, newVisita])
    addNotification({
      type: "visit",
      title: "Visita Agendada",
      description: `Visita a ${visita.obraName} agendada para ${visita.date}.`,
    })
  }

  const updateVisita = (id: string, visita: Partial<Visita>) => {
    setVisitas((prev) => prev.map((v) => (v.id === id ? { ...v, ...visita } : v)))
  }

  const deleteVisita = (id: string) => {
    setVisitas((prev) => prev.filter((v) => v.id !== id))
  }

  // Concursos
  const inviteUserToConcurso = (concursoId: string, userId: string) => {
    setConcursos((prev) =>
      prev.map((c) => (c.id === concursoId ? { ...c, invitedUsers: [...c.invitedUsers, userId] } : c)),
    )
    const concurso = concursos.find((c) => c.id === concursoId)
    const user = users.find((u) => u.id === userId)
    if (concurso && user) {
      addNotification({
        type: "concurso",
        title: "Convite Enviado",
        description: `${user.name} foi convidado para ${concurso.title}.`,
      })
    }
  }

  // Messages
  const sendMessage = (conversationId: string, content: string) => {
    const newMessage: Message = {
      id: generateId(),
      senderId: "1",
      senderName: "Administrador",
      senderAvatar: "/admin-avatar-professional.jpg",
      receiverId: conversations.find((c) => c.id === conversationId)?.participantId || "",
      content,
      timestamp: new Date().toISOString(),
      read: true,
    }

    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage],
    }))

    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, lastMessage: content, lastMessageTime: "Agora" } : c)),
    )
  }

  const markConversationAsRead = (conversationId: string) => {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)))
    setMessages((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map((m) => ({ ...m, read: true })),
    }))
  }

  // Notifications
  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date().toISOString(),
      read: false,
    }
    setNotifications((prev) => [newNotification, ...prev])
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  // Invites
  const sendInvite = (email: string, name?: string, role?: string) => {
    const newInvite: Invite = {
      id: generateId(),
      email,
      name,
      role,
      status: "enviado",
      sentDate: new Date().toISOString().split("T")[0],
      sentBy: "Administrador",
    }
    setInvites((prev) => [...prev, newInvite])
    addNotification({ type: "system", title: "Convite Enviado", description: `Convite enviado para ${email}.` })
  }

  const sendBulkInvites = (emails: string[]) => {
    const newInvites = emails.map((email) => ({
      id: generateId(),
      email,
      status: "enviado" as const,
      sentDate: new Date().toISOString().split("T")[0],
      sentBy: "Administrador",
    }))
    setInvites((prev) => [...prev, ...newInvites])
    addNotification({ type: "system", title: "Convites Enviados", description: `${emails.length} convites enviados.` })
  }

  return (
    <DataContext.Provider
      value={{
        materials,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        budgets,
        addBudget,
        updateBudget,
        deleteBudget,
        obras,
        addObra,
        updateObra,
        deleteObra,
        visitas,
        addVisita,
        updateVisita,
        deleteVisita,
        concursos,
        inviteUserToConcurso,
        conversations,
        messages,
        sendMessage,
        markConversationAsRead,
        users,
        notifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        invites,
        sendInvite,
        sendBulkInvites,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
