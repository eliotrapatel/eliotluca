// Open Graph cards, rendered at build time: satori lays out the type,
// resvg rasterises the sheet. One card = one 1200 x 630 page of the notebook:
// carta ground, iron-gall type, and Leonardo's skeletal polyhedron on the right,
// drawn as on the home sheet (no construction lines) and captioned as there.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { render } from './polyhedron';

// The light sheet only: a shared image cannot follow the reader's theme.
const C = {
  carta: '#050506',
  ink: '#f1efe9',
  metal: '#a3a19b',
  silver: '#3a3936',
  lead: '#cdb68a',
  rule: 'rgba(34,26,20,0.28)',
};

const W = 1200;
const H = 630;
const PAD = 72;
const COL = 600; // width of the type column

export type OgCard = {
  /** Main title. Set in Castoro Titling unless `face` is 'text'. */
  title: string;
  /** 'titling' for names and page titles, 'text' for mixed-case essay titles. */
  face?: 'titling' | 'text';
  /** One line of EB Garamond italic beneath the title. */
  line?: string;
  /** Small Mona Sans line above the title (kind, date, role). */
  meta?: string;
  /** Turns the solid: any string gives a stable, slightly different view. */
  seed?: string;
};

// ---------------------------------------------------------------- fonts

const FILES = join(process.cwd(), 'node_modules', '@fontsource');
const font = (pkg: string, file: string) => readFileSync(join(FILES, pkg, 'files', file));

type FontDef = { name: string; data: Buffer; weight: 400 | 500; style: 'normal' | 'italic' };
let fonts: FontDef[] | null = null;

function loadFonts(): FontDef[] {
  if (fonts) return fonts;
  fonts = [
    { name: 'Castoro Titling', data: font('castoro-titling', 'castoro-titling-latin-400-normal.woff'), weight: 400, style: 'normal' },
    { name: 'EB Garamond', data: font('eb-garamond', 'eb-garamond-latin-400-normal.woff'), weight: 400, style: 'normal' },
    { name: 'EB Garamond', data: font('eb-garamond', 'eb-garamond-latin-ext-400-normal.woff'), weight: 400, style: 'normal' },
    { name: 'EB Garamond', data: font('eb-garamond', 'eb-garamond-latin-400-italic.woff'), weight: 400, style: 'italic' },
    { name: 'EB Garamond', data: font('eb-garamond', 'eb-garamond-latin-ext-400-italic.woff'), weight: 400, style: 'italic' },
    { name: 'Mona Sans', data: font('mona-sans', 'mona-sans-latin-400-normal.woff'), weight: 400, style: 'normal' },
    { name: 'Mona Sans', data: font('mona-sans', 'mona-sans-latin-500-normal.woff'), weight: 500, style: 'normal' },
  ];
  return fonts;
}

// ---------------------------------------------------------------- drawing

const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

