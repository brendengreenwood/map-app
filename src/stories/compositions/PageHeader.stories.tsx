import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { mdiBarley, mdiOfficeBuildingOutline, mdiDatabase, mdiShield, mdiCog, mdiPlus } from '@mdi/js';

const meta: Meta<typeof PageHeader> = {
  title: 'Compositions/PageHeader',
  component: PageHeader,
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
  args: {
    icon: mdiDatabase,
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
    icon: mdiBarley,
    title: 'Producers',
    description: 'Manage grain producers and their bin locations.',
  },
  render: (args) => (
    <PageHeader {...args}>
      <Button>
        <Icon path={mdiPlus} data-icon="inline-start" /> Add Producer
      </Button>
    </PageHeader>
  ),
};

export const AllPages: Story = {
  name: 'All Page Headers',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <PageHeader icon={mdiDatabase} title="Dashboard" description="Overview of features and stats." />
      <PageHeader icon={mdiBarley} title="Producers" description="Manage grain producers and their bin locations.">
        <Button><Icon path={mdiPlus} data-icon="inline-start" /> Add Producer</Button>
      </PageHeader>
      <PageHeader icon={mdiOfficeBuildingOutline} title="Competitors" description="Track competing grain elevators.">
        <Button><Icon path={mdiPlus} data-icon="inline-start" /> Add Competitor</Button>
      </PageHeader>
      <PageHeader icon={mdiShield} title="Admin" description="Assign originators to merchants and elevators to merchants." />
      <PageHeader icon={mdiCog} title="Settings" description="Profile preferences and app configuration." />
    </div>
  ),
};
