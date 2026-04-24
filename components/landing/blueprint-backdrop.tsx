"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface BlueprintBackdropProps {
  className?: string
  variant?: "default" | "dense" | "minimal" | "subtle"
  auroras?: boolean
  /** When true, renders an interactive canvas grid reacting to the cursor. */
  interactive?: boolean
  children?: React.ReactNode
}

/**
 * Architectural blueprint backdrop — subtle grid lines, optional aurora blobs,
 * and a radial mask so the grid fades at the edges. Intended to sit behind
 * landing-page sections.
 *
 * `interactive` swaps the static CSS grid for a canvas grid that pulses ambient
 * ripples, warms up under the cursor, and emits a ring on click. DPR-aware,
 * respects prefers-reduced-motion, stays behind content via pointer-events.
 */
export function BlueprintBackdrop({
  className,
  variant = "default",
  auroras = true,
  interactive = false,
  children,
}: BlueprintBackdropProps) {
  const gridClass = variant === "dense" ? "bp-grid-sm" : "bp-grid"
  const showStaticGrid = variant !== "minimal" && !interactive

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {/* Static CSS grid */}
      {showStaticGrid && <div className={cn("absolute inset-0 bp-grid-fade", gridClass)} />}

      {/* Interactive canvas grid */}
      {interactive && <InteractiveGrid />}

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

/**
 * Canvas-driven interactive grid. Mounted only when `interactive` is true.
 * Pointer events are re-enabled on this layer so the grid can follow the cursor,
 * but we forward the events via `pointer-events: auto` on the transparent overlay.
 */
function InteractiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) return

    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const state = {
      width: 0,
      height: 0,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      mouseX: -9999,
      mouseY: -9999,
      spacing: 48,
      primary: [166, 76, 47] as [number, number, number],
      amber: [38, 92, 58] as [number, number, number],
      ripples: [] as {
        x: number
        y: number
        r: number
        maxR: number
        start: number
      }[],
      beacons: [] as {
        x: number
        y: number
        phase: number
        speed: number
      }[],
    }

    const readCssColor = (variable: string): [number, number, number] | null => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim()
      const m = raw.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/)
      if (!m) return null
      return [Number(m[1]), Number(m[2]), Number(m[3])]
    }

    const refreshColors = () => {
      const p = readCssColor("--primary")
      const a = readCssColor("--amber")
      if (p) state.primary = p
      if (a) state.amber = a
    }
    refreshColors()

    const themeObserver = new MutationObserver(() => refreshColors())
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      state.width = rect.width
      state.height = rect.height
      canvas.width = Math.max(1, Math.round(state.width * state.dpr))
      canvas.height = Math.max(1, Math.round(state.height * state.dpr))
      canvas.style.width = `${state.width}px`
      canvas.style.height = `${state.height}px`
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0)

      // Seed ambient beacons at grid intersections
      const cellsX = Math.max(3, Math.floor(state.width / state.spacing))
      const cellsY = Math.max(3, Math.floor(state.height / state.spacing))
      const count = Math.max(6, Math.min(20, Math.floor((cellsX * cellsY) / 22)))
      state.beacons = Array.from({ length: count }, () => ({
        x: Math.round(Math.random() * cellsX) * state.spacing,
        y: Math.round(Math.random() * cellsY) * state.spacing,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0006 + Math.random() * 0.0008,
      }))
    }
    resize()

    const onResize = () => resize()
    window.addEventListener("resize", onResize, { passive: true })

    const onPointerMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect()
      state.mouseX = e.clientX - rect.left
      state.mouseY = e.clientY - rect.top
    }
    const onPointerLeave = () => {
      state.mouseX = -9999
      state.mouseY = -9999
    }
    const onPointerDown = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      state.ripples.push({
        x,
        y,
        r: 0,
        maxR: Math.max(state.width, state.height) * 0.45,
        start: performance.now(),
      })
    }

    wrap.addEventListener("pointermove", onPointerMove, { passive: true })
    wrap.addEventListener("pointerleave", onPointerLeave, { passive: true })
    wrap.addEventListener("pointerdown", onPointerDown, { passive: true })

    let raf = 0
    const render = (now: number) => {
      ctx.clearRect(0, 0, state.width, state.height)

      const { spacing, mouseX, mouseY, primary, amber } = state
      const [ph, ps, pl] = primary
      const influence = 200

      // Vertical grid lines — warmer and brighter near the cursor
      for (let x = 0; x <= state.width; x += spacing) {
        const dx = Math.abs(x - mouseX)
        const t = mouseX > -9000 ? Math.max(0, 1 - dx / influence) : 0
        const alpha = 0.06 + t * 0.22
        const hue = t > 0.15
          ? `hsl(${ph + (amber[0] - ph) * t * 0.5} ${ps}% ${pl}% / ${alpha})`
          : `hsl(${ph} ${ps}% ${pl}% / ${alpha})`
        ctx.strokeStyle = hue
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x + 0.5, 0)
        ctx.lineTo(x + 0.5, state.height)
        ctx.stroke()
      }

      // Horizontal grid lines
      for (let y = 0; y <= state.height; y += spacing) {
        const dy = Math.abs(y - mouseY)
        const t = mouseY > -9000 ? Math.max(0, 1 - dy / influence) : 0
        const alpha = 0.06 + t * 0.22
        const hue = t > 0.15
          ? `hsl(${ph + (amber[0] - ph) * t * 0.5} ${ps}% ${pl}% / ${alpha})`
          : `hsl(${ph} ${ps}% ${pl}% / ${alpha})`
        ctx.strokeStyle = hue
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, y + 0.5)
        ctx.lineTo(state.width, y + 0.5)
        ctx.stroke()
      }

      // Cursor glow
      if (mouseX > -9000) {
        const radius = 240
        const grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, radius)
        grad.addColorStop(0, `hsl(${ph} ${ps}% ${pl}% / 0.22)`)
        grad.addColorStop(1, `hsl(${ph} ${ps}% ${pl}% / 0)`)
        ctx.fillStyle = grad
        ctx.fillRect(mouseX - radius, mouseY - radius, radius * 2, radius * 2)
      }

      // Ambient beacons — slow pulsing survey dots at grid intersections
      for (const b of state.beacons) {
        const pulse = 0.5 + 0.5 * Math.sin(now * b.speed + b.phase)
        const r = 1.25 + pulse * 1.5
        ctx.fillStyle = `hsl(${ph} ${ps}% ${pl}% / ${0.15 + pulse * 0.45})`
        ctx.beginPath()
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Click ripples
      state.ripples = state.ripples.filter((rp) => {
        const elapsed = now - rp.start
        const t = Math.min(1, elapsed / 1200)
        if (t >= 1) return false
        rp.r = rp.maxR * t
        const alpha = 0.45 * (1 - t)
        ctx.strokeStyle = `hsl(${ph} ${ps}% ${pl}% / ${alpha})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2)
        ctx.stroke()
        return true
      })

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      wrap.removeEventListener("pointermove", onPointerMove)
      wrap.removeEventListener("pointerleave", onPointerLeave)
      wrap.removeEventListener("pointerdown", onPointerDown)
      themeObserver.disconnect()
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0"
      style={{
        pointerEvents: "auto",
        maskImage:
          "radial-gradient(ellipse at center, black 40%, transparent 78%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, black 40%, transparent 78%)",
      }}
    >
      {/* Static grid fallback for reduced motion + before the canvas paints */}
      <div className="absolute inset-0 bp-grid opacity-70" aria-hidden="true" />
      <canvas ref={canvasRef} className="absolute inset-0 motion-reduce:hidden" />
    </div>
  )
}