// Prepared paper: the chain lines of a laid mould, as on the site, and a scatter
// of fibres drawn as short strokes (cheap to encode, unlike a noise field).
function paper(): string {
  let chains = '';
  for (let x = 107; x < W; x += 108) chains += `<rect x="${x}" y="0" width="1" height="${H}"/>`;
  let seed = 20250;
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
  let dark = '';
  let pale = '';
  for (let i = 0; i < 440; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const a = rnd() * Math.PI * 2;
    const l = 3 + rnd() * rnd() * 22;
    const bend = (rnd() - 0.5) * l * 0.6;
    const x2 = x + Math.cos(a) * l;
    const y2 = y + Math.sin(a) * l;
    const cx = (x + x2) / 2 - Math.sin(a) * bend;
    const cy = (y + y2) / 2 + Math.cos(a) * bend;
    const d = `M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    if (rnd() < 0.62) dark += d;
    else pale += d;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.carta}"/>
  <g fill="rgba(34,26,20,0.045)">${chains}</g>
  <path d="${dark}" fill="none" stroke="rgba(34,26,20,0.09)" stroke-width="0.6" stroke-linecap="round"/>
  <path d="${pale}" fill="none" stroke="rgba(244,241,232,0.2)" stroke-width="0.8" stroke-linecap="round"/>
</svg>`;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const SOLID = 320; // polyhedron.ts drawing space
const SHOWN = 400; // size on the card

function solid(seed?: string): string {
  // The home sheet's own view for the default card; a small, stable turn for the rest.
  const h = seed ? hash(seed) : 0;
  const yaw = -0.62 + (seed ? ((h % 9) - 4) * 0.13 : 0);
  const pitch = 0.42 + (seed ? (((h >>> 8) % 5) - 2) * 0.05 : 0);
  const k = SHOWN / SOLID; // keep the line weights of the site drawing at card scale
  const paths = render(yaw, pitch, SOLID)
    .map((f) => {
      const d = `d="${f.d}" fill-rule="evenodd"`;
      if (f.cls === 'pf-back') return `<path ${d} fill="url(#h)" stroke="${C.silver}" stroke-width="${0.55 / k}" opacity="0.6"/>`;
      if (f.cls === 'pf-lit') return `<path ${d} fill="${C.lead}" stroke="${C.ink}" stroke-width="${1.35 / k}"/>`;
      if (f.cls === 'pf-shade')
        return `<path ${d} fill="${C.carta}"/><path ${d} fill="url(#h)" stroke="${C.ink}" stroke-width="${1.35 / k}"/>`;
      return `<path ${d} fill="${C.carta}" stroke="${C.ink}" stroke-width="${1.35 / k}"/>`;
    })
    .join('');
  const m = 1 / k;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SHOWN}" height="${SHOWN}" viewBox="0 0 ${SOLID} ${SOLID}">
  <defs>
    <pattern id="h" width="${5 * m}" height="${5 * m}" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
      <line x1="0" y1="0" x2="0" y2="${5 * m}" stroke="${C.ink}" stroke-width="${0.7 * m}"/>
    </pattern>
  </defs>
  <g stroke-linejoin="round">${paths}</g>
</svg>`;
}

// ---------------------------------------------------------------- layout

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.]$/, '') + '…';
}

// Castoro Titling: size the longest word to the column, never above 124px.
function titlingSize(title: string): number {
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  return Math.round(Math.min(124, COL / (longest * 0.8)));
}

// Garamond titles: step down with length so three lines is the most.
function textSize(title: string): number {
  const n = title.length;
  if (n <= 22) return 84;
  if (n <= 40) return 72;
  if (n <= 64) return 60;
  if (n <= 90) return 50;
  return 44;
}

function card({ title, face = 'titling', line, meta, seed }: OgCard): Node {
  const titling = face === 'titling';
  const size = titling ? titlingSize(title) : textSize(title);

  const titleNode = h(
    'div',
    {
      display: 'flex',
      flexWrap: 'wrap',
      width: COL,
      fontFamily: titling ? 'Castoro Titling' : 'EB Garamond',
      fontSize: size,
      lineHeight: titling ? 0.98 : 1.04,
      letterSpacing: titling ? size * 0.02 : -size * 0.01,
      color: C.ink,
      textWrap: 'balance',
    },
    titling ? title.toUpperCase() : clamp(title, 120),
  );

  const lineNode = line
    ? h(
        'div',
        {
          display: 'flex',
          width: COL - 24,
          marginTop: titling ? 30 : 26,
          fontFamily: 'EB Garamond',
          fontStyle: 'italic',
          fontSize: line.length > 92 ? 27 : 31,
          lineHeight: 1.28,
          color: C.ink,
          textWrap: 'balance',
        },
        clamp(line, 170),
      )
    : null;

  const metaNode = h(
    'div',
    { display: 'flex', height: 26, fontFamily: 'Mona Sans', fontSize: 21, color: C.metal, letterSpacing: 0.2 },
    meta ?? '',
  );

  const foot = h(
    'div',
    { display: 'flex', alignItems: 'center', fontFamily: 'Mona Sans', fontWeight: 500, fontSize: 20, color: C.ink, letterSpacing: 0.4 },
    [h('div', { display: 'flex', width: 28, height: 1, backgroundColor: C.ink, marginRight: 14 }), 'eliotluca.com'],
  );

  const column = h(
    'div',
    {
      position: 'absolute',
      left: PAD,
      top: 64,
      bottom: 60,
      width: COL,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    [
      metaNode,
      h('div', { display: 'flex', flexDirection: 'column', marginTop: -6 }, [titleNode, lineNode].filter(Boolean)),
      foot,
    ],
  );

  const caption = h(
    'div',
    {
      position: 'absolute',
      right: 84,
      bottom: 58,
      width: SHOWN,
      display: 'flex',
      justifyContent: 'center',
      fontFamily: 'EB Garamond',
      fontStyle: 'italic',
      fontSize: 19,
      color: C.metal,
    },
    'Rhombicuboctahedron, after Leonardo',
  );

  return h(
    'div',
    { width: W, height: H, display: 'flex', position: 'relative', backgroundColor: C.carta },
    [
      h('img', { position: 'absolute', left: 0, top: 0, width: W, height: H }, undefined, { src: svgUri(paper()), width: W, height: H }),
      // A hairline ruled margin, as on a bound sheet.
      h('div', { position: 'absolute', left: 32, top: 32, right: 32, bottom: 32, display: 'flex', border: `1px solid ${C.rule}` }),
      h('img', { position: 'absolute', right: 84, top: (H - SHOWN) / 2 - 12, width: SHOWN, height: SHOWN }, undefined, {
        src: svgUri(solid(seed)),
        width: SHOWN,
        height: SHOWN,
      }),
      caption,
      column,
    ],
  );
}

export async function renderOg(input: OgCard): Promise<Uint8Array> {
  // satori's types expect React elements; plain element objects are what it reads.
  const svg = await satori(card(input) as unknown as Parameters<typeof satori>[0], {
    width: W,
    height: H,
    fonts: loadFonts(),
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  return new Uint8Array(png);
}
