"use client"

import * as React from "react"
import {
  Sprout,
  Palette,
  Type,
  Ruler,
  Layers,
  Component,
  TextCursorInput,
  Table2,
  BarChart3,
  PanelsTopLeft,
  LayoutDashboard,
  Filter,
  LayoutList,
  Route,
  Terminal,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const nav = [
  {
    label: "Get started",
    items: [
      { title: "Overview", href: "#overview", icon: Sprout },
      { title: "Install & usage", href: "#install", icon: Terminal },
    ],
  },
  {
    label: "Foundations",
    items: [
      { title: "Color", href: "#colors", icon: Palette },
      { title: "Typography", href: "#typography", icon: Type },
      { title: "Spacing & radius", href: "#spacing", icon: Ruler },
      { title: "Elevation", href: "#shadows", icon: Layers },
    ],
  },
  {
    label: "Components",
    items: [
      { title: "Components", href: "#components", icon: Component },
      { title: "Form elements", href: "#forms", icon: TextCursorInput },
      { title: "Tables", href: "#tables", icon: Table2 },
      { title: "Charts", href: "#charts", icon: BarChart3 },
    ],
  },
  {
    label: "Patterns",
    items: [
      { title: "App shell", href: "#appshell", icon: PanelsTopLeft },
      { title: "Dashboard", href: "#dashboard", icon: LayoutDashboard },
      { title: "Filtering", href: "#filters", icon: Filter },
      { title: "CRUD patterns", href: "#patterns", icon: LayoutList },
      { title: "Flows", href: "#flows", icon: Route },
    ],
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Sprout className="size-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Kernel</div>
            <div className="font-mono text-[11px] text-muted-foreground">
              design system
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {nav.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-1 font-mono text-[11px] text-muted-foreground">
          v1.0.0 · shadcn/ui
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
