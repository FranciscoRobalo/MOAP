"use client"

import type React from "react"
import { useEffect, useRef, type CSSProperties } from "react"
import { cn } from "@/lib/utils"

interface BlueprintBackdropProps {
  className?: string
  variant?: "default" | "dense" | "minimal" | "subtle"
  auroras?: boolean
  /**
   * Adds a cursor-following radial highlight over the existing grid.
   * Pure CSS (custom properties) — no canvas, no mask, identical in light & dark.
   */
  interactive?: boolean
  children?: React.ReactNode
}

/**
 * Architectural blueprint backdrop — subtle grid lines, optional aurora blobs.
 * `interactive` brightens the grid locally where the cursor moves via CSS vars.
 */
export function BlueprintBackdrop({
  className,
  variant = "default",
  auroras = true,
  interactive = false,
  children,
}: BlueprintBackdropProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const gridClass = variant === "dense" ? "bp-grid-sm" : "bp-grid"
  const showGrid = variant !== "minimal"

  useEffect(() => {
    if (!interactive) return
    const el = rootRef.current
    if (!el) return
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    let raf = 0
    let targetX = 50
    let targetY = 50
    let currentX = 50
    let currentY = 50
    let active = false

    const setVars = () => {
      el.style.setProperty("--mx", `${currentX}%`)
      el.style.setProperty("--my", `${currentY}%`)
      el.style.setProperty("--mo", active ? "1" : "0")
    }

    const loop = () => {
      currentX += (targetX - currentX) * 0.14
      currentY += (targetY - currentY) * 0.14
      setVars()
      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1 || !active) {
        raf = requestAnimationFrame(loop)
      } else {
        raf = 0
      }
    }

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        active = false
      } else {
        active = true
        targetX = ((e.clientX - rect.left) / rect.width) * 100
        targetY = ((e.clientY - rect.top) / rect.height) * 100
      }
      if (!raf) raf = requestAnimationFrame(loop)
    }

    const onLeave = () => {
      active = false
      if (!raf) raf = requestAnimationFrame(loop)
    }

    setVars()
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerleave", onLeave)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerleave", onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [interactive])

  const interactiveStyle: CSSProperties | undefined = interactive
    ? ({
        ["--mx" as any]: "50%",
        ["--my" as any]: "50%",
        ["--mo" as any]: "0",
      } as CSSProperties)
    : undefined

  return (
    <div
      ref={rootRef}
      style={interactiveStyle}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {/* Base grid */}
      {showGrid && <div className={cn("absolute inset-0 bp-grid-fade", gridClass)} />}

      {/* Cursor-following highlight — CSS-only, theme-agnostic */}
      {interactive && showGrid && (
        <>
          <div
            className={cn("absolute inset-0 transition-opacity duration-300", gridClass)}
            style={{
              opacity: "calc(var(--mo, 0) * 0.9)",
              WebkitMaskImage:
                "radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), rgba(0,0,0,0.9), rgba(0,0,0,0) 70%)",
              maskImage:
                "radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), rgba(0,0,0,0.9), rgba(0,0,0,0) 70%)",
              filter: "brightness(1.8) saturate(1.3)",
            }}
          />
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: "calc(var(--mo, 0) * 0.45)",
              background:
                "radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), hsl(166 76% 47% / 0.18), transparent 70%)",
            }}
          />
        </>
      )}

      {/* Aurora blobs */}
      {auroras && (
        <>
          <div
            className="aurora-blob"
            style={{
              top: "-10%",
              left: "-5%",
              width: "42vw",
              height: "42vw",
              background:
                "radial-gradient(circle at 30% 30%, hsl(166 76% 47% / 0.28), transparent 60%)",
              animationDelay: "0s",
            }}
          />
          <div
            className="aurora-blob"
            style={{
              top: "20%",
              right: "-10%",
              width: "36vw",
              height: "36vw",
              background:
                "radial-gradient(circle at 60% 40%, hsl(38 92% 58% / 0.18), transparent 60%)",
              animationDelay: "-6s",
            }}
          />
          <div
            className="aurora-blob"
            style={{
              bottom: "-15%",
              left: "30%",
              width: "30vw",
              height: "30vw",
              background:
                "radial-gradient(circle at 50% 50%, hsl(166 76% 47% / 0.14), transparent 60%)",
              animationDelay: "-12s",
            }}
          />
        </>
      )}

      {children}
    </div>
  )
}
