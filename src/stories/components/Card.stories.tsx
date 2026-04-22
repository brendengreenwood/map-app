import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const meta = {
  title: 'Components/Card',
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description text goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">This is the card content area. Use it for any content.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Create Producer</CardTitle>
        <CardDescription>Add a new producer to the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Fill out the form to add a new grain producer.</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const StatsCard: Story = {
  name: 'Stats Card (Dashboard pattern)',
  render: () => (
    <div className="grid grid-cols-3 gap-4" style={{ maxWidth: 600 }}>
      <Card>
        <CardHeader>
          <CardDescription>Total Features</CardDescription>
          <CardTitle className="text-2xl">12,450</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Producers</CardDescription>
          <CardTitle className="text-2xl">38</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Competitors</CardDescription>
          <CardTitle className="text-2xl">15</CardTitle>
        </CardHeader>
      </Card>
    </div>
  ),
};

export const WithBadges: Story = {
  name: 'With Badges (List item pattern)',
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Smith Family Farms</CardTitle>
          <Badge variant="secondary" className="text-[10px]">merchant</Badge>
        </div>
        <CardDescription>123 County Rd, Iowa</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">corn</Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">soybeans</Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">wheat</Badge>
        </div>
      </CardContent>
    </Card>
  ),
};
