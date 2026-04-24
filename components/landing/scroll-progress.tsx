"use client"

import { useEffect, useState } from "react"

/**
 * Hairline gradient bar pinned to the top of the page that grows with scroll.
 * Extremely cheap: listens to scroll and updates CSS transform.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const next = max > 0 ? doc.scrollTop / max : 0
      setProgress(next)
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-primary via-amber to-primary"
      style={{ transform: `scaleX(${progress})` }}
      aria-hidden="true"
    />
  )
}
