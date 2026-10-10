// The working tools under /instruments, in the order the disciplines were
// taken up. `value` and `unit` are the headline figure of the default state,
// shown on the home page.
export type InstrumentFamily = 'Crypto' | 'Commerce' | 'Capital' | 'Code' | 'Form' | 'Time';

export type InstrumentEntry = {
  slug: string;
  name: string;
  family: InstrumentFamily;
  line: string;
  value: string;
  unit: string;
};

export const instruments: InstrumentEntry[] = [
  {
    slug: 'pool',
    name: 'Pool',
    family: 'Crypto',
    line: 'What a trade costs in a constant-product pool, and what providing liquidity gives up.',
    value: '−1.96%',
    unit: 'price impact on a 2% trade',
  },
  {
    slug: 'order',
    name: 'Order Profitability',
    family: 'Commerce',
    line: 'What one online order leaves after product, shipping, fees, returns and ads.',
    value: '2.00×',
    unit: 'break-even ROAS',
  },
  {
    slug: 'returns',
    name: 'Returns',
    family: 'Capital',
    line: 'What a leveraged buyout returns, split into growth, multiple and debt paydown.',
    value: '2.86×',
    unit: 'MOIC, 23.4% IRR',
  },
  {
    slug: 'dilution',
    name: 'Dilution',
    family: 'Capital',
    line: 'How much of the company the founders keep, round after round, option pool included.',
    value: '52.1%',
    unit: 'founders after Series A',
  },
  {
    slug: 'bottleneck',
    name: 'Bottleneck',
    family: 'Code',
    line: 'A build-out delivers what its scarcest part allows. Find the stave that sets the level.',
    value: '70',
    unit: 'of 100 planned, capped by power',
  },
  {
    slug: 'copilot-economics',
    name: 'Copilot economics',
    family: 'Code',
    line: 'What an AI copilot costs per user per month, and the margin left on the subscription.',
    value: '80.4%',
    unit: 'gross margin',
  },
  {
    slug: 'solid',
    name: 'Solid',
    family: 'Form',
    line: 'Seven solids to turn in your hand, with their measures and their weight.',
    value: '8.71 cm³',
    unit: 'rhombicuboctahedron, 10 mm edge',
  },
  {
    slug: 'beat',
    name: 'Beat',
    family: 'Time',
    line: 'How fast a watch beats, what it sounds like, and what a few seconds a day add up to.',
    value: '4 Hz',
    unit: '28,800 vph, 8 beats a second',
  },
];
