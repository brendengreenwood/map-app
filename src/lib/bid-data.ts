// Types and mock data for corn futures bid management

export interface CornContract {
  code: string;
  label: string;
}

export interface PricingData {
  posted: number;   // basis in cents
  max: number;      // max bid in cents
  leeway: number;   // leeway in cents
  increment: number; // bid increment in cents
  updated: string;
  by: string;
}

export interface DeliveryWindow {
  code: string;
  label: string;
}

export interface WindowPricing extends Omit<PricingData, 'updated' | 'by'> {
  isOverride: boolean;
}

// ── Contracts ──────────────────────────────────────────────

export const CORN_CONTRACTS: CornContract[] = [
  { code: 'N26', label: 'Jul 2026' },
  { code: 'U26', label: 'Sep 2026' },
  { code: 'Z26', label: 'Dec 2026' },
  { code: 'H27', label: 'Mar 2027' },
  { code: 'K27', label: 'May 2027' },
  { code: 'N27', label: 'Jul 2027' },
  { code: 'U27', label: 'Sep 2027' },
  { code: 'Z27', label: 'Dec 2027' },
  { code: 'H28', label: 'Mar 2028' },
];

// ── Pricing per contract ───────────────────────────────────

export const PRICING_DATA: Record<string, PricingData> = {
  N26: { posted: -25, max: -15, leeway: 3, increment: 1, updated: '2h ago', by: 'R. Miller' },
  U26: { posted: -22, max: -12, leeway: 3, increment: 1, updated: '2h ago', by: 'R. Miller' },
  Z26: { posted: -18, max: -8,  leeway: 5, increment: 2, updated: '4h ago', by: 'S. Chen' },
  H27: { posted: -20, max: -10, leeway: 4, increment: 2, updated: '1d ago', by: 'S. Chen' },
  K27: { posted: -16, max: -6,  leeway: 3, increment: 1, updated: '1d ago', by: 'S. Chen' },
  N27: { posted: -14, max: -4,  leeway: 3, increment: 1, updated: '3d ago', by: 'R. Miller' },
  U27: { posted: -12, max: -2,  leeway: 2, increment: 1, updated: '3d ago', by: 'R. Miller' },
  Z27: { posted: -10, max: 0,   leeway: 5, increment: 2, updated: '5d ago', by: 'J. Doe' },
  H28: { posted: -8,  max: 2,   leeway: 4, increment: 2, updated: '1w ago', by: 'J. Doe' },
};

// ── Delivery windows per contract ──────────────────────────

export const DELIVERY_WINDOWS: Record<string, DeliveryWindow[]> = {
  N26: [
    { code: 'N26-JUN-A', label: 'Jun 1–15' },
    { code: 'N26-JUN-B', label: 'Jun 16–30' },
    { code: 'N26-JUL-A', label: 'Jul 1–15' },
    { code: 'N26-JUL-B', label: 'Jul 16–31' },
  ],
  U26: [
    { code: 'U26-AUG-A', label: 'Aug 1–15' },
    { code: 'U26-AUG-B', label: 'Aug 16–31' },
    { code: 'U26-SEP-A', label: 'Sep 1–15' },
  ],
  Z26: [
    { code: 'Z26-NOV-A', label: 'Nov 1–15' },
    { code: 'Z26-NOV-B', label: 'Nov 16–30' },
    { code: 'Z26-DEC-A', label: 'Dec 1–15' },
    { code: 'Z26-DEC-B', label: 'Dec 16–31' },
  ],
  H27: [
    { code: 'H27-FEB-A', label: 'Feb 1–15' },
    { code: 'H27-MAR-A', label: 'Mar 1–15' },
  ],
  K27: [
    { code: 'K27-APR-A', label: 'Apr 1–15' },
    { code: 'K27-MAY-A', label: 'May 1–15' },
  ],
};

// ── Window-level pricing ───────────────────────────────────

const WINDOW_OVERRIDES: Record<string, Partial<WindowPricing>> = {
  'N26-JUN-A': { posted: -23, isOverride: true },
  'Z26-NOV-A': { posted: -15, max: -5, isOverride: true },
};

export function getWindowPricing(contractCode: string, windowCode: string): WindowPricing {
  const parent = PRICING_DATA[contractCode];
  const override = WINDOW_OVERRIDES[windowCode];
  if (override) {
    return {
      posted: override.posted ?? parent.posted,
      max: override.max ?? parent.max,
      leeway: override.leeway ?? parent.leeway,
      increment: override.increment ?? parent.increment,
      isOverride: true,
    };
  }
  return {
    posted: parent.posted,
    max: parent.max,
    leeway: parent.leeway,
    increment: parent.increment,
    isOverride: false,
  };
}

// ── Formatting helpers ─────────────────────────────────────

export function formatBasis(cents: number): string {
  const sign = cents >= 0 ? '+' : '';
  return `${sign}${cents}¢`;
}
