import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Trash2, Plus, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import {
  fetchCompetitors, createCompetitor, deleteCompetitor, type CompetitorRow,
} from '@/lib/api';

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sheet state
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lng, setLng] = useState('');
  const [lat, setLat] = useState('');
  const [commodities, setCommodities] = useState('');

  const reload = useCallback(async () => {
    try {
      const { competitors } = await fetchCompetitors();
      setCompetitors(competitors);
      setError('');
    } catch {
      setError('Could not connect to API server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const resetForm = () => {
    setName('');
    setAddress('');
    setLng('');
    setLat('');
    setCommodities('');
  };

  const handleOpen = () => {
    resetForm();
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createCompetitor({
        id: crypto.randomUUID(),
        name: name.trim(),
        lng: lng.trim() ? parseFloat(lng) : undefined,
        lat: lat.trim() ? parseFloat(lat) : undefined,
        address: address.trim() || undefined,
        commodities: commodities.trim()
          ? commodities.split(',').map((c) => c.trim()).filter(Boolean)
          : undefined,
      });
      setOpen(false);
      reload();
    } catch {
      setError('Failed to create competitor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCompetitor(id);
    reload();
  };

  if (error && !competitors.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        icon={Building2}
        title="Competitors"
        description={`${competitors.length} ${competitors.length === 1 ? 'competitor' : 'competitors'}`}
      >
        <Button onClick={handleOpen}>
          <Plus data-icon="inline-start" />
          Add Competitor
        </Button>
      </PageHeader>

      {/* Data table */}
      <Card className="py-0 gap-0 p-4">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : competitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Building2 className="size-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">No competitors yet</p>
              <p className="text-xs text-muted-foreground/75">Click "Add Competitor" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Commodities</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.address ?? '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {c.lng != null && c.lat != null
                        ? `${c.lng.toFixed(4)}, ${c.lat.toFixed(4)}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {c.commodities.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {c.commodities.map((cm) => (
                            <Badge key={cm} variant="secondary">{cm}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(c.id)}>
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Add Competitor Sheet ── */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Competitor</SheetTitle>
            <SheetDescription>Add a rival grain elevator to track.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            <FieldGroup className="grid gap-4">
              <Field>
                <FieldLabel htmlFor="c-name">Name *</FieldLabel>
                <Input id="c-name" placeholder="e.g. Rival Grain Co" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="c-addr">Address</FieldLabel>
                <Input id="c-addr" placeholder="e.g. 789 Market St" value={address} onChange={(e) => setAddress(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="c-lng">Longitude</FieldLabel>
                  <Input id="c-lng" placeholder="-95.5" type="number" value={lng} onChange={(e) => setLng(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="c-lat">Latitude</FieldLabel>
                  <Input id="c-lat" placeholder="40.2" type="number" value={lat} onChange={(e) => setLat(e.target.value)} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="c-comm">Commodities</FieldLabel>
                <Input id="c-comm" placeholder="corn, wheat, soybeans" value={commodities} onChange={(e) => setCommodities(e.target.value)} />
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter>
            <Button onClick={handleSubmit} disabled={submitting || !name.trim()} className="w-full">
              {submitting ? <Spinner data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
              {submitting ? 'Creating...' : 'Create Competitor'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
