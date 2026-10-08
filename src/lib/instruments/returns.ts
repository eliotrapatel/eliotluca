// Returns: a deliberately bare leveraged buyout. Pure functions shared by the
// server render (default state) and the client (live recompute).
// No fees, no interest, no taxes, no interim dividends.

export type ReturnsKey = 'ebitda' | 'entryMultiple' | 'leverage' | 'growth' | 'exitMultiple' | 'years' | 'cash';

export type ReturnsInputs = Record<ReturnsKey, number>;

export interface Limit {
  min: number;
  max: number;
  step: number;
  /** Short key used in the query string. */
  q: string;
}

export const RETURNS_DEFAULTS: ReturnsInputs = {
  ebitda: 10,
  entryMultiple: 8,
  leverage: 4,
  growth: 8,
  exitMultiple: 9,
  years: 5,
  cash: 35,
};

export const RETURNS_LIMITS: Record<ReturnsKey, Limit> = {
  ebitda: { min: 0.1, max: 100000, step: 0.1, q: 'ebitda' },
  entryMultiple: { min: 4, max: 16, step: 0.1, q: 'entry' },
  leverage: { min: 0, max: 7, step: 0.1, q: 'lev' },
  growth: { min: -10, max: 30, step: 0.5, q: 'growth' },
  exitMultiple: { min: 4, max: 16, step: 0.1, q: 'exit' },
  years: { min: 1, max: 10, step: 1, q: 'years' },
  cash: { min: 0, max: 80, step: 1, q: 'cash' },
};

export interface FieldError {
  field: ReturnsKey;
  message: string;
}

export interface ReturnsYear {
  year: number;
  ebitda: number;
  repaid: number;
  netDebt: number;
}

export interface ReturnsResult {
  ok: true;
  inputs: ReturnsInputs;
  entryEV: number;
  entryNetDebt: number;
  entryEquity: number;
  exitEbitda: number;
  exitEV: number;
  /** Net debt at exit: gross debt minus accumulated cash. Negative means net cash. */
  exitNetDebt: number;
  exitDebt: number;
  exitCash: number;
  /** Paper equity at exit (EV minus net debt); can be negative. */
  exitEquity: number;
  /** True when exit value does not cover net debt: the equity is lost. */
  wipedOut: boolean;
  moic: number;
  irr: number;
  bridge: {
    growth: number;
    multiple: number;
    deleveraging: number;
    /** Sum of the three components. */
    sum: number;
    /** exitEquity - entryEquity, which `sum` must equal. */
    change: number;
  };
  schedule: ReturnsYear[];
}

export interface ReturnsFailure {
  ok: false;
  inputs: ReturnsInputs;
  errors: FieldError[];
}

export type ReturnsOutcome = ReturnsResult | ReturnsFailure;

const LABELS: Record<ReturnsKey, string> = {
  ebitda: 'Entry EBITDA',
  entryMultiple: 'Entry multiple',
  leverage: 'Leverage',
  growth: 'EBITDA growth',
  exitMultiple: 'Exit multiple',
  years: 'Holding period',
  cash: 'Cash conversion',
};

export function validateReturns(i: ReturnsInputs): FieldError[] {
  const errors: FieldError[] = [];
  const L = RETURNS_LIMITS;
  if (!Number.isFinite(i.ebitda) || i.ebitda <= 0) {
    errors.push({ field: 'ebitda', message: 'Entry EBITDA must be a number above zero, in € millions. Enter a positive figure such as 10.' });
  } else if (i.ebitda > L.ebitda.max) {
    errors.push({ field: 'ebitda', message: `Entry EBITDA is capped at €${fmt0.format(L.ebitda.max)}m here. Enter a smaller figure.` });
  }
  for (const k of ['entryMultiple', 'leverage', 'growth', 'exitMultiple', 'years', 'cash'] as ReturnsKey[]) {
    const v = i[k];
    if (!Number.isFinite(v) || v < L[k].min || v > L[k].max) {
      errors.push({ field: k, message: `${LABELS[k]} must sit between ${L[k].min} and ${L[k].max}. Move the scale back inside that range.` });
    } else if (k === 'years' && !Number.isInteger(v)) {
      // The schedule runs in whole years; a fraction would be rounded silently.
      errors.push({ field: k, message: `${LABELS[k]} is counted in whole years. Enter a whole number from ${L[k].min} to ${L[k].max}.` });
    }
  }
  if (k_ok(errors, 'entryMultiple') && k_ok(errors, 'leverage') && i.leverage >= i.entryMultiple) {
    errors.push({
      field: 'leverage',
      message: `Net debt of ${fmt1.format(i.leverage)}× EBITDA meets or exceeds the ${fmt1.format(i.entryMultiple)}× price, so the equity cheque would be zero or negative. Bring leverage below ${fmt1.format(i.entryMultiple)}× or raise the entry multiple.`,
    });
  }
  return errors;
}

