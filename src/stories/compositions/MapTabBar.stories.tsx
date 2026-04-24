import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MapTabBar, type MapTab } from '@/components/map-tab-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { mdiArrowLeft, mdiPlus, mdiMap, mdiLayers, mdiRoutes, mdiCompass } from '@mdi/js';

const SAMPLE_TABS: MapTab[] = [
  { id: 'main', label: 'Main Map', icon: mdiMap },
  { id: 'heatmap', label: 'Heatmap View', icon: mdiLayers },
  { id: 'route-1', label: 'Route Planning', icon: mdiRoutes },
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
        <Icon path={mdiArrowLeft} />
      </Button>
    ),
  },
};

export const WithActions: Story = {
  name: 'With Back + Add Button',
  args: {
    leadingAction: (
      <Button variant="ghost" size="icon-sm">
        <Icon path={mdiArrowLeft} />
      </Button>
    ),
    trailingAction: (
      <Button variant="ghost" size="icon-sm">
        <Icon path={mdiPlus} />
      </Button>
    ),
  },
};

export const SingleTab: Story = {
  name: 'Single Tab',
  args: {
    tabs: [{ id: 'main', label: 'Main Map', icon: mdiMap }],
    activeTabId: 'main',
  },
};

export const ManyTabs: Story = {
  name: 'Many Tabs (overflow)',
  args: {
    tabs: [
      { id: 'main', label: 'Main Map', icon: mdiMap },
      { id: 'heat', label: 'Heatmap View', icon: mdiLayers },
      { id: 'route-1', label: 'Route A → B', icon: mdiRoutes },
      { id: 'route-2', label: 'Route C → D', icon: mdiRoutes },
      { id: 'compass', label: 'Navigation', icon: mdiCompass },
      { id: 'extra-1', label: 'Producer Overlay' },
      { id: 'extra-2', label: 'Competitor Overlay' },
    ],
    activeTabId: 'heat',
    leadingAction: (
      <Button variant="ghost" size="icon-sm">
        <Icon path={mdiArrowLeft} />
      </Button>
    ),
    trailingAction: (
      <Button variant="ghost" size="icon-sm">
        <Icon path={mdiPlus} />
      </Button>
    ),
  },
};

export const Interactive: Story = {
  name: 'Interactive (click tabs)',
  render: function InteractiveStory() {
    const [tabs, setTabs] = useState<MapTab[]>([
      { id: 'main', label: 'Main Map', icon: mdiMap },
      { id: 'heatmap', label: 'Heatmap View', icon: mdiLayers },
      { id: 'route', label: 'Route Planning', icon: mdiRoutes },
    ]);
    const [activeId, setActiveId] = useState('main');
    let counter = tabs.length;

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
        leadingAction={
          <Button variant="ghost" size="icon-sm" onClick={() => alert('Back!')}>
            <Icon path={mdiArrowLeft} />
          </Button>
        }
        trailingAction={
          <Button variant="ghost" size="icon-sm" onClick={handleAdd}>
            <Icon path={mdiPlus} />
          </Button>
        }
      />
    );
  },
};
