import { useEffect, useState } from 'react';
import { useTheme } from './theme';

const KEYS = ['wine', 'copper', 'gold', 'moss', 'amber', 'rust', 'ink2', 'faint', 'line', 'line2', 'card', 'paper'];

function read() {
  const s = getComputedStyle(document.documentElement);
  const g = (n) => s.getPropertyValue(n).trim();
  const out = {};
  KEYS.forEach((k) => (out[k] = g(`--c-${k}`)));
  return out;
}

/** Returns CSS-variable triplets like "122 41 55" for chart colors. */
export function usePalette() {
  const { theme } = useTheme();
  const [p, setP] = useState(read);
  useEffect(() => {
    const t = setTimeout(() => setP(read()), 60);
    return () => clearTimeout(t);
  }, [theme]);
  return p;
}

/** Build a color from a triplet: R(p.wine) or R(p.wine, 0.2) */
export const R = (triplet, a = 1) =>
  a >= 1 ? `rgb(${triplet})` : `rgb(${triplet} / ${a})`;
