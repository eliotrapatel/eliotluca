// Copilot economics: what an AI copilot costs per paying user per month, and
// the gross margin left on the subscription. Pure functions shared by the
// server render (default state) and the client (live recompute).
// Deliberately ignored: cache-write surcharges, failed or retried requests,
// tool calls, rate-limit tiers, volume discounts, taxes, payment fees, support.

export type CopilotKey =
  | 'users'
  | 'price'
  | 'requests'
  | 'days'
  | 'inputTokens'
  | 'outputTokens'
  | 'cacheShare'
  | 'priceIn'
  | 'priceOut'
  | 'cachedRate'
  | 'infra';

export type CopilotInputs = Record<CopilotKey, number>;

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

/** Illustrative defaults: a small team plan on a mid-priced model. */
export const COPILOT_DEFAULTS: CopilotInputs = {
  users: 250,
  price: 29,
  requests: 10,
  days: 30,
  inputTokens: 6000,
  outputTokens: 700,
  cacheShare: 60,
  priceIn: 3,
  priceOut: 15,
  cachedRate: 10,
  infra: 10,
};

export const COPILOT_FIELDS: Record<CopilotKey, FieldSpec> = {
  users: { q: 'u', min: 1, max: 10_000_000, integer: true, noun: 'the number of paying users', example: '250' },
  price: { q: 'p', min: 0.01, max: 100_000, noun: 'the price per user', example: '29' },
  requests: { q: 'r', min: 0, max: 100_000, noun: 'requests per user per day', example: '10' },
  days: { q: 'd', min: 0, max: 31, noun: 'days of use per month', example: '22' },
  inputTokens: { q: 'ti', min: 0, max: 10_000_000, integer: true, noun: 'input tokens per request', example: '6000' },
  outputTokens: { q: 'to', min: 0, max: 1_000_000, integer: true, noun: 'output tokens per request', example: '700' },
  cacheShare: { q: 'c', min: 0, max: 95, noun: 'the cached share', example: '60' },
  priceIn: { q: 'pi', min: 0, max: 10_000, noun: 'the input price per million tokens', example: '3' },
  priceOut: { q: 'po', min: 0, max: 10_000, noun: 'the output price per million tokens', example: '15' },
  cachedRate: { q: 'k', min: 0, max: 100, noun: 'the cached input rate', example: '10' },
  infra: { q: 'f', min: 0, max: 100_000_000, noun: 'fixed infrastructure', example: '10' },
};

export const COPILOT_KEYS = Object.keys(COPILOT_DEFAULTS) as CopilotKey[];

/** Illustrative tiers: they set only the two token prices (US$ per million tokens). */
export const TIERS = {
  large: { label: 'Large', priceIn: 15, priceOut: 75 },
  medium: { label: 'Medium', priceIn: 3, priceOut: 15 },
  small: { label: 'Small', priceIn: 1, priceOut: 5 },
} as const;
export type TierId = keyof typeof TIERS;

export function tierFor(priceIn: number, priceOut: number): TierId | null {
  for (const id of Object.keys(TIERS) as TierId[]) {
    if (TIERS[id].priceIn === priceIn && TIERS[id].priceOut === priceOut) return id;
  }
  return null;
}

/** Parse a typed number. Accepts "6000", "6,000", "6 000", "2.5" and "2,5". */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().replace(/[\s_  ]/g, '').replace(/^\$|^US\$/i, '').replace(/%$/, '');
  if (s === '') return null;
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const plain = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });

/** Validate one raw field value; returns the number or an error naming the problem and the fix. */
export function validateField(key: CopilotKey, raw: string): { value: number } | { error: string } {
  const f = COPILOT_FIELDS[key];
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

export interface CopilotResult {
  inputs: CopilotInputs;
  requestsPerUser: number;
  /** Model cost of one request, split by token kind (US$). */
  perRequest: { input: number; cached: number; output: number; total: number };
  /** One paying user over one month (US$). Infrastructure is the fixed cost shared across users. */
  perUser: { input: number; cached: number; output: number; model: number; infra: number; total: number };
  revenue: number;
  modelMonth: number;
  grossProfit: number;
  /** Fraction of revenue; negative when costs exceed revenue. */
  margin: number;
  breakEven: number;
}

export function compute(i: CopilotInputs): CopilotResult {
  const cache = i.cacheShare / 100;
  const M = 1_000_000;
  const input = (i.inputTokens * (1 - cache) * i.priceIn) / M;
  const cached = (i.inputTokens * cache * i.priceIn * (i.cachedRate / 100)) / M;
  const output = (i.outputTokens * i.priceOut) / M;
  const perReq = input + cached + output;
  const n = i.requests * i.days;
  const model = perReq * n;
  const infraPerUser = i.infra / i.users;
  const revenue = i.users * i.price;
  const modelMonth = model * i.users;
  const grossProfit = revenue - modelMonth - i.infra;
  return {
    inputs: i,
    requestsPerUser: n,
    perRequest: { input, cached, output, total: perReq },
    perUser: { input: input * n, cached: cached * n, output: output * n, model, infra: infraPerUser, total: model + infraPerUser },
    revenue,
    modelMonth,
    grossProfit,
    margin: grossProfit / revenue,
    breakEven: model + infraPerUser,
  };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */

const MINUS = '−';

export function usd(v: number): string {
  const abs = Math.abs(v);
  const s = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: abs !== 0 && abs < 0.1 ? 4 : 2,
  }).format(v);
  return s.replace('-', MINUS);
}

