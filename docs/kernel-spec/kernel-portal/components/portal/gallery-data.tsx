"use client"

import * as React from "react"
import Image from "next/image"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, type Status } from "@/components/ui/status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GroupHeader, Subhead, Demo } from "./section"

type Project = { name: string; status: Status; owner: string; usage: number }

const data: Project[] = [
  { name: "orchard-api", status: "in_transit", owner: "Ellis Morgan", usage: 62 },
  { name: "leaf-web", status: "settled", owner: "Sasha Lin", usage: 38 },
  { name: "seed-worker", status: "on_hold", owner: "Devon Park", usage: 0 },
  { name: "canopy-edge", status: "rejected", owner: "Rae Okafor", usage: 91 },
]

const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Project <ArrowUpDown className="ml-1 size-3.5" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status") as Status} />,
  },
  { accessorKey: "owner", header: "Owner" },
  {
    accessorKey: "usage",
    header: () => <div className="text-right">Usage</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono">{row.getValue("usage")}%</div>
    ),
  },
]

function DataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function GalleryData() {
  return (
    <>
      <GroupHeader title="Data display" sub="Surfaces for content, status, and loading states." />

      <Subhead>Card</Subhead>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deploy preview</CardTitle>
            <CardDescription>
              Ship a branch to an isolated preview environment in seconds.
            </CardDescription>
          </CardHeader>
          <CardFooter className="gap-3 border-t pt-4">
            <Button size="sm">Deploy</Button>
            <Button size="sm" variant="ghost">Cancel</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>EM</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-semibold">Ellis Morgan</div>
                <div className="text-sm text-muted-foreground">Platform team</div>
              </div>
              <Badge variant="secondary" className="ml-auto">Pro</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              “Kernel dropped straight into our app — the tokens just worked.”
            </p>
          </CardContent>
        </Card>
      </div>

      <Subhead>Status badges</Subhead>
      <p className="-mt-2 mb-4 max-w-2xl text-sm text-muted-foreground">
        Persistent lifecycle states for loads and contracts. Each maps to a
        <code className="mx-1 font-mono">--status-*</code> token on a distinct hue,
        so a column of them is scannable at a glance.
      </p>
      <Demo className="gap-2.5">
        {([
          "draft",
          "pending",
          "booked",
          "in_transit",
          "delivered",
          "settled",
          "on_hold",
          "rejected",
          "cancelled",
          "expired",
        ] as Status[]).map((s) => (
          <StatusBadge key={s} status={s} />
        ))}
      </Demo>

      <Subhead>Badge · Avatar</Subhead>
      <Demo className="gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Live</Badge>
          <Badge variant="warning">On hold</Badge>
          <Badge variant="info">Booked</Badge>
          <Badge variant="destructive">Errored</Badge>
          <Badge variant="outline">Draft</Badge>
        </div>
        <div className="flex items-center -space-x-2">
          <Avatar className="ring-2 ring-card"><AvatarFallback>SL</AvatarFallback></Avatar>
          <Avatar className="ring-2 ring-card"><AvatarFallback>EM</AvatarFallback></Avatar>
          <Avatar className="ring-2 ring-card"><AvatarFallback>DP</AvatarFallback></Avatar>
          <Avatar className="ring-2 ring-card"><AvatarFallback>+5</AvatarFallback></Avatar>
        </div>
      </Demo>

      <Subhead>Table · Data table (sortable)</Subhead>
      <DataTable />

      <Subhead>Progress · Skeleton</Subhead>
      <div className="grid gap-4 sm:grid-cols-2">
        <Demo className="flex-col items-stretch gap-4">
          <div className="text-sm font-medium">72%</div>
          <Progress value={72} />
          <div className="text-sm font-medium">34%</div>
          <Progress value={34} />
        </Demo>
        <Demo className="flex-col items-stretch gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-3 w-11/12" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </Demo>
      </div>

      <Subhead>Separator · Aspect ratio</Subhead>
      <div className="grid gap-4 sm:grid-cols-2">
        <Demo className="flex-col items-start">
          <div>
            <div className="text-sm font-semibold">Kernel</div>
            <div className="text-sm text-muted-foreground">A shadcn/ui theme</div>
          </div>
          <Separator className="my-4" />
          <div className="flex h-5 items-center gap-4 text-sm text-muted-foreground">
            <span>Docs</span>
            <Separator orientation="vertical" />
            <span>Source</span>
            <Separator orientation="vertical" />
            <span>Theme</span>
          </div>
        </Demo>
        <Demo className="justify-center">
          <div className="w-full max-w-xs">
            <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md border bg-muted">
              <div className="grid h-full place-items-center font-mono text-xs text-primary">
                16 : 9 · media
              </div>
            </AspectRatio>
          </div>
        </Demo>
      </div>
    </>
  )
}
