// Renders public/favicon.svg to public/apple-touch-icon.png (180 x 180).
// Run after editing the favicon: node scripts/icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const pub = (f) => fileURLToPath(new URL(`../public/${f}`, import.meta.url));

// resvg ignores the dark-mode media query, so the icon is the day sheet.
const svg = readFileSync(pub('favicon.svg'), 'utf8');
const png = new Resvg(svg, { fitTo: { mode: 'width', value: 180 } }).render().asPng();
writeFileSync(pub('apple-touch-icon.png'), png);
console.log(`apple-touch-icon.png written (${png.length} bytes)`);
