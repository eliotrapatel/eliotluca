import { getCollection, type CollectionEntry } from 'astro:content';

export type Essay = CollectionEntry<'writing'> & { number: number; minutes: number };

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateFmtFr = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function formatDate(d: Date, lang: string = 'en') {
  return (lang === 'fr' ? dateFmtFr : dateFmt).format(d);
}

export function readingMinutes(body: string | undefined) {
  const words = (body ?? '').replace(/[#>*_`\-\[\]()!]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

/** Published pieces, newest first, numbered in order of publication (No. 1 is the oldest). */
export async function getEssays(): Promise<Essay[]> {
  const all = await getCollection('writing', ({ data }) => import.meta.env.DEV || !data.draft);
  const oldestFirst = all.sort((a, b) => a.data.date.getTime() - b.data.date.getTime() || a.id.localeCompare(b.id));
  return oldestFirst
    .map((e, i) => ({ ...e, number: i + 1, minutes: readingMinutes(e.body) }))
    .reverse();
}

export const kindLabel = (kind: string, lang: string) =>
  lang === 'fr' ? ({ essay: 'Essai', manifesto: 'Manifeste', note: 'Note' } as Record<string, string>)[kind] ?? kind
    : ({ essay: 'Essay', manifesto: 'Manifesto', note: 'Note' } as Record<string, string>)[kind] ?? kind;

/**
 * Links to an essay fall back to the writing index while that essay is still a
 * draft, so a production build never links to a page that was not generated.
 */
export async function essayHref(href: string): Promise<string> {
  const m = href.match(/^\/writing\/([^/#?]+)/);
  if (!m) return href;
  const ids = new Set((await getEssays()).map((e) => e.id));
  return ids.has(m[1]) ? href : '/writing';
}
