import type { Meta, StoryObj } from '@storybook/react-vite';

function TypographyScale() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 16, fontFamily: 'var(--font-sans)' }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Typography</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
          Font stack: HelveticaNowForCargill → Geist Variable → system-ui. Tailwind utility classes for sizing.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {[
          { label: 'text-3xl (30px)', className: 'text-3xl font-bold', text: 'Page Heading' },
          { label: 'text-2xl (24px)', className: 'text-2xl font-bold', text: 'Section Heading' },
          { label: 'text-xl (20px)', className: 'text-xl font-semibold', text: 'Card Title' },
          { label: 'text-lg (18px)', className: 'text-lg font-medium', text: 'Subtitle' },
          { label: 'text-base (16px)', className: 'text-base', text: 'Body text — the quick brown fox jumps over the lazy dog.' },
          { label: 'text-sm (14px)', className: 'text-sm', text: 'Secondary text — used for descriptions, table cells, and form labels.' },
          { label: 'text-xs (12px)', className: 'text-xs', text: 'Caption text — timestamps, badges, and metadata.' },
          { label: 'text-[10px]', className: 'text-[10px]', text: 'Micro text — tiny badge labels.' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <code style={{ fontSize: 11, color: 'var(--muted-foreground)', width: 140, flexShrink: 0, textAlign: 'right' }}>
              {item.label}
            </code>
            <span className={item.className}>{item.text}</span>
          </div>
        ))}
      </div>

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
          Font Weights
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'font-normal (400)', className: 'font-normal text-lg' },
            { label: 'font-medium (500)', className: 'font-medium text-lg' },
            { label: 'font-semibold (600)', className: 'font-semibold text-lg' },
            { label: 'font-bold (700)', className: 'font-bold text-lg' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <code style={{ fontSize: 11, color: 'var(--muted-foreground)', width: 140, flexShrink: 0, textAlign: 'right' }}>
                {item.label}
              </code>
              <span className={item.className}>The quick brown fox jumps over the lazy dog</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
          Text Colors
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'text-foreground', className: 'text-foreground', desc: 'Primary' },
            { label: 'text-muted-foreground', className: 'text-muted-foreground', desc: 'Secondary/muted' },
            { label: 'text-primary', className: 'text-primary', desc: 'Brand accent' },
            { label: 'text-destructive', className: 'text-destructive', desc: 'Error/warning' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <code style={{ fontSize: 11, color: 'var(--muted-foreground)', width: 180, flexShrink: 0, textAlign: 'right' }}>
                {item.label}
              </code>
              <span className={`text-base font-medium ${item.className}`}>{item.desc} — Sample text</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Tokens/Typography',
};

export default meta;

export const Scale: StoryObj = {
  render: () => <TypographyScale />,
};
