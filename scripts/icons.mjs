// Renders the touch icon (scripts/touch-icon.svg, the mark drawn for 180px)
// to public/apple-touch-icon.png. The 32px favicon is public/favicon.svg.
// Run after editing either: node scripts/icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const here = (f) => fileURLToPath(new URL(f, import.meta.url));

const svg = readFileSync(here('./touch-icon.svg'), 'utf8');
const png = new Resvg(svg, { fitTo: { mode: 'width', value: 180 } }).render().asPng();
writeFileSync(here('../public/apple-touch-icon.png'), png);
console.log(`apple-touch-icon.png written (${png.length} bytes)`);
