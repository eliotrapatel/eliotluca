// Pool: a constant-product liquidity pool (x · y = k), the mechanism behind
// automated market makers. What a trade costs against the reserves, and what
// providing liquidity gives up against holding. Pure functions shared by the
// server render (default state) and the client (live recompute).
// Deliberately ignored: concentrated liquidity, gas, MEV, fee income over
// time, pools of more than two assets.

export type PoolKey = 'reserveA' | 'reserveB' | 'fee' | 'size' | 'move';

/** Sell token A for token B, or buy token A with token B. */
export type Direction = 'sell' | 'buy';

export interface PoolInputs extends Record<PoolKey, number> {
  direction: Direction;
}

export interface FieldSpec {
  /** Short key used in the query string. */
  q: string;
  min: number;
  max: number;
  integer?: boolean;
  /** How the field is named inside an error message. */
  noun: string;
  example: string;
}

/** Illustrative defaults: no real pool. Token A at US$2,000, a trade of 2% of its reserve. */
export const POOL_DEFAULTS: PoolInputs = {
  reserveA: 1000,
  reserveB: 2_000_000,
  fee: 0.3,
  size: 20,
  move: 50,
  direction: 'sell',
};

export const POOL_FIELDS: Record<PoolKey, FieldSpec> = {
  reserveA: { q: 'a', min: 0.000001, max: 1_000_000_000_000, noun: 'the reserve of token A', example: '1000' },
  reserveB: { q: 'b', min: 0.01, max: 1_000_000_000_000, noun: 'the reserve of token B in US$', example: '2000000' },
  fee: { q: 'f', min: 0, max: 10, noun: 'the pool fee in %', example: '0.3' },
  size: { q: 't', min: 0.000001, max: 1_000_000_000_000, noun: 'the trade size', example: '20' },
  move: { q: 'm', min: -90, max: 400, integer: true, noun: 'the price move in %', example: '50' },
};

export const POOL_KEYS = Object.keys(POOL_FIELDS) as PoolKey[];

/** Query key for the trade direction. */
export const DIRECTION_QUERY = 'd';

/** The two directions: the label of the choice and the unit the trade size is typed in. */
export const DIRECTIONS = {
  sell: { label: 'Sell A for B', unit: 'token A' },
  buy: { label: 'Buy A with B', unit: 'US$' },
} as const;

export function parseDirection(raw: string | null): Direction {
  return raw === 'buy' ? 'buy' : 'sell';
}

/** Parse a typed number. Accepts "2000000", "2,000,000", "2 000 000", "0.3", "0,3" and "1e-7". */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().replace(/[\s_  ]/g, '').replace(/^\$|^US\$/i, '').replace(/%$/, '');
  if (s === '') return null;
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
  if (!/^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const plain = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 6 });

/** Validate one raw field value; returns the number or an error naming the problem and the fix. */
export function validateField(key: PoolKey, raw: string): { value: number } | { error: string } {
  const f = POOL_FIELDS[key];
  const n = parseNumber(raw);
  if (n === null) {
    return { error: raw.trim() === '' ? `Enter ${f.noun}, for example ${f.example}.` : `Use digits only for ${f.noun}, for example ${f.example}.` };
  }
  if (f.integer && !Number.isInteger(n)) return { error: `Use a whole number for ${f.noun}, for example ${f.example}.` };
  if (n < f.min || n > f.max) {
    return { error: `That is outside the range. Enter ${f.noun} from ${plain.format(f.min)} to ${plain.format(f.max)}.` };
  }
  return { value: n };
}

/** A number as a field value: grouped thousands, six significant figures, never an exponent. parseNumber reads it back. */
export function fieldText(n: number): string {
  return new Intl.NumberFormat('en-GB', { maximumSignificantDigits: 6 }).format(n);
}

/** The same trade typed in the other token, converted at the spot price (US$ per token A). */
export function convertSize(size: number, to: Direction, spot: number): number {
  return to === 'buy' ? size * spot : size / spot;
}

