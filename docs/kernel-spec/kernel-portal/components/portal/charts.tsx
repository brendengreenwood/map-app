"use client"

import * as React from "react"
import { Bar, BarChart, Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Section } from "./section"

const deployData = [
  { day: "Mon", production: 18, preview: 24 },
  { day: "Tue", production: 26, preview: 30 },
  { day: "Wed", production: 14, preview: 19 },
  { day: "Thu", production: 32, preview: 28 },
  { day: "Fri", production: 22, preview: 35 },
  { day: "Sat", production: 9, preview: 12 },
  { day: "Sun", production: 16, preview: 14 },
]

const deployConfig = {
  production: { label: "Production", color: "var(--chart-1)" },
  preview: { label: "Preview", color: "var(--chart-2)" },
} satisfies ChartConfig

const usersData = [
  { week: "W1", users: 1200 },
  { week: "W2", users: 1320 },
  { week: "W3", users: 1180 },
  { week: "W4", users: 1620 },
  { week: "W5", users: 1740 },
  { week: "W6", users: 2010 },
  { week: "W7", users: 2280 },
  { week: "W8", users: 2640 },
]

const usersConfig = {
  users: { label: "Weekly active", color: "var(--chart-4)" },
} satisfies ChartConfig

export function ChartsSection() {
  return (
    <Section
      id="charts"
      eyebrow="Elements"
      title="Charts"
      lead="Data visualization draws from the five-step chart scale via shadcn's ChartContainer. The greens read clearly together in both light and dark."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly deployments</CardTitle>
            <CardDescription>Last 7 days · by environment</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={deployConfig} className="h-56 w-full">
              <BarChart data={deployData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="production" fill="var(--color-production)" radius={4} />
                <Bar dataKey="preview" fill="var(--color-preview)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active users</CardTitle>
            <CardDescription>Trailing 8 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={usersConfig} className="h-56 w-full">
              <AreaChart data={usersData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-users)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-users)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="users"
                  type="natural"
                  fill="url(#fillUsers)"
                  stroke="var(--color-users)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}
