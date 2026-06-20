import type { Meta, StoryObj } from "@storybook/react-vite"
import { OverviewSection } from "@/components/portal/overview"
import { InstallSection } from "@/components/portal/install"

const meta: Meta = {
  title: "Portal/Get started",
  parameters: { docs: { disable: true } },
}
export default meta

export const Overview: StoryObj = { render: () => <OverviewSection /> }
export const InstallAndUsage: StoryObj = {
  name: "Install & usage",
  render: () => <InstallSection />,
}
