import type React from "react"
import { cn } from "@/lib/utils"

interface MarqueeProps {
  children: React.ReactNode
  speed?: "slow" | "normal" | "fast"
  reverse?: boolean
  pauseOnHover?: boolean
  className?: string
}

/**
 * Seamless horizontal marquee. Duplicates children so the track loops cleanly.
 * Respects prefers-reduced-motion via globals.css.
 */
export function Marquee({
  children,
  speed = "normal",
  reverse = false,
  pauseOnHover = true,
  className,
}: MarqueeProps) {
  const speedClass = speed === "slow" ? "marquee-slow" : speed === "fast" ? "marquee-fast" : ""

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        pauseOnHover && "marquee-pause",
        className,
      )}
    >
      <div
        className={cn("marquee-track", speedClass, reverse && "marquee-reverse")}
        aria-hidden="false"
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>

      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  )
}
