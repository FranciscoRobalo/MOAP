"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Modern, editorial-feel custom cursor.
 *
 * Two stacked layers:
 *   - .cursor-dot  — tiny, follows the pointer 1:1 (no smoothing)
 *   - .cursor-ring — larger, lerp-smoothed trail that morphs by target
 *
 * Implicit state detection (no markup needed):
 *   - Hovering <a>, <button>, [role="button"], .bp-bracket, [data-cursor="hover"]
 *       → ring grows + soft primary fill
 *   - Hovering <input type="text|search|...">, <textarea>, [contenteditable]
 *       → ring becomes a thin I-beam
 *   - Hovering [data-cursor="magnetic"]
 *       → ring snaps toward the element's center (subtle pull)
 *   - [data-cursor-label="…"]
 *       → ring expands further and shows the label inside
 *
 * Respects prefers-reduced-motion (no lerp, no magnet) and hides itself
 * entirely on touch devices.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  const [enabled, setEnabled] = useState(false)
  const [label, setLabel] = useState("")
  const [mode, setMode] = useState<"default" | "hover" | "text" | "label" | "disabled">("default")
  const [pressed, setPressed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mqTouch = window.matchMedia("(hover: none), (pointer: coarse)")
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mqTouch.matches) {
      setEnabled(false)
      return
    }
    setEnabled(true)
    document.documentElement.classList.add("cursor-active")
    const onTouchChange = () => {
      if (mqTouch.matches) {
        setEnabled(false)
        document.documentElement.classList.remove("cursor-active")
      } else {
        setEnabled(true)
        document.documentElement.classList.add("cursor-active")
      }
    }
    mqTouch.addEventListener?.("change", onTouchChange)

    const reduceMotion = mqReduced.matches
    const onReducedChange = () => (reducedRef.current = mqReduced.matches)
    const reducedRef = { current: reduceMotion }
    mqReduced.addEventListener?.("change", onReducedChange)

    // Pointer position (target) + eased ring position
    const mouse = { x: -100, y: -100 }
    const ringPos = { x: -100, y: -100 }
    const dotPos = { x: -100, y: -100 }
    let rafId = 0
    let magnetTarget: HTMLElement | null = null

    const step = () => {
      // Target position with optional magnetic pull
      let tx = mouse.x
      let ty = mouse.y
      if (magnetTarget && !reducedRef.current) {
        const r = magnetTarget.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        // Pull ~22% toward the element center when close to it
        const pullX = (cx - mouse.x) * 0.22
        const pullY = (cy - mouse.y) * 0.22
        tx = mouse.x + pullX
        ty = mouse.y + pullY
      }

      // Dot — 1:1
      dotPos.x += (mouse.x - dotPos.x) * (reducedRef.current ? 1 : 0.85)
      dotPos.y += (mouse.y - dotPos.y) * (reducedRef.current ? 1 : 0.85)
      // Ring — smoother trail
      const ease = reducedRef.current ? 1 : 0.18
      ringPos.x += (tx - ringPos.x) * ease
      ringPos.y += (ty - ringPos.y) * ease

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0) translate(-50%, -50%)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`
      }
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      if (!visible) setVisible(true)
    }
    const onEnter = () => setVisible(true)
    const onLeave = () => setVisible(false)
    const onDown = () => setPressed(true)
    const onUp = () => setPressed(false)

    // Hover target resolution — find the nearest "interactive" ancestor
    const resolveTarget = (el: Element | null): HTMLElement | null => {
      if (!el) return null
      return (
        (el.closest(
          'a, button, [role="button"], [data-cursor], [data-cursor-label], ' +
            'input:not([type="hidden"]), textarea, select, [contenteditable="true"], ' +
            'label, summary, [role="link"], [role="menuitem"], [role="tab"], [role="option"]',
        ) as HTMLElement | null) ?? null
      )
    }

    const updateForTarget = (el: HTMLElement | null) => {
      if (!el) {
        magnetTarget = null
        setMode("default")
        setLabel("")
        return
      }
      // Explicit label takes priority
      const explicitLabel = el.getAttribute("data-cursor-label")
      const explicit = el.getAttribute("data-cursor")

      if (explicit === "disabled" || el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") {
        magnetTarget = null
        setMode("disabled")
        setLabel("")
        return
      }

      if (explicitLabel) {
        magnetTarget = explicit === "magnetic" ? el : null
        setLabel(explicitLabel)
        setMode("label")
        return
      }

      const tag = el.tagName.toLowerCase()
      const isText =
        explicit === "text" ||
        tag === "textarea" ||
        (tag === "input" && !["button", "submit", "checkbox", "radio", "range", "file", "color"].includes((el as HTMLInputElement).type)) ||
        el.getAttribute("contenteditable") === "true"

      if (isText) {
        magnetTarget = null
        setLabel("")
        setMode("text")
        return
      }

      magnetTarget = explicit === "magnetic" ? el : null
      setLabel("")
      setMode("hover")
    }

    const onOver = (e: PointerEvent) => updateForTarget(resolveTarget(e.target as Element))
    const onOut = (e: PointerEvent) => {
      // Only reset if we leave ALL interactive ancestors
      const next = resolveTarget((e.relatedTarget as Element) ?? null)
      if (!next) updateForTarget(null)
      else updateForTarget(next)
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onDown)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointerover", onOver)
    window.addEventListener("pointerout", onOut)
    document.addEventListener("mouseleave", onLeave)
    document.addEventListener("mouseenter", onEnter)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointerover", onOver)
      window.removeEventListener("pointerout", onOut)
      document.removeEventListener("mouseleave", onLeave)
      document.removeEventListener("mouseenter", onEnter)
      mqTouch.removeEventListener?.("change", onTouchChange)
      mqReduced.removeEventListener?.("change", onReducedChange)
      document.documentElement.classList.remove("cursor-active")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!enabled) return null

  return (
    <div
      aria-hidden="true"
      data-state={mode}
      data-pressed={pressed || undefined}
      data-visible={visible || undefined}
      className="cursor-layer"
    >
      <div ref={ringRef} className="cursor-ring">
        <span ref={labelRef} className="cursor-label">
          {label}
        </span>
      </div>
      <div ref={dotRef} className="cursor-dot" />
    </div>
  )
}
