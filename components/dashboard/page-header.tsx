"use client"

import type { ReactNode } from "react"

interface DashboardPageHeaderProps {
  /** Mono uppercase label shown above the title (e.g. "Orçamentos"). */
  eyebrow?: string
  /** The large display title. */
  title: string
  /** Optional emphasis fragment rendered in primary color at the end of the title. */
  titleHighlight?: string
  /** Short paragraph under the title. */
  description?: string
  /** Buttons / controls rendered in the top-right on lg+ screens. */
  actions?: ReactNode
  /** Optional secondary row (search, filters, tabs) rendered under the description. */
  toolbar?: ReactNode
  /** Optional className for the outer wrapper. */
  className?: string
}

/**
 * Consistent editorial page header used across every dashboard route.
 *
 * Layout mirrors the landing / auth pages: mono eyebrow, display heading,
 * short description, optional action cluster and toolbar, hairline divider.
 */
export function DashboardPageHeader({
  eyebrow,
  title,
  titleHighlight,
  description,
  actions,
  toolbar,
  className,
}: DashboardPageHeaderProps) {
  return (
    <header className={`mb-8 ${className ?? ""}`}>
      <div className="flex flex-col gap-4 border-b border-hairline/60 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
          <h1 className="display text-balance text-3xl text-foreground sm:text-4xl lg:text-5xl">
            {title}
            {titleHighlight ? (
              <>
                {" "}
                <span className="font-display font-medium tracking-tight text-primary">
                  {titleHighlight}
                </span>
              </>
            ) : null}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
            {actions}
          </div>
        ) : null}
      </div>

      {toolbar ? <div className="mt-6">{toolbar}</div> : null}
    </header>
  )
}
