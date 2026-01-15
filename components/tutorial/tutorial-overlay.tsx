"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTutorial } from "@/contexts/tutorial-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { X, ChevronLeft, ChevronRight, SkipForward, Lightbulb } from "lucide-react"

export function TutorialOverlay() {
  const { user } = useAuth()
  const {
    isActive,
    currentStep,
    currentStepData,
    totalSteps,
    nextStep,
    prevStep,
    skipTutorial,
    startTutorial,
    hasCompletedTutorial,
  } = useTutorial()
  const pathname = usePathname()
  const router = useRouter()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [showStartPrompt, setShowStartPrompt] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null)

  // Show tutorial start prompt for public users who haven't completed it
  useEffect(() => {
    if (user?.role === "public" && !hasCompletedTutorial && !isActive) {
      const timer = setTimeout(() => {
        setShowStartPrompt(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [user, hasCompletedTutorial, isActive])

  // Find and highlight target element
  const updateTargetPosition = useCallback(() => {
    if (!currentStepData || currentStepData.placement === "center") {
      setTargetRect(null)
      setTooltipPosition(null)
      return
    }

    const target = document.querySelector(currentStepData.target)
    if (target) {
      const rect = target.getBoundingClientRect()
      setTargetRect(rect)

      const padding = 16
      const tooltipWidth = 380
      const tooltipHeight = 280
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let top = 0
      let left = 0
      let actualPlacement = currentStepData.placement

      // Check if preferred placement fits, otherwise find best alternative
      const fitsTop = rect.top - tooltipHeight - padding > 0
      const fitsBottom = rect.bottom + tooltipHeight + padding < viewportHeight
      const fitsLeft = rect.left - tooltipWidth - padding > 0
      const fitsRight = rect.right + tooltipWidth + padding < viewportWidth

      // Determine best placement
      if (actualPlacement === "top" && !fitsTop) {
        actualPlacement = fitsBottom ? "bottom" : fitsRight ? "right" : "left"
      } else if (actualPlacement === "bottom" && !fitsBottom) {
        actualPlacement = fitsTop ? "top" : fitsRight ? "right" : "left"
      } else if (actualPlacement === "left" && !fitsLeft) {
        actualPlacement = fitsRight ? "right" : fitsBottom ? "bottom" : "top"
      } else if (actualPlacement === "right" && !fitsRight) {
        actualPlacement = fitsLeft ? "left" : fitsBottom ? "bottom" : "top"
      }

      switch (actualPlacement) {
        case "top":
          top = rect.top - tooltipHeight - padding
          left = rect.left + rect.width / 2 - tooltipWidth / 2
          break
        case "bottom":
          top = rect.bottom + padding
          left = rect.left + rect.width / 2 - tooltipWidth / 2
          break
        case "left":
          top = rect.top + rect.height / 2 - tooltipHeight / 2
          left = rect.left - tooltipWidth - padding
          break
        case "right":
          top = rect.top + rect.height / 2 - tooltipHeight / 2
          left = rect.right + padding
          break
      }

      // Clamp to viewport boundaries with safe margins
      top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding))
      left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding))

      setTooltipPosition({ top, left })
    } else {
      setTargetRect(null)
      setTooltipPosition(null)
    }
  }, [currentStepData])

  useEffect(() => {
    if (isActive) {
      updateTargetPosition()
      window.addEventListener("resize", updateTargetPosition)
      window.addEventListener("scroll", updateTargetPosition)

      const observer = new MutationObserver(updateTargetPosition)
      observer.observe(document.body, { childList: true, subtree: true })

      return () => {
        window.removeEventListener("resize", updateTargetPosition)
        window.removeEventListener("scroll", updateTargetPosition)
        observer.disconnect()
      }
    }
  }, [isActive, currentStepData, updateTargetPosition])

  // Navigate to correct page if needed
  useEffect(() => {
    if (isActive && currentStepData?.page && pathname !== currentStepData.page) {
      router.push(currentStepData.page)
    }
  }, [isActive, currentStepData, pathname, router])

  const getTooltipStyle = (): React.CSSProperties => {
    if (!currentStepData || currentStepData.placement === "center" || !tooltipPosition) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10001,
      }
    }

    return {
      position: "fixed",
      top: tooltipPosition.top,
      left: tooltipPosition.left,
      zIndex: 10001,
    }
  }

  // Start prompt for public users
  if (showStartPrompt && !isActive && user?.role === "public") {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Lightbulb className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Bem-vindo ao MOAP!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Parece que é a sua primeira vez aqui. Gostaria de fazer um tour guiado pela plataforma?
            </p>
            <p className="text-sm text-muted-foreground">
              O tutorial irá mostrar-lhe como criar obras, analisar orçamentos e comunicar com outros utilizadores.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                setShowStartPrompt(false)
                startTutorial()
              }}
            >
              Iniciar Tutorial
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShowStartPrompt(false)
                skipTutorial()
              }}
            >
              Saltar Tutorial
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!isActive || !currentStepData) return null

  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <>
      {targetRect && currentStepData.placement !== "center" ? (
        <>
          {/* Top overlay */}
          <div
            className="fixed bg-black/60 z-[9999]"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: Math.max(0, targetRect.top - 8),
            }}
          />
          {/* Bottom overlay */}
          <div
            className="fixed bg-black/60 z-[9999]"
            style={{
              top: targetRect.bottom + 8,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* Left overlay */}
          <div
            className="fixed bg-black/60 z-[9999]"
            style={{
              top: targetRect.top - 8,
              left: 0,
              width: Math.max(0, targetRect.left - 8),
              height: targetRect.height + 16,
            }}
          />
          {/* Right overlay */}
          <div
            className="fixed bg-black/60 z-[9999]"
            style={{
              top: targetRect.top - 8,
              left: targetRect.right + 8,
              right: 0,
              height: targetRect.height + 16,
            }}
          />
          {/* Highlight border around target */}
          <div
            className="fixed border-2 border-primary rounded-lg z-[10000] pointer-events-none transition-all duration-300 ring-4 ring-primary/30"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        </>
      ) : (
        /* Full overlay for center placement */
        <div className="fixed inset-0 bg-black/60 z-[9999]" />
      )}

      {/* Tutorial tooltip */}
      <Card
        className="w-[380px] shadow-2xl border-primary/20 z-[10001] max-h-[90vh] overflow-auto"
        style={getTooltipStyle()}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                {currentStep + 1}
              </div>
              <CardTitle className="text-lg leading-tight">{currentStepData.title}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={skipTutorial}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progress} className="h-1 mt-2" />
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-muted-foreground text-sm">{currentStepData.content}</p>
          {currentStepData.action && (
            <div className="mt-3 p-2 rounded-md bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 shrink-0" />
                <span>{currentStepData.action}</span>
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {currentStep + 1} / {totalSteps}
          </div>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
            {currentStep < totalSteps - 1 ? (
              <Button size="sm" onClick={nextStep}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={skipTutorial}>
                Concluir
              </Button>
            )}
          </div>
        </CardFooter>
        <div className="px-4 pb-4">
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={skipTutorial}>
            <SkipForward className="h-4 w-4 mr-2" />
            Saltar tutorial
          </Button>
        </div>
      </Card>
    </>
  )
}
