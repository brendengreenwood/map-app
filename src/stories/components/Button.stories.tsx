import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, Trash2, Download, ArrowRight } from 'lucide-react';

const meta = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete' },
};

export const Outline: Story = {
  args: { variant: 'outline', children: 'Outline' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
};

export const Small: Story = {
  args: { size: 'sm', children: 'Small' },
};

export const Large: Story = {
  args: { size: 'lg', children: 'Large' },
};

export const WithIcon: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button>
        <Plus data-icon="inline-start" /> Add Item
      </Button>
      <Button variant="destructive">
        <Trash2 data-icon="inline-start" /> Delete
      </Button>
      <Button variant="outline">
        Download <Download data-icon="inline-end" />
      </Button>
      <Button variant="secondary">
        Next <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button disabled>
        <Spinner data-icon="inline-start" /> Creating...
      </Button>
      <Button variant="destructive" disabled>
        <Spinner data-icon="inline-start" /> Deleting...
      </Button>
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button size="icon" variant="outline"><Plus /></Button>
      <Button size="icon" variant="ghost"><Trash2 /></Button>
      <Button size="icon" variant="destructive"><Trash2 /></Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const).map((variant) => (
        <div key={variant} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <code style={{ fontSize: 11, width: 100, color: 'var(--muted-foreground)' }}>{variant}</code>
          <Button variant={variant} size="sm">Small</Button>
          <Button variant={variant}>Default</Button>
          <Button variant={variant} size="lg">Large</Button>
          <Button variant={variant} disabled>Disabled</Button>
        </div>
      ))}
    </div>
  ),
};
