"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface TutorialStep {
  id: string
  target: string // CSS selector or element ID
  title: string
  content: string
  placement: "top" | "bottom" | "left" | "right" | "center"
  page?: string // Which page this step belongs to
  action?: string // Optional action hint
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    target: "body",
    title: "Bem-vindo ao MOAP!",
    content:
      "Vamos guiá-lo através das funcionalidades principais da plataforma. Este tutorial irá ajudá-lo a entender como usar o MOAP para gerir as suas obras e orçamentos.",
    placement: "center",
    page: "/dashboard",
  },
  {
    id: "overview-stats",
    target: "[data-tutorial='stats']",
    title: "Visão Geral",
    content:
      "Aqui pode ver um resumo rápido das suas obras, orçamentos, visitas agendadas e mensagens. Clique em qualquer cartão para ver mais detalhes.",
    placement: "bottom",
    page: "/dashboard",
  },
  {
    id: "quick-actions",
    target: "[data-tutorial='quick-actions']",
    title: "Ações Rápidas",
    content: "Use estes atalhos para criar rapidamente uma nova obra, orçamento ou agendar uma visita técnica.",
    placement: "top",
    page: "/dashboard",
  },
  {
    id: "sidebar-nav",
    target: "[data-tutorial='sidebar']",
    title: "Menu de Navegação",
    content:
      "O menu lateral permite aceder a todas as secções da plataforma. Vamos explorar a criação de uma nova obra.",
    placement: "right",
    page: "/dashboard",
    action: "Clique em 'Nova Obra' para continuar",
  },
  {
    id: "nova-obra-form",
    target: "[data-tutorial='obra-form']",
    title: "Formulário de Nova Obra",
    content:
      "Preencha os dados do seu projeto aqui. Inclua informações como nome, localização, tipo de obra e orçamento estimado.",
    placement: "right",
    page: "/dashboard/obras/nova",
  },
  {
    id: "nova-obra-details",
    target: "[data-tutorial='obra-details']",
    title: "Detalhes do Projeto",
    content: "Forneça uma descrição detalhada e especifique as datas de início e fim previstas.",
    placement: "left",
    page: "/dashboard/obras/nova",
  },
  {
    id: "nova-obra-submit",
    target: "[data-tutorial='obra-submit']",
    title: "Submeter Obra",
    content: "Após preencher todos os campos, clique aqui para submeter a sua obra para análise.",
    placement: "top",
    page: "/dashboard/obras/nova",
    action: "Preencha o formulário e submeta",
  },
  {
    id: "analise-intro",
    target: "[data-tutorial='analise-upload']",
    title: "Análise de Orçamentos",
    content:
      "Carregue um ficheiro CSV com o seu orçamento. O sistema irá comparar os preços com a nossa base de dados e dar-lhe uma classificação.",
    placement: "bottom",
    page: "/dashboard/analise",
  },
  {
    id: "analise-format",
    target: "[data-tutorial='analise-format']",
    title: "Formato do Ficheiro",
    content:
      "O ficheiro CSV deve conter colunas para: Nome do item, Unidade, Quantidade e Preço. O sistema aceita vários formatos.",
    placement: "top",
    page: "/dashboard/analise",
  },
  {
    id: "analise-results",
    target: "[data-tutorial='analise-results']",
    title: "Resultados da Análise",
    content:
      "Após o upload, verá uma tabela com todos os itens analisados. As cores indicam se os preços estão abaixo (verde), na média (amarelo), acima (laranja) ou muito acima (vermelho) dos valores de referência.",
    placement: "top",
    page: "/dashboard/analise",
    action: "Carregue um CSV para ver os resultados",
  },
  {
    id: "messages-intro",
    target: "[data-tutorial='messages']",
    title: "Mensagens",
    content: "Comunique com outros utilizadores e técnicos através do sistema de mensagens integrado.",
    placement: "right",
    page: "/dashboard/messages",
  },
  {
    id: "tutorial-complete",
    target: "body",
    title: "Tutorial Completo!",
    content:
      "Parabéns! Agora conhece as funcionalidades principais do MOAP. Pode sempre reiniciar este tutorial nas definições.",
    placement: "center",
    page: "/dashboard",
  },
]

interface TutorialContextType {
  isActive: boolean
  currentStep: number
  currentStepData: TutorialStep | null
  totalSteps: number
  startTutorial: () => void
  endTutorial: () => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  skipTutorial: () => void
  hasCompletedTutorial: boolean
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem("moap_tutorial_completed")
    if (completed === "true") {
      setHasCompletedTutorial(true)
    }
  }, [])

  const startTutorial = () => {
    setIsActive(true)
    setCurrentStep(0)
  }

  const endTutorial = () => {
    setIsActive(false)
    setHasCompletedTutorial(true)
    localStorage.setItem("moap_tutorial_completed", "true")
  }

  const nextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      endTutorial()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const goToStep = (step: number) => {
    if (step >= 0 && step < TUTORIAL_STEPS.length) {
      setCurrentStep(step)
    }
  }

  const skipTutorial = () => {
    setIsActive(false)
    setHasCompletedTutorial(true)
    localStorage.setItem("moap_tutorial_completed", "true")
  }

  const currentStepData = isActive ? TUTORIAL_STEPS[currentStep] : null

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        currentStepData,
        totalSteps: TUTORIAL_STEPS.length,
        startTutorial,
        endTutorial,
        nextStep,
        prevStep,
        goToStep,
        skipTutorial,
        hasCompletedTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const context = useContext(TutorialContext)
  if (context === undefined) {
    throw new Error("useTutorial must be used within a TutorialProvider")
  }
  return context
}

export { TUTORIAL_STEPS }
