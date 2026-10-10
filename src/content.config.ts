import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    lang: z.enum(['en', 'fr']).default('en'),
    kind: z.enum(['essay', 'manifesto', 'note']).default('essay'),
    place: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    name: z.string(),
    line: z.string(),
    summary: z.string().optional(),
    points: z.array(z.string()).default([]),
    role: z.string(),
    status: z.string(),
    since: z.number(),
    url: z.string().url().optional(),
    urlLabel: z.string().optional(),
    tier: z.enum(['venture', 'lab']),
    order: z.number(),
    visible: z.boolean().default(true),
    facts: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
  }),
});

export const collections = { writing, work };
