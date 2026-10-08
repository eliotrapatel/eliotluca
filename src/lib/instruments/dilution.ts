// Dilution: founders' ownership across up to four priced rounds, with the
// option pool topped up in the pre-money (the "option pool shuffle").
// Pure functions shared by the server render and the client.

export type RoundId = 'preseed' | 'seed' | 'seriesA' | 'seriesB';
export type RoundField = 'pre' | 'raise' | 'pool';

export interface RoundDef {
  id: RoundId;
  name: string;
  /** Prefix used in the query string. */
  q: string;
}

export const ROUNDS: RoundDef[] = [
  { id: 'preseed', name: 'Pre-seed', q: 'ps' },
  { id: 'seed', name: 'Seed', q: 'seed' },
  { id: 'seriesA', name: 'Series A', q: 'a' },
  { id: 'seriesB', name: 'Series B', q: 'b' },
];

export interface RoundInput {
  on: boolean;
  /** Pre-money valuation, € millions. */
  pre: number;
  /** Amount raised, € millions. */
  raise: number;
  /** Target option pool, % of post-money. */
  pool: number;
}

export type DilutionInputs = Record<RoundId, RoundInput>;

export const DILUTION_DEFAULTS: DilutionInputs = {
  preseed: { on: false, pre: 3, raise: 0.6, pool: 5 },
  seed: { on: true, pre: 8, raise: 2, pool: 10 },
  seriesA: { on: true, pre: 30, raise: 8, pool: 12 },
  seriesB: { on: false, pre: 90, raise: 20, pool: 10 },
};

export const POOL_MAX = 30;
export const MONEY_MAX = 100000;

export interface DilutionError {
  round: RoundId;
  field: RoundField;
  message: string;
}

export interface Holdings {
  founders: number;
  pool: number;
  investors: Partial<Record<RoundId, number>>;
}

export interface Stage {
  round: RoundId;
  name: string;
  pre: number;
  raise: number;
  post: number;
  /** Pool target, as a fraction of post-money. */
  poolTarget: number;
  /** Pool created in this round, as a fraction of post-money (0 when the existing pool already covers the target). */
  poolTopUp: number;
  holdings: Holdings;
  /**
   * The same holdings rounded to a tenth of a per cent so that the printed
   * column adds up to exactly 100.0% (largest remainder). Use for lettering only.
   */
  shown: Holdings;
}

export interface DilutionResult {
  ok: true;
  stages: Stage[];
  founders: number;
  /** Founders' share after the last round, as printed in the ledger. */
  foundersShown: number;
  lastPost: number;
  founderValue: number;
}

export interface DilutionFailure {
  ok: false;
  errors: DilutionError[];
  /** True when the inputs are valid but every round is switched off. */
  empty: boolean;
}

export type DilutionOutcome = DilutionResult | DilutionFailure;

