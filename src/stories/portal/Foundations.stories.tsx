import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  ColorsSection,
  TypographySection,
  SpacingSection,
  ShadowsSection,
} from "@/components/portal/foundations"

const meta: Meta = {
  title: "Portal/Foundations",
  parameters: { docs: { disable: true } },
}
export default meta

export const Colors: StoryObj = { render: () => <ColorsSection /> }
export const Typography: StoryObj = { render: () => <TypographySection /> }
export const Spacing: StoryObj = { render: () => <SpacingSection /> }
export const Shadows: StoryObj = { render: () => <ShadowsSection /> }
