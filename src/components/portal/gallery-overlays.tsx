"use client"


import { toast } from "sonner"
import { CheckCircle2, AlertTriangle, Info, XCircle, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { GroupHeader, Subhead, Demo } from "./section"

export function GalleryOverlays() {
  return (
    <>
      <GroupHeader title="Feedback & overlay" sub="Alerts, transient messages, and floating surfaces." />

      <Subhead>Alert</Subhead>
      <div className="space-y-4">
        <Alert variant="success">
          <CheckCircle2 />
          <AlertTitle>Contract settled</AlertTitle>
          <AlertDescription>
            Load #4471 settled at $4.62/bu — payment scheduled for Friday.
          </AlertDescription>
        </Alert>
        <Alert variant="warning">
          <AlertTriangle />
          <AlertTitle>Moisture over spec</AlertTitle>
          <AlertDescription>
            This corn load tested 16.2% — a drying discount will apply at intake.
          </AlertDescription>
        </Alert>
        <Alert variant="info">
          <Info />
          <AlertTitle>Basis updated</AlertTitle>
          <AlertDescription>
            River terminal posted a new corn basis 12 minutes ago.
          </AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <XCircle />
          <AlertTitle>Settlement failed</AlertTitle>
          <AlertDescription>
            Bank rejected the ACH transfer. Re-enter routing details to retry.
          </AlertDescription>
        </Alert>
      </div>

      <Subhead>Sonner (toast) · Tooltip</Subhead>
      <Demo className="gap-4">
        <Button
          variant="outline"
          onClick={() =>
            toast.success("Deployment published", {
              description: "orchard-api · production",
              action: { label: "View", onClick: () => {} },
            })
          }
        >
          Show toast
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" size="icon"> <Plus /> </Button>} />
            <TooltipContent>Add to library</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Demo>

      <Subhead>Dialog · Alert dialog</Subhead>
      <Demo className="gap-4">
        <Dialog>
          <DialogTrigger render={<Button variant="outline">Edit profile</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" defaultValue="Ellis Morgan" />
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive">Delete project</Button>} />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the project and all of its deployments.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Demo>

      <Subhead>Popover · Hover card</Subhead>
      <Demo className="gap-4">
        <Popover>
          <PopoverTrigger render={<Button variant="outline">Dimensions</Button>} />
          <PopoverContent className="w-72">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold">Dimensions</div>
                <div className="text-sm text-muted-foreground">
                  Set the width and height for the layer.
                </div>
              </div>
              <div className="flex gap-3">
                <div className="grid flex-1 gap-1.5">
                  <Label htmlFor="w" className="text-xs">Width</Label>
                  <Input id="w" defaultValue="100%" className="h-8" />
                </div>
                <div className="grid flex-1 gap-1.5">
                  <Label htmlFor="h" className="text-xs">Height</Label>
                  <Input id="h" defaultValue="auto" className="h-8" />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <HoverCard>
          <HoverCardTrigger render={<Button variant="link">@sashalin</Button>} />
          <HoverCardContent className="w-80">
            <div className="flex gap-3">
              <Avatar className="size-12"><AvatarFallback>SL</AvatarFallback></Avatar>
              <div>
                <div className="text-sm font-semibold">Sasha Lin</div>
                <div className="text-sm text-muted-foreground">
                  Design systems lead · maintains the Kernel theme.
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </Demo>

      <Subhead>Sheet · Drawer</Subhead>
      <Demo className="gap-4">
        <Sheet>
          <SheetTrigger render={<Button variant="outline">Open sheet</Button>} />
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Refine results by status and owner.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-2 px-4">
              <Label htmlFor="f-status">Status</Label>
              <Input id="f-status" placeholder="All" />
            </div>
          </SheetContent>
        </Sheet>

        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader>
                <DrawerTitle>Move to project</DrawerTitle>
                <DrawerDescription>
                  Choose a destination for the selected items.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <Button>Confirm</Button>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </Demo>
    </>
  )
}
