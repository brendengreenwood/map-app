import type { Meta, StoryObj } from '@storybook/react-vite';

const PRIMITIVES = {
  'Greens': [
    { name: 'green-100', var: '--sprout-green-100', hex: '#eef5e6' },
    { name: 'green-200', var: '--sprout-green-200', hex: '#8cc63f' },
    { name: 'green-300', var: '--sprout-green-300', hex: '#4d8c2a' },
    { name: 'green-400', var: '--sprout-green-400', hex: '#2d5016' },
    { name: 'green-700', var: '--sprout-green-700', hex: '#1f3b0f' },
    { name: 'green-800', var: '--sprout-green-800', hex: '#142a09' },
    { name: 'green-900', var: '--sprout-green-900', hex: '#0b1d04' },
  ],
  'Neutrals': [
    { name: 'neutral-100', var: '--sprout-neutral-100', hex: '#f3f4f1' },
    { name: 'neutral-200', var: '--sprout-neutral-200', hex: '#e6e7e4' },
    { name: 'neutral-300', var: '--sprout-neutral-300', hex: '#d9dbd6' },
    { name: 'neutral-400', var: '--sprout-neutral-400', hex: '#a6aca2' },
    { name: 'neutral-500', var: '--sprout-neutral-500', hex: '#7c847a' },
    { name: 'neutral-600', var: '--sprout-neutral-600', hex: '#656e62' },
    { name: 'neutral-700', var: '--sprout-neutral-700', hex: '#4e564c' },
    { name: 'neutral-900', var: '--sprout-neutral-900', hex: '#2c3329' },
    { name: 'neutral-1000', var: '--sprout-neutral-1000', hex: '#1e2520' },
  ],
  'Emphasis': [
    { name: 'ruby-red-100', var: '--sprout-ruby-red-100', hex: '#d94040' },
    { name: 'ruby-red-500', var: '--sprout-ruby-red-500', hex: '#a3231e' },
    { name: 'midnight-blue-500', var: '--sprout-midnight-blue-500', hex: '#1a2a60' },
    { name: 'sky-blue-500', var: '--sprout-sky-blue-500', hex: '#89cff0' },
    { name: 'bright-yellow-500', var: '--sprout-bright-yellow-500', hex: '#c8a516' },
    { name: 'vibrant-purple-500', var: '--sprout-vibrant-purple-500', hex: '#7a33d0' },
    { name: 'vibrant-purple-100', var: '--sprout-vibrant-purple-100', hex: '#c9a5e8' },
  ],
};

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

function ColorSwatch({ name, cssVar, label }: { name: string; cssVar: string; label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          background: `var(${cssVar})`,
          border: '1px solid var(--border)',
          flexShrink: 0,
        }}
      />
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
        <code style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{cssVar}</code>
        {label && <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{label}</div>}
      </div>
    </div>
  );
}

function PrimitiveColors() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 16, fontFamily: 'var(--font-sans)' }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Sprout Primitive Colors</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
          Core palette tokens from the Sprout design system. These are never used directly in components — they feed the semantic tokens.
        </p>
      </div>
      {Object.entries(PRIMITIVES).map(([group, colors]) => (
        <div key={group}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            {group}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
            {colors.map((c) => (
              <ColorSwatch key={c.name} name={c.name} cssVar={c.var} label={c.hex} />
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
          These tokens map Sprout primitives to functional roles. Use these in components — never reference primitives directly.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
        {SEMANTIC.map((c) => (
          <ColorSwatch key={c.name} name={c.name} cssVar={c.var} label={c.usage} />
        ))}
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Tokens/Colors',
};

export default meta;

export const Primitives: StoryObj = {
  render: () => <PrimitiveColors />,
};

export const Semantic: StoryObj = {
  render: () => <SemanticColors />,
};
