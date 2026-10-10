// Order: the unit economics of one online order for a brand that sells physical
// products direct to customers. Pure functions shared by the server render
// (default state) and the client (live recompute).
// Every figure is an average over kept and returned orders.
// Deliberately ignored: VAT and sales tax, repeat purchases and lifetime value,
// stock and cash timing, chargebacks, currency.

export type OrderKey =
  | 'price'
  | 'discount'
  | 'units'
  | 'cogs'
  | 'packaging'
  | 'shipping'
  | 'shipPaid'
  | 'feePct'
  | 'feeFixed'
  | 'returnRate'
  | 'returnCost'
  | 'cpa'
  | 'fixed';

export type OrderInputs = Record<OrderKey, number>;

export interface FieldSpec {
  /** Short key used in the query string. */
  q: string;
  min: number;
  max: number;
  /** Set on the fields drawn as a scale: the step of the range input. */
  step?: number;
  /** How the field is named inside an error message. */
  noun: string;
  example: string;
}

/** Illustrative defaults: a small brand selling one product line at around €60. */
export const ORDER_DEFAULTS: OrderInputs = {
  price: 60,
  discount: 10,
  units: 1.2,
  cogs: 18,
  packaging: 1.5,
  shipping: 7,
  shipPaid: 50,
  feePct: 2.5,
  feeFixed: 0.25,
  returnRate: 10,
  returnCost: 8,
  cpa: 22,
  fixed: 8000,
};

export const ORDER_FIELDS: Record<OrderKey, FieldSpec> = {
  price: { q: 'p', min: 0.01, max: 1_000_000, noun: 'the selling price per unit', example: '60' },
  discount: { q: 'd', min: 0, max: 80, step: 0.5, noun: 'the average discount', example: '10' },
  units: { q: 'u', min: 1, max: 1000, noun: 'units per order', example: '1.2' },
  cogs: { q: 'c', min: 0, max: 1_000_000, noun: 'the product cost per unit', example: '18' },
  packaging: { q: 'k', min: 0, max: 100_000, noun: 'packaging per order', example: '1.5' },
  shipping: { q: 's', min: 0, max: 100_000, noun: 'shipping and fulfilment per order', example: '7' },
  shipPaid: { q: 'sp', min: 0, max: 100, step: 1, noun: 'the share of shipping paid by the customer', example: '50' },
  feePct: { q: 'f', min: 0, max: 30, noun: 'the payment fee as a percentage', example: '2.5' },
  feeFixed: { q: 'ff', min: 0, max: 100, noun: 'the fixed payment fee per order', example: '0.25' },
  returnRate: { q: 'r', min: 0, max: 60, step: 0.5, noun: 'the return rate', example: '10' },
  returnCost: { q: 'rc', min: 0, max: 100_000, noun: 'the cost of handling one return', example: '8' },
  cpa: { q: 'a', min: 0, max: 1_000_000, noun: 'the cost to acquire one order', example: '22' },
  fixed: { q: 'm', min: 0, max: 1_000_000_000, noun: 'fixed costs per month', example: '8000' },
};

export const ORDER_KEYS = Object.keys(ORDER_DEFAULTS) as OrderKey[];

/** Parse a typed number. Accepts "8000", "8,000", "8 000", "2.5", "2,5", "€60" and "10%". */
export function parseNumber(raw: string): number | null {
  let s = raw
    .trim()
    .replace(/[\s_]/g, '')
    .replace(/^(€|£|US\$|\$|EUR)/i, '')
    .replace(/(€|%)$/, '');
  if (s === '') return null;
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const plain = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });

/** Validate one raw field value; returns the number or an error naming the problem and the fix. */
export function validateField(key: OrderKey, raw: string): { value: number } | { error: string } {
  const f = ORDER_FIELDS[key];
  const n = parseNumber(raw);
  if (n === null) {
    return { error: raw.trim() === '' ? `Enter ${f.noun}, for example ${f.example}.` : `Use digits only for ${f.noun}, for example ${f.example}.` };
  }
  if (n < f.min || n > f.max) {
    return { error: `That is outside the range. Enter ${f.noun} from ${plain.format(f.min)} to ${plain.format(f.max)}.` };
  }
  return { value: n };
}