function k_ok(errors: FieldError[], k: ReturnsKey) {
  return !errors.some((e) => e.field === k);
}

export function computeReturns(inputs: ReturnsInputs): ReturnsOutcome {
  const errors = validateReturns(inputs);
  if (errors.length) return { ok: false, inputs, errors };

  const { ebitda: e0, entryMultiple: m0, leverage, exitMultiple: m1 } = inputs;
  const g = inputs.growth / 100;
  const c = inputs.cash / 100;
  const n = Math.round(inputs.years);

  const entryEV = e0 * m0;
  const entryNetDebt = e0 * leverage;
  const entryEquity = entryEV - entryNetDebt;

  // Each year, a share c of that year's EBITDA repays debt. Once gross debt is
  // gone the surplus piles up as cash, so net debt keeps falling below zero.
  const schedule: ReturnsYear[] = [];
  let netDebt = entryNetDebt;
  let ebitda = e0;
  for (let t = 1; t <= n; t++) {
    ebitda = e0 * Math.pow(1 + g, t);
    const repaid = c * ebitda;
    netDebt -= repaid;
    schedule.push({ year: t, ebitda, repaid, netDebt });
  }

  const exitEbitda = ebitda;
  const exitEV = exitEbitda * m1;
  const exitNetDebt = netDebt;
  const exitDebt = Math.max(0, exitNetDebt);
  const exitCash = Math.max(0, -exitNetDebt);
  const exitEquity = exitEV - exitNetDebt;
  const wipedOut = exitEquity <= 0;
  const moic = wipedOut ? 0 : exitEquity / entryEquity;
  const irr = wipedOut ? -1 : Math.pow(moic, 1 / n) - 1;

  const growth = (exitEbitda - e0) * m0;
  const multiple = (m1 - m0) * exitEbitda;
  const deleveraging = entryNetDebt - exitNetDebt;

  return {
    ok: true,
    inputs,
    entryEV,
    entryNetDebt,
    entryEquity,
    exitEbitda,
    exitEV,
    exitNetDebt,
    exitDebt,
    exitCash,
    exitEquity,
    wipedOut,
    moic,
    irr,
    bridge: { growth, multiple, deleveraging, sum: growth + multiple + deleveraging, change: exitEquity - entryEquity },
    schedule,
  };
}

/* ------------------------------------------------------------------
   Query string
------------------------------------------------------------------- */

export function returnsFromQuery(search: string): ReturnsInputs {
  const p = new URLSearchParams(search);
  const out = { ...RETURNS_DEFAULTS };
  for (const k of Object.keys(RETURNS_LIMITS) as ReturnsKey[]) {
    const raw = p.get(RETURNS_LIMITS[k].q);
    if (raw === null || raw.trim() === '') continue;
    const v = Number(raw);
    if (Number.isFinite(v)) out[k] = v;
  }
  return out;
}

