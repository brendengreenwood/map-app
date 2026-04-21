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
import { Trash2, Plus, Wheat, ChevronRight, ChevronLeft, X, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import {
  fetchProducers, createProducer, deleteProducer, type ProducerRow,
} from '@/lib/api';

// ── Stepped form state ──

interface LocationDraft {
  name: string;
  address: string;
  lng: string;
  lat: string;
}

const emptyLocation = (): LocationDraft => ({ name: '', address: '', lng: '', lat: '' });

const STEPS = ['Details', 'Bin Locations', 'Review'] as const;
type Step = (typeof STEPS)[number];

export default function ProducersPage() {
  const [producers, setProducers] = useState<ProducerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sheet state
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('Details');
  const [submitting, setSubmitting] = useState(false);

  // Form fields — step 1
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [lng, setLng] = useState('');
  const [lat, setLat] = useState('');
  const [commodities, setCommodities] = useState('');

  // Form fields — step 2
  const [locations, setLocations] = useState<LocationDraft[]>([emptyLocation()]);

  const reload = useCallback(async () => {
    try {
      const { producers } = await fetchProducers();
      setProducers(producers);
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
    setBusinessName('');
    setAddress('');
    setLng('');
    setLat('');
    setCommodities('');
    setLocations([emptyLocation()]);
    setStep('Details');
  };

  const handleOpen = () => {
    resetForm();
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const validLocations = locations
        .filter((l) => l.name.trim())
        .map((l) => ({
          name: l.name.trim(),
          address: l.address.trim() || undefined,
          lng: l.lng.trim() ? parseFloat(l.lng) : undefined,
          lat: l.lat.trim() ? parseFloat(l.lat) : undefined,
        }));

      await createProducer({
        id: crypto.randomUUID(),
        name: name.trim(),
        business_name: businessName.trim() || undefined,
        lng: lng.trim() ? parseFloat(lng) : undefined,
        lat: lat.trim() ? parseFloat(lat) : undefined,
        address: address.trim() || undefined,
        commodities: commodities.trim()
          ? commodities.split(',').map((c) => c.trim()).filter(Boolean)
          : undefined,
        locations: validLocations.length ? validLocations : undefined,
      });
      setOpen(false);
      reload();
    } catch {
      setError('Failed to create producer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProducer(id);
    reload();
  };

  const addLocation = () => setLocations((prev) => [...prev, emptyLocation()]);
  const removeLocation = (i: number) =>
    setLocations((prev) => prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i));
  const updateLocation = (i: number, field: keyof LocationDraft, value: string) =>
    setLocations((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const stepIndex = STEPS.indexOf(step);
  const canNext = step === 'Details' ? name.trim().length > 0 : true;

  if (error && !producers.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const validLocations = locations.filter((l) => l.name.trim());
  const parsedCommodities = commodities.trim()
    ? commodities.split(',').map((c) => c.trim()).filter(Boolean)
    : [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        icon={Wheat}
        title="Producers"
        description={`${producers.length} ${producers.length === 1 ? 'producer' : 'producers'}`}
      >
        <Button onClick={handleOpen}>
          <Plus data-icon="inline-start" />
          Add Producer
        </Button>
      </PageHeader>

      {/* Data table */}
      <Card className="py-0 gap-0 p-4">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : producers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Wheat className="size-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">No producers yet</p>
              <p className="text-xs text-muted-foreground/75">Click "Add Producer" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead>Commodities</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {producers.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.business_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.address ?? '—'}
                    </TableCell>
                    <TableCell>
                      {p.locations.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {p.locations.map((loc) => (
                            <Badge key={loc.id} variant="outline" className="gap-1">
                              <MapPin className="size-3" />
                              {loc.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.commodities.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {p.commodities.map((c) => (
                            <Badge key={c} variant="secondary">{c}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id)}>
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

      {/* ── Add Producer Sheet ── */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex flex-col sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Add Producer</SheetTitle>
            <SheetDescription>
              Step {stepIndex + 1} of {STEPS.length}: {step}
            </SheetDescription>
            {/* Step indicators */}
            <div className="flex gap-1.5 pt-2">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full ${
                    i <= stepIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            {/* Step 1: Details */}
            {step === 'Details' && (
              <FieldGroup className="grid gap-4">
                <Field>
                  <FieldLabel htmlFor="p-name">Producer Name *</FieldLabel>
                  <Input id="p-name" placeholder="e.g. John Smith" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="p-biz">Business Name</FieldLabel>
                  <Input id="p-biz" placeholder="e.g. Smith Family Farms LLC" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="p-addr">Address</FieldLabel>
                  <Input id="p-addr" placeholder="e.g. 123 County Rd, Iowa" value={address} onChange={(e) => setAddress(e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="p-lng">Longitude</FieldLabel>
                    <Input id="p-lng" placeholder="-95.5" type="number" value={lng} onChange={(e) => setLng(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="p-lat">Latitude</FieldLabel>
                    <Input id="p-lat" placeholder="40.2" type="number" value={lat} onChange={(e) => setLat(e.target.value)} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="p-comm">Commodities</FieldLabel>
                  <Input id="p-comm" placeholder="corn, soybeans, wheat" value={commodities} onChange={(e) => setCommodities(e.target.value)} />
                </Field>
              </FieldGroup>
            )}

            {/* Step 2: Bin Locations */}
            {step === 'Bin Locations' && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Add bin / elevator locations for this producer. You can skip this step.
                </p>
                {locations.map((loc, i) => (
                  <Card key={i}>
                    <CardContent className="flex flex-col gap-3 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Location {i + 1}</span>
                        {locations.length > 1 && (
                          <Button variant="ghost" size="icon" className="size-6 text-muted-foreground" onClick={() => removeLocation(i)}>
                            <X />
                          </Button>
                        )}
                      </div>
                      <FieldGroup className="grid gap-3">
                        <Field>
                          <FieldLabel htmlFor={`loc-name-${i}`}>Location Name *</FieldLabel>
                          <Input id={`loc-name-${i}`} placeholder="e.g. North Bin Site" value={loc.name} onChange={(e) => updateLocation(i, 'name', e.target.value)} />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`loc-addr-${i}`}>Address</FieldLabel>
                          <Input id={`loc-addr-${i}`} placeholder="e.g. 456 Grain Rd" value={loc.address} onChange={(e) => updateLocation(i, 'address', e.target.value)} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field>
                            <FieldLabel htmlFor={`loc-lng-${i}`}>Lng</FieldLabel>
                            <Input id={`loc-lng-${i}`} placeholder="-95.5" type="number" value={loc.lng} onChange={(e) => updateLocation(i, 'lng', e.target.value)} />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`loc-lat-${i}`}>Lat</FieldLabel>
                            <Input id={`loc-lat-${i}`} placeholder="40.2" type="number" value={loc.lat} onChange={(e) => updateLocation(i, 'lat', e.target.value)} />
                          </Field>
                        </div>
                      </FieldGroup>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" onClick={addLocation}>
                  <Plus data-icon="inline-start" />
                  Add Another Location
                </Button>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 'Review' && (
              <div className="flex flex-col gap-4">
                <div className="rounded-md border p-4">
                  <h3 className="text-sm font-medium mb-3">Producer Details</h3>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{name}</dd>
                    {businessName && (
                      <>
                        <dt className="text-muted-foreground">Business</dt>
                        <dd>{businessName}</dd>
                      </>
                    )}
                    {address && (
                      <>
                        <dt className="text-muted-foreground">Address</dt>
                        <dd>{address}</dd>
                      </>
                    )}
                    {(lng || lat) && (
                      <>
                        <dt className="text-muted-foreground">Coords</dt>
                        <dd className="font-mono text-xs">{lng || '—'}, {lat || '—'}</dd>
                      </>
                    )}
                    {parsedCommodities.length > 0 && (
                      <>
                        <dt className="text-muted-foreground">Commodities</dt>
                        <dd className="flex gap-1 flex-wrap">
                          {parsedCommodities.map((c) => (
                            <Badge key={c} variant="secondary">{c}</Badge>
                          ))}
                        </dd>
                      </>
                    )}
                  </dl>
                </div>
                {validLocations.length > 0 && (
                  <div className="rounded-md border p-4">
                    <h3 className="text-sm font-medium mb-3">
                      Bin Locations ({validLocations.length})
                    </h3>
                    <div className="flex flex-col gap-2">
                      {validLocations.map((loc, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium">{loc.name}</span>
                          {loc.address && (
                            <span className="text-muted-foreground">— {loc.address}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <SheetFooter className="flex-row gap-2">
            {stepIndex > 0 && (
              <Button variant="outline" onClick={() => setStep(STEPS[stepIndex - 1])}>
                <ChevronLeft data-icon="inline-start" />
                Back
              </Button>
            )}
            <div className="flex-1" />
            {stepIndex < STEPS.length - 1 ? (
              <Button onClick={() => setStep(STEPS[stepIndex + 1])} disabled={!canNext}>
                Next
                <ChevronRight data-icon="inline-end" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
                {submitting ? <Spinner data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
                {submitting ? 'Creating...' : 'Create Producer'}
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