const fmt1 = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt0 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 });
const fmtPct = new Intl.NumberFormat('en-GB', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** 52.1% (input is a ratio) */
export const pct = (x: number) => fmtPct.format(x);
/** €38.0m */
export const money = (x: number) => '€' + fmt1.format(x) + 'm';
/** 12% or 12.5% (input is a percentage) */
export const poolText = (p: number) => fmt0.format(p) + '%';

export function validateDilution(i: DilutionInputs): DilutionError[] {
  const errors: DilutionError[] = [];
  for (const r of ROUNDS) {
    const x = i[r.id];
    if (!x.on) continue;
    let moneyOk = true;
    if (!Number.isFinite(x.pre) || x.pre <= 0) {
      errors.push({ round: r.id, field: 'pre', message: `The ${r.name} pre-money must be above zero. Enter a valuation in € millions, such as 8.` });
      moneyOk = false;
    } else if (x.pre > MONEY_MAX) {
      errors.push({ round: r.id, field: 'pre', message: `The ${r.name} pre-money is capped at €${fmt0.format(MONEY_MAX)}m here. Enter a smaller figure.` });
      moneyOk = false;
    }
    if (!Number.isFinite(x.raise) || x.raise <= 0) {
      errors.push({ round: r.id, field: 'raise', message: `The ${r.name} raise must be positive. Enter the amount invested in € millions, such as 2.` });
      moneyOk = false;
    } else if (x.raise > MONEY_MAX) {
      errors.push({ round: r.id, field: 'raise', message: `The ${r.name} raise is capped at €${fmt0.format(MONEY_MAX)}m here. Enter a smaller figure.` });
      moneyOk = false;
    }
    if (!Number.isFinite(x.pool) || x.pool < 0 || x.pool > POOL_MAX) {
      errors.push({ round: r.id, field: 'pool', message: `The ${r.name} pool must be between 0% and ${POOL_MAX}% of post-money. Move the scale back inside that range.` });
    } else if (moneyOk) {
      const preShare = x.pre / (x.pre + x.raise);
      if (x.pool / 100 >= preShare) {
        errors.push({
          round: r.id,
          field: 'pool',
          message: `A ${poolText(x.pool)} pool cannot come out of a pre-money worth only ${pct(preShare)} of the post-money: nothing would be left for existing holders. Lower the pool, increase the pre-money or reduce the amount raised.`,
        });
      }
    }
  }
  return errors;
}

export function computeDilution(i: DilutionInputs): DilutionOutcome {
  const errors = validateDilution(i);
  if (errors.length) return { ok: false, errors, empty: false };
  const active = ROUNDS.filter((r) => i[r.id].on);
  if (!active.length) return { ok: false, errors: [], empty: true };

  let h: Holdings = { founders: 1, pool: 0, investors: {} };
  const stages: Stage[] = [];

  for (const r of active) {
    const { pre, raise } = i[r.id];
    const post = pre + raise;
    const s = pre / post; // share of post-money held by everyone already in
    const target = i[r.id].pool / 100;

    // Without a top-up the existing pool is simply diluted to q·s. If that
    // falls short of the target, the gap is issued before the money comes in,
    // so it dilutes only the existing holders: the pool lands exactly on target.
    const diluted = h.pool * s;
    const pool = Math.max(target, diluted);
    const topUp = pool - diluted;
    // Everyone else already in (founders, earlier investors) shares what is left
    // of the pre-money, in proportion to what they held.
    const k = (s - pool) / (1 - h.pool);

    const investors: Partial<Record<RoundId, number>> = {};
    for (const [id, v] of Object.entries(h.investors) as [RoundId, number][]) investors[id] = v * k;
    investors[r.id] = raise / post;

    h = { founders: h.founders * k, pool, investors };
    stages.push({ round: r.id, name: r.name, pre, raise, post, poolTarget: target, poolTopUp: topUp, holdings: h, shown: roundHoldings(h) });
  }

  const last = stages[stages.length - 1];
  return {
    ok: true,
    stages,
    founders: last.holdings.founders,
    foundersShown: last.shown.founders,
    lastPost: last.post,
    founderValue: last.holdings.founders * last.post,
  };
}

/**
 * Round a cap table to tenths of a per cent so the parts add up to exactly
 * 100.0%: floor every share, then give the missing tenths to the largest
 * remainders. Each share moves by less than a tenth of a per cent.
 */
function roundHoldings(h: Holdings): Holdings {
  const ids = Object.keys(h.investors) as RoundId[];
  const raw = [h.founders, h.pool, ...ids.map((id) => h.investors[id]!)].map((v) => v * 1000);
  const units = raw.map((v) => Math.floor(v + 1e-9));
  let missing = 1000 - units.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ i, rem: v - units[i] })).sort((a, b) => b.rem - a.rem);
  for (let j = 0; missing > 0 && j < order.length; j++, missing--) units[order[j].i]++;
  const investors: Partial<Record<RoundId, number>> = {};
  ids.forEach((id, j) => (investors[id] = units[j + 2] / 1000));
  return { founders: units[0] / 1000, pool: units[1] / 1000, investors };
}

