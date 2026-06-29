import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Kernel alert — extends the shadcn/ui base with first-class semantic
 * variants wired to the notification color scales (see globals.css).
 * Each variant is self-contained (its own bg / border / text / icon),
 * so it can never collide with brand, data-viz, or another status color.
 * Light and dark are both pinned to scale steps.
 */
const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "border-error-200 bg-error-50 text-error-800 [&>svg]:text-error-600 *:data-[slot=alert-description]:text-error-700 dark:border-error-800/60 dark:bg-error-900/30 dark:text-error-100 dark:[&>svg]:text-error-400 dark:*:data-[slot=alert-description]:text-error-200",
        success:
          "border-success-200 bg-success-50 text-success-800 [&>svg]:text-success-600 *:data-[slot=alert-description]:text-success-700 dark:border-success-800/60 dark:bg-success-900/30 dark:text-success-100 dark:[&>svg]:text-success-300 dark:*:data-[slot=alert-description]:text-success-200",
        warning:
          "border-warning-300 bg-warning-50 text-warning-900 [&>svg]:text-warning-700 *:data-[slot=alert-description]:text-warning-800 dark:border-warning-800/60 dark:bg-warning-900/30 dark:text-warning-100 dark:[&>svg]:text-warning-400 dark:*:data-[slot=alert-description]:text-warning-200",
        info:
          "border-info-200 bg-info-50 text-info-800 [&>svg]:text-info-600 *:data-[slot=alert-description]:text-info-700 dark:border-info-800/60 dark:bg-info-900/30 dark:text-info-100 dark:[&>svg]:text-info-300 dark:*:data-[slot=alert-description]:text-info-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
