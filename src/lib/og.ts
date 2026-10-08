// Open Graph cards, rendered at build time: satori lays out the type, resvg
// rasterises. Same identity as the site: near-black, bone type, the step-cut
// mark and the ELIOT LUCA logotype, and Leonardo's solid drawn in light.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { render } from './polyhedron';

const C = {
  ground: '#070708',
  ink: '#f1efe9',
  ash: '#a3a19b',
  smoke: '#3d3c39',
  gold: '#cdb68a',
  frame: 'rgba(255,255,255,0.08)',
};

const W = 1200;
const H = 630;
const PAD = 72;
const COL = 640; // width of the type column

export type OgCard = {
  /** Main title. The site name is set as the logotype; anything else in Mona Sans. */
  title: string;
  /** Kept for the callers: 'text' marks mixed-case essay titles. */
  face?: 'titling' | 'text';
  /** One line beneath the title. */
  line?: string;
  /** Small line above the title (kind, date, role). */
  meta?: string;
  /** Turns the solid: any string gives a stable, slightly different view. */
  seed?: string;
};

// ---------------------------------------------------------------- fonts

const FS = join(process.cwd(), 'node_modules', '@fontsource');
const OWN = join(process.cwd(), 'src', 'assets', 'og-fonts');

type FontDef = { name: string; data: Buffer; weight: 300 | 400 | 500; style: 'normal' };
let fonts: FontDef[] | null = null;

function loadFonts(): FontDef[] {
  if (fonts) return fonts;
  fonts = [
    // Static instances of Mona Sans at 125% width, cut from the variable font.
    { name: 'Mona Sans Expanded', data: readFileSync(join(OWN, 'MonaSans-Expanded-300.ttf')), weight: 300, style: 'normal' },
    { name: 'Mona Sans Expanded', data: readFileSync(join(OWN, 'MonaSans-Expanded-400.ttf')), weight: 400, style: 'normal' },
    { name: 'Mona Sans', data: readFileSync(join(FS, 'mona-sans', 'files', 'mona-sans-latin-400-normal.woff')), weight: 400, style: 'normal' },
    { name: 'Mona Sans', data: readFileSync(join(FS, 'mona-sans', 'files', 'mona-sans-latin-ext-400-normal.woff')), weight: 400, style: 'normal' },
    { name: 'Mona Sans', data: readFileSync(join(FS, 'mona-sans', 'files', 'mona-sans-latin-500-normal.woff')), weight: 500, style: 'normal' },
    { name: 'Mona Sans', data: readFileSync(join(FS, 'mona-sans', 'files', 'mona-sans-latin-ext-500-normal.woff')), weight: 500, style: 'normal' },
  ];
  return fonts;
}

// ---------------------------------------------------------------- drawing

const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

