import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Kernel badge — extends the shadcn/ui base with first-class semantic
 * variants (success / warning / info) drawn from the notification scales,
 * so a status pill always matches its Alert and never collides with brand
 * or data-viz colors. Soft fills read well at small sizes; light + dark pinned.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium leading-none transition-[color,box-shadow] [&>svg]:pointer-events-none [&>svg]:size-3 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-error-200 bg-error-100 text-error-800 dark:border-error-800/50 dark:bg-error-900/45 dark:text-error-100 [a&]:hover:bg-error-200/70 dark:[a&]:hover:bg-error-900/60",
        success:
          "border-success-200 bg-success-100 text-success-800 dark:border-success-800/50 dark:bg-success-900/45 dark:text-success-100 [a&]:hover:bg-success-200/70 dark:[a&]:hover:bg-success-900/60",
        warning:
          "border-warning-200 bg-warning-100 text-warning-900 dark:border-warning-800/50 dark:bg-warning-900/45 dark:text-warning-100 [a&]:hover:bg-warning-200/70 dark:[a&]:hover:bg-warning-900/60",
        info:
          "border-info-200 bg-info-100 text-info-800 dark:border-info-800/50 dark:bg-info-900/45 dark:text-info-100 [a&]:hover:bg-info-200/70 dark:[a&]:hover:bg-info-900/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
