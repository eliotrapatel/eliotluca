// Everything personal lives here. Edit this file to update the site.
// Empty strings hide a link everywhere it would appear.

export const site = {
  name: 'Eliot Luca',
  domain: 'eliotluca.com',
  url: 'https://eliotluca.com',
  description:
    'Eliot Luca builds on what is tangible: a finance background in private equity, venture and M&A, THE ENTITY, which ties markets to the physical value chain of AI, and ORBES, a Paris jewellery house.',
  statement:
    'I build on what is tangible. Trained in private equity, venture and M&A, I now build THE ENTITY and ORBES.',
  email: 'hello@eliotluca.com',
  // Fill these in when ready. Empty values are hidden.
  social: {
    linkedin: '',
    x: '',
    github: '',
    instagram: '',
  },
  locale: 'en',
  languages: ['English', 'French', 'Italian', 'Spanish', 'Portuguese'],
};

export type Discipline = {
  id: string;
  name: string;
  since: number;
  note: string;
  href: string;
  study: string; // id of the drawing on the home sheet
};

// The practice, in order of entry. Years are the year each discipline began.
export const disciplines: Discipline[] = [
  { id: 'mark', name: 'Branding and graphic design', since: 2016, note: 'Names, marks, packaging', href: '/work/orbes', study: 'letter' },
  { id: 'chain', name: 'Blockchain and crypto', since: 2017, note: 'Markets, DeFi and a thesis', href: '/writing/defi-competes-on-mechanics', study: 'amm' },
  { id: 'commerce', name: 'E-commerce', since: 2018, note: 'Selling objects online', href: '/work/orbes', study: 'dieline' },
  { id: 'capital', name: 'Finance and private equity', since: 2021, note: 'PE, VC, M&A, integration', href: '/about#record', study: 'bridge' },
  { id: 'sound', name: 'Music production', since: 2023, note: 'Personal practice', href: '/about#practice', study: 'envelope' },
  { id: 'compute', name: 'AI infrastructure', since: 2025, note: 'Models, routing, cost', href: '/work/the-entity', study: 'routing' },
  { id: 'form', name: '3D industrial modelling', since: 2026, note: 'Objects drawn in three dimensions', href: '/work/orbes', study: 'polyhedron' },
  { id: 'time', name: 'Watchmaking', since: 2026, note: 'Movements and their parts', href: '/about#practice', study: 'escapement' },
];

export type RecordEntry = {
  firm: string;
  role: string;
  scope: string;
  duration?: string;
};

// Finance record, most recent first. Add dates when you want them shown.
export const record: RecordEntry[] = [
  {
    firm: 'Asset management technology',
    role: 'Corporate development',
    scope: 'Strategy and transformation, post-merger integration',
  },
  {
    firm: 'Search fund',
    role: 'Analyst',
    scope: 'Private equity',
  },
  {
    firm: 'Private equity',
    role: 'Intern',
    scope: 'Information memorandum and Q&A on an €80M M&A transaction',
    duration: '6 months',
  },
  {
    firm: 'Venture capital',
    role: 'Intern',
    scope: 'Fundraising, data rooms and investor Q&A for startups',
    duration: '6 months',
  },
];

export const education = [
  { school: 'emlyon business school', programme: 'MSc in Finance' },
  { school: 'ESSEC Business School', programme: 'Global BBA' },
  { school: 'McGill University', programme: 'Study trip, Montreal' },
];

export const thesis = {
  question: 'To what extent can decentralised finance compete with traditional finance?',
  method: 'Five semi-structured interviews with DeFi protocol executives, more than five hours in total.',
};

// The /now page. Update the date when you change it.
export const now = {
  updated: '2026-10-08',
  items: [
    {
      title: 'Building THE ENTITY',
      body: 'Model 2.8 is live: the AI supply chain as one graph, re-scored every night, with a Copilot and a public API.',
      href: 'https://joinentity.com',
    },
    {
      title: 'Running the ORBES draw',
      body: 'The Orchid ring in 18ct gold and emerald baguettes, ten pieces, allocated by draw. Entries close on 11 October 2026.',
      href: 'https://verify.theorbes.com',
    },
    {
      title: 'Learning 3D modelling and watchmaking',
      body: '3D industrial modelling and watchmaking, both taken up in 2026.',
      href: '/about#practice',
    },
  ],
};