export function returnsToQuery(i: ReturnsInputs): string {
  const p = new URLSearchParams();
  for (const k of Object.keys(RETURNS_LIMITS) as ReturnsKey[]) {
    if (Number.isFinite(i[k]) && i[k] !== RETURNS_DEFAULTS[k]) p.set(RETURNS_LIMITS[k].q, String(i[k]));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

/* ------------------------------------------------------------------
   Formatting (en-GB, tabular figures are set in CSS)
------------------------------------------------------------------- */

const fmt0 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const fmt1 = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt2 = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct1 = new Intl.NumberFormat('en-GB', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });

const MINUS = '−';
const typeset = (s: string) => s.replace(/-/g, MINUS);

/** 40.0 */
export const num1 = (x: number) => typeset(fmt1.format(x)).replace(/^−(0\.0)$/, '$1');
/** €40.0m. A figure that rounds to zero carries no minus sign. */
export const money = (x: number) => {
  const s = fmt1.format(Math.abs(x));
  return (x < 0 && s !== fmt1.format(0) ? MINUS : '') + '€' + s + 'm';
};
/** +37.5 or −3.2 */
export const signed1 = (x: number) => {
  const r = Math.round(x * 10) / 10;
  if (r === 0) return fmt1.format(0);
  return (r > 0 ? '+' : MINUS) + fmt1.format(Math.abs(r));
};
/** 2.86× */
export const times = (x: number) => fmt2.format(x) + '×';
/** 8.0× */
export const times1 = (x: number) => fmt1.format(x) + '×';
/** 23.4% (input is a ratio) */
export const pct = (x: number) => typeset(fmtPct1.format(x));

export function scaleText(k: ReturnsKey, v: number): string {
  switch (k) {
    case 'entryMultiple':
    case 'exitMultiple':
    case 'leverage':
      return times1(v);
    case 'growth':
      return (v > 0 ? '+' : '') + typeset(fmt1.format(v)) + '%';
    case 'cash':
      return fmt0.format(v) + '%';
    case 'years':
      return v === 1 ? '1 year' : `${fmt0.format(v)} years`;
    default:
      return num1(v);
  }
}

/** Spoken value for range inputs (aria-valuetext). */
export function scaleSpoken(k: ReturnsKey, v: number): string {
  switch (k) {
    case 'entryMultiple':
    case 'exitMultiple':
      return `${fmt1.format(v)} times EBITDA`;
    case 'leverage':
      return `net debt ${fmt1.format(v)} times EBITDA`;
    case 'growth':
      return `${typeset(fmt1.format(v))} per cent a year`;
    case 'cash':
      return `${fmt0.format(v)} per cent of EBITDA`;
    case 'years':
      return v === 1 ? '1 year' : `${fmt0.format(v)} years`;
    default:
      return String(v);
  }
}

/** A figure in whole tenths, rounded by the same Intl rules as the printed figure, never −0. */
const fmtRaw1 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
const tenths = (x: number) => {
  const t = Math.round(Number(fmtRaw1.format(x)) * 10);
  return t === 0 ? 0 : t;
};

/**
 * The bridge as lettered, in € millions to one decimal. Entry and exit equity
 * are rounded as everywhere else; the three components are then rounded by
 * largest remainder so that, as printed, they add up exactly to exit equity
 * less entry equity. Each component moves by less than €0.1m.
 */
export function bridgeLettering(r: ReturnsResult) {
  const entry = tenths(r.entryEquity);
  const exit = tenths(r.exitEquity);
  const change = exit - entry;
  const raw = [r.bridge.growth, r.bridge.multiple, r.bridge.deleveraging].map((x) => x * 10);
  const units = raw.map((v) => Math.floor(v));
  let missing = change - units.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ i, rem: v - units[i] }));
  // Give missing tenths to the largest remainders; take surplus ones from the smallest.
  order.sort((a, b) => b.rem - a.rem);
  for (let j = 0; missing > 0; j = (j + 1) % 3, missing--) units[order[j].i]++;
  order.sort((a, b) => a.rem - b.rem);
  for (let j = 0; missing < 0; j = (j + 1) % 3, missing++) units[order[j].i]--;
  const u = units.map((v) => (v === 0 ? 0 : v / 10));
  return { entry: entry / 10, exit: exit / 10, growth: u[0], multiple: u[1], deleveraging: u[2], change: change / 10 };
}

