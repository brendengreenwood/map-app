import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { mdiLoading } from "@mdi/js"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Icon path={mdiLoading} role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
