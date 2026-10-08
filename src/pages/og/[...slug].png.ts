// Open Graph cards for every page, written as static PNGs at build time.
// /og/default.png, /og/<page>.png, /og/writing/<id>.png, /og/work/<id>.png,
// /og/instruments/<slug>.png. Layouts already point here.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderOg, type OgCard } from '../../lib/og';
import { now, site } from '../../data/site';

export const prerender = true;

const longDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const pages: Record<string, OgCard> = {
  default: {
    title: site.name,
    line: 'I build on what is tangible.',
  },
  about: {
    title: 'About',
    line: 'Trained in private equity, venture and M&A, now building THE ENTITY and ORBES.',
  },
  now: {
    title: 'Now',
    line: 'What I am working on at the moment.',
    meta: `Updated ${longDate(new Date(now.updated))}`,
  },
  writing: {
    title: 'Writing',
    line: 'Essays, manifestos and notes, in English and French.',
  },
  work: {
    title: 'Ventures',
    line: 'THE ENTITY, ORBES and the lab projects around them.',
  },
  instruments: {
    title: 'Instruments',
    line: 'Small working tools from the disciplines I practise.',
  },
  links: {
    title: 'Links',
    line: 'Ventures, writing and a way to write to me, in one list.',
  },
};

const instrumentSlugs = ['returns', 'dilution', 'copilot-economics', 'ring-sizes'];

// Read the title and lede an instrument page passes to its layout, so the card
// stays in step with the page. Falls back to a plain name from the slug.
function instrumentCard(slug: string): OgCard {
  const fallback = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  let title = fallback;
  let line = 'A working instrument that computes in the browser.';
  let family: string | undefined;
  const file = join(process.cwd(), 'src', 'pages', 'instruments', `${slug}.astro`);
  if (existsSync(file)) {
    const page = readFileSync(file, 'utf8');
    const at = page.indexOf('<Instrument');
    const src = at >= 0 ? page.slice(at, at + 3000) : page;
    const prop = (name: string) => src.match(new RegExp(`\\b${name}=(?:"([^"]+)"|'([^']+)'|\\{\\s*['"\`]([^'"\`]+)['"\`]\\s*\\})`));
    const pick = (m: RegExpMatchArray | null) => (m ? m[1] ?? m[2] ?? m[3] : undefined);
    title = pick(prop('title')) ?? title;
    line = pick(prop('lede')) ?? pick(prop('description')) ?? line;
    family = pick(prop('family'));
  }
  return { title, line, meta: family ? `Instruments / ${family}` : 'Instruments', seed: `instruments/${slug}` };
}

const kindName = { essay: 'Essay', manifesto: 'Manifesto', note: 'Note' } as const;

export const getStaticPaths = (async () => {
  const showDrafts = import.meta.env.DEV;
  const essays = await getCollection('writing', (e) => showDrafts || !e.data.draft);
  // Hidden lab projects get no page, in dev or in production, so no card either.
  const work = await getCollection('work', (e) => e.data.visible);

  const paths: { params: { slug: string }; props: { card: OgCard } }[] = [];

  for (const [slug, card] of Object.entries(pages)) {
    paths.push({ params: { slug }, props: { card: slug === 'default' ? card : { ...card, seed: slug } } });
  }

  for (const e of essays) {
    const meta = [kindName[e.data.kind], longDate(e.data.date), e.data.lang === 'fr' ? 'in French' : '']
      .filter(Boolean)
      .join(', ');
    paths.push({
      params: { slug: `writing/${e.id}` },
      props: { card: { title: e.data.title, face: 'text', line: e.data.description, meta, seed: `writing/${e.id}` } },
    });
  }

  for (const w of work) {
    const tier = w.data.tier === 'venture' ? 'Venture' : 'Lab project';
    paths.push({
      params: { slug: `work/${w.id}` },
      props: {
        card: {
          title: w.data.name,
          line: w.data.line,
          meta: `${tier}, ${w.data.role.toLowerCase()} since ${w.data.since}`,
          seed: `work/${w.id}`,
        },
      },
    });
  }

  for (const slug of instrumentSlugs) {
    paths.push({ params: { slug: `instruments/${slug}` }, props: { card: instrumentCard(slug) } });
  }

  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg((props as { card: OgCard }).card);
  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
  });
};