export interface OrderResult {
  inputs: OrderInputs;
  /** Goods at the selling price after the discount (€). */
  goods: number;
  /** The customer's share of the shipping cost (€). */
  shippingCharged: number;
  /** What the customer pays at checkout: goods plus their share of shipping. */
  paid: number;
  /** Average refunded per order: the return rate times what was paid. */
  refunds: number;
  netRevenue: number;
  /** Average costs of one order before ads (€). Product is net of the goods recovered on returns. */
  costs: { product: number; packaging: number; shipping: number; fees: number; returns: number; total: number };
  /** Net revenue less every cost before ads; also the most a CPA can be. */
  contribution: number;
  /** Fraction of net revenue; NaN when there is no net revenue. */
  contributionRate: number;
  /** Net revenue over contribution; null when the order loses money before ads. */
  breakEvenRoas: number | null;
  maxCpa: number;
  /** What is left after ads; negative when the order loses money. */
  profit: number;
  /** Net revenue over the CPA entered; null when no acquisition cost is entered. */
  roas: number | null;
  /** Orders a month that cover the fixed costs; null when an order leaves nothing. */
  ordersToCover: number | null;
}

/** Clears floating point residue, so an order that breaks even reads as exactly zero. */
const tidy = (v: number) => {
  const t = Math.round(v * 1e9) / 1e9;
  return t === 0 ? 0 : t;
};

