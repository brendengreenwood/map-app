import { Toaster as Sonner, type ToasterProps } from "sonner"
import { Icon } from "@/components/ui/icon"
import { mdiCheckCircleOutline, mdiInformationOutline, mdiAlertOutline, mdiCloseOctagonOutline, mdiLoading } from "@mdi/js"
import { useUsers } from "@/hooks/use-users"

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useUsers()

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <Icon path={mdiCheckCircleOutline} className="size-4" />,
        info: <Icon path={mdiInformationOutline} className="size-4" />,
        warning: <Icon path={mdiAlertOutline} className="size-4" />,
        error: <Icon path={mdiCloseOctagonOutline} className="size-4" />,
        loading: <Icon path={mdiLoading} className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
