import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const meta = {
  title: 'Components/Table',
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_PRODUCERS = [
  { id: '1', name: 'Smith Family Farms', business: 'Smith LLC', bins: 2, commodities: ['corn', 'wheat'], created: '2026-04-20' },
  { id: '2', name: 'Johnson Grain', business: 'Johnson Co', bins: 1, commodities: ['soybeans'], created: '2026-04-19' },
  { id: '3', name: 'Midwest Harvest', business: '', bins: 3, commodities: ['corn', 'barley', 'oats'], created: '2026-04-18' },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Business</TableHead>
          <TableHead className="text-center">Bins</TableHead>
          <TableHead>Commodities</TableHead>
          <TableHead className="text-right">Created</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {SAMPLE_PRODUCERS.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium text-sm">{p.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{p.business || '—'}</TableCell>
            <TableCell className="text-center text-sm">{p.bins}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                {p.commodities.map((c) => (
                  <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0">{c}</Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="text-right text-xs text-muted-foreground">
              {new Date(p.created).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" className="text-destructive"><Trash2 /></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Empty: Story = {
  name: 'Empty State',
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Business</TableHead>
          <TableHead>Commodities</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
            No producers found. Add one to get started.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
