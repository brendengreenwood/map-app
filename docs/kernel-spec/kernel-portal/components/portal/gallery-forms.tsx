"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Bold, Italic, Underline, ArrowRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { GroupHeader, Subhead, Demo } from "./section"

const schema = z.object({
  username: z.string().min(2, "At least 2 characters."),
  email: z.string().email("Enter a valid email."),
})

function ProfileForm() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", email: "" },
  })

  function onSubmit(values: z.infer<typeof schema>) {
    toast.success("Submitted", { description: JSON.stringify(values) })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-5"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="sasha" {...field} />
              </FormControl>
              <FormDescription>Your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save changes</Button>
      </form>
    </Form>
  )
}

export function GalleryForms() {
  const [slider, setSlider] = React.useState([64])

  return (
    <>
      <GroupHeader title="Actions" sub="Buttons and toggles — the primary triggers in the system." />

      <Subhead>Button</Subhead>
      <Demo className="flex-col items-start gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" variant="outline">
            <Plus />
          </Button>
          <Button disabled>Disabled</Button>
          <Button>
            With icon <ArrowRight />
          </Button>
        </div>
      </Demo>

      <Subhead>Toggle · Toggle group</Subhead>
      <Demo className="gap-8">
        <div className="flex items-center gap-2">
          <Toggle aria-label="Bold" defaultPressed>
            <Bold />
          </Toggle>
          <Toggle aria-label="Italic">
            <Italic />
          </Toggle>
          <Toggle aria-label="Underline">
            <Underline />
          </Toggle>
        </div>
        <ToggleGroup type="single" defaultValue="left" variant="outline">
          <ToggleGroupItem value="left">Left</ToggleGroupItem>
          <ToggleGroupItem value="center">Center</ToggleGroupItem>
          <ToggleGroupItem value="right">Right</ToggleGroupItem>
        </ToggleGroup>
      </Demo>

      <GroupHeader title="Forms & input" sub="Text fields, choices, ranges, validation, and one-time codes." />

      <Subhead>Input · Select · Textarea</Subhead>
      <Demo className="flex-col items-stretch gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select>
              <SelectTrigger id="role">
                <SelectValue placeholder="Engineer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eng">Engineer</SelectItem>
                <SelectItem value="design">Designer</SelectItem>
                <SelectItem value="pm">Product</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="msg">Message</Label>
            <Textarea id="msg" placeholder="Tell us what you're building…" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Label className="flex items-center gap-2">
            <Checkbox defaultChecked /> Subscribe to updates
          </Label>
          <Label className="flex items-center gap-2">
            <Switch defaultChecked /> Notifications
          </Label>
        </div>
      </Demo>

      <Subhead>Radio group</Subhead>
      <Demo>
        <RadioGroup defaultValue="comfortable" className="gap-3">
          <Label className="flex items-center gap-2 font-normal">
            <RadioGroupItem value="default" /> Default
          </Label>
          <Label className="flex items-center gap-2 font-normal">
            <RadioGroupItem value="comfortable" /> Comfortable
          </Label>
          <Label className="flex items-center gap-2 font-normal">
            <RadioGroupItem value="compact" /> Compact
          </Label>
        </RadioGroup>
      </Demo>

      <Subhead>Slider · Input OTP</Subhead>
      <Demo className="flex-col items-start gap-7">
        <div className="w-full max-w-xs">
          <div className="mb-3 text-sm font-medium">
            Value <span className="font-mono text-muted-foreground">{slider[0]}</span>
          </div>
          <Slider value={slider} onValueChange={setSlider} max={100} step={1} />
        </div>
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </Demo>

      <Subhead>Form (react-hook-form + zod)</Subhead>
      <Demo>
        <ProfileForm />
      </Demo>
    </>
  )
}