export function compute(i: OrderInputs): OrderResult {
  const back = i.returnRate / 100;
  const goods = i.price * i.units * (1 - i.discount / 100);
  const shippingCharged = i.shipping * (i.shipPaid / 100);
  const paid = goods + shippingCharged;
  const refunds = paid * back;
  const netRevenue = tidy(paid - refunds);

  // A returned order: the product comes back at cost; packaging, outbound
  // shipping and the payment fee stay spent, and the handling cost is added.
  const product = i.cogs * i.units * (1 - back);
  const fees = paid * (i.feePct / 100) + i.feeFixed;
  const returns = back * i.returnCost;
  const total = product + i.packaging + i.shipping + fees + returns;

  const contribution = tidy(netRevenue - total);
  const profit = tidy(contribution - i.cpa);
  let ordersToCover: number | null = null;
  if (profit > 0) ordersToCover = Math.ceil(i.fixed / profit - 1e-9);
  else if (profit === 0 && i.fixed === 0) ordersToCover = 0;

  return {
    inputs: i,
    goods,
    shippingCharged,
    paid,
    refunds,
    netRevenue,
    costs: { product, packaging: i.packaging, shipping: i.shipping, fees, returns, total },
    contribution,
    contributionRate: netRevenue > 0 ? contribution / netRevenue : NaN,
    breakEvenRoas: contribution > 0 ? netRevenue / contribution : null,
    maxCpa: Math.max(0, contribution),
    profit,
    roas: i.cpa > 0 ? netRevenue / i.cpa : null,
    ordersToCover,
  };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */

const MINUS = '−';

const fmtEur = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtEur0 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmtEurCompact = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 2 });
const fmtPct1 = new Intl.NumberFormat('en-GB', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt2 = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** €61.47. A figure that rounds to zero carries no minus sign. */
export function eur(v: number): string {
  return fmtEur.format(Math.abs(v) < 0.005 ? 0 : v).replace('-', MINUS);
}

/** Large sums without cents once they pass ten thousand. */
export function eurWhole(v: number): string {
  if (Math.abs(v) < 10_000) return eur(v);
  return fmtEur0.format(v).replace('-', MINUS);
}

/** An amount as it was typed: whole euros when it has no cents. */
export function eurPlain(v: number): string {
  return Number.isInteger(v) ? fmtEur0.format(v).replace('-', MINUS) : eurWhole(v);
}

/** Lettering for the drawing: whole euros past ten thousand, compact past a million. */
export function eurShort(v: number): string {
  if (Math.abs(v) < 1_000_000) return eurWhole(v);
  return fmtEurCompact.format(v).replace('-', MINUS);
}

/** 49.5% (input is a ratio) */
export function pct(v: number): string {
  if (!Number.isFinite(v)) return MINUS;
  return fmtPct1.format(v).replace('-', MINUS);
}

/** 2.02× */
export function times(v: number): string {
  return fmt2.format(v) + '×';
}

export function count(v: number): string {
  return plain.format(v);
}

/** Lettering beside a scale, and its spoken value: 10% */
export function scaleText(v: number): string {
  return `${plain.format(v)}%`;
}

/* ------------------------------------------------------------------ */
/* Readout figures                                                     */

export interface Figure {
  id: string;
  label: string;
  value: string;
  small: string;
  key?: boolean;
}

export function figures(r: OrderResult): Figure[] {
  const i = r.inputs;
  const be = r.breakEvenRoas;

  let leftNote = 'the order breaks even exactly';
  if (r.profit > 0) {
    const share = `${pct(r.profit / r.netRevenue)} of net revenue`;
    leftNote = i.cpa > 0 ? `${share}, after ${eur(i.cpa)} to acquire the order` : `${share}, with no acquisition cost entered`;
  } else if (r.profit < 0) {
    leftNote =
      r.contribution > 0
        ? `each order loses money: ${eur(r.contribution)} of contribution against ${eur(i.cpa)} to acquire it`
        : `each order loses money before ads, then ${eur(i.cpa)} more to acquire it`;
  }

  let roasNote = 'no acquisition cost entered';
  if (r.roas !== null) {
    if (be === null) roasNote = 'no ROAS pays for an order that leaves nothing before ads';
    else if (r.profit > 0) roasNote = `above the break-even of ${times(be)}`;
    else if (r.profit === 0) roasNote = `exactly at the break-even of ${times(be)}`;
    else roasNote = `below the break-even of ${times(be)}: each order loses money`;
  }

  let breakEvenNote = 'net revenue ÷ contribution before ads';
  if (be === null) breakEvenNote = r.contribution < 0 ? 'the order loses money before any ad spend' : 'nothing is left before ads';

  let ordersValue = 'Never';
  let ordersNote = 'each order loses money, so more orders widen the loss';
  if (r.ordersToCover !== null && i.fixed === 0) {
    ordersValue = '0';
    ordersNote = 'no fixed costs entered';
  } else if (r.ordersToCover !== null) {
    ordersValue = count(r.ordersToCover);
    ordersNote = `${eurPlain(i.fixed)} of fixed costs ÷ ${eur(r.profit)} left per order`;
  } else if (r.profit === 0) {
    ordersNote = 'each order only breaks even, so nothing is left for the fixed costs';
  }

  return [
    {
      id: 'left',
      label: 'Left per order, after ads',
      value: eur(r.profit),
      small: leftNote,
      key: true,
    },
    {
      id: 'net',
      label: 'Net revenue per order',
      value: eur(r.netRevenue),
      small: `${eur(r.paid)} paid, less ${eur(r.refunds)} refunded on returns`,
    },
    {
      id: 'contribution',
      label: 'Contribution before ads',
      value: eur(r.contribution),
      small: Number.isFinite(r.contributionRate) ? `${pct(r.contributionRate)} of net revenue` : 'no net revenue to measure it against',
    },
    {
      id: 'breakeven',
      label: 'Break-even ROAS',
      value: be === null ? 'None' : times(be),
      small: breakEvenNote,
    },
    {
      id: 'maxcpa',
      label: 'Maximum CPA',
      value: eur(r.maxCpa),
      small: r.contribution > 0 ? 'the most one order can bear before it loses money' : 'nothing is left to pay for acquisition',
    },
    {
      id: 'roas',
      label: 'ROAS at the CPA entered',
      value: r.roas === null ? 'None' : times(r.roas),
      small: roasNote,
    },
    {
      id: 'orders',
      label: 'Orders a month to cover fixed costs',
      value: ordersValue,
      small: ordersNote,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Drawing: the waterfall of one order, as SVG markup for a <g>.       */
/* `w` is the drawing width in user units; the client passes the       */
/* rendered width so lettering stays at true size on every screen.     */

export const VIEW = { w: 640, h: 326 };

const TOP = 46; // centre of the first row
const PITCH = 26; // row to row
const BAR = 13; // bar thickness

interface Row {
  name: string;
  /** total: measured from zero. cost: hangs from the running level. left: the remainder. */
  kind: 'total' | 'cost' | 'left';
  from: number;
  to: number;
}

/** The order read top to bottom: paid, each cost in turn, the two remainders. */
function rows(r: OrderResult): Row[] {
  const c = r.costs;
  const out: Row[] = [{ name: 'Customer pays', kind: 'total', from: 0, to: r.paid }];
  let level = r.paid;
  const take = (name: string, v: number) => {
    out.push({ name, kind: 'cost', from: level, to: level - v });
    level -= v;
  };
  take('Refunds', r.refunds);
  take('Product', c.product);
  take('Packaging', c.packaging);
  take('Shipping', c.shipping);
  take('Payment fees', c.fees);
  take('Return handling', c.returns);
  out.push({ name: 'Before ads', kind: 'total', from: 0, to: r.contribution });
  level = r.contribution;
  take('Ads', r.inputs.cpa);
  out.push({ name: r.profit < 0 ? 'Lost' : 'Left', kind: 'left', from: 0, to: r.profit });
  return out;
}

// The two remainders stand a little apart from the costs above them.
const rowY = (i: number) => TOP + i * PITCH + (i >= 7 ? 6 : 0) + (i >= 9 ? 6 : 0);

const r1 = (v: number) => Math.round(v * 10) / 10;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Plain-language description of the drawing, for the SVG <desc>. */
export function describe(r: OrderResult): string {
  const c = r.costs;
  const head = `One order, averaged over kept and returned orders. The customer pays ${eur(r.paid)}. Taken off in turn: refunds ${eur(r.refunds)}, product ${eur(c.product)}, packaging ${eur(c.packaging)}, shipping ${eur(c.shipping)}, payment fees ${eur(c.fees)}, return handling ${eur(c.returns)}. That leaves ${eur(r.contribution)} before ads. Ads take ${eur(r.inputs.cpa)}.`;
  if (r.profit < 0) return `${head} The order loses ${eur(-r.profit)}.`;
  return `${head} ${eur(r.profit)} is left.`;
}

/** Inner SVG markup for the readout drawing. Pure, so the server and the client draw the same thing. */
export function drawing(r: OrderResult, w = VIEW.w): string {
  const narrow = w < 420;
  const fs = narrow ? 11.5 : 13;
  const afs = narrow ? 11 : 12; // amounts, set in the mono face
  const x0 = narrow ? 92 : 118; // bar area, after the row names
  const x1 = w - (narrow ? 74 : 92) - 10; // and before the amounts

  const list = rows(r);
  const lo = Math.min(0, r.profit);
  const hi = Math.max(0, r.paid);
  const span = hi - lo || 1;
  const x = (v: number) => x0 + ((v - lo) / span) * (x1 - x0);
  const out: string[] = [];

  // Heading annotation.
  const heading = r.profit < 0 ? `One order: it loses ${eurShort(-r.profit)} after ads` : 'One order, in € per order';
  out.push(`<text class="note" x="0" y="16" font-size="${fs + 3}">${esc(heading)}</text>`);

  // Zero datum.
  const zx = r1(x(0));
  const foot = rowY(list.length - 1) + 14;
  out.push(`<line class="ink-fine" x1="${zx}" y1="${TOP - 14}" x2="${zx}" y2="${foot}"/>`);
  out.push(`<text class="dim" x="${zx}" y="${r1(foot + fs)}" font-size="${fs}" text-anchor="middle">0</text>`);

  list.forEach((s, i) => {
    const cy = rowY(i);
    const a = x(s.from);
    const z = x(s.to);
    const xl = r1(Math.min(a, z));
    const wd = r1(Math.abs(a - z));
    const top = r1(cy - BAR / 2);
    const box = `x="${xl}" y="${top}" width="${wd}" height="${BAR}"`;
    const gold = 'fill:none;stroke:var(--gold);stroke-width:1.25';

    if (wd < 0.75) {
      // Nothing to draw to scale: a tick at the running level.
      const tx = r1(z);
      const stroke = s.kind === 'left' ? ` style="${gold}"` : '';
      out.push(`<line class="ink" x1="${tx}" y1="${top}" x2="${tx}" y2="${r1(top + BAR)}"${stroke}/>`);
    } else if (s.kind === 'total') {
      // A sum measured from zero: ink hatching under an ink outline, broken when negative.
      if (s.to >= 0) out.push(`<rect ${box} style="fill:url(#hatch-ink);stroke:none"/>`, `<rect class="ink" ${box}/>`);
      else out.push(`<rect class="ink" ${box} stroke-dasharray="4 2.5"/>`);
    } else if (s.kind === 'cost') {
      // A cost hangs from the level the row above ended on.
      out.push(`<rect class="ink-fine" ${box} style="fill:var(--rule)"/>`);
    } else if (s.to >= 0) {
      // What is left: the one gold bar on the sheet.
      out.push(`<rect class="hatch" ${box}/>`, `<rect ${box} style="${gold}"/>`);
    } else {
      // A loss: the same gold line, broken, on the far side of zero.
      out.push(`<rect ${box} style="${gold};stroke-dasharray:4 2.5"/>`);
    }

    // Running connector down to the next row, at the level this row ends on.
    if (i < list.length - 1) {
      const lx = r1(z);
      out.push(`<line class="metal" x1="${lx}" y1="${r1(cy + BAR / 2)}" x2="${lx}" y2="${r1(rowY(i + 1) - BAR / 2)}"/>`);
    }

    // Row name on the left, amount on the right.
    const strong = s.kind !== 'cost';
    const base = r1(cy + fs * 0.34);
    out.push(
      `<text class="dim" x="0" y="${base}" font-size="${fs}"${strong ? ' font-weight="600" style="fill:var(--line)"' : ''}>${esc(s.name)}</text>`,
    );
    const amount = s.kind === 'cost' ? eurShort(s.to - s.from) : eurShort(s.to);
    out.push(
      `<text class="amt" x="${w}" y="${base}" font-size="${afs}" text-anchor="end"${strong ? ' font-weight="600"' : ''}>${esc(amount)}</text>`,
    );
  });

  return out.join('');
}
