// The working tools under /instruments. One per discipline family.
export type InstrumentEntry = {
  slug: string;
  name: string;
  family: 'Capital' | 'Code' | 'Craft';
  line: string;
};

export const instruments: InstrumentEntry[] = [
  {
    slug: 'returns',
    name: 'Returns',
    family: 'Capital',
    line: 'What a leveraged buyout returns, split into growth, multiple and debt paydown.',
  },
  {
    slug: 'dilution',
    name: 'Dilution',
    family: 'Capital',
    line: 'How much of the company the founders keep, round after round, option pool included.',
  },
  {
    slug: 'copilot-economics',
    name: 'Copilot economics',
    family: 'Code',
    line: 'What an AI copilot costs per user per month, and the margin left on the subscription.',
  },
  {
    slug: 'ring-sizes',
    name: 'Ring sizes',
    family: 'Craft',
    line: 'One finger, six sizing systems, with the millimetres behind each.',
  },
];
