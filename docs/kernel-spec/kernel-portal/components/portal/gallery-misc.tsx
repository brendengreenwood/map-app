"use client"

import * as React from "react"
import { format } from "date-fns"
import { ChevronsUpDown, Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { GroupHeader, Subhead, Demo } from "./section"

function DatePicker() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 5, 12))
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-[260px] justify-start gap-2 font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="size-4" />
          {date ? format(date, "PPP") : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
      </PopoverContent>
    </Popover>
  )
}

const releases = [
  "v1.2.0 — token refinements",
  "v1.1.4 — dark mode contrast",
  "v1.1.0 — chart palette",
  "v1.0.6 — sheet + drawer",
  "v1.0.2 — calendar",
  "v1.0.0 — initial release",
  "v0.9.0 — beta",
  "v0.8.0 — alpha",
]

export function GalleryMisc() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 5, 7))
  const [open, setOpen] = React.useState(true)

  return (
    <>
      <GroupHeader title="Disclosure" sub="Progressive reveal for dense content." />

      <Subhead>Accordion · Collapsible</Subhead>
      <div className="grid gap-4 sm:grid-cols-2">
        <Accordion type="single" collapsible defaultValue="a1" className="rounded-lg border bg-card px-4">
          <AccordionItem value="a1">
            <AccordionTrigger>Is it accessible?</AccordionTrigger>
            <AccordionContent>
              Yes. Every component follows WAI-ARIA patterns and is keyboard navigable.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="a2">
            <AccordionTrigger>Is it themed?</AccordionTrigger>
            <AccordionContent>
              Yes. All styling derives from the Kernel token set in light and dark.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="a3">
            <AccordionTrigger>Is it animated?</AccordionTrigger>
            <AccordionContent>
              Yes, with a default that honors reduced-motion preferences.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Demo className="items-start">
          <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-xs space-y-2">
            <div className="flex items-center justify-between rounded-md border bg-card px-4 py-2.5">
              <span className="text-sm font-medium">@kernel starred 3 repos</span>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7">
                  <ChevronsUpDown />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-2">
              {["@kernel/ui", "@kernel/themes", "@kernel/charts"].map((r) => (
                <div key={r} className="rounded-md border bg-card px-4 py-2.5 font-mono text-xs text-muted-foreground">
                  {r}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </Demo>
      </div>

      <GroupHeader title="Date & media" sub="Calendars, pickers, and carousels." />

      <Subhead>Calendar · Date picker</Subhead>
      <div className="grid gap-4 sm:grid-cols-2">
        <Demo className="justify-center">
          <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border bg-card" />
        </Demo>
        <Demo className="items-start">
          <DatePicker />
        </Demo>
      </div>

      <Subhead>Carousel</Subhead>
      <Demo className="justify-center">
        <Carousel className="w-full max-w-md">
          <CarouselContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <CarouselItem key={n} className="basis-1/3">
                <div className="grid aspect-square place-items-center rounded-lg border bg-primary/10 text-4xl font-semibold text-primary">
                  {n}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </Demo>

      <GroupHeader title="Layout" sub="Containers for scrolling and resizable regions." />

      <Subhead>Scroll area · Resizable</Subhead>
      <div className="grid gap-4 sm:grid-cols-2">
        <Demo className="justify-center">
          <ScrollArea className="h-44 w-full max-w-xs rounded-md border bg-card p-2">
            {releases.map((r) => (
              <div key={r} className="border-b px-3 py-2 text-sm last:border-b-0">
                {r}
              </div>
            ))}
          </ScrollArea>
        </Demo>
        <Demo className="justify-center">
          <ResizablePanelGroup
            direction="horizontal"
            className="h-40 max-w-md rounded-lg border"
          >
            <ResizablePanel defaultSize={35}>
              <div className="grid h-full place-items-center p-4 text-sm text-muted-foreground">
                Sidebar
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={65}>
              <div className="grid h-full place-items-center p-4 text-sm text-muted-foreground">
                Content
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Demo>
      </div>
    </>
  )
}
