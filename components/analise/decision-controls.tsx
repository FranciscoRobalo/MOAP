"use client"

import { Check, MessageSquareWarning, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DecisionValue } from "@/lib/analise/types"

interface DecisionControlsProps {
  value?: DecisionValue
  onChange: (next: DecisionValue) => void
  disabled?: boolean
  size?: "sm" | "xs"
  className?: string
}

const VARIANTS: Record<
  Exclude<DecisionValue, "pending">,
  { icon: typeof Check; label: string; short: string; active: string; hover: string }
> = {
  accepted: {
    icon: Check,
    label: "Aceitar",
    short: "OK",
    active: "border-price-below/60 bg-price-below/10 text-price-below",
    hover: "hover:border-price-below/40 hover:text-price-below",
  },
  negotiate: {
    icon: MessageSquareWarning,
    label: "Negociar",
    short: "NEG",
    active: "border-price-above/60 bg-price-above/10 text-price-above",
    hover: "hover:border-price-above/40 hover:text-price-above",
  },
  rejected: {
    icon: X,
    label: "Rejeitar",
    short: "OUT",
    active: "border-price-critical/60 bg-price-critical/10 text-price-critical",
    hover: "hover:border-price-critical/40 hover:text-price-critical",
  },
}

export function DecisionControls({
  value,
  onChange,
  disabled,
  size = "sm",
  className,
}: DecisionControlsProps) {
  const resolved = (value ?? "pending") as DecisionValue

  return (
    <div
      className={cn(
        "inline-flex items-center gap-px overflow-hidden rounded-full border border-border/60 bg-background/40 p-0.5",
        className,
      )}
      role="group"
      aria-label="Decisão sobre o item"
    >
      {(Object.keys(VARIANTS) as Exclude<DecisionValue, "pending">[]).map((key) => {
        const v = VARIANTS[key]
        const Icon = v.icon
        const isActive = resolved === key
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(isActive ? "pending" : key)}
            title={v.label}
            aria-pressed={isActive}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-transparent font-mono uppercase tracking-[0.14em] transition-colors",
              size === "sm" ? "px-2 py-1 text-[10px]" : "px-1.5 py-0.5 text-[9px]",
              !isActive && "text-muted-foreground/80",
              !isActive && !disabled && v.hover,
              isActive && v.active,
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <Icon className={size === "sm" ? "h-3 w-3" : "h-2.5 w-2.5"} aria-hidden="true" />
            <span>{v.short}</span>
          </button>
        )
      })}
    </div>
  )
}