/** Sums under a dollar to four decimals, so a cost per request stays legible. */
export function usdFine(v: number): string {
  if (Math.abs(v) >= 1) return usd(v);
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 })
    .format(v)
    .replace('-', MINUS);
}

/** Large sums without cents once they pass ten thousand. */
export function usdWhole(v: number): string {
  if (Math.abs(v) < 10_000) return usd(v);
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v).replace('-', MINUS);
}

export function pct(v: number): string {
  if (!Number.isFinite(v)) return MINUS;
  const s = new Intl.NumberFormat('en-GB', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);
  return s.replace('-', MINUS);
}

export function count(v: number): string {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(v);
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

export function figures(r: CopilotResult): Figure[] {
  const u = r.inputs.users;
  return [
    {
      id: 'margin',
      label: 'Gross margin',
      value: pct(r.margin),
      small: `after model and infrastructure: ${usdWhole(r.grossProfit)} a month on ${usdWhole(r.revenue)} of subscriptions`,
      key: true,
    },
    {
      id: 'model',
      label: 'Model cost per month',
      value: usdWhole(r.modelMonth),
      small: `${count(u)} ${u === 1 ? 'user' : 'users'}, ${count(r.requestsPerUser * u)} requests`,
    },
    {
      id: 'user',
      label: 'Cost per user per month',
      value: usd(r.perUser.total),
      small: `model ${usd(r.perUser.model)}, infrastructure ${usd(r.perUser.infra)}`,
    },
    {
      id: 'request',
      label: 'Cost per request',
      value: usdFine(r.perRequest.total),
      small: 'model only',
    },
    {
      id: 'breakeven',
      label: 'Break-even price per user',
      value: usd(r.breakEven),
      small: 'where the margin reaches zero',
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Drawing: one user's month as a single column                        */

export const VIEW = { w: 440, h: 420 };

const X0 = 132; // column left
const CW = 72; // column width
const BASE = 372; // ground line
const TOP = 72; // highest tick
const LABEL_X = 236;
const VALUE_X = 434;

function niceStep(max: number): number {
  const raw = max / 5;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  const k = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
  return k * p;
}

const r1 = (v: number) => Math.round(v * 10) / 10;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function tick(v: number): string {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: v < 1 ? 2 : v < 10 ? 1 : 0 }).format(v);
}

/** Plain-language description of the drawing, for the SVG <desc>. */
export function describe(r: CopilotResult): string {
  const p = r.inputs.price;
  const c = r.perUser.total;
  const head = `One paying user over one month. Price ${usd(p)}. Costs ${usd(c)}: input ${usd(r.perUser.input)}, cached input ${usd(r.perUser.cached)}, output ${usd(r.perUser.output)}, infrastructure ${usd(r.perUser.infra)}.`;
  return c > p ? `${head} Costs exceed the price by ${usd(c - p)}.` : `${head} Margin ${usd(p - c)}.`;
}

/** Inner SVG markup for the readout drawing. Pure, so the server and the client draw the same thing. */
export function drawing(r: CopilotResult): string {
  const price = r.inputs.price;
  const total = r.perUser.total;
  const over = total > price;
  const vmax = Math.max(price, total);
  const step = niceStep(vmax);
  const top = Math.ceil(vmax / step - 1e-9) * step;
  const y = (v: number) => BASE - (v / top) * (BASE - TOP);
  const out: string[] = [];

  // Heading annotation.
  out.push(`<text class="note" x="24" y="30" font-size="17">One paying user, one month</text>`);
  if (over) {
    out.push(
      `<text class="note" x="24" y="52" font-size="14.5">Costs exceed the price by ${esc(usd(total - price))} a user.</text>`,
    );
  } else {
    out.push(`<text class="dim" x="24" y="52" font-size="13">US$ per user per month, drawn to scale</text>`);
  }

  // Ruler.
  const RX = 100;
  out.push(`<line class="ink-fine" x1="${RX}" y1="${BASE}" x2="${RX}" y2="${r1(y(top))}"/>`);
  for (let v = 0; v <= top + step / 1000; v += step) {
    const ty = r1(y(v));
    out.push(`<line class="ink-fine" x1="${RX - 7}" y1="${ty}" x2="${RX}" y2="${ty}"/>`);
    out.push(`<text class="dim" x="${RX - 11}" y="${r1(ty + 4)}" font-size="12.5" text-anchor="end">${tick(v)}</text>`);
    // half ticks
    const hv = v + step / 2;
    if (hv < top) {
      const hy = r1(y(hv));
      out.push(`<line class="ink-fine" x1="${RX - 4}" y1="${hy}" x2="${RX}" y2="${hy}"/>`);
    }
  }

  // Segments, bottom up.
  type Seg = { name: string; v: number; fill: string };
  const segs: Seg[] = [
    { name: 'Input', v: r.perUser.input, fill: 'url(#ce-hatch-in)' },
    { name: 'Cached input', v: r.perUser.cached, fill: 'url(#ce-stipple)' },
    { name: 'Output', v: r.perUser.output, fill: 'url(#ce-cross)' },
    { name: 'Infrastructure', v: r.perUser.infra, fill: 'url(#ce-rule)' },
  ];
  if (!over) segs.push({ name: 'Margin', v: price - total, fill: 'url(#hatch)' });

  type Lab = { name: string; value: string; anchor: number; y: number; strong?: boolean; from?: number };
  const labels: Lab[] = [];
  let acc = 0;
  for (const s of segs) {
    if (s.v <= 0) continue;
    const y0 = y(acc);
    const y1 = y(acc + s.v);
    acc += s.v;
    const h = y0 - y1;
    out.push(
      `<rect x="${X0}" y="${r1(y1)}" width="${CW}" height="${Math.max(0.4, r1(h))}" style="fill:${s.fill};stroke:none"/>`,
    );
    out.push(`<line class="ink-fine" x1="${X0}" y1="${r1(y1)}" x2="${X0 + CW}" y2="${r1(y1)}"/>`);
    labels.push({
      name: s.name,
      value: s.name === 'Margin' ? `${usd(s.v)}, ${pct(s.v / price)}` : usd(s.v),
      anchor: (y0 + y1) / 2,
      y: (y0 + y1) / 2,
      strong: s.name === 'Margin',
    });
  }

  const colTop = y(over ? total : price);
  // Column outline, ground line and footing.
  out.push(`<rect class="ink" x="${X0}" y="${r1(colTop)}" width="${CW}" height="${r1(BASE - colTop)}"/>`);
  out.push(`<line class="ink" x1="${X0 - 22}" y1="${BASE}" x2="${X0 + CW + 22}" y2="${BASE}"/>`);
  out.push(`<rect x="${X0 - 22}" y="${BASE}" width="${CW + 44}" height="7" style="fill:url(#hatch-ink);stroke:none"/>`);

  // The price line, drawn across the column like a datum.
  const py = r1(y(price));
  out.push(`<line class="ink-bold" x1="${RX + 4}" y1="${py}" x2="${X0 + CW + 14}" y2="${py}"/>`);
  labels.push({ name: 'Price', value: usd(price), anchor: py, y: py, strong: true });

  if (over) {
    const oy = r1(y(total));
    out.push(
      `<rect class="metal" x="${X0 - 6}" y="${r1(oy - 6)}" width="${CW + 12}" height="${r1(py - oy + 6)}"/>`,
    );
    labels.push({ name: 'Over the price', value: usd(total - price), anchor: (oy + py) / 2, y: (oy + py) / 2, strong: true, from: X0 + CW + 6 });
  }

  // Label layout: keep the anchors' order and push labels apart.
  labels.sort((a, b) => a.anchor - b.anchor);
  const GAP = 21;
  for (let i = 1; i < labels.length; i++) {
    if (labels[i].y - labels[i - 1].y < GAP) labels[i].y = labels[i - 1].y + GAP;
  }
  const last = labels[labels.length - 1];
  if (last && last.y > BASE - 4) last.y = BASE - 4;
  for (let i = labels.length - 2; i >= 0; i--) {
    if (labels[i + 1].y - labels[i].y < GAP) labels[i].y = labels[i + 1].y - GAP;
  }

  for (const l of labels) {
    const ax = X0 + CW;
    const ly = r1(l.y);
    const ay = r1(l.anchor);
    const dot = l.from === undefined && l.name !== 'Price';
    if (dot) out.push(`<circle class="ink-fill" cx="${ax - 6}" cy="${ay}" r="1.6"/>`);
    const sx = l.from ?? (l.name === 'Price' ? X0 + CW + 14 : ax - 6);
    out.push(
      `<polyline class="ink-fine" points="${sx},${ay} ${ax + 16},${ay} ${LABEL_X - 10},${ly} ${LABEL_X - 4},${ly}"/>`,
    );
    out.push(
      `<text class="note" x="${LABEL_X}" y="${r1(ly + 4.5)}" font-size="${l.strong ? 16 : 15}">${esc(l.name)}</text>`,
    );
    out.push(
      `<text class="dim" x="${VALUE_X}" y="${r1(ly + 4.5)}" font-size="14" text-anchor="end" style="fill:var(--line)">${esc(l.value)}</text>`,
    );
  }

  return out.join('');
}