/* ------------------------------------------------------------------ */
/* The maths                                                           */

/** Impermanent loss for a price ratio r = new price ÷ old price: 2·√r ÷ (1 + r) − 1. */
export function lossAt(ratio: number): number {
  return (2 * Math.sqrt(ratio)) / (1 + ratio) - 1;
}

/** The two price moves (down and up, as fractions) at which the loss reaches `loss`, e.g. −0.05. */
export function movesForLoss(loss: number): { down: number; up: number } {
  const c = 1 + loss;
  const root = Math.sqrt(1 - c * c);
  return { down: Math.pow((1 - root) / c, 2) - 1, up: Math.pow((1 + root) / c, 2) - 1 };
}

/** The loss marked on the second drawing and quoted in the readout. */
export const LOSS_MARK = -0.05;

export interface PoolResult {
  inputs: PoolInputs;
  /** The invariant before the trade: reserve A × reserve B. */
  k: number;
  /** US$ per token A: reserve B ÷ reserve A. */
  spotBefore: number;
  spotAfter: number;
  /** spotAfter ÷ spotBefore − 1. */
  spotChange: number;
  /** Amount paid in, in the token going in, and the part of it swapped once the fee is left behind. */
  amountIn: number;
  amountInEff: number;
  /** Amount paid in ÷ the reserve it enters. */
  share: number;
  /** Fee in the token going in, and valued in US$ at the spot price before the trade. */
  fee: number;
  feeUsd: number;
  /** Amount received, in the token coming out. */
  amountOut: number;
  /** US$ per token A actually paid or received, fee included. */
  execPrice: number;
  /** execPrice ÷ spotBefore − 1: negative when selling, positive when buying. */
  execVsSpot: number;
  /** Amount received against the spot price on the amount swapped, less one. The curve alone, never above zero. */
  impact: number;
  /** Reserves once the trade has settled. The fee stays in, so k rises a little. */
  after: { a: number; b: number; k: number };
  /** A deposit of the whole pool, valued before the trade, after the price of token A moves by `ratio`. */
  lp: {
    ratio: number;
    deposit: number;
    hold: number;
    pool: number;
    /** pool ÷ hold − 1. */
    loss: number;
    lossUsd: number;
    /** Price moves at which the loss reaches LOSS_MARK. */
    mark: { down: number; up: number };
  };
}

export function compute(i: PoolInputs): PoolResult {
  const a = i.reserveA;
  const b = i.reserveB;
  const sell = i.direction === 'sell';
  const f = i.fee / 100;
  const rin = sell ? a : b;
  const rout = sell ? b : a;
  const spot = b / a;

  // The fee is taken from the amount in; only the rest moves the pool along the curve.
  const din = i.size;
  const dinEff = din * (1 - f);
  const dout = (rout * dinEff) / (rin + dinEff);
  const fee = din - dinEff;

  const a1 = sell ? a + din : a - dout;
  const b1 = sell ? b - dout : b + din;
  const exec = sell ? dout / din : din / dout;
  const spotAfter = b1 / a1;

  const ratio = 1 + i.move / 100;
  const hold = b * (1 + ratio);
  const pool = 2 * b * Math.sqrt(ratio);

  return {
    inputs: i,
    k: a * b,
    spotBefore: spot,
    spotAfter,
    spotChange: spotAfter / spot - 1,
    amountIn: din,
    amountInEff: dinEff,
    share: din / rin,
    fee,
    feeUsd: sell ? fee * spot : fee,
    amountOut: dout,
    execPrice: exec,
    execVsSpot: exec / spot - 1,
    impact: -dinEff / (rin + dinEff),
    after: { a: a1, b: b1, k: a1 * b1 },
    lp: { ratio, deposit: 2 * b, hold, pool, loss: lossAt(ratio), lossUsd: pool - hold, mark: movesForLoss(LOSS_MARK) },
  };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */

const MINUS = '−';
const typeset = (s: string) => s.replace(/-/g, MINUS);

/** US$39,100.34, US$1,960,900 past a hundred thousand, four significant figures under a dollar. */
export function usd(v: number): string {
  if (!Number.isFinite(v)) return 'n/a';
  const abs = Math.abs(v);
  const digits: Intl.NumberFormatOptions =
    abs >= 100_000
      ? { maximumFractionDigits: 0 }
      : abs >= 1 || abs === 0
        ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        : { minimumSignificantDigits: 2, maximumSignificantDigits: 4 };
  return typeset(new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'USD', ...digits }).format(v));
}

