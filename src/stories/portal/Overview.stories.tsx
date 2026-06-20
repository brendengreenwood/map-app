import type { Meta, StoryObj } from "@storybook/react-vite"
import { OverviewSection } from "@/components/portal/overview"

const meta: Meta<typeof OverviewSection> = {
  title: "Portal/Overview",
  component: OverviewSection,
  parameters: { docs: { disable: true } },
}
export default meta

export const Overview: StoryObj<typeof OverviewSection> = { render: () => <OverviewSection /> }
