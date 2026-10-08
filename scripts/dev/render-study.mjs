// Dev helper: rasterise the drawings of a page served by `npm run dev` so a
// drawing can be inspected as a PNG without a browser.
// Usage: node scripts/dev/render-study.mjs <path> <out.png> [index|all] [light|dark]
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';

const [, , path = '/', out = 'study.png', which = '0', theme = 'light'] = process.argv;
const base = process.env.DEV_URL || 'http://localhost:4321';
const html = await (await fetch(base + path)).text();

const palette =
  theme === 'dark'
    ? { ground: '#18212b', line: '#ece9e0', line2: '#aebac5', line3: '#72838f', light: '#c3d2de' }
    : { ground: '#a9b8c4', line: '#221a14', line2: '#39434e', line3: '#5d6c7a', light: '#f4f1e8' };

const vars = (s) =>
  s
    .replaceAll('var(--ground)', palette.ground)
    .replaceAll('var(--line-2)', palette.line2)
    .replaceAll('var(--line-3)', palette.line3)
    .replaceAll('var(--line)', palette.line)
    .replaceAll('var(--light)', palette.light)
    .replace(/var\(--[a-z0-9-]+\)/g, palette.line);

const css = vars(`
  .ink{fill:none;stroke:var(--line);stroke-width:1.25;stroke-linecap:round;stroke-linejoin:round}
  .ink-fine{fill:none;stroke:var(--line);stroke-width:.75;stroke-linecap:round}
  .ink-bold{fill:none;stroke:var(--line);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .metal{fill:none;stroke:var(--line-3);stroke-width:.75;stroke-dasharray:3 3}
  .lead{fill:none;stroke:var(--light);stroke-width:2.5;stroke-linecap:round}
  .lead-fill{fill:var(--light);stroke:none}
  .ink-fill{fill:var(--line);stroke:none}
  .hatch{fill:url(#hatch)}
  text{fill:var(--line);font-family:Helvetica}
  .dim{font-family:'Helvetica Neue',Helvetica;fill:var(--line-2)}
  .note{font-family:Georgia;font-style:italic;fill:var(--line)}
  .pf-back{fill:url(#hatch-ink);stroke:var(--line-3);stroke-width:.6;opacity:.75}
  .pf-front{fill:var(--ground);stroke:var(--line);stroke-width:1.1}
  .pf-lit{fill:var(--light);stroke:var(--line);stroke-width:1.1}
  .pf-shade{fill:url(#hatch-ink);stroke:var(--line);stroke-width:1.1}
`);

const defsMatch = html.match(/<svg class="defs"[\s\S]*?<defs>([\s\S]*?)<\/defs>/);
const defs = defsMatch ? vars(defsMatch[1]) : '';

const svgs = [...html.matchAll(/<figure[^>]*class="[^"]*\bstudy\b[^"]*"[^>]*>[\s\S]*?(<svg[\s\S]*?<\/svg>)/g)].map((m) => m[1]);
if (!svgs.length) {
  console.error('No <figure class="study"> drawings found at ' + path);
  process.exit(1);
}
const pick = which === 'all' ? svgs : [svgs[Number(which)]];
pick.forEach((svgIn, i) => {
  let svg = svgIn;
  if (!svg) return;
  const vb = svg.match(/viewBox="([^"]+)"/)?.[1]?.split(/\s+/).map(Number) ?? [0, 0, 320, 320];
  // HTML allows valueless attributes (Astro scope markers); XML does not.
  svg = svg.replace(/<[^>]+>/g, (tag) => tag.replace(/\s[a-zA-Z_:][-a-zA-Z0-9_:.]*(?=[\s/>])(?!\s*=)/g, ''));
  let s = vars(svg)
    .replace(/<svg([^>]*)>/, (_, attrs) => `<svg xmlns="http://www.w3.org/2000/svg"${attrs.replace(/\s(role|tabindex|aria-[a-z]+|data-[a-z-]+)="[^"]*"/g, '')}><style>${css}</style><defs>${defs}</defs><rect x="${vb[0] - 20}" y="${vb[1] - 20}" width="${vb[2] + 40}" height="${vb[3] + 40}" fill="${palette.ground}"/>`)
    .replace(/<title[\s\S]*?<\/title>/, '');
  const png = new Resvg(s, { fitTo: { mode: 'width', value: 960 }, font: { loadSystemFonts: true, defaultFontFamily: 'Helvetica' } }).render().asPng();
  const file = pick.length > 1 ? out.replace(/\.png$/, `-${i}.png`) : out;
  writeFileSync(file, png);
  console.log('wrote ' + file);
});