// The step-cut mark, as in src/components/brand/Mark.astro.
function mark(size: number): string {
  const ring = (half: number, c: number) => {
    const a = 50 - half;
    const b = 50 + half;
    return [
      [a + c, a],
      [b - c, a],
      [b, a + c],
      [b, b - c],
      [b - c, b],
      [a + c, b],
      [a, b - c],
      [a, a + c],
    ];
  };
  const g = ring(50, 22);
  const s = ring(34, 15);
  const t = ring(19, 8.5);
  const pts = (r: number[][]) => r.map(([x, y]) => `${x},${y}`).join(' ');
  const joins = g.map(([x, y], i) => `M${x},${y}L${t[i][0]},${t[i][1]}`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-5 -5 110 110">
  <polygon points="${pts(t)}" fill="${C.gold}" fill-opacity="0.28"/>
  <path d="${joins}" fill="none" stroke="${C.gold}" stroke-opacity="0.7" stroke-width="3.2"/>
  <polygon points="${pts(s)}" fill="none" stroke="${C.gold}" stroke-opacity="0.7" stroke-width="3.2"/>
  <polygon points="${pts(t)}" fill="none" stroke="${C.gold}" stroke-width="3.2"/>
  <polygon points="${pts(g)}" fill="none" stroke="${C.gold}" stroke-width="5"/>
</svg>`;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const SOLID = 320; // polyhedron.ts drawing space
const SHOWN = 420; // size on the card

function solid(seed?: string): string {
  const h = seed ? hash(seed) : 0;
  const yaw = -0.62 + (seed ? ((h % 9) - 4) * 0.13 : 0);
  const pitch = 0.42 + (seed ? (((h >>> 8) % 5) - 2) * 0.05 : 0);
  const k = SHOWN / SOLID;
  const sw = (px: number) => (px / k).toFixed(3);
  const paths = render(yaw, pitch, SOLID)
    .map((f) => {
      const d = `d="${f.d}" fill-rule="evenodd"`;
      if (f.cls === 'pf-back') return `<path ${d} fill="none" stroke="${C.smoke}" stroke-width="${sw(0.9)}"/>`;
      if (f.cls === 'pf-lit') return `<path ${d} fill="${C.gold}" fill-opacity="0.26" stroke="${C.gold}" stroke-width="${sw(1.4)}"/>`;
      if (f.cls === 'pf-shade')
        return `<path ${d} fill="${C.ground}"/><path ${d} fill="url(#h)" stroke="${C.ink}" stroke-opacity="0.85" stroke-width="${sw(1.2)}"/>`;
      return `<path ${d} fill="${C.ground}" stroke="${C.ink}" stroke-opacity="0.9" stroke-width="${sw(1.2)}"/>`;
    })
    .join('');
  const m = 1 / k;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SHOWN}" height="${SHOWN}" viewBox="0 0 ${SOLID} ${SOLID}">
  <defs>
    <pattern id="h" width="${5 * m}" height="${5 * m}" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
      <line x1="0" y1="0" x2="0" y2="${5 * m}" stroke="${C.ink}" stroke-opacity="0.35" stroke-width="${0.7 * m}"/>
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

function titleSize(title: string): number {
  const n = title.length;
  if (n <= 14) return 88;
  if (n <= 26) return 74;
  if (n <= 44) return 62;
  if (n <= 70) return 52;
  return 44;
}

function card({ title, line, meta, seed }: OgCard): Node {
  const isName = title.trim().toLowerCase() === 'eliot luca';

  // On the name card the logotype is the title, so the corner keeps the mark alone.
  const lockup = h('div', { display: 'flex', alignItems: 'center' }, [
    h('img', { width: 34, height: 34, marginRight: 16 }, undefined, { src: svgUri(mark(34)), width: 34, height: 34 }),
    isName
      ? null
      : h(
          'div',
          { display: 'flex', fontFamily: 'Mona Sans Expanded', fontWeight: 400, fontSize: 19, letterSpacing: 19 * 0.3, color: C.ink },
          'ELIOT LUCA',
        ),
  ].filter(Boolean));

  const titleNode = isName
    ? h(
        'div',
        {
          display: 'flex',
          fontFamily: 'Mona Sans Expanded',
          fontWeight: 300,
          fontSize: 92,
          lineHeight: 0.95,
          letterSpacing: 92 * 0.05,
          color: C.ink,
        },
        'ELIOT LUCA',
      )
    : h(
        'div',
        {
          display: 'flex',
          flexWrap: 'wrap',
          width: COL,
          fontFamily: 'Mona Sans',
          fontWeight: 500,
          fontSize: titleSize(title),
          lineHeight: 1.04,
          letterSpacing: -titleSize(title) * 0.025,
          color: C.ink,
          textWrap: 'balance',
        },
        clamp(title, 110),
      );

  const lineNode = line
    ? h(
        'div',
        {
          display: 'flex',
          width: COL - 40,
          marginTop: 26,
          fontFamily: 'Mona Sans',
          fontWeight: 400,
          fontSize: line.length > 92 ? 25 : 29,
          lineHeight: 1.35,
          color: C.ash,
          textWrap: 'balance',
        },
        clamp(line, 170),
      )
    : null;

  const metaNode = meta
    ? h('div', { display: 'flex', fontFamily: 'Mona Sans', fontSize: 20, color: C.gold, marginBottom: 22 }, meta)
    : null;

  const column = h(
    'div',
    {
      position: 'absolute',
      left: PAD,
      top: 64,
      bottom: 64,
      width: COL,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    [
      lockup,
      h('div', { display: 'flex', flexDirection: 'column' }, [metaNode, titleNode, lineNode].filter(Boolean)),
      h('div', { display: 'flex', fontFamily: 'Mona Sans', fontSize: 19, color: C.ash }, 'eliotluca.com'),
    ],
  );

  return h(
    'div',
    {
      width: W,
      height: H,
      display: 'flex',
      position: 'relative',
      backgroundColor: C.ground,
      backgroundImage: 'radial-gradient(circle at 78% 46%, rgba(205,182,138,0.10), rgba(7,7,8,0) 55%)',
    },
    [
      h('div', { position: 'absolute', left: 28, top: 28, right: 28, bottom: 28, display: 'flex', border: `1px solid ${C.frame}`, borderRadius: 18 }),
      h('img', { position: 'absolute', right: 70, top: (H - SHOWN) / 2, width: SHOWN, height: SHOWN }, undefined, {
        src: svgUri(solid(seed)),
        width: SHOWN,
        height: SHOWN,
      }),
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
