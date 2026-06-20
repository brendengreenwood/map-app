import type { Meta, StoryObj } from "@storybook/react-vite"
import { ComponentsSection } from "@/components/portal/gallery"
import { FormElementsSection } from "@/components/portal/form-elements"
import { TablesSection } from "@/components/portal/tables"
import { ChartsSection } from "@/components/portal/charts"

const meta: Meta = {
  title: "Portal/Components",
  parameters: { docs: { disable: true } },
}
export default meta

export const Components: StoryObj = { render: () => <ComponentsSection /> }
export const FormElements: StoryObj = {
  name: "Form elements",
  render: () => <FormElementsSection />,
}
export const Tables: StoryObj = { render: () => <TablesSection /> }
export const Charts: StoryObj = { render: () => <ChartsSection /> }
