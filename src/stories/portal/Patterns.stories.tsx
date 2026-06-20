import type { Meta, StoryObj } from "@storybook/react-vite"
import { FormElementsSection } from "@/components/portal/form-elements"
import { TablesSection } from "@/components/portal/tables"
import { ChartsSection } from "@/components/portal/charts"
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

export const FormElements: StoryObj = { render: () => <FormElementsSection /> }
export const Tables: StoryObj = { render: () => <TablesSection /> }
export const Charts: StoryObj = { render: () => <ChartsSection /> }
export const AppShell: StoryObj = { render: () => <AppShellSection /> }
export const Dashboard: StoryObj = { render: () => <DashboardSection /> }
export const Filters: StoryObj = { render: () => <FiltersSection /> }
export const Patterns: StoryObj = { render: () => <PatternsSection /> }
export const Flows: StoryObj = { render: () => <FlowsSection /> }
