import type { Meta, StoryObj } from "@storybook/react-vite"
import { AppShellSection } from "@/components/portal/app-shell"
import { DashboardSection } from "@/components/portal/dashboard"
import { FiltersSection } from "@/components/portal/filters"
import { PatternsSection } from "@/components/portal/patterns"
import { FlowsSection } from "@/components/portal/flows"

const meta: Meta = {
  title: "Portal/Patterns",
  parameters: { docs: { disable: true } },
}
export default meta

export const AppShell: StoryObj = {
  name: "App shell",
  render: () => <AppShellSection />,
}
export const Dashboard: StoryObj = { render: () => <DashboardSection /> }
export const Filtering: StoryObj = { render: () => <FiltersSection /> }
export const CrudPatterns: StoryObj = {
  name: "CRUD patterns",
  render: () => <PatternsSection />,
}
export const Flows: StoryObj = { render: () => <FlowsSection /> }
