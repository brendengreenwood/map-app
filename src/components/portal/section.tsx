import * as React from "react"
import { cn } from "@/lib/utils"

/** Section wrapper — eyebrow, title, lead, then content. */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id?: string
  eyebrow: string
  title: string
  lead?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 pt-16 first:pt-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h2>
      {lead ? (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {lead}
        </p>
      ) : null}
      <div className="mt-8">{children}</div>
    </section>
  )
}

/** Group header inside the component gallery. */
export function GroupHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mt-14 border-t pt-5 first:mt-0 first:border-t-0 first:pt-0">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  )
}

/** Labeled subhead above a single component demo. */
export function Subhead({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mt-9 mb-4 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
      {children}
    </h4>
  )
}

/** Neutral surface that a component demo sits on. */
export function Demo({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-lg border bg-card p-8",
        className
      )}
    >
      {children}
    </div>
  )
}
