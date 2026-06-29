"use client"

import * as React from "react"
import {
  User,
  Settings,
  LogOut,
  Copy,
  Share,
  ChevronsUpDown,
  Check,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { GroupHeader, Subhead, Demo } from "./section"

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "vite", label: "Vite" },
]

function Combobox() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("next")
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[220px] justify-between">
          {frameworks.find((f) => f.value === value)?.label ?? "Select…"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0">
        <Command>
          <CommandInput placeholder="Search framework…" />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {frameworks.map((f) => (
                <CommandItem
                  key={f.value}
                  value={f.value}
                  onSelect={(v) => {
                    setValue(v)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 size-4", value === f.value ? "opacity-100" : "opacity-0")} />
                  {f.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function GalleryNav() {
  return (
    <>
      <GroupHeader title="Navigation" sub="Tabs, breadcrumbs, paging, and menu bars for moving through the app." />

      <Subhead>Tabs</Subhead>
      <Demo className="block">
        <Tabs defaultValue="account" className="w-full">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="text-sm text-muted-foreground">
            Manage your profile, email, and connected accounts.
          </TabsContent>
          <TabsContent value="password" className="text-sm text-muted-foreground">
            Use at least 12 characters with a mix of letters and numbers.
          </TabsContent>
          <TabsContent value="team" className="text-sm text-muted-foreground">
            Invite teammates and manage roles across your workspace.
          </TabsContent>
        </Tabs>
      </Demo>

      <Subhead>Breadcrumb · Pagination</Subhead>
      <Demo className="flex-col items-start gap-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="#">Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="#">Components</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Breadcrumb</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Pagination className="mx-0 w-auto justify-start">
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
            <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
            <PaginationItem><PaginationEllipsis /></PaginationItem>
            <PaginationItem><PaginationNext href="#" /></PaginationItem>
          </PaginationContent>
        </Pagination>
      </Demo>

      <Subhead>Navigation menu · Menubar</Subhead>
      <Demo className="flex-col items-start gap-6">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Product</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 p-3 md:grid-cols-2">
                  {[
                    ["Components", "45 accessible building blocks."],
                    ["Theming", "Tokenized color, fully re-skinnable."],
                    ["Charts", "Composable data visualization."],
                    ["CLI", "Add components with one command."],
                  ].map(([t, d]) => (
                    <li key={t}>
                      <NavigationMenuLink className="block rounded-md p-3 hover:bg-muted">
                        <div className="text-sm font-semibold">{t}</div>
                        <div className="text-xs text-muted-foreground">{d}</div>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New tab</MenubarItem>
              <MenubarItem>New window</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Share</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu><MenubarTrigger>Edit</MenubarTrigger></MenubarMenu>
          <MenubarMenu><MenubarTrigger>View</MenubarTrigger></MenubarMenu>
        </Menubar>
      </Demo>

      <GroupHeader title="Menus & command" sub="Context-driven actions and keyboard-first search." />

      <Subhead>Dropdown menu · Context menu</Subhead>
      <Demo className="gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuItem><User /> Profile <DropdownMenuShortcut>⌘P</DropdownMenuShortcut></DropdownMenuItem>
            <DropdownMenuItem><Settings /> Settings <DropdownMenuShortcut>⌘,</DropdownMenuShortcut></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive"><LogOut /> Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ContextMenu>
          <ContextMenuTrigger className="grid h-20 w-56 place-items-center rounded-md border border-dashed text-sm text-muted-foreground">
            Right-click here
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem><Copy /> Copy</ContextMenuItem>
            <ContextMenuItem><Share /> Share</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Refresh</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Demo>

      <Subhead>Command · Combobox</Subhead>
      <Demo className="flex-col items-start gap-6">
        <Command className="max-w-md rounded-lg border shadow-md">
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem><CalendarIcon /> Calendar</CommandItem>
              <CommandItem><Clock /> Search history</CommandItem>
              <CommandItem><User /> Profile</CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </CommandList>
        </Command>
        <Combobox />
      </Demo>
    </>
  )
}
