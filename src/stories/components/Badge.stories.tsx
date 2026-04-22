import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@/components/ui/badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
  args: {
    children: 'Badge',
    variant: 'default',
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'secondary' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'error' },
};

export const Outline: Story = {
  args: { variant: 'outline', children: 'outline' },
};

export const CommodityBadges: Story = {
  name: 'Commodity Badges (App pattern)',
  render: () => (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {['corn', 'soybeans', 'wheat', 'barley', 'sorghum', 'oats'].map((c) => (
        <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0">{c}</Badge>
      ))}
    </div>
  ),
};

export const UserTypeBadges: Story = {
  name: 'User Type Badges (App pattern)',
  render: () => (
    <div style={{ display: 'flex', gap: 4 }}>
      <Badge className="bg-primary text-primary-foreground">admin</Badge>
      <Badge className="bg-chart-2 text-white">merchant</Badge>
      <Badge className="bg-chart-3 text-foreground">originator</Badge>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['default', 'secondary', 'destructive', 'outline'] as const).map((variant) => (
        <div key={variant} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <code style={{ fontSize: 11, width: 100, color: 'var(--muted-foreground)' }}>{variant}</code>
          <Badge variant={variant}>{variant}</Badge>
        </div>
      ))}
    </div>
  ),
};
