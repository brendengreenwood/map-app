/**
 * Sprout-themed MapLibre styles
 *
 * Uses MapLibre's `transformStyle` callback to recolor CartoDB basemap layers
 * to match the Sprout design system palette, without pre-fetching styles.
 */

// Sprout palette (hex equivalents of the oklch tokens in index.css)
const SPROUT = {
  green100: '#e8ebd3',
  green200: '#8cc63f',
  green300: '#4d8c2a',
  green400: '#2d5016',
  green700: '#1f3b0f',
  green800: '#152a09',
  green900: '#0d1c05',
  neutral100: '#f1f2ee',
  neutral200: '#e7e8e4',
  neutral300: '#dfe0dc',
  neutral400: '#a8aba5',
  neutral500: '#7d827a',
  neutral600: '#666b63',
  neutral700: '#515550',
  neutral900: '#2e3230',
  neutral1000: '#252927',
  white: '#ffffff',
  water: '#c8dbe5',
  waterDark: '#1a2c38',
} as const;

export const CARTO_URLS = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
} as const;

/**
 * Recursively replace color values in a paint/layout object.
 */
function replaceColors(obj: unknown, colorMap: [string | RegExp, string][]): unknown {
  if (typeof obj === 'string') {
    for (const [pattern, replacement] of colorMap) {
      if (typeof pattern === 'string') {
        if (obj.toLowerCase() === pattern.toLowerCase()) return replacement;
      } else {
        if (pattern.test(obj)) return replacement;
      }
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => replaceColors(item, colorMap));
  }
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = replaceColors(value, colorMap);
    }
    return result;
  }
  return obj;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StyleJSON = any;

function setLayerPaint(style: StyleJSON, layerId: string, paintOverrides: Record<string, unknown>) {
  const layer = style.layers.find((l: { id: string }) => l.id === layerId);
  if (layer) {
    layer.paint = { ...layer.paint, ...paintOverrides };
  }
}

function applyLightTheme(style: StyleJSON): StyleJSON {
  const colorMap: [string | RegExp, string][] = [
    ['#fafaf8', SPROUT.neutral100],
    ['#f5f5f3', SPROUT.neutral100],
    [/rgba\(234,\s*241,\s*233/i, `rgba(210, 230, 200`],
    ['#aad3df', SPROUT.water],
    ['#a0c8d7', SPROUT.water],
    [/rgba\(63,\s*90,\s*109/i, `rgba(150, 190, 210`],
    ['#dfdfdf', SPROUT.neutral300],
    ['#ededed', SPROUT.neutral200],
    ['#fdfdfd', SPROUT.white],
    ['#d5d5d5', SPROUT.neutral300],
    ['#f3efed', SPROUT.neutral200],
    [/rgba\(0,\s*0,\s*0,\s*0\.05\)/i, `rgba(45, 80, 22, 0.06)`],
  ];

  for (const layer of style.layers) {
    if (layer.paint) {
      layer.paint = replaceColors(layer.paint, colorMap);
    }
  }

  setLayerPaint(style, 'background', { 'background-color': SPROUT.neutral100 });
  setLayerPaint(style, 'water', { 'fill-color': SPROUT.water });

  return style;
}

function applyDarkTheme(style: StyleJSON): StyleJSON {
  const colorMap: [string | RegExp, string][] = [
    ['#0e0e0e', SPROUT.neutral1000],
    ['#2c353c', SPROUT.waterDark],
    ['#2C353C', SPROUT.waterDark],
    [/rgba\(63,\s*90,\s*109/i, `rgba(26, 44, 56`],
    ['#181818', SPROUT.neutral900],
    ['#1a1a1a', SPROUT.neutral900],
    ['#222', SPROUT.neutral700],
    ['#222222', SPROUT.neutral700],
    [/rgba\(103,\s*103,\s*114/i, `rgba(81, 85, 80`],
  ];

  for (const layer of style.layers) {
    if (layer.paint) {
      layer.paint = replaceColors(layer.paint, colorMap);
    }
  }

  setLayerPaint(style, 'background', { 'background-color': SPROUT.neutral1000 });
  setLayerPaint(style, 'water', { 'fill-color': SPROUT.waterDark });

  return style;
}

/**
 * Returns a transformStyle function for MapLibre that recolors the
 * basemap to match the Sprout design system.
 */
export function sproutTransformStyle(theme: 'light' | 'dark') {
  return (_prev: StyleJSON | undefined, next: StyleJSON): StyleJSON => {
    return theme === 'light' ? applyLightTheme(next) : applyDarkTheme(next);
  };
}
