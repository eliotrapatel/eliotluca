// Wordmarks as vector outlines. Letters are placed in font units (1000 to the
// em) with the ink of the first letter at x = 0, so a wordmark sits flush
// against its mark and can be cut, drawn or reassembled letter by letter.
import data from '../data/gravesend-glyphs.json';

type GlyphData = { w: number; d: string; b: number[] };
const GLYPHS = data.glyphs as Record<string, GlyphData>;

export const UPM = data.upm;
export const CAP = data.cap;

export interface Placed {
  ch: string;
  x: number; // origin of the glyph
  w: number; // advance
  l: number; // ink left, absolute
  r: number; // ink right, absolute
  d: string;
}

export interface Layout {
  width: number;
  glyphs: Placed[];
}

export function layout(text: string, tracking: number, space = 0): Layout {
  const t = tracking * UPM;
  const glyphs: Placed[] = [];
  let x = 0;
  for (const ch of text.toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    if (ch === ' ') {
      x += g.w + space * UPM + t;
      continue;
    }
    glyphs.push({ ch, x, w: g.w, l: x + g.b[0], r: x + g.b[2], d: g.d });
    x += g.w + t;
  }
  const shift = glyphs.length ? glyphs[0].l : 0;
  for (const g of glyphs) {
    g.x -= shift;
    g.l -= shift;
    g.r -= shift;
  }
  return { width: glyphs.length ? glyphs[glyphs.length - 1].r : 0, glyphs };
}

export const glyph = (ch: string) => GLYPHS[ch];

/** The y-down transform that seats a glyph on the cap line box. */
export const seat = (x: number) => `translate(${round(x)} ${CAP}) scale(1 -1)`;

export const round = (n: number) => Math.round(n * 10) / 10;

/** Static markup, for the server and for the resting state. */
export function wordmarkSVG(l: Layout): string {
  const paths = l.glyphs.map((g) => `<g class="gl"><path transform="${seat(g.x)}" d="${g.d}"/></g>`).join('');
  return `<svg class="wm" viewBox="0 0 ${round(l.width)} ${CAP}" style="width:${round(l.width) / UPM}em" aria-hidden="true" focusable="false">${paths}</svg>`;
}
