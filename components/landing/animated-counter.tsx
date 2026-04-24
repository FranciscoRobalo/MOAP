"use client"

import { useEffect, useRef, useState } from "react"

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
  decimals?: number
}

/**
 * Counts up from 0 to `value` when the element scrolls into view.
 * Uses IntersectionObserver so it only runs once and only when visible.
 */
export function AnimatedCounter({
  value,
  duration = 1800,
  prefix = "",
  suffix = "",
  className,
  decimals = 0,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (hasStarted || !ref.current) return
    const el = ref.current

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !hasStarted) {
            setHasStarted(true)
            io.disconnect()
          }
        })
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return
    const startTime = performance.now()
    let rafId = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setDisplay(value * eased)
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [hasStarted, value, duration])

  const formatted = display.toLocaleString("pt-PT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