/** One plain sentence describing the bridge, for captions and screen readers. */
export function bridgeSentence(r: ReturnsResult): string {
  const b = r.bridge;
  const shown = bridgeLettering(r);
  const part = (label: string, v: number) => {
    if (v === 0) return `${label} adds nothing`;
    return `${label} ${v > 0 ? 'adds' : 'takes away'} ${money(Math.abs(v))}`;
  };
  const verb = b.change >= 0 ? 'grows' : 'falls';
  const lost = r.wipedOut ? ' Exit value no longer covers net debt, so the equity is lost.' : '';
  return `Equity ${verb} from ${money(r.entryEquity)} to ${money(r.exitEquity)}: ${part('EBITDA growth', shown.growth)}, ${part(
    b.multiple < 0 ? 'multiple contraction' : 'multiple expansion',
    shown.multiple,
  )}, ${part('debt paydown', shown.deleveraging)}.${lost}`;
}

/* ------------------------------------------------------------------
   Drawing: the equity value bridge, as SVG markup for a <g>.
   `w` is the drawing width in user units; the client passes the
   rendered width so lettering stays at true size on every screen.
------------------------------------------------------------------- */

export const BRIDGE_H = 392;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function bridgeSvg(r: ReturnsResult, w = 640): string {
  const H = BRIDGE_H;
  const fs = w < 420 ? 11.5 : 13;
  const left = w < 420 ? 8 : 14;
  const dimSpace = w < 420 ? 64 : 78;
  const right = w - dimSpace;
  const top = 46;
  const base = 300;

  const b = r.bridge;
  const shown = bridgeLettering(r);
  const steps = [
    { label: ['Entry', 'equity'], kind: 'total' as const, from: 0, to: r.entryEquity, shown: shown.entry },
    { label: ['EBITDA', 'growth'], kind: 'step' as const, from: r.entryEquity, to: r.entryEquity + b.growth, shown: shown.growth },
    {
      label: ['Multiple', b.multiple < 0 ? 'contraction' : 'expansion'],
      kind: 'step' as const,
      from: r.entryEquity + b.growth,
      to: r.entryEquity + b.growth + b.multiple,
      shown: shown.multiple,
    },
    {
      label: ['Debt', 'paydown'],
      kind: 'step' as const,
      from: r.entryEquity + b.growth + b.multiple,
      to: r.entryEquity + b.sum,
      shown: shown.deleveraging,
    },
    { label: ['Exit', 'equity'], kind: 'total' as const, from: 0, to: r.exitEquity, shown: shown.exit },
  ];

  const levels = steps.flatMap((s) => [s.from, s.to]);
  const lo = Math.min(0, ...levels);
  const hi = Math.max(0, ...levels);
  const span = hi - lo || 1;
  // Leave room for lettering under a bar that reaches the foot of the drawing.
  const bottom = lo < 0 ? base - 24 : base;
  const y = (v: number) => bottom - ((v - lo) / span) * (bottom - top);
  const y0 = y(0);

  const col = (right - left) / steps.length;
  const bw = Math.min(64, col * 0.56);
  const cx = (i: number) => left + col * (i + 0.5);

  const out: string[] = [];
  const t = (x: number, yy: number, s: string, cls = 'dim', anchor = 'middle', extra = '', size = fs) =>
    `<text class="${cls}" x="${x.toFixed(1)}" y="${yy.toFixed(1)}" text-anchor="${anchor}" font-size="${size}"${extra}>${esc(s)}</text>`;

  // Unit and datum
  out.push(t(left, 16, 'Equity value, € millions', 'note', 'start', '', fs + 3));
  out.push(`<line class="ink-fine" x1="${left}" y1="${y0.toFixed(1)}" x2="${(right + 14).toFixed(1)}" y2="${y0.toFixed(1)}" />`);
  out.push(t(right + 18, y0 + 4, '0', 'dim', 'start'));

  // Entry datum: a dashed metalpoint line at the entry equity level, carried
  // to the dimension line on the right.
  const yEntry = y(r.entryEquity);
  const yExit = y(r.exitEquity);
  out.push(`<line class="metal" x1="${(cx(0) + bw / 2).toFixed(1)}" y1="${yEntry.toFixed(1)}" x2="${(right + 30).toFixed(1)}" y2="${yEntry.toFixed(1)}" />`);
  out.push(`<line class="metal" x1="${(cx(4) + bw / 2).toFixed(1)}" y1="${yExit.toFixed(1)}" x2="${(right + 30).toFixed(1)}" y2="${yExit.toFixed(1)}" />`);

  steps.forEach((s, i) => {
    const x = cx(i) - bw / 2;
    const a = y(s.from);
    const z = y(s.to);
    const yt = Math.min(a, z);
    const h = Math.abs(a - z);
    const delta = s.to - s.from;
    const neg = delta < 0;

    if (h < 0.75) {
      out.push(`<line class="ink" x1="${x.toFixed(1)}" y1="${a.toFixed(1)}" x2="${(x + bw).toFixed(1)}" y2="${a.toFixed(1)}" />`);
    } else {
      const box = `x="${x.toFixed(1)}" y="${yt.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}"`;
      if (s.kind === 'total') {
        // Equity held: ink hatching under an ink outline.
        out.push(`<rect ${box} fill="url(#hatch-ink)" stroke="none" />`, `<rect class="ink" ${box} />`);
      } else if (!neg) {
        // Value added: lead-white heightening.
        out.push(`<rect class="hatch" ${box} />`, `<rect class="ink" ${box} />`);
      } else {
        // Value lost hangs below the running line, outlined and broken.
        out.push(`<rect class="ink" ${box} stroke-dasharray="4 2.5" />`);
      }
    }

    // Value lettering: above a rise, below a fall.
    const value = s.kind === 'total' ? num1(s.shown) : signed1(s.shown);
    const below = s.kind === 'total' ? s.to < 0 : neg;
    const ly = below ? Math.max(a, z) + fs + 4 : yt - 7;
    out.push(t(cx(i), ly, value, 'dim', 'middle', ` font-weight="550"`));

    // Running connector to the next column, at the level this column ends on.
    if (i < steps.length - 1) {
      const ly2 = y(s.to).toFixed(1);
      out.push(`<line class="metal" x1="${(x + bw).toFixed(1)}" y1="${ly2}" x2="${(cx(i + 1) - bw / 2).toFixed(1)}" y2="${ly2}" />`);
    }

    // Column lettering under the drawing.
    out.push(t(cx(i), base + 30, s.label[0], 'dim'));
    out.push(t(cx(i), base + 30 + fs + 3, s.label[1], 'dim'));
    out.push(`<line class="ink-fine" x1="${cx(i).toFixed(1)}" y1="${(base + 12).toFixed(1)}" x2="${cx(i).toFixed(1)}" y2="${(base + 17).toFixed(1)}" />`);
  });

  // Dimension line: entry equity to exit equity, lettered with the multiple.
  const dx = right + 24;
  if (!r.wipedOut) {
    const gap = Math.abs(yExit - yEntry);
    if (gap > 18) {
      out.push(`<line class="ink-fine" x1="${dx}" y1="${yEntry.toFixed(1)}" x2="${dx}" y2="${yExit.toFixed(1)}" marker-start="url(#arrow)" marker-end="url(#arrow)" />`);
    }
    const my = (yEntry + yExit) / 2;
    out.push(t(dx + 6, my - 2, times(r.moic), 'dim', 'start', ` font-weight="600"`));
    out.push(t(dx + 6, my + fs + 1, 'MOIC', 'dim', 'start'));
  } else {
    out.push(t(dx + 6, yExit + 4, 'lost', 'note', 'start'));
  }

  // The check, lettered like a margin calculation.
  // Lettered from the rounded figures, so the arithmetic on the page closes to the tenth.
  const check = `${signed1(shown.growth)} ${signed1(shown.multiple)} ${signed1(shown.deleveraging)} = ${signed1(shown.change)} = ${num1(shown.exit)} ${MINUS} ${num1(shown.entry)}`;
  out.push(t(left, H - 8, `Check: ${check}`, 'dim', 'start'));

  return out.join('');
}
