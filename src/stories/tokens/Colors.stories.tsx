import type { Meta, StoryObj } from '@storybook/react';

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const SCALES: { group: string; prefix: string }[] = [
  { group: 'Brand', prefix: 'brand' },
  { group: 'Neutral', prefix: 'neutral' },
  { group: 'Success', prefix: 'success' },
  { group: 'Warning', prefix: 'warning' },
  { group: 'Error', prefix: 'error' },
  { group: 'Info', prefix: 'info' },
  { group: 'Viz · Crop', prefix: 'viz-crop' },
  { group: 'Viz · Wheat', prefix: 'viz-wheat' },
  { group: 'Viz · Clay', prefix: 'viz-clay' },
  { group: 'Viz · Sky', prefix: 'viz-sky' },
  { group: 'Viz · Plum', prefix: 'viz-plum' },
  { group: 'Viz · Teal', prefix: 'viz-teal' },
  { group: 'Viz · Rust', prefix: 'viz-rust' },
  { group: 'Viz · Slate', prefix: 'viz-slate' },
];

const SEMANTIC = [
  { name: 'background', var: '--background', usage: 'Page background' },
  { name: 'foreground', var: '--foreground', usage: 'Primary text' },
  { name: 'card', var: '--card', usage: 'Card surfaces' },
  { name: 'card-foreground', var: '--card-foreground', usage: 'Card text' },
  { name: 'primary', var: '--primary', usage: 'Brand primary actions' },
  { name: 'primary-foreground', var: '--primary-foreground', usage: 'Text on primary' },
  { name: 'secondary', var: '--secondary', usage: 'Subtle backgrounds' },
  { name: 'secondary-foreground', var: '--secondary-foreground', usage: 'Text on secondary' },
  { name: 'muted', var: '--muted', usage: 'Muted backgrounds' },
  { name: 'muted-foreground', var: '--muted-foreground', usage: 'Subdued text' },
  { name: 'accent', var: '--accent', usage: 'Accent tint' },
  { name: 'accent-foreground', var: '--accent-foreground', usage: 'Accent text' },
  { name: 'destructive', var: '--destructive', usage: 'Error/delete actions' },
  { name: 'border', var: '--border', usage: 'Borders and dividers' },
  { name: 'input', var: '--input', usage: 'Input borders' },
  { name: 'ring', var: '--ring', usage: 'Focus rings' },
];

const STATUSES = [
  'draft',
  'pending',
  'booked',
  'intransit',
  'delivered',
  'settled',
  'onhold',
  'rejected',
  'cancelled',
  'expired',
];

function ScaleSwatch({ cssVar, step }: { cssVar: string; step: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          height: 56,
          borderRadius: 6,
          background: `var(${cssVar})`,
          border: '1px solid var(--border)',
        }}
      />
      <div style={{ fontSize: 11, fontWeight: 600 }}>{step}</div>
      <code style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{cssVar}</code>
    </div>
  );
}

function Scales() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 16, fontFamily: 'var(--font-sans)' }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Kernel Color Scales</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
          Every color family is a full 50→950 ramp. Reach for these scale steps when
          building semantic tokens or one-off accents; never reference brand or viz
          scales directly inside components.
        </p>
      </div>
      {SCALES.map(({ group, prefix }) => (
        <div key={prefix}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 12,
              borderBottom: '1px solid var(--border)',
              paddingBottom: 8,
            }}
          >
            {group}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))',
              gap: 8,
            }}
          >
            {STEPS.map((step) => (
              <ScaleSwatch key={step} cssVar={`--${prefix}-${step}`} step={step} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SemanticColors() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 16, fontFamily: 'var(--font-sans)' }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Semantic Color Tokens</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
          These tokens map Kernel scale steps to functional roles. Use these in
          components — never reference scale steps directly.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {SEMANTIC.map((c) => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: `var(${c.var})`,
                border: '1px solid var(--border)',
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
              <code style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{c.var}</code>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{c.usage}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusTokens() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, fontFamily: 'var(--font-sans)' }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Status Tokens</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
          Persistent lifecycle state for loads and contracts. Pair with{' '}
          <code>&lt;StatusBadge status="…"/&gt;</code>.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
        {STATUSES.map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                background: `var(--status-${s})`,
                border: '1px solid var(--border)',
              }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{s}</div>
              <code style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>--status-{s}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Tokens/Colors',
};

export default meta;

type Story = StoryObj;

export const Scales_: Story = {
  name: 'Scales (50→950)',
  render: () => <Scales />,
};

export const Semantic: Story = {
  render: () => <SemanticColors />,
};

export const Status: Story = {
  render: () => <StatusTokens />,
};