/** An amount of token A: 1,020 or 19.5502. */
export function units(v: number): string {
  if (!Number.isFinite(v)) return 'n/a';
  const abs = Math.abs(v);
  const digits: Intl.NumberFormatOptions =
    abs >= 1000 ? { maximumFractionDigits: 2 } : abs >= 1 || abs === 0 ? { maximumFractionDigits: 4 } : { maximumSignificantDigits: 4 };
  return typeset(new Intl.NumberFormat('en-GB', digits).format(v));
}

/** −1.96% (input is a ratio). `signed` adds a plus to a rise. A figure that rounds to zero carries no sign. */
export function pct(v: number, digits = 2, signed = false): string {
  if (!Number.isFinite(v)) return 'n/a';
  const s = new Intl.NumberFormat('en-GB', { style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(v));
  if (Number((Math.abs(v) * 100).toFixed(digits)) === 0) return s;
  return (v < 0 ? MINUS : signed ? '+' : '') + s;
}

/** +50%, −50% or 0% (input is the scale value, in per cent). */
export function moveText(m: number): string {
  const s = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(Math.abs(m));
  return (m > 0 ? '+' : m < 0 ? MINUS : '') + s + '%';
}

/** Spoken value for the scale (aria-valuetext). */
export function moveSpoken(m: number): string {
  if (m === 0) return 'price of token A unchanged';
  return `price of token A ${m > 0 ? 'up' : 'down'} ${Math.abs(m)} per cent`;
}

/** Short lettering for the drawings: 1,020, 39.1K, 1.961M, 2bn, 1.2e−4. Suffixes are set here so every browser letters alike. */
function short(v: number, digits: number): string {
  if (v !== 0 && Math.abs(v) < 0.001) return typeset(v.toExponential(1));
  const rounded = Number(v.toPrecision(digits));
  const abs = Math.abs(rounded);
  const [unit, suffix]: [number, string] =
    abs >= 1e12 ? [1e12, 'tn'] : abs >= 1e9 ? [1e9, 'bn'] : abs >= 1e6 ? [1e6, 'M'] : abs >= 1e4 ? [1e3, 'K'] : [1, ''];
  return typeset(new Intl.NumberFormat('en-GB', { maximumSignificantDigits: digits }).format(rounded / unit)) + suffix;
}

/* ------------------------------------------------------------------ */
/* Readout figures                                                     */

export interface Figure {
  id: string;
  group: 'trade' | 'lp';
  label: string;
  value: string;
  small: string;
  key?: boolean;
}

export function figures(r: PoolResult): Figure[] {
  const i = r.inputs;
  const sell = i.direction === 'sell';
  const paid = sell ? `${units(r.amountIn)} token A` : usd(r.amountIn);
  const lp = r.lp;
  const moved = i.move === 0 ? 'unchanged' : `${i.move > 0 ? 'up' : 'down'} ${moveText(Math.abs(i.move)).replace('+', '')}`;
  return [
    {
      id: 'impact',
      group: 'trade',
      label: 'Price impact',
      value: pct(r.impact),
      small: `the curve alone, before the fee: the trade is ${pct(r.share)} of the ${sell ? 'token A' : 'US$'} reserve`,
      key: true,
    },
    {
      id: 'received',
      group: 'trade',
      label: 'Amount received',
      value: sell ? usd(r.amountOut) : `${units(r.amountOut)} token A`,
      small: `for ${paid} paid in`,
    },
    {
      id: 'exec',
      group: 'trade',
      label: 'Execution price',
      value: usd(r.execPrice),
      small: `per token A, fee included: ${pct(Math.abs(r.execVsSpot))} ${sell ? 'below' : 'above'} spot`,
    },
    {
      id: 'fee',
      group: 'trade',
      label: 'Fee paid',
      value: usd(r.feeUsd),
      small: sell ? `${units(r.fee)} token A at the spot price, kept by the pool` : `${pct(i.fee / 100)} of the amount in, kept by the pool`,
    },
    {
      id: 'spot',
      group: 'trade',
      label: 'Spot price before',
      value: usd(r.spotBefore),
      small: 'per token A: reserve B ÷ reserve A',
    },
    {
      id: 'after',
      group: 'trade',
      label: 'Spot price after',
      value: usd(r.spotAfter),
      small: `${pct(r.spotChange, 2, true)} on the price before; reserves ${units(r.after.a)} token A and ${usd(r.after.b)}`,
    },
    {
      id: 'loss',
      group: 'lp',
      label: 'Impermanent loss',
      value: pct(lp.loss),
      small: `${usd(lp.lossUsd)} against holding, on a deposit of the whole pool (${usd(lp.deposit)}) with token A ${moved}`,
      key: true,
    },
    {
      id: 'position',
      group: 'lp',
      label: 'Position in the pool',
      value: usd(lp.pool),
      small: `against ${usd(lp.hold)} for the same tokens simply held`,
    },
    {
      id: 'mark',
      group: 'lp',
      label: `Loss reaches ${pct(Math.abs(LOSS_MARK), 0)} at`,
      value: `${pct(lp.mark.down, 1)} or ${pct(lp.mark.up, 1, true)}`,
      small: 'price moves of token A, the same for every pool of this kind',
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Drawing: the curve x · y = k and the trade along it                 */

export const VIEW = { w: 440, h: 356 };

const OX = 66; // origin
const OY = 312;
const XW = 344; // length of the reserve A axis, to the largest value drawn
const YH = 264; // length of the reserve B axis
const WIDE = 1.5; // axis reach, as a multiple of the larger reserve
const CLOSE = 2; // the same when a detail is drawn, to clear the corner for it
const NEAR_X = 50; // under these gaps the lettering of the two points would collide,
const NEAR_Y = 30; // so the trade is drawn again in an enlarged detail
const DETAIL = { x: 254, y: 44, w: 170, h: 128 };

type Pt = { x: number; y: number };
/** Maps reserves (token A, token B) to the sheet. */
type Frame = (a: number, b: number) => Pt;

const r1 = (v: number) => Math.round(v * 10) / 10;
const r2 = (v: number) => Math.round(v * 100) / 100;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const trace = (pts: Pt[]) => pts.map((p, n) => `${n ? 'L' : 'M'}${r2(p.x)} ${r2(p.y)}`).join('');

const text = (x: number, y: number, s: string, anchor = 'start', cls = 'lbl', size = 12.5) =>
  `<text class="${cls}" x="${r1(x)}" y="${r1(y)}" font-size="${size}" text-anchor="${anchor}">${esc(s)}</text>`;

/** The curve a · b = k between two values of a, sampled evenly in log space so the knee is as fine as the tails. */
function hyperbola(k: number, frame: Frame, lo: number, hi: number, n: number): string {
  const pts: Pt[] = [];
  for (let s = 0; s <= n; s++) {
    const a = lo * Math.pow(hi / lo, s / n);
    pts.push(frame(a, k / a));
  }
  return trace(pts);
}

/** Plain-language description of the first drawing, for the SVG <desc>. */
export function describe(r: PoolResult): string {
  const i = r.inputs;
  const sell = i.direction === 'sell';
  const trade = sell
    ? `Selling ${units(r.amountIn)} token A returns ${usd(r.amountOut)}`
    : `Paying ${usd(r.amountIn)} buys ${units(r.amountOut)} token A`;
  return `The curve x times y equals k for a pool of ${units(i.reserveA)} token A and ${usd(i.reserveB)}, spot price ${usd(r.spotBefore)}. ${trade} at ${usd(r.execPrice)} per token A, a price impact of ${pct(r.impact)}. The pool ends at ${units(r.after.a)} token A and ${usd(r.after.b)}, spot price ${usd(r.spotAfter)}.`;
}

/** Inner SVG markup for the first drawing. Pure, so the server and the client draw the same thing. */
export function drawing(r: PoolResult): string {
  const { reserveA: a0, reserveB: b0 } = r.inputs;
  const { a: a1, b: b1 } = r.after;
  const sell = r.inputs.direction === 'sell';
  const aTop = Math.max(a0, a1);
  const bTop = Math.max(b0, b1);

  // A trade too small for the lettering of its two points gets an enlarged detail.
  const moved = Math.abs(a1 - a0) / a0 > 1e-9 && Math.abs(b1 - b0) / b0 > 1e-9;
  const gapX = (Math.abs(a1 - a0) / (aTop * WIDE)) * XW;
  const gapY = (Math.abs(b1 - b0) / (bTop * WIDE)) * YH;
  const detail = gapX < NEAR_X || gapY < NEAR_Y;
  const reach = detail ? CLOSE : WIDE;
  const aMax = aTop * reach;
  const bMax = bTop * reach;
  const main: Frame = (a, b) => ({ x: OX + (a / aMax) * XW, y: OY - (b / bMax) * YH });
  const A = main(a0, b0);
  const B = main(a1, b1);
  const out: string[] = [];

  // The swap itself: along the curve by the amount net of the fee, then the fee added to the reserve.
  // Sampled in log space like the curve, so a very large trade still turns the knee smoothly.
  const swap = (frame: Frame): string => {
    const rin = sell ? a0 : b0;
    const pts: Pt[] = [];
    for (let s = 0; s <= 64; s++) {
      const v = rin * Math.pow(1 + r.amountInEff / rin, s / 64);
      pts.push(sell ? frame(v, r.k / v) : frame(r.k / v, v));
    }
    pts.push(frame(a1, b1));
    return trace(pts);
  };

  // Under the curve: the hatched swap rectangle and the gold stretch that was traded.
  const under = (frame: Frame): string => {
    const P = frame(a0, b0);
    const Q = frame(a1, b1);
    const box = `x="${r1(Math.min(P.x, Q.x))}" y="${r1(Math.min(P.y, Q.y))}" width="${r1(Math.abs(Q.x - P.x))}" height="${r1(Math.abs(Q.y - P.y))}"`;
    return `<rect ${box} style="fill:url(#hatch-ink);stroke:none;opacity:0.35"/><path class="gold-line" d="${swap(frame)}"/>`;
  };

  // Over the curve: the two legs of the trade, their lettering, and the two points.
  const over = (frame: Frame, legs: boolean, dot: number): string => {
    const P = frame(a0, b0);
    const Q = frame(a1, b1);
    const C = frame(aTop, bTop); // corner of the swap rectangle, clear of the curve
    const s: string[] = [];
    if (legs) {
      const arrow = `class="ink-fine" marker-end="url(#arrow)"`;
      if (sell) {
        s.push(`<line ${arrow} x1="${r1(P.x + 5)}" y1="${r1(C.y)}" x2="${r1(C.x - 1)}" y2="${r1(C.y)}"/>`);
        s.push(`<line ${arrow} x1="${r1(C.x)}" y1="${r1(C.y + 1)}" x2="${r1(C.x)}" y2="${r1(Q.y - 5)}"/>`);
      } else {
        s.push(`<line ${arrow} x1="${r1(C.x)}" y1="${r1(P.y - 5)}" x2="${r1(C.x)}" y2="${r1(C.y + 1)}"/>`);
        s.push(`<line ${arrow} x1="${r1(C.x - 1)}" y1="${r1(C.y)}" x2="${r1(Q.x + 5)}" y2="${r1(C.y)}"/>`);
      }
      const across = sell ? `+${short(r.amountIn, 3)} A` : `${MINUS}${short(r.amountOut, 3)} A`;
      const down = sell ? `${MINUS}US$${short(r.amountOut, 3)}` : `+US$${short(r.amountIn, 3)}`;
      s.push(text((P.x + Q.x) / 2, C.y - 7, across, 'middle', 'lbl is-strong'));
      s.push(text(C.x + 7, (P.y + Q.y) / 2 + 4, down, 'start', 'lbl is-strong'));
    }
    s.push(`<circle class="hollow" cx="${r1(P.x)}" cy="${r1(P.y)}" r="${dot}"/>`);
    if (moved) s.push(`<circle class="gold-dot" cx="${r1(Q.x)}" cy="${r1(Q.y)}" r="${dot}"/>`);
    return s.join('');
  };

  // Axis lettering.
  out.push(text(12, 24, 'reserve of token B, US$'));
  out.push(text(OX + XW + 14, OY + 36, 'reserve of token A', 'end'));

  // Projections of the points on both axes, with the reserves lettered.
  const project = (p: Pt, a: number, b: number) => {
    out.push(`<path class="metal" d="M${r1(p.x)} ${r1(p.y)}V${OY}M${r1(p.x)} ${r1(p.y)}H${OX}"/>`);
    out.push(`<line class="ink-fine" x1="${r1(p.x)}" y1="${OY}" x2="${r1(p.x)}" y2="${OY + 5}"/>`);
    out.push(`<line class="ink-fine" x1="${OX - 5}" y1="${r1(p.y)}" x2="${OX}" y2="${r1(p.y)}"/>`);
    out.push(text(p.x, OY + 18, short(a, 4), 'middle'));
    out.push(text(OX - 8, p.y + 4, short(b, 4), 'end'));
  };
  project(A, a0, b0);
  if (!detail) project(B, a1, b1);

  // Axes.
  out.push(`<line class="ink" x1="${OX}" y1="${OY}" x2="${OX + XW + 14}" y2="${OY}" marker-end="url(#arrow)"/>`);
  out.push(`<line class="ink" x1="${OX}" y1="${OY}" x2="${OX}" y2="${OY - YH - 12}" marker-end="url(#arrow)"/>`);

  // The fee stays in the pool, so the trade ends a little above the old curve.
  // The new curve is drawn only once that gap can be seen.
  const lift = ((b1 - r.k / a1) / bMax) * YH;
  const top = bMax * 0.97;
  if (lift >= 2) out.push(`<path class="metal" d="${hyperbola(r.after.k, main, r.after.k / top, aMax, 128)}"/>`);

  if (!detail) out.push(under(main));
  out.push(`<path class="ink" d="${hyperbola(r.k, main, r.k / top, aMax, 128)}"/>`);
  out.push(over(main, !detail, detail ? 2.2 : 3.2));

  const n = main(r.k / (bMax * 0.86), bMax * 0.86);
  out.push(text(n.x + 10, n.y + 4, 'x · y = k', 'start', 'note', 15));

  if (!detail) return out.join('');

  // The detail: the same sheet enlarged about the midpoint of the trade.
  const M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const sep = Math.hypot(B.x - A.x, B.y - A.y);
  const ring = Math.max(9, sep / 2 + 6);
  if (!moved) {
    out.push(`<circle class="ink-fine" cx="${r1(M.x)}" cy="${r1(M.y)}" r="${r1(ring)}" style="stroke:var(--line-2)"/>`);
    out.push(text(OX + XW + 14, DETAIL.y + 14, 'the trade is too small to draw', 'end'));
    return out.join('');
  }
  const zoom = 60 / Math.max(Math.abs(B.x - A.x), Math.abs(B.y - A.y));
  const cx = DETAIL.x + 48;
  const cy = DETAIL.y + 74;
  const inset: Frame = (a, b) => {
    const p = main(a, b);
    return { x: cx + (p.x - M.x) * zoom, y: cy + (p.y - M.y) * zoom };
  };
  // Reserve A at the left and right edges of the detail.
  const edge = (x: number) => ((M.x + (x - cx) / zoom - OX) / XW) * aMax;
  const lo = Math.max(edge(DETAIL.x), aMax * 1e-6);
  const hi = edge(DETAIL.x + DETAIL.w);
  const corner = { x: DETAIL.x, y: DETAIL.y + DETAIL.h };
  const reachTo = Math.hypot(corner.x - M.x, corner.y - M.y);
  const box = `x="${DETAIL.x}" y="${DETAIL.y}" width="${DETAIL.w}" height="${DETAIL.h}"`;

  out.push(`<circle class="ink-fine" cx="${r1(M.x)}" cy="${r1(M.y)}" r="${r1(ring)}" style="stroke:var(--line-2)"/>`);
  if (reachTo > ring + 4) {
    const ux = (corner.x - M.x) / reachTo;
    const uy = (corner.y - M.y) / reachTo;
    out.push(`<line class="metal" x1="${r1(M.x + ux * ring)}" y1="${r1(M.y + uy * ring)}" x2="${corner.x}" y2="${corner.y}"/>`);
  }
  out.push(`<defs><clipPath id="po-detail-clip"><rect ${box}/></clipPath></defs>`);
  out.push(`<rect class="detail" ${box}/>`);
  out.push(`<g clip-path="url(#po-detail-clip)">`);
  if (lift * zoom >= 2) out.push(`<path class="metal" d="${hyperbola(r.after.k, inset, lo, hi, 48)}"/>`);
  out.push(under(inset));
  out.push(`<path class="ink" d="${hyperbola(r.k, inset, lo, hi, 48)}"/>`);
  out.push(`</g>`);
  out.push(over(inset, true, 3.2));
  out.push(text(DETAIL.x + 8, DETAIL.y + 17, `detail ×${zoom < 10 ? r1(zoom) : short(zoom, 3)}`, 'start', 'lbl', 12));

  return out.join('');
}

/* ------------------------------------------------------------------ */
/* Drawing: impermanent loss against the price change of token A       */

export const LOSS_VIEW = { w: 440, h: 216 };

const LL = 58; // plot left
const LR = 424; // plot right
const LT = 40; // no loss
const LB = 172; // floor of the plot
const LOSS_FLOOR = -0.45;
const RATIO_MIN = 1 + POOL_FIELDS.move.min / 100;
const RATIO_MAX = 1 + POOL_FIELDS.move.max / 100;

// The price axis is logarithmic: a halving and a doubling sit the same distance from no change.
const lossX = (ratio: number) => LL + (Math.log(ratio / RATIO_MIN) / Math.log(RATIO_MAX / RATIO_MIN)) * (LR - LL);
const lossY = (loss: number) => LT + (loss / LOSS_FLOOR) * (LB - LT);

/** The loss curve between two price ratios, sampled evenly in log space. */
function lossCurve(from: number, to: number, n: number): string {
  const pts: Pt[] = [];
  for (let s = 0; s <= n; s++) {
    const ratio = from * Math.pow(to / from, s / n);
    pts.push({ x: lossX(ratio), y: lossY(lossAt(ratio)) });
  }
  return trace(pts);
}

/** Plain-language description of the second drawing, for the SVG <desc>. */
export function describeLoss(r: PoolResult): string {
  const lp = r.lp;
  const span = `from ${moveText(POOL_FIELDS.move.min)} to ${moveText(POOL_FIELDS.move.max)}`;
  return `Impermanent loss against the price change of token A, ${span} on a logarithmic scale. At ${moveText(r.inputs.move)} the loss is ${pct(lp.loss)}, ${usd(lp.lossUsd)} on a deposit of ${usd(lp.deposit)}. The loss reaches ${pct(Math.abs(LOSS_MARK), 0)} at ${pct(lp.mark.down, 1)} and ${pct(lp.mark.up, 1, true)}.`;
}

/** Inner SVG markup for the second drawing. */
export function lossDrawing(r: PoolResult): string {
  const lp = r.lp;
  const out: string[] = [];

  // Axis lettering.
  out.push(text(12, 18, 'loss against holding'));
  out.push(text(LR, LB + 36, 'price change of token A, log scale', 'end'));

  // Loss scale.
  out.push(`<line class="ink-fine" x1="${LL}" y1="${LT}" x2="${LL}" y2="${LB}"/>`);
  for (let v = 0; v >= -0.4 - 1e-9; v -= 0.1) {
    const y = r1(lossY(v));
    out.push(`<line class="ink-fine" x1="${LL - 5}" y1="${y}" x2="${LL}" y2="${y}"/>`);
    out.push(text(LL - 8, y + 4, pct(v, 0), 'end'));
  }

  // Price scale. The +200% tick is left bare so its neighbours stay legible.
  out.push(`<line class="ink-fine" x1="${LL}" y1="${LT}" x2="${LR}" y2="${LT}"/>`);
  out.push(`<line class="ink-fine" x1="${LL}" y1="${LB}" x2="${LR}" y2="${LB}"/>`);
  const ticks: [number, boolean][] = [
    [-90, true],
    [-75, true],
    [-50, true],
    [0, true],
    [100, true],
    [200, false],
    [400, true],
  ];
  for (const [m, lettered] of ticks) {
    const x = r1(lossX(1 + m / 100));
    out.push(`<line class="ink-fine" x1="${x}" y1="${LB}" x2="${x}" y2="${LB + 5}"/>`);
    if (lettered) out.push(m === POOL_FIELDS.move.max ? text(LR + 2, LB + 18, moveText(m), 'end') : text(x, LB + 18, moveText(m), 'middle'));
  }

  // The marked loss: a chord across the curve at −5%.
  const my = lossY(LOSS_MARK);
  const mx0 = lossX(1 + lp.mark.down);
  const mx1 = lossX(1 + lp.mark.up);
  out.push(`<line class="metal" x1="${r1(mx0)}" y1="${r1(my)}" x2="${r1(mx1)}" y2="${r1(my)}"/>`);
  out.push(`<circle class="ink-fill" cx="${r1(mx0)}" cy="${r1(my)}" r="1.6"/>`);
  out.push(`<circle class="ink-fill" cx="${r1(mx1)}" cy="${r1(my)}" r="1.6"/>`);
  out.push(text(mx1 + 12, my - 3, `loss of ${pct(Math.abs(LOSS_MARK), 0)}`));

  // The curve, and in gold the stretch from no change to the move set on the scale.
  const x = lossX(lp.ratio);
  const y = lossY(lp.loss);
  if (lp.ratio !== 1) out.push(`<path class="gold-line" d="${lossCurve(1, lp.ratio, 32)}"/>`);
  out.push(`<path class="ink" d="${lossCurve(RATIO_MIN, RATIO_MAX, 96)}"/>`);
  out.push(`<line class="metal" x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x)}" y2="${LB}"/>`);
  out.push(`<circle class="gold-dot" cx="${r1(x)}" cy="${r1(y)}" r="3.4"/>`);

  // The reading sits inside the arch, below the chord, on the side away from the curve.
  // Near the floor it cannot drop below the point, so it steps further in to clear the curve.
  const floor = LB - 5;
  const ly = Math.min(Math.max(y + 14, my + 17), floor);
  const lx = y + 14 > floor ? 18 : 10;
  out.push(lp.ratio < 1 ? text(x + lx, ly, pct(lp.loss), 'start', 'lbl is-strong') : text(x - lx, ly, pct(lp.loss), 'end', 'lbl is-strong'));

  return out.join('');
}
