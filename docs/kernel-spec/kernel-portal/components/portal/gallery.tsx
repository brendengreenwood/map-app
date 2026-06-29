"use client"

import { Section } from "./section"
import { GalleryForms } from "./gallery-forms"
import { GalleryData } from "./gallery-data"
import { GalleryOverlays } from "./gallery-overlays"
import { GalleryNav } from "./gallery-nav"
import { GalleryMisc } from "./gallery-misc"
import { Badge } from "@/components/ui/badge"

const all = [
  "Accordion","Alert","Alert Dialog","Aspect Ratio","Avatar","Badge","Breadcrumb",
  "Button","Calendar","Card","Carousel","Chart","Checkbox","Collapsible","Combobox",
  "Command","Context Menu","Data Table","Date Picker","Dialog","Drawer","Dropdown Menu",
  "Form","Hover Card","Input","Input OTP","Label","Menubar","Navigation Menu","Pagination",
  "Popover","Progress","Radio Group","Resizable","Scroll Area","Select","Separator","Sheet",
  "Sidebar","Skeleton","Slider","Sonner","Switch","Table","Tabs","Textarea","Toggle",
  "Toggle Group","Tooltip",
]

export function ComponentsSection() {
  return (
    <Section
      id="components"
      eyebrow="Elements"
      title="Components"
      lead="The full shadcn/ui registry, rendered with Kernel tokens and grouped by role. Every element reads exclusively from theme variables, so the whole gallery re-themes on toggle."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="font-mono">{all.length} components</Badge>
        {all.map((c) => (
          <span
            key={c}
            className="rounded-full border bg-card px-2.5 py-1 font-mono text-xs text-muted-foreground"
          >
            {c}
          </span>
        ))}
      </div>

      <div className="mt-2">
        <GalleryForms />
        <GalleryData />
        <GalleryOverlays />
        <GalleryNav />
        <GalleryMisc />
      </div>
    </Section>
  )
}
