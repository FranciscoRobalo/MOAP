import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface DashboardStatCardProps {
  eyebrow: string
  value: string | number
  description?: string
  icon?: LucideIcon
  tone?: "default" | "primary" | "amber" | "muted"
  className?: string
}

/**
 * Editorial statistic card. Hairline border, corner brackets, mono eyebrow,
 * large display number. Matches landing-page card system.
 */
export function DashboardStatCard({
  eyebrow,
  value,
  description,
  icon: Icon,
  tone = "default",
  className,
}: DashboardStatCardProps) {
  const toneClasses = {
    default: "text-foreground",
    primary: "text-primary",
    amber: "text-amber",
    muted: "text-muted-foreground",
  }[tone]

  return (
    <div
      className={cn(
        "bp-bracket relative overflow-hidden rounded-lg border border-border/60 bg-card/30 p-5 transition-colors hover:border-border",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
          <p
            className={cn(
              "mt-3 font-display text-4xl font-medium tracking-tight tabular-nums",
              toneClasses,
            )}
          >
            {value}
          </p>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{description}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-md border border-border/60 bg-background/60 p-2 text-muted-foreground">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
