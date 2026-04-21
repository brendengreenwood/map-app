/**
 * Sprout-themed MapLibre styles
 *
 * Provides functions to recolor CartoDB basemap layers via setPaintProperty
 * to match the Sprout design system palette.
 */

import type maplibregl from 'maplibre-gl';

// Sprout palette (hex equivalents of the oklch tokens in index.css)
const SPROUT = {
  green100: '#e8ebd3',
  neutral100: '#f1f2ee',
  neutral200: '#e7e8e4',
  neutral300: '#dfe0dc',
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

type PaintOverride = { property: string; value: unknown };
type LayerOverride = { id: string; overrides: PaintOverride[] };

const LIGHT_OVERRIDES: LayerOverride[] = [
  { id: 'background', overrides: [{ property: 'background-color', value: SPROUT.neutral100 }] },
  { id: 'water', overrides: [{ property: 'fill-color', value: SPROUT.water }] },
  { id: 'landcover', overrides: [{ property: 'fill-color', value: 'rgba(210, 230, 200, 0.5)' }] },
  { id: 'park_national_park', overrides: [{ property: 'fill-color', value: 'rgba(210, 230, 200, 0.5)' }] },
  { id: 'park_nature_reserve', overrides: [{ property: 'fill-color', value: 'rgba(210, 230, 200, 0.5)' }] },
  { id: 'building', overrides: [{ property: 'fill-color', value: SPROUT.neutral300 }] },
  { id: 'building-top', overrides: [{ property: 'fill-color', value: SPROUT.neutral200 }, { property: 'fill-outline-color', value: SPROUT.neutral300 }] },
];

const DARK_OVERRIDES: LayerOverride[] = [
  { id: 'background', overrides: [{ property: 'background-color', value: SPROUT.neutral1000 }] },
  { id: 'water', overrides: [{ property: 'fill-color', value: SPROUT.waterDark }] },
  { id: 'landcover', overrides: [{ property: 'fill-color', value: SPROUT.neutral1000 }] },
  { id: 'park_national_park', overrides: [{ property: 'fill-color', value: SPROUT.neutral1000 }] },
  { id: 'park_nature_reserve', overrides: [{ property: 'fill-color', value: SPROUT.neutral1000 }] },
];

/**
 * Apply Sprout palette overrides to the map's basemap layers.
 * Call after the style has loaded.
 */
export function applySproutTheme(map: maplibregl.Map, theme: 'light' | 'dark') {
  const overrides = theme === 'light' ? LIGHT_OVERRIDES : DARK_OVERRIDES;
  for (const { id, overrides: props } of overrides) {
    for (const { property, value } of props) {
      try {
        map.setPaintProperty(id, property, value);
      } catch {
        // Layer may not exist in this style variant
      }
    }
  }
}
