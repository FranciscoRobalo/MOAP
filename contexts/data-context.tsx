"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Types
export interface Material {
  id: string
  name: string
  unit: string
  price: number
  category: string
  type: "material" | "work"
  region?: string
  lastUpdated?: string // Added lastUpdated field to track price sync
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

// Updated Obra interface
export interface Obra {
  id: string
  title: string
  client: string
  location: string
  category: string
  budget: number
  startDate: string
  endDate: string
  status: "pending" | "approved" | "in-analysis" | "info-needed" | "rejected"
  description: string
  area?: string
  type?: string
  timeline?: string
  contact?: {
    name: string
    email: string
    phone: string
  }
  progress?: number
  documents?: string[]
  createdAt: string
  updatedAt: string
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

// Renamed Invites to Invitations and updated fields
export interface Invite {
  id: string
  email: string
  name?: string
  role?: string
  status: "enviado" | "aceite" | "expirado"
  sentDate: string
  sentBy: string
}

// Renamed Invitation interface
export interface Invitation {
  id: string
  email: string
  name?: string
  role?: string
  status: "pending" | "accepted" | "expired"
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
  addObra: (obra: Omit<Obra, "id" | "createdAt" | "updatedAt">) => void
  updateObra: (id: string, obra: Partial<Obra>) => void
  deleteObra: (id: string) => void

  // Visitas
  visitas: Visita[]
  addVisita: (visita: Omit<Visita, "id">) => void
  updateVisita: (id: string, visita: Partial<Visita>) => void
  deleteVisita: (id: string) => void
  // Added cancelVisita
  cancelVisita: (id: string) => void

  // Concursos
  concursos: Concurso[]
  inviteUserToConcurso: (concursoId: string, userId: string) => void

  // Messages
  // Changed messages type to Message[]
  messages: Message[]
  conversations: Conversation[]
  // Renamed sendMessage to addMessage and updated signature
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void
  // Renamed markConversationAsRead to markAsRead
  markAsRead: (conversationId: string) => void

  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  // Added deleteNotification
  deleteNotification: (id: string) => void