/* ------------------------------------------------------------------
   Query string
------------------------------------------------------------------- */

export function dilutionFromQuery(search: string): DilutionInputs {
  const p = new URLSearchParams(search);
  const out = structuredCloneInputs(DILUTION_DEFAULTS);
  for (const r of ROUNDS) {
    const on = p.get(r.q);
    if (on === '1') out[r.id].on = true;
    if (on === '0') out[r.id].on = false;
    for (const f of ['pre', 'raise', 'pool'] as RoundField[]) {
      const raw = p.get(`${r.q}_${f}`);
      if (raw === null || raw.trim() === '') continue;
      const v = Number(raw);
      if (Number.isFinite(v)) out[r.id][f] = v;
    }
  }
  return out;
}

export function dilutionToQuery(i: DilutionInputs): string {
  const p = new URLSearchParams();
  for (const r of ROUNDS) {
    const x = i[r.id];
    const d = DILUTION_DEFAULTS[r.id];
    if (x.on !== d.on) p.set(r.q, x.on ? '1' : '0');
    for (const f of ['pre', 'raise', 'pool'] as RoundField[]) {
      if (Number.isFinite(x[f]) && x[f] !== d[f]) p.set(`${r.q}_${f}`, String(x[f]));
    }
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function structuredCloneInputs(i: DilutionInputs): DilutionInputs {
  return {
    preseed: { ...i.preseed },
    seed: { ...i.seed },
    seriesA: { ...i.seriesA },
    seriesB: { ...i.seriesB },
  };
}

/** Spoken value for the pool scale. */
export const poolSpoken = (p: number) => `${fmt0.format(p)} per cent of post-money`;

/** One plain sentence for captions and screen readers. */
export function dilutionSentence(r: DilutionResult): string {
  const last = r.stages[r.stages.length - 1];
  const steps = r.stages.map((s) => `${pct(s.shown.founders)} after ${s.name}`).join(', ');
  return `Founders go from 100% to ${steps}. At the ${last.name} post-money of ${money(last.post)}, their stake is worth ${money(r.founderValue)} on paper.`;
}

/* ------------------------------------------------------------------
   Drawing: one stacked bar per round, founders first, then the pool,
   then each round's investors in order of entry.
------------------------------------------------------------------- */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const ROW_PITCH = 100;
const FIRST_ROUND_Y = 124;

export function dilutionHeight(r: DilutionResult): number {
  return FIRST_ROUND_Y + (r.stages.length - 1) * ROW_PITCH + 30 + 58 + 46;
}

interface LaneLabel {
  cx: number;
  w: number;
  text: string;
  x: number;
}

/** Spread labels along a lane so none overlap, keeping each near its anchor. Returns false if they cannot fit. */
function spread(labels: LaneLabel[], minX: number, maxX: number, gap: number): boolean {
  labels.sort((a, b) => a.cx - b.cx);
  labels.forEach((l, i) => {
    l.x = Math.max(l.cx, minX + l.w / 2);
    if (i > 0) {
      const p = labels[i - 1];
      l.x = Math.max(l.x, p.x + p.w / 2 + gap + l.w / 2);
    }
  });
  for (let i = labels.length - 1; i >= 0; i--) {
    const l = labels[i];
    l.x = Math.min(l.x, maxX - l.w / 2);
    if (i < labels.length - 1) {
      const n = labels[i + 1];
      l.x = Math.min(l.x, n.x - n.w / 2 - gap - l.w / 2);
    }
  }
  return !labels.length || labels[0].x - labels[0].w / 2 >= minX - 0.5;
}

export function dilutionSvg(r: DilutionResult, w = 640): string {
  const narrow = w < 420;
  const fs = narrow ? 11 : 12.5;
  const charW = fs * 0.55;
  const left = 4;
  const right = w - 4;
  const span = right - left;
  const bh = 30;
  const under: string[] = []; // the founders' trace, broken around lettering
  const knock: { x: number; y: number; w: number; h: number }[] = [];
  const out: string[] = [];
  const t = (x: number, y: number, s: string, cls = 'dim', anchor = 'middle', size = fs, extra = '') =>
    `<text class="${cls}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" font-size="${size}"${extra}>${esc(s)}</text>`;
  const plate = (x: number, y: number, pw: number, ph: number) =>
    `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" style="fill: var(--ground)" />`;
  const textW = (s: string, size = fs) => s.length * size * 0.55;
  const X = (f: number) => left + f * span;

  // Key, lettered like a drawing legend.
  const key = [
    { label: 'Founders', fill: 'ink' },
    { label: 'Option pool', fill: 'lead' },
    { label: narrow ? 'Investors' : 'Investors, by round', fill: 'none' },
  ];
  let kx = left;
  const ky = 10;
  for (const k of key) {
    const box = `x="${kx.toFixed(1)}" y="${ky}" width="22" height="12"`;
    if (k.fill === 'ink') out.push(`<rect ${box} fill="url(#hatch-ink)" stroke="none" />`);
    if (k.fill === 'lead') out.push(`<rect class="hatch" ${box} />`);
    out.push(`<rect class="ink-fine" ${box} />`);
    out.push(t(kx + 28, ky + 10.5, k.label, 'dim', 'start'));
    kx += 28 + textW(k.label) + (narrow ? 14 : 24);
  }

  const nameOf = (id: RoundId) => ROUNDS.find((x) => x.id === id)!.name;
  const shortOf = (id: RoundId) => (narrow ? nameOf(id).replace('Series ', '') : nameOf(id));

  // At founding: a slim bar, wholly the founders'.
  const fy = 62;
  out.push(t(left, fy - 8, 'At founding', 'note', 'start', fs + 3));
  out.push(`<rect x="${left}" y="${fy}" width="${span.toFixed(1)}" height="14" fill="url(#hatch-ink)" stroke="none" />`);
  out.push(`<rect class="ink-fine" x="${left}" y="${fy}" width="${span.toFixed(1)}" height="14" />`);
  out.push(t(right, fy - 8, '100%', 'dim', 'end'));
  let prevEdge = { x: right, y: fy + 14 };

  r.stages.forEach((stage, si) => {
    const y = FIRST_ROUND_Y + si * ROW_PITCH;
    const hh = stage.holdings;
    const order = r.stages.slice(0, si + 1).map((x) => x.round);

    // Heading: round name left, post-money right, each on a plate of paper.
    const post = `${money(stage.post)} post-money`;
    out.push(t(left, y - 8, stage.name, 'note', 'start', fs + 3));
    knock.push({ x: right - textW(post) - 6, y: y - 10 - fs, w: textW(post) + 8, h: fs + 8 });
    out.push(t(right, y - 8, post, 'dim', 'end'));

    const sh = stage.shown;
    const segs: { f: number; shown: number; kind: 'founders' | 'pool' | 'inv'; name: string }[] = [
      { f: hh.founders, shown: sh.founders, kind: 'founders', name: 'Founders' },
    ];
    if (hh.pool > 0) segs.push({ f: hh.pool, shown: sh.pool, kind: 'pool', name: 'Pool' });
    for (const id of order) segs.push({ f: hh.investors[id] ?? 0, shown: sh.investors[id] ?? 0, kind: 'inv', name: shortOf(id) });

    const lane: LaneLabel[] = [];
    let acc = 0;
    for (const s of segs) {
      const x0 = X(acc);
      const x1 = X(acc + s.f);
      const sw = x1 - x0;
      const cx = (x0 + x1) / 2;
      const box = `x="${x0.toFixed(1)}" y="${y}" width="${sw.toFixed(1)}" height="${bh}"`;
      if (s.kind === 'founders') out.push(`<rect ${box} fill="url(#hatch-ink)" stroke="none" />`);
      if (s.kind === 'pool') out.push(`<rect class="hatch" ${box} />`);
      out.push(`<rect class="${s.kind === 'inv' ? 'ink' : 'ink-fine'}" ${box} />`);

      const p = pct(s.shown);
      const full = s.kind === 'founders' ? p : `${s.name} ${p}`;
      const inside = textW(full) + 12 <= sw ? full : textW(p) + 10 <= sw ? p : null;
      if (inside) {
        const tw = textW(inside) + 8;
        if (s.kind !== 'inv') out.push(plate(cx - tw / 2, y + bh / 2 - fs / 2 - 3, tw, fs + 6));
        out.push(t(cx, y + bh / 2 + fs * 0.36, inside, 'dim', 'middle', fs, s.kind === 'founders' ? ' font-weight="600"' : ''));
      }
      if (inside !== full) {
        const text = inside ? s.name : `${s.name} ${p}`;
        lane.push({ cx, w: textW(text, fs - 0.5), text, x: cx });
      }
      acc += s.f;
    }

    // Lettering under the bar: one lane, or two if one cannot hold it all.
    const lanes: LaneLabel[][] = [];
    const one = lane.map((l) => ({ ...l }));
    if (spread(one, left, right, 8)) lanes.push(one);
    else {
      const sorted = [...lane].sort((a, b) => a.cx - b.cx);
      const a = sorted.filter((_, i) => i % 2 === 0);
      const b = sorted.filter((_, i) => i % 2 === 1);
      spread(a, left, right, 8);
      spread(b, left, right, 8);
      lanes.push(a, b);
    }
    lanes.forEach((ls, li) => {
      const by = y + bh + fs + 9 + li * (fs + 7);
      for (const l of ls) {
        out.push(`<line class="ink-fine" x1="${l.cx.toFixed(1)}" y1="${y + bh}" x2="${l.x.toFixed(1)}" y2="${(by - fs + 1).toFixed(1)}" />`);
        knock.push({ x: l.x - l.w / 2 - 4, y: by - fs - 1, w: l.w + 8, h: fs + 6 });
        out.push(t(l.x, by, l.text, 'dim', 'middle', fs - 0.5));
      }
    });

    // Trace the founders' edge from bar to bar: the dilution itself.
    const fx = X(hh.founders);
    under.push(`<line class="metal" x1="${prevEdge.x.toFixed(1)}" y1="${prevEdge.y.toFixed(1)}" x2="${fx.toFixed(1)}" y2="${y}" />`);
    prevEdge = { x: fx, y: y + bh };
  });

  // Ruled scale: 0 to 100% of the company.
  const ry = FIRST_ROUND_Y + (r.stages.length - 1) * ROW_PITCH + bh + 58;
  out.push(`<line class="ink-fine" x1="${left}" y1="${ry}" x2="${right}" y2="${ry}" />`);
  for (let p = 0; p <= 100; p += 5) {
    const x = X(p / 100);
    const major = p % 25 === 0;
    out.push(`<line class="ink-fine" x1="${x.toFixed(1)}" y1="${ry}" x2="${x.toFixed(1)}" y2="${ry + (major ? 7 : 3.5)}" />`);
    if (major) out.push(t(x, ry + 9 + fs, `${p}%`, 'dim', p === 0 ? 'start' : p === 100 ? 'end' : 'middle'));
  }
  out.push(t(left, ry + 2 * fs + 16, 'Fully diluted ownership. Shares are drawn to scale.', 'note', 'start', fs + 1));

  // Drafting convention: a construction line breaks where it meets lettering.
  const H = dilutionHeight(r);
  const holes = knock.map((k) => `M${k.x.toFixed(1)} ${k.y.toFixed(1)}h${k.w.toFixed(1)}v${k.h.toFixed(1)}h${(-k.w).toFixed(1)}Z`).join('');
  const clip = `<clipPath id="dil-trace-clip"><path clip-rule="evenodd" d="M-10 -10H${w + 10}V${H + 10}H-10Z${holes}" /></clipPath>`;
  return `<defs>${clip}</defs><g clip-path="url(#dil-trace-clip)">${under.join('')}</g>` + out.join('');
}
