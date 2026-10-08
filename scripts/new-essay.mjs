// Creates a new draft in src/content/writing.
// Usage: npm run new -- "Title of the essay" [--fr] [--manifesto] [--note]
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const title = args
  .filter((a) => !a.startsWith('--'))
  .join(' ')
  .trim();

if (!title) {
  console.error('Usage: npm run new -- "Title of the essay" [--fr] [--manifesto] [--note]');
  process.exit(1);
}

const known = new Set(['--fr', '--en', '--manifesto', '--note', '--essay']);
for (const f of flags) {
  if (!known.has(f)) {
    console.error(`Unknown option ${f}. Options: --fr, --manifesto, --note.`);
    process.exit(1);
  }
}

const clash = (a, b) => flags.has(a) && flags.has(b);
if (clash('--fr', '--en') || clash('--manifesto', '--note') || clash('--manifesto', '--essay') || clash('--note', '--essay')) {
  console.error('Choose one language and one kind. Options: --fr, --manifesto, --note.');
  process.exit(1);
}

const lang = flags.has('--fr') ? 'fr' : 'en';
const kind = flags.has('--manifesto') ? 'manifesto' : flags.has('--note') ? 'note' : 'essay';

const slug = title
  .replace(/[œŒ]/g, 'oe')
  .replace(/[æÆ]/g, 'ae')
  .replace(/ß/g, 'ss')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

if (!slug) {
  console.error('The title gives an empty file name. Use at least one letter or digit.');
  process.exit(1);
}

const pad = (n) => String(n).padStart(2, '0');
const d = new Date();
const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const dir = fileURLToPath(new URL('../src/content/writing/', import.meta.url));
const file = `${dir}${slug}.md`;
const shown = `src/content/writing/${slug}.md`;

if (existsSync(file)) {
  console.error(`${shown} already exists. Nothing was written.`);
  process.exit(1);
}

const description =
  lang === 'fr'
    ? 'Une phrase qui dit de quoi parle le texte. Elle sert de résumé et de description pour les partages.'
    : 'One sentence that says what the piece is about. It is used as the summary and for link previews.';

const body =
  lang === 'fr'
    ? 'Écris ici. Le texte reste invisible tant que draft vaut true.'
    : 'Write here. The piece stays hidden while draft is true.';

const md = `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
date: ${today}
lang: ${lang}
kind: ${kind}
draft: true
---

<!-- ${body} -->
`;

mkdirSync(dir, { recursive: true });
writeFileSync(file, md, { flag: 'wx' });
console.log(`Created ${shown} (${kind}, ${lang}, draft).`);
console.log('Replace the placeholder description: it becomes the summary, the RSS entry and the link preview.');
console.log('Preview it with npm run dev (drafts show there, never in production).');
console.log('Set draft: false when it is ready, then commit and push.');
