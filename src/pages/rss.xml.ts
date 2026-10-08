// RSS feed of the writing collection, newest first. Drafts are left out.
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../data/site';

export const GET: APIRoute = async (context) => {
  const posts = (await getCollection('writing', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  return rss({
    title: `${site.name}, writing`,
    description: 'Essays, manifestos and notes by Eliot Luca, in English and French.',
    site: context.site ?? site.url,
    xmlns: { dc: 'http://purl.org/dc/elements/1.1/', atom: 'http://www.w3.org/2005/Atom' },
    // An empty channel is still a valid feed, so the build holds while every piece is a draft.
    customData: `<language>${site.locale}</language><atom:link href="${new URL('/rss.xml', context.site ?? site.url).href}" rel="self" type="application/rss+xml"/>`,
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/writing/${post.id}`,
      categories: [post.data.kind],
      customData: `<dc:language>${post.data.lang}</dc:language>`,
    })),
  });
};
