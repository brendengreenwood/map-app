import type { Meta, StoryObj } from "@storybook/react-vite"
import { ComponentsSection } from "@/components/portal/gallery"
import { GalleryForms } from "@/components/portal/gallery-forms"
import { GalleryData } from "@/components/portal/gallery-data"
import { GalleryOverlays } from "@/components/portal/gallery-overlays"
import { GalleryNav } from "@/components/portal/gallery-nav"
import { GalleryMisc } from "@/components/portal/gallery-misc"

const meta: Meta = {
  title: "Portal/Components",
  parameters: { docs: { disable: true } },
}
export default meta

export const Overview: StoryObj = { render: () => <ComponentsSection /> }
export const Forms: StoryObj = { render: () => <GalleryForms /> }
export const Data: StoryObj = { render: () => <GalleryData /> }
export const Overlays: StoryObj = { render: () => <GalleryOverlays /> }
export const Navigation: StoryObj = { render: () => <GalleryNav /> }
export const Misc: StoryObj = { render: () => <GalleryMisc /> }
