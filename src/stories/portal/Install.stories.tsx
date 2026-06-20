import type { Meta, StoryObj } from "@storybook/react-vite"
import { InstallSection } from "@/components/portal/install"

const meta: Meta<typeof InstallSection> = {
  title: "Portal/Install",
  component: InstallSection,
  parameters: { docs: { disable: true } },
}
export default meta

export const Install: StoryObj<typeof InstallSection> = { render: () => <InstallSection /> }
