import type React from "react"
import { cn } from "@/lib/utils"

interface BlueprintBackdropProps {
  className?: string
  variant?: "default" | "dense" | "minimal"
  auroras?: boolean
  children?: React.ReactNode
}

/**
 * Architectural blueprint backdrop — subtle grid lines, optional aurora blobs,
 * and a radial mask so the grid fades at the edges. Intended to sit behind
 * landing-page sections.
 */
export function BlueprintBackdrop({
  className,
  variant = "default",
  auroras = true,
  children,
}: BlueprintBackdropProps) {
  const gridClass = variant === "dense" ? "bp-grid-sm" : "bp-grid"

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {/* Grid */}
      {variant !== "minimal" && <div className={cn("absolute inset-0 bp-grid-fade", gridClass)} />}

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
                "radial-gradient(circle at 50% 50%, hsl(262 70% 60% / 0.14), transparent 60%)",
              animationDelay: "-12s",
            }}
          />
        </>
      )}

      {children}
    </div>
  )
}
