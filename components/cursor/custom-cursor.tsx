"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Modern, editorial-feel custom cursor — zero-re-render edition.
 *
 * Two stacked layers:
 *   - .cursor-dot  — tiny, near 1:1 pointer tracking
 *   - .cursor-ring — larger, lerp-smoothed trail that morphs by target
 *
 * All hot-path work (pointer move, hover state, press state, visibility)
 * mutates DOM attributes / transforms via refs. React only renders once:
 * an empty shell on mount. This eliminates the lag caused by per-frame
 * re-renders and by CSS transitions conflicting with transform updates.
 *
 * Implicit state detection (no markup needed):
 *   - Hovering <a>, <button>, [role="button"], [data-cursor="hover"], .bp-bracket
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
  // Only React state — whether to render the shell at all.
  // Everything else is ref-based to avoid re-renders during movement.
  const [mounted, setMounted] = useState(false)
  const [enabled, setEnabled] = useState(false)

  const layerRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (typeof window === "undefined") return

    const mqTouch = window.matchMedia("(hover: none), (pointer: coarse)")
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)")

    if (mqTouch.matches) {
      setEnabled(false)
      return
    }

    setEnabled(true)
    document.documentElement.classList.add("cursor-active")

    const layer = layerRef.current
    const dot = dotRef.current
    const ring = ringRef.current
    const labelEl = labelRef.current
    if (!layer || !dot || !ring || !labelEl) return

    // --- Mutable, non-React state ---------------------------------------
    const reduced = { current: mqReduced.matches }
    const mouse = { x: -100, y: -100 }
    const ringPos = { x: -100, y: -100 }
    const dotPos = { x: -100, y: -100 }
    let magnetTarget: HTMLElement | null = null
    let currentMode: "default" | "hover" | "text" | "label" | "disabled" = "default"
    let currentLabel = ""
    let visible = false
    let pressed = false
    let rafId = 0

    // Attribute setters — write to DOM only when the value actually changes.
    const setAttr = (name: string, value: string | null) => {
      if (value == null) {
        if (layer.hasAttribute(name)) layer.removeAttribute(name)
      } else if (layer.getAttribute(name) !== value) {
        layer.setAttribute(name, value)
      }
    }
    const setMode = (m: typeof currentMode) => {
      if (m === currentMode) return
      currentMode = m
      setAttr("data-state", m)
    }
    const setLabel = (text: string) => {
      if (text === currentLabel) return
      currentLabel = text
      labelEl.textContent = text
    }
    const setVisible = (v: boolean) => {
      if (v === visible) return
      visible = v
      setAttr("data-visible", v ? "true" : null)
    }
    const setPressed = (p: boolean) => {
      if (p === pressed) return
      pressed = p
      setAttr("data-pressed", p ? "true" : null)
    }

    // --- Animation loop --------------------------------------------------
    const step = () => {
      let tx = mouse.x
      let ty = mouse.y
      if (magnetTarget && !reduced.current) {
        const r = magnetTarget.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        tx = mouse.x + (cx - mouse.x) * 0.22
        ty = mouse.y + (cy - mouse.y) * 0.22
      }

      // Dot — near 1:1 with light smoothing for sub-pixel stability
      if (reduced.current) {
        dotPos.x = mouse.x
        dotPos.y = mouse.y
      } else {
        dotPos.x += (mouse.x - dotPos.x) * 0.9
        dotPos.y += (mouse.y - dotPos.y) * 0.9
      }
      // Ring — smoother trail
      if (reduced.current) {
        ringPos.x = tx
        ringPos.y = ty
      } else {
        ringPos.x += (tx - ringPos.x) * 0.2
        ringPos.y += (ty - ringPos.y) * 0.2
      }

      // Direct transform writes — no CSS transition on transform (see globals.css)
      dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0) translate(-50%, -50%)`
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`

      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)

    // --- Pointer handlers -----------------------------------------------
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      if (!visible) setVisible(true)
    }
    const onEnterWindow = () => setVisible(true)
    const onLeaveWindow = () => setVisible(false)
    const onDown = () => setPressed(true)
    const onUp = () => setPressed(false)

    const INTERACTIVE_SELECTOR =
      'a, button, [role="button"], [data-cursor], [data-cursor-label], ' +
      'input:not([type="hidden"]), textarea, select, [contenteditable="true"], ' +
      'label, summary, [role="link"], [role="menuitem"], [role="tab"], [role="option"]'

    const resolveTarget = (el: Element | null): HTMLElement | null => {
      if (!el) return null
      return (el.closest(INTERACTIVE_SELECTOR) as HTMLElement | null) ?? null
    }

    const updateForTarget = (el: HTMLElement | null) => {
      if (!el) {
        magnetTarget = null
        setMode("default")
        setLabel("")
        return
      }

      const explicitLabel = el.getAttribute("data-cursor-label")
      const explicit = el.getAttribute("data-cursor")

      if (
        explicit === "disabled" ||
        el.hasAttribute("disabled") ||
        el.getAttribute("aria-disabled") === "true"
      ) {
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
        (tag === "input" &&
          !["button", "submit", "checkbox", "radio", "range", "file", "color"].includes(
            (el as HTMLInputElement).type,
          )) ||
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
      const next = resolveTarget((e.relatedTarget as Element) ?? null)
      updateForTarget(next)
    }

    // Reduced-motion listener. If the user toggles the preference mid-session,
    // the RAF loop reads `reduced.current` on every frame so it adapts immediately.
    const onReducedChange = () => {
      reduced.current = mqReduced.matches
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onDown, { passive: true })
    window.addEventListener("pointerup", onUp, { passive: true })
    window.addEventListener("pointerover", onOver, { passive: true })
    window.addEventListener("pointerout", onOut, { passive: true })
    // `mouseenter` / `mouseleave` don't bubble, so we attach them to <html>
    // instead of `document`. They fire only when the pointer physically
    // enters or leaves the viewport (tab switches, dragging off-screen).
    document.documentElement.addEventListener("mouseleave", onLeaveWindow)
    document.documentElement.addEventListener("mouseenter", onEnterWindow)
    mqReduced.addEventListener?.("change", onReducedChange)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointerover", onOver)
      window.removeEventListener("pointerout", onOut)
      document.documentElement.removeEventListener("mouseleave", onLeaveWindow)
      document.documentElement.removeEventListener("mouseenter", onEnterWindow)
      mqReduced.removeEventListener?.("change", onReducedChange)
      document.documentElement.classList.remove("cursor-active")
    }
  }, [mounted])

  // Always render the shell once mounted. On touch devices the CSS media
  // query (@media (hover: none), (pointer: coarse)) hides it and restores
  // the native cursor, so we don't need a React-side guard for that.
  if (!mounted) return null

  return (
    <div ref={layerRef} aria-hidden="true" data-state="default" className="cursor-layer">
      <div ref={ringRef} className="cursor-ring">
        <span ref={labelRef} className="cursor-label" />
      </div>
      <div ref={dotRef} className="cursor-dot" />
    </div>
  )
}