  // Invites
  // Renamed invites to invitations and updated type
  invitations: Invite[]
  // Renamed sendInvite to addInvitation
  addInvitation: (invitation: Omit<Invite, "id" | "sentDate">) => void
  // Renamed sendBulkInvites to addBulkInvitations
  addBulkInvitations: (invitations: Omit<Invite, "id" | "sentDate">[]) => void
  // Added updateInvitationStatus
  updateInvitationStatus: (id: string, status: Invite["status"]) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const initialMaterials: Material[] = [
  // MATERIALS - Estrutura
  {
    id: "m1",
    name: "Cimento Portland",
    unit: "kg",
    price: 0.15,
    category: "Estrutura",
    type: "material",
    region: "Nacional",
    lastUpdated: "2024-01-15",
  },
  {
    id: "m2",
    name: "Betão C25/30",
    unit: "m³",
    price: 85.0,
    category: "Estrutura",
    type: "material",
    region: "Nacional",
    lastUpdated: "2024-01-11",
  },
  {
    id: "m3",
    name: "Areia Grossa",
    unit: "m³",
    price: 45.0,
    category: "Estrutura",
    type: "material",
    region: "Lisboa",
    lastUpdated: "2024-01-10",
  },
  {
    id: "m4",
    name: "Ferro CA-50 10mm",
    unit: "kg",
    price: 4.2,
    category: "Estrutura",
    type: "material",
    region: "Nacional",
    lastUpdated: "2024-01-12",
  },
  {
    id: "m5",
    name: "Betão Celular",
    unit: "m³",
    price: 320.0,
    category: "Estrutura",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m6",
    name: "Estrutura LSF (aço leve)",
    unit: "m²",
    price: 42.5,
    category: "Estrutura",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m7",
    name: "Painel Sandwich 70mm",
    unit: "m²",
    price: 35.0,
    category: "Estrutura",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // MATERIALS - Alvenaria
  {
    id: "m10",
    name: "Tijolo Cerâmico 30x20x15",
    unit: "un",
    price: 0.45,
    category: "Alvenaria",
    type: "material",
    region: "Nacional",
    lastUpdated: "2024-01-15",
  },
  {
    id: "m11",
    name: "Bloco de Betão",
    unit: "un",
    price: 1.8,
    category: "Alvenaria",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // MATERIALS - Revestimentos
  {
    id: "m20",
    name: "Azulejo 30x30",
    unit: "m²",
    price: 18.5,
    category: "Revestimentos",
    type: "material",
    region: "Norte",
    lastUpdated: "2024-01-08",
  },
  {
    id: "m21",
    name: "Azulejo 60x60 Beige Elovolution (Magres)",
    unit: "m²",
    price: 35.0,
    category: "Revestimentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m22",
    name: "Mosaico Terracota Algarvio 30x30",
    unit: "m²",
    price: 25.0,
    category: "Revestimentos",
    type: "material",
    region: "Sul",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m23",
    name: "Pedra Lioz",
    unit: "m²",
    price: 124.56,
    category: "Revestimentos",
    type: "material",
    region: "Lisboa",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m24",
    name: "Stone Panel Ardósia",
    unit: "m²",
    price: 87.19,
    category: "Revestimentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m25",
    name: "Sistema ETICS 8cm",
    unit: "m²",
    price: 42.5,
    category: "Revestimentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m26",
    name: "Placas OSB",
    unit: "m²",
    price: 15.0,
    category: "Revestimentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // MATERIALS - Pavimentos
  {
    id: "m30",
    name: "Pavimento Vinílico Flutuante",
    unit: "m²",
    price: 35.0,
    category: "Pavimentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m31",
    name: "Soalho Pinho Nacional 14mm",
    unit: "m²",
    price: 42.0,
    category: "Pavimentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m32",
    name: "Deck Casquinha Thermowood",
    unit: "m²",
    price: 72.24,
    category: "Pavimentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m33",
    name: "Rodapé MDF Hidrófugo Lacado",
    unit: "ml",
    price: 15.57,
    category: "Pavimentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m34",
    name: "Rodapé PVC",
    unit: "ml",
    price: 4.5,
    category: "Pavimentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // MATERIALS - Isolamentos
  {
    id: "m40",
    name: "XPS 80mm",
    unit: "m²",
    price: 12.5,
    category: "Isolamentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m41",
    name: "Lã de Rocha 200mm 40kg",
    unit: "m²",
    price: 18.0,
    category: "Isolamentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m42",
    name: "Tela Betuminosa Polyplas 30",
    unit: "m²",
    price: 8.5,
    category: "Isolamentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m43",
    name: "Manta Térmica Cobertura",
    unit: "m²",
    price: 12.0,
    category: "Isolamentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // MATERIALS - Pinturas
  {
    id: "m50",
    name: "Tinta Acrílica Exterior",
    unit: "L",
    price: 12.0,
    category: "Pinturas",
    type: "material",
    region: "Nacional",
    lastUpdated: "2024-01-14",
  },
  {
    id: "m51",
    name: "Tinta Plástica Interior",
    unit: "L",
    price: 8.5,
    category: "Pinturas",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m52",
    name: "Primário de Aderência",
    unit: "L",
    price: 6.0,
    category: "Pinturas",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // MATERIALS - Instalações
  {
    id: "m60",
    name: "Tubo PVC 110mm",
    unit: "m",
    price: 8.5,
    category: "Instalações",
    type: "material",
    region: "Nacional",
    lastUpdated: "2024-01-09",
  },
  {
    id: "m61",
    name: "Tubo Multicamada",
    unit: "m",
    price: 4.2,
    category: "Instalações",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m62",
    name: "Cabo Elétrico 2.5mm",
    unit: "m",
    price: 1.2,
    category: "Instalações",
    type: "material",
    region: "Nacional",
    lastUpdated: "2024-01-13",
  },
  {
    id: "m63",
    name: "Tubo Cobre DN22 Revestido PVC",
    unit: "m",
    price: 8.5,
    category: "Instalações",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // MATERIALS - Carpintarias
  {
    id: "m70",
    name: "Porta Interior MDF Lacada",
    unit: "un",
    price: 708.0,
    category: "Carpintarias",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m71",
    name: "Porta Correr MDF com Cassete",
    unit: "un",
    price: 1208.32,
    category: "Carpintarias",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m72",
    name: "Armário MDF Lacado",
    unit: "ml",
    price: 350.0,
    category: "Carpintarias",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // MATERIALS - Caixilharias
  {
    id: "m80",
    name: "Caixilharia Alumínio Corte Térmico",
    unit: "m²",
    price: 285.0,
    category: "Caixilharias",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m81",
    name: "Porta Entrada Pivotante Alumínio",
    unit: "un",
    price: 4094.6,
    category: "Caixilharias",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m82",
    name: "Caixilharia PVC",
    unit: "m²",
    price: 180.0,
    category: "Caixilharias",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // MATERIALS - Loiças Sanitárias
  {
    id: "m90",
    name: "Sanita Suspensa Roca Vitoria",
    unit: "un",
    price: 480.8,
    category: "Loiças",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m91",
    name: "Lavatório Roca Round 40",
    unit: "un",
    price: 255.35,
    category: "Loiças",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m92",
    name: "Base Duche 1400x700 Sanindusa",
    unit: "un",
    price: 747.36,
    category: "Loiças",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m93",
    name: "Banheira Acrílica Retangular",
    unit: "un",
    price: 700.0,
    category: "Loiças",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m94",
    name: "Misturadora Duche Bruma Lusa",
    unit: "un",
    price: 411.05,
    category: "Loiças",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m95",
    name: "Torneira Lavatório Roca",
    unit: "un",
    price: 173.14,
    category: "Loiças",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m96",
    name: "Móvel Lavatório Roca Tenet",
    unit: "un",
    price: 450.0,
    category: "Loiças",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // MATERIALS - Equipamentos
  {
    id: "m100",
    name: "Depósito Painéis Solares 300L",
    unit: "un",
    price: 2914.6,
    category: "Equipamentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m101",
    name: "Termoacumulador 300L",
    unit: "un",
    price: 4733.28,
    category: "Equipamentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m102",
    name: "Sistema VMC (Ventilação Mecânica)",
    unit: "un",
    price: 2500.0,
    category: "Equipamentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m103",
    name: "Fossa Sética 4000L",
    unit: "un",
    price: 1800.0,
    category: "Equipamentos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // MATERIALS - Tetos Falsos
  {
    id: "m110",
    name: "Gesso Cartonado Standard 13mm",
    unit: "m²",
    price: 23.67,
    category: "Tetos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "m111",
    name: "Gesso Cartonado Hidrófugo",
    unit: "m²",
    price: 26.16,
    category: "Tetos",
    type: "material",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // WORKS - Demolições e Movimentação
  {
    id: "w1",
    name: "Demolição de Cobertura Existente",
    unit: "vg",
    price: 4900.0,
    category: "Demolições",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w2",
    name: "Demolição de Paredes Interiores",
    unit: "vg",
    price: 5300.0,
    category: "Demolições",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w3",
    name: "Picagem de Revestimentos",
    unit: "vg",
    price: 2400.0,
    category: "Demolições",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w4",
    name: "Movimentação e Recolha de Entulho",
    unit: "vg",
    price: 4000.0,
    category: "Demolições",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w5",
    name: "Transporte a Vazadouro",
    unit: "vg",
    price: 2643.2,
    category: "Demolições",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // WORKS - Estaleiro
  {
    id: "w10",
    name: "Montagem e Desmontagem de Estaleiro",
    unit: "vg",
    price: 1180.0,
    category: "Estaleiro",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w11",
    name: "Manutenção de Estaleiro",
    unit: "mês",
    price: 177.0,
    category: "Estaleiro",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w12",
    name: "Montagem e Manutenção de Andaimes",
    unit: "vg",
    price: 4720.0,
    category: "Estaleiro",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w13",
    name: "Direção de Obra com Alvará",
    unit: "mês",
    price: 146.02,
    category: "Estaleiro",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // WORKS - Estruturas
  {
    id: "w20",
    name: "Execução Estrutura Laje Betão",
    unit: "vg",
    price: 7080.0,
    category: "Estrutura",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w21",
    name: "Execução Estrutura Escada Betão",
    unit: "vg",
    price: 3540.0,
    category: "Estrutura",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w22",
    name: "Execução Estrutura LSF",
    unit: "vg",
    price: 64310.0,
    category: "Estrutura",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w23",
    name: "Execução Estrutura Metálica Mezzanine",
    unit: "vg",
    price: 7965.0,
    category: "Estrutura",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // WORKS - Alvenarias
  {
    id: "w30",
    name: "Execução Muros Alvenaria Tijolo",
    unit: "ml",
    price: 149.47,
    category: "Alvenaria",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w31",
    name: "Execução Paredes Alvenaria",
    unit: "m²",
    price: 29.89,
    category: "Alvenaria",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w32",
    name: "Criação Paredes Divisórias",
    unit: "vg",
    price: 4600.0,
    category: "Alvenaria",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w33",
    name: "Abertura e Tapamento de Roços",
    unit: "vg",
    price: 3540.0,
    category: "Alvenaria",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // WORKS - Revestimentos
  {
    id: "w40",
    name: "Execução Reboco Estuque Paredes",
    unit: "m²",
    price: 12.46,
    category: "Revestimentos",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w41",
    name: "Aplicação Cerâmica Parede",
    unit: "m²",
    price: 27.28,
    category: "Revestimentos",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w42",
    name: "Aplicação Stone Panel",
    unit: "m²",
    price: 45.0,
    category: "Revestimentos",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w43",
    name: "Reboco Cimentício Hidrófugo",
    unit: "m²",
    price: 18.5,
    category: "Revestimentos",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // WORKS - Pavimentos
  {
    id: "w50",
    name: "Betonilha Regularização",
    unit: "m²",
    price: 15.0,
    category: "Pavimentos",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w51",
    name: "Aplicação Auto-nivelante",
    unit: "m²",
    price: 12.5,
    category: "Pavimentos",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w52",
    name: "Assentamento Pavimento Cerâmico",
    unit: "m²",
    price: 25.0,
    category: "Pavimentos",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w53",
    name: "Assentamento Soalho Madeira",
    unit: "m²",
    price: 35.0,
    category: "Pavimentos",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w54",
    name: "Recuperação Pavimento Existente",
    unit: "vg",
    price: 3751.75,
    category: "Pavimentos",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // WORKS - Pinturas
  {
    id: "w60",
    name: "Pintura Paredes Interiores",
    unit: "vg",
    price: 7249.39,
    category: "Pinturas",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w61",
    name: "Pintura Fachadas Exteriores",
    unit: "vg",
    price: 10500.0,
    category: "Pinturas",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w62",
    name: "Pintura Tetos",
    unit: "vg",
    price: 3985.92,
    category: "Pinturas",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // WORKS - Tetos
  {
    id: "w70",
    name: "Execução Teto Falso Gesso Cartonado",
    unit: "m²",
    price: 23.67,
    category: "Tetos",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w71",
    name: "Teto Falso com Isolamento Acústico",
    unit: "vg",
    price: 5500.0,
    category: "Tetos",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // WORKS - Coberturas
  {
    id: "w80",
    name: "Execução Cobertura Horizontal Impermeabilizada",
    unit: "vg",
    price: 6608.0,
    category: "Cobertura",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w81",
    name: "Execução Cobertura Inclinada",
    unit: "vg",
    price: 10384.0,
    category: "Cobertura",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w82",
    name: "Assentamento Telhas",
    unit: "vg",
    price: 7000.0,
    category: "Cobertura",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w83",
    name: "Instalação Calhas e Condutores",
    unit: "vg",
    price: 1500.0,
    category: "Cobertura",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // WORKS - Instalações
  {
    id: "w90",
    name: "Execução Rede Água Quente e Fria",
    unit: "vg",
    price: 6228.0,
    category: "Instalações",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w91",
    name: "Execução Rede Esgotos Domésticos",
    unit: "vg",
    price: 2678.04,
    category: "Instalações",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w92",
    name: "Execução Rede Elétrica Completa",
    unit: "vg",
    price: 8844.1,
    category: "Instalações",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w93",
    name: "Execução Rede ITED",
    unit: "vg",
    price: 4690.5,
    category: "Instalações",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w94",
    name: "Execução Rede Gás",
    unit: "vg",
    price: 1494.72,
    category: "Instalações",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w95",
    name: "Pré-instalação Ar Condicionado",
    unit: "ponto",
    price: 354.0,
    category: "Instalações",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // WORKS - Montagens
  {
    id: "w100",
    name: "Montagem Loiças Sanitárias",
    unit: "wc",
    price: 1062.0,
    category: "Montagens",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w101",
    name: "Montagem Caixilharias",
    unit: "vg",
    price: 2500.0,
    category: "Montagens",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w102",
    name: "Montagem Carpintarias",
    unit: "vg",
    price: 1800.0,
    category: "Montagens",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w103",
    name: "Montagem Sistema Painéis Solares",
    unit: "un",
    price: 1500.0,
    category: "Montagens",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },

  // WORKS - Certificações e Limpezas
  {
    id: "w110",
    name: "Certificação Instalação Elétrica",
    unit: "vg",
    price: 177.0,
    category: "Certificações",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w111",
    name: "Certificação ITED",
    unit: "vg",
    price: 177.0,
    category: "Certificações",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
  {
    id: "w112",
    name: "Limpeza Final de Obra",
    unit: "vg",
    price: 944.0,
    category: "Limpezas",
    type: "work",
    region: "Nacional",
    lastUpdated: "2025-01-15",
  },
]

const initialObras: Obra[] = [
  {
    id: "1",
    title: "Moradia Cobre - Reabilitação",
    client: "João Bilbao",
    location: "Cobre, Portugal",
    category: "Residencial",
    budget: 236749.95,
    startDate: "2021-10-21",
    endDate: "2022-04-21",
    status: "approved",
    description: "Reabilitação total de moradia incluindo estrutura, coberturas, instalações e acabamentos",
    area: "280m²",
    type: "Reabilitação",
    timeline: "6 meses",
    progress: 100,
    createdAt: "2021-10-01T10:00:00Z",
    updatedAt: "2022-04-21T15:30:00Z",
  },
  {
    id: "2",
    title: "Moradia Colares - Bruno Ferreira",
    client: "Bruno Ferreira",
    location: "Rua dos Depósitos de Água 49, Sintra",
    category: "Residencial",
    budget: 355497.92,
    startDate: "2024-12-01",
    endDate: "2025-12-01",
    status: "in-analysis",
    description: "Construção de moradia inacabada com estrutura LSF, instalações completas e acabamentos",
    area: "320m²",
    type: "Construção Nova",
    timeline: "12 meses",
    progress: 15,
    createdAt: "2024-11-18T09:00:00Z",
    updatedAt: "2024-11-18T14:20:00Z",
  },
  {
    id: "3",
    title: "Moradia Quinta do Anjo",
    client: "Bernardo Rico",
    location: "Rua Miguel Cândido 46C, Quinta do Anjo",
    category: "Residencial",
    budget: 157540.0,
    startDate: "2025-03-15",
    endDate: "2025-09-15",
    status: "pending",
    description: "Remodelação de moradia e anexo incluindo demolições, instalações e acabamentos",
    area: "180m²",
    type: "Remodelação",
    timeline: "6 meses",
    progress: 0,
    contact: {
      name: "Bernardo Rico",
      email: "bernardo.rico@email.com",
      phone: "+351 912 345 678",
    },
    createdAt: "2025-03-09T11:30:00Z",
    updatedAt: "2025-03-09T11:30:00Z",
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

// Updated initialMessages structure
const initialMessages: Message[] = [
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
]

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

// Renamed initialInvites to initialInvitations
const initialInvitations: Invite[] = [
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
  // Changed messages state to Message[]
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  // Renamed invites to invitations
  const [invitations, setInvitations] = useState<Invite[]>(initialInvitations)

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
        // Updated localStorage loading for invitations
        if (data.invitations) setInvitations(data.invitations)
      } catch (e) {
        console.error("Error loading data:", e)
      }
    }
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(
      "moap_data",
      JSON.stringify({ materials, budgets, obras, visitas, notifications, invitations }),
    )
  }, [materials, budgets, obras, visitas, notifications, invitations])

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
  const addObra = (obra: Omit<Obra, "id" | "createdAt" | "updatedAt">) => {
    const newObra: Obra = {
      ...obra,
      id: generateId(),
      // Updated default status and timestamps
      status: "pending",
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setObras((prev) => [...prev, newObra])
    addNotification({
      type: "obra",
      title: "Nova Obra Submetida",
      description: `${obra.title} foi submetida para análise.`,
    })
  }

  const updateObra = (id: string, obra: Partial<Obra>) => {
    setObras((prev) => prev.map((o) => (o.id === id ? { ...o, ...obra, updatedAt: new Date().toISOString() } : o)))
  }

  const deleteObra = (id: string) => {
    setObras((prev) => prev.filter((o) => o.id !== id))
  }

  // Visitas
  const addVisita = (visita: Omit<Visita, "id">) => {
    // Removed default status from here, it's handled in the UI or by initial data
    const newVisita: Visita = { ...visita, id: generateId() }
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

  // Added cancelVisita
  const cancelVisita = (id: string) => {
    setVisitas((prev) => prev.map((v) => (v.id === id ? { ...v, status: "cancelada" } : v)))
    addNotification({
      type: "visit",
      title: "Visita Cancelada",
      description: `A visita com o ID ${id} foi cancelada.`,
    })
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
  // Renamed sendMessage to addMessage
  const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: new Date().toISOString(),
      read: false, // New messages are initially unread by the receiver
    }

    // Find the conversation this message belongs to
    let conversationId = ""
    if (message.senderId === "1") {
      // Assuming "1" is the current user's ID
      conversationId = conversations.find((c) => c.participantId === message.receiverId)?.id || ""
    } else {
      conversationId = conversations.find((c) => c.participantId === message.senderId)?.id || ""
    }

    setMessages((prev) => [...prev, newMessage])

    // Update conversation if it exists, otherwise create a new one (simplified here)
    if (conversationId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: message.content,
                lastMessageTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                unread: c.online ? c.unread : c.unread + 1, // Increment unread if participant is offline
              }
            : c,
        ),
      )
    }
  }

  // Renamed markConversationAsRead to markAsRead
  const markAsRead = (conversationId: string) => {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)))
    setMessages((prev) =>
      prev.map((m) =>
        // Mark as read only if the message belongs to the specified conversation and is not from the current user
        m.id.startsWith("conv-") && m.id.split("-")[1] === conversationId.split("-")[1] && m.senderId !== "1"
          ? { ...m, read: true }
          : m,
      ),
    )
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

  // Added deleteNotification
  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Invites
  // Renamed sendInvite to addInvitation
  const addInvitation = (invitation: Omit<Invite, "id" | "sentDate">) => {
    const newInvitation: Invite = {
      ...invitation,
      id: generateId(),
      sentDate: new Date().toISOString().split("T")[0],
      status: "enviado", // Default status
    }
    setInvitations((prev) => [...prev, newInvitation])
    addNotification({
      type: "system",
      title: "Convite Enviado",
      description: `Convite enviado para ${invitation.email}.`,
    })
  }

  // Renamed sendBulkInvites to addBulkInvitations
  const addBulkInvitations = (invitationsData: Omit<Invite, "id" | "sentDate">[]) => {
    const newInvitations = invitationsData.map((inv) => ({
      ...inv,
      id: generateId(),
      sentDate: new Date().toISOString().split("T")[0],
      status: "enviado" as const,
    }))
    setInvitations((prev) => [...prev, ...newInvitations])
    addNotification({
      type: "system",
      title: "Convites Enviados",
      description: `${invitationsData.length} convites enviados.`,
    })
  }

  // Added updateInvitationStatus
  const updateInvitationStatus = (id: string, status: Invite["status"]) => {
    setInvitations((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status } : inv)))
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
        cancelVisita, // Added cancelVisita
        concursos,
        inviteUserToConcurso,
        conversations,
        messages, // Changed messages state
        addMessage, // Renamed sendMessage
        markAsRead, // Renamed markConversationAsRead
        users,
        notifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification, // Added deleteNotification
        invitations, // Renamed invites
        addInvitation, // Renamed sendInvite
        addBulkInvitations, // Renamed sendBulkInvites
        updateInvitationStatus, // Added updateInvitationStatus
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
