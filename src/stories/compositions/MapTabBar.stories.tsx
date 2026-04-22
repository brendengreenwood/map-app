import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MapTabBar, type MapTab } from '@/components/map-tab-bar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Map, Layers, Route, Compass } from 'lucide-react';

const SAMPLE_TABS: MapTab[] = [
  { id: 'main', label: 'Main Map', icon: Map, closable: false },
  { id: 'heatmap', label: 'Heatmap View', icon: Layers },
  { id: 'route-1', label: 'Route Planning', icon: Route },
];

const meta: Meta<typeof MapTabBar> = {
  title: 'Compositions/MapTabBar',
  component: MapTabBar,
  args: {
    tabs: SAMPLE_TABS,
    activeTabId: 'main',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: 800, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <Story />
        <div className="flex h-48 items-center justify-center bg-muted text-sm text-muted-foreground">
          Map content area
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithBackButton: Story = {
  name: 'With Back Button',
  args: {
    leadingAction: (
      <Button variant="ghost" size="icon-sm" onClick={() => alert('Back!')}>
        <ArrowLeft />
      </Button>
    ),
  },
};

export const WithActions: Story = {
  name: 'With Back + Add Button',
  args: {
    leadingAction: (
      <Button variant="ghost" size="icon-sm">
        <ArrowLeft />
      </Button>
    ),
    trailingAction: (
      <Button variant="ghost" size="icon-sm">
        <Plus />
      </Button>
    ),
  },
};

export const SingleTab: Story = {
  name: 'Single Tab (no close)',
  args: {
    tabs: [{ id: 'main', label: 'Main Map', icon: Map, closable: false }],
    activeTabId: 'main',
  },
};

export const ManyTabs: Story = {
  name: 'Many Tabs (overflow)',
  args: {
    tabs: [
      { id: 'main', label: 'Main Map', icon: Map, closable: false },
      { id: 'heat', label: 'Heatmap View', icon: Layers },
      { id: 'route-1', label: 'Route A → B', icon: Route },
      { id: 'route-2', label: 'Route C → D', icon: Route },
      { id: 'compass', label: 'Navigation', icon: Compass },
      { id: 'extra-1', label: 'Producer Overlay' },
      { id: 'extra-2', label: 'Competitor Overlay' },
    ],
    activeTabId: 'heat',
    leadingAction: (
      <Button variant="ghost" size="icon-sm">
        <ArrowLeft />
      </Button>
    ),
    trailingAction: (
      <Button variant="ghost" size="icon-sm">
        <Plus />
      </Button>
    ),
  },
};

export const Interactive: Story = {
  name: 'Interactive (click tabs, close)',
  render: function InteractiveStory() {
    const [tabs, setTabs] = useState<MapTab[]>([
      { id: 'main', label: 'Main Map', icon: Map, closable: false },
      { id: 'heatmap', label: 'Heatmap View', icon: Layers },
      { id: 'route', label: 'Route Planning', icon: Route },
    ]);
    const [activeId, setActiveId] = useState('main');
    let counter = tabs.length;

    const handleClose = (id: string) => {
      setTabs((prev) => prev.filter((t) => t.id !== id));
      if (activeId === id) setActiveId('main');
    };

    const handleAdd = () => {
      counter += 1;
      const newId = `tab-${Date.now()}`;
      setTabs((prev) => [...prev, { id: newId, label: `New Tab ${counter}` }]);
      setActiveId(newId);
    };

    return (
      <MapTabBar
        tabs={tabs}
        activeTabId={activeId}
        onTabChange={setActiveId}
        onTabClose={handleClose}
        leadingAction={
          <Button variant="ghost" size="icon-sm" onClick={() => alert('Back!')}>
            <ArrowLeft />
          </Button>
        }
        trailingAction={
          <Button variant="ghost" size="icon-sm" onClick={handleAdd}>
            <Plus />
          </Button>
        }
      />
    );
  },
};
