import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Wheat, Building2, Database, Shield, Settings, Plus } from 'lucide-react';

const meta: Meta<typeof PageHeader> = {
  title: 'Compositions/PageHeader',
  component: PageHeader,
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
  args: {
    icon: Database,
    title: 'Dashboard',
    description: 'Overview of features and stats.',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  name: 'With Action Button',
  args: {
    icon: Wheat,
    title: 'Producers',
    description: 'Manage grain producers and their bin locations.',
  },
  render: (args) => (
    <PageHeader {...args}>
      <Button>
        <Plus data-icon="inline-start" /> Add Producer
      </Button>
    </PageHeader>
  ),
};

export const AllPages: Story = {
  name: 'All Page Headers',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <PageHeader icon={Database} title="Dashboard" description="Overview of features and stats." />
      <PageHeader icon={Wheat} title="Producers" description="Manage grain producers and their bin locations.">
        <Button><Plus data-icon="inline-start" /> Add Producer</Button>
      </PageHeader>
      <PageHeader icon={Building2} title="Competitors" description="Track competing grain elevators.">
        <Button><Plus data-icon="inline-start" /> Add Competitor</Button>
      </PageHeader>
      <PageHeader icon={Shield} title="Admin" description="Assign originators to merchants and elevators to merchants." />
      <PageHeader icon={Settings} title="Settings" description="Profile preferences and app configuration." />
    </div>
  ),
};
