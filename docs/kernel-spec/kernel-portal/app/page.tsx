import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/portal/app-sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { OverviewSection } from "@/components/portal/overview"
import { ColorsSection, TypographySection, SpacingSection, ShadowsSection } from "@/components/portal/foundations"
import { ComponentsSection } from "@/components/portal/gallery"
import { FormElementsSection } from "@/components/portal/form-elements"
import { TablesSection } from "@/components/portal/tables"
import { ChartsSection } from "@/components/portal/charts"
import { AppShellSection } from "@/components/portal/app-shell"
import { DashboardSection } from "@/components/portal/dashboard"
import { FiltersSection } from "@/components/portal/filters"
import { PatternsSection } from "@/components/portal/patterns"
import { FlowsSection } from "@/components/portal/flows"
import { InstallSection } from "@/components/portal/install"

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm text-muted-foreground">
            Kernel <span className="opacity-40">/</span>{" "}
            <span className="font-medium text-foreground">Design System</span>
          </span>
          <div className="ml-auto">
            <ModeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl px-6 pb-32 md:px-10">
          <OverviewSection />
          <ColorsSection />
          <TypographySection />
          <SpacingSection />
          <ShadowsSection />
          <ComponentsSection />
          <FormElementsSection />
          <TablesSection />
          <ChartsSection />
          <AppShellSection />
          <DashboardSection />
          <FiltersSection />
          <PatternsSection />
          <FlowsSection />
          <InstallSection />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
