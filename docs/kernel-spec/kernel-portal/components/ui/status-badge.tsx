import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * StatusBadge — persistent lifecycle state for a load or contract.
 *
 * Distinct from <Badge variant="success | warning | …">, which signals the
 * *outcome* of a momentary event. A status is a stable state an object sits in;
 * each maps to a `--status-*` token on its own hue so a column of them stays
 * scannable. The leading dot carries the color; the soft fill keeps rows calm.
 *
 *   <StatusBadge status="in_transit" />
 *   <StatusBadge status="settled">Paid in full</StatusBadge>
 */
const statusBadgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full border py-0.5 pl-2 pr-2.5 text-xs font-medium leading-none whitespace-nowrap",
  {
    variants: {
      status: {
        draft:
          "border-neutral-200 bg-neutral-100 text-neutral-800 dark:border-neutral-700/50 dark:bg-neutral-800/50 dark:text-neutral-100",
        pending:
          "border-info-200 bg-info-100 text-info-800 dark:border-info-800/50 dark:bg-info-900/45 dark:text-info-100",
        booked:
          "border-viz-plum-200 bg-viz-plum-100 text-viz-plum-800 dark:border-viz-plum-800/50 dark:bg-viz-plum-900/45 dark:text-viz-plum-100",
        in_transit:
          "border-warning-200 bg-warning-100 text-warning-900 dark:border-warning-800/50 dark:bg-warning-900/45 dark:text-warning-100",
        delivered:
          "border-viz-teal-200 bg-viz-teal-100 text-viz-teal-800 dark:border-viz-teal-800/50 dark:bg-viz-teal-900/45 dark:text-viz-teal-100",
        settled:
          "border-success-200 bg-success-100 text-success-800 dark:border-success-800/50 dark:bg-success-900/45 dark:text-success-100",
        on_hold:
          "border-viz-clay-200 bg-viz-clay-100 text-viz-clay-900 dark:border-viz-clay-800/50 dark:bg-viz-clay-900/45 dark:text-viz-clay-100",
        rejected:
          "border-error-200 bg-error-100 text-error-800 dark:border-error-800/50 dark:bg-error-900/45 dark:text-error-100",
        cancelled:
          "border-viz-slate-200 bg-viz-slate-100 text-viz-slate-800 dark:border-viz-slate-800/50 dark:bg-viz-slate-900/45 dark:text-viz-slate-100",
        expired:
          "border-viz-rust-200 bg-viz-rust-100 text-viz-rust-800 dark:border-viz-rust-800/50 dark:bg-viz-rust-900/45 dark:text-viz-rust-100",
      },
    },
    defaultVariants: { status: "draft" },
  }
)

const dotColor: Record<string, string> = {
  draft: "bg-neutral-500",
  pending: "bg-info-500",
  booked: "bg-viz-plum-500",
  in_transit: "bg-warning-500",
  delivered: "bg-viz-teal-500",
  settled: "bg-success-500",
  on_hold: "bg-viz-clay-500",
  rejected: "bg-error-500",
  cancelled: "bg-viz-slate-500",
  expired: "bg-viz-rust-500",
}

const defaultLabel: Record<string, string> = {
  draft: "Draft",
  pending: "Pending",
  booked: "Booked",
  in_transit: "In transit",
  delivered: "Delivered",
  settled: "Settled",
  on_hold: "On hold",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
}

export type Status = keyof typeof defaultLabel

function StatusBadge({
  status = "draft",
  className,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof statusBadgeVariants>) {
  const key = (status ?? "draft") as Status
  return (
    <span
      data-slot="status-badge"
      data-status={key}
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", dotColor[key])} />
      {children ?? defaultLabel[key]}
    </span>
  )
}

export { StatusBadge, statusBadgeVariants }
