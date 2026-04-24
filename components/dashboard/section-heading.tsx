import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface DashboardSectionHeadingProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

/**
 * In-card section heading. Mono eyebrow + display title, optional actions
 * aligned right. Used for grouping content inside dashboard pages.
 */
export function DashboardSectionHeading({
  eyebrow,
  title,
  description,
  actions,
  className,
}: DashboardSectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-1">
        {eyebrow ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
