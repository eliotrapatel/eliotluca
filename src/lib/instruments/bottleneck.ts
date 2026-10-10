// Bottleneck: the law of the minimum applied to the physical chain behind AI
// compute. Six parts, each with a capacity as an index where 100 is the plan;
// the chain delivers the lowest of the six. Pure functions shared by the
// server render (default state) and the client (live recompute).
// Deliberately ignored: substitution between parts, lead times, prices,
// partial deliveries, and the fact that real capacity is not a single number.

export type PartKey = 'power' | 'cooling' | 'chips' | 'memory' | 'packaging' | 'networking';
export type BottleneckKey = PartKey | 'capital';

export type BottleneckInputs = Record<BottleneckKey, number>;

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

/** The plan, as an index. Every capacity is read against it. */
export const PLAN = 100;
/** Top of every capacity scale. */
export const CAPACITY_MAX = 200;

/** The six parts, in the order of the chain. One stave each. */
export const PARTS: { key: PartKey; label: string }[] = [
  { key: 'power', label: 'Power' },
  { key: 'cooling', label: 'Cooling' },
  { key: 'chips', label: 'Chips' },
  { key: 'memory', label: 'Memory' },
  { key: 'packaging', label: 'Packaging' },
  { key: 'networking', label: 'Networking' },
];

/** Illustrative defaults: plenty of chips, short of power. Capital in US$ billions. */
export const BOTTLENECK_DEFAULTS: BottleneckInputs = {
  power: 70,
  cooling: 95,
  chips: 120,
  memory: 85,
  packaging: 80,
  networking: 110,
  capital: 100,
};

export const BOTTLENECK_FIELDS: Record<BottleneckKey, FieldSpec> = {
  power: { q: 'pw', min: 0, max: CAPACITY_MAX, integer: true, noun: 'power capacity', example: '70' },
  cooling: { q: 'co', min: 0, max: CAPACITY_MAX, integer: true, noun: 'cooling capacity', example: '95' },
  chips: { q: 'ch', min: 0, max: CAPACITY_MAX, integer: true, noun: 'chip capacity', example: '120' },
  memory: { q: 'me', min: 0, max: CAPACITY_MAX, integer: true, noun: 'memory capacity', example: '85' },
  packaging: { q: 'pk', min: 0, max: CAPACITY_MAX, integer: true, noun: 'packaging capacity', example: '80' },
  networking: { q: 'nw', min: 0, max: CAPACITY_MAX, integer: true, noun: 'networking capacity', example: '110' },
  capital: { q: 'k', min: 0.1, max: 100_000, noun: 'the capital committed', example: '100' },
};

export const BOTTLENECK_KEYS = Object.keys(BOTTLENECK_DEFAULTS) as BottleneckKey[];

/** Parse a typed number. Accepts "100", "1,000", "1 000", "2.5" and "2,5". */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().replace(/[\s_  ]/g, '').replace(/^\$|^US\$/i, '').replace(/bn$/i, '');
  if (s === '') return null;
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const plain = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });

/** Validate one raw field value; returns the number or an error naming the problem and the fix. */
export function validateField(key: BottleneckKey, raw: string): { value: number } | { error: string } {
  const f = BOTTLENECK_FIELDS[key];
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

export interface PartResult {
  key: PartKey;
  label: string;
  capacity: number;
  /** Capacity above the level: built, and waiting on the binding part. */
  idle: number;
  /** The idle capacity the committed capital paid for: idle, counted only up to the plan. */
  paidIdle: number;
  /** Capacity the plan paid for that is not there. */
  shortfall: number;
  binding: boolean;
  /** Output gained from one more unit of this part alone. */
  shadow: 0 | 1;
}

export interface BottleneckResult {
  inputs: BottleneckInputs;
  /** What the chain delivers: the minimum of the six capacities. */
  level: number;
  /** Every part standing at the level. More than one when the minimum is shared. */
  binding: PartKey[];
  /** The lowest capacity above the level and the parts standing at it; null when all six are level. */
  next: { level: number; parts: PartKey[] } | null;
  /** Output gained by raising the binding parts to the next constraint. */
  headroom: number;
  parts: PartResult[];
  /**
   * Committed capital, US$ billions. Spread equally across the six parts, each
   * sixth buys 100 index points of its part, so the three sums add up to the
   * capital committed.
   */
  capital: { committed: number; perPoint: number; working: number; stranded: number; unbuilt: number };
}

export function compute(i: BottleneckInputs): BottleneckResult {
  const caps = PARTS.map((p) => i[p.key]);
  const level = Math.min(...caps);
  const binding = PARTS.filter((p) => i[p.key] === level).map((p) => p.key);
  const above = caps.filter((c) => c > level);
  const nextLevel = above.length ? Math.min(...above) : null;
  const next = nextLevel === null ? null : { level: nextLevel, parts: PARTS.filter((p) => i[p.key] === nextLevel).map((p) => p.key) };
  // A shared minimum has no single owner: no part raises output on its own.
  const sole = binding.length === 1;

  const parts: PartResult[] = PARTS.map((p) => {
    const capacity = i[p.key];
    const isBinding = capacity === level;
    return {
      key: p.key,
      label: p.label,
      capacity,
      idle: capacity - level,
      paidIdle: Math.max(0, Math.min(capacity, PLAN) - level),
      shortfall: Math.max(0, PLAN - capacity),
      binding: isBinding,
      shadow: isBinding && sole ? 1 : 0,
    };
  });

  const perPoint = i.capital / (PARTS.length * PLAN);
  const sum = (f: (p: PartResult) => number) => parts.reduce((a, p) => a + f(p), 0);
  return {
    inputs: i,
    level,
    binding,
    next,
    headroom: next ? next.level - level : 0,
    parts,
    capital: {
      committed: i.capital,
      perPoint,
      working: PARTS.length * Math.min(level, PLAN) * perPoint,
      stranded: sum((p) => p.paidIdle) * perPoint,
      unbuilt: sum((p) => p.shortfall) * perPoint,
    },
  };
}

/** The next step along the chain: every binding part raised to the next constraint. Null when all six are level. */
export function relieve(i: BottleneckInputs): BottleneckInputs | null {
  const r = compute(i);
  if (!r.next) return null;
  const out = { ...i };
  for (const k of r.binding) out[k] = r.next.level;
  return out;
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
const LABEL = Object.fromEntries(PARTS.map((p) => [p.key, p.label])) as Record<PartKey, string>;
const lower = (k: PartKey) => LABEL[k].toLowerCase();
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "power", "power and packaging", "power, cooling and chips". */
function list(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** The binding parts as a phrase inside a sentence. */
function who(r: BottleneckResult): string {
  return r.binding.length === PARTS.length ? 'all six parts' : list(r.binding.map(lower));
}

export function count(v: number): string {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(v);
}

function fixed(v: number, d: number): string {
  return new Intl.NumberFormat('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}

/** US$18.3bn */
export function usdBn(v: number, d: number): string {
  return `US$${fixed(v, d)}bn`;
}

/**
 * Round a split to `d` decimals by largest remainder, so the printed parts add
 * up to the printed total. `to` is that total when it is already lettered.
 */
function apportion(parts: number[], d: number, to?: number): number[] {
  const k = Math.pow(10, d);
  const raw = parts.map((p) => p * k);
  const units = raw.map((v) => Math.floor(v + 1e-9));
  const total = Math.round((to ?? parts.reduce((a, b) => a + b, 0)) * k);
  let missing = total - units.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ i, rem: v - units[i] })).sort((a, b) => b.rem - a.rem);
  for (let j = 0; missing > 0 && j < order.length; j++, missing--) units[order[j].i]++;
  return units.map((u) => u / k);
}

/**
 * The capital figures as lettered. Sums under US$10bn carry two decimals,
 * larger ones carry one. Working, stranded and unbuilt add up to the capital
 * committed, the six stranded sums add up to the stranded total, and the three
 * shares add up to 100.0%.
 */
export function lettering(r: BottleneckResult) {
  const c = r.capital;
  const d = c.committed < 10 ? 2 : 1;
  const [working, stranded, unbuilt] = apportion([c.working, c.stranded, c.unbuilt], d);
  const [workingPct, strandedPct, unbuiltPct] = apportion(
    [c.working, c.stranded, c.unbuilt].map((v) => (v / c.committed) * 100),
    1,
  );
  const perPart = apportion(
    r.parts.map((p) => p.paidIdle * c.perPoint),
    d,
    stranded,
  );
  return { d, committed: working + stranded + unbuilt, working, stranded, unbuilt, workingPct, strandedPct, unbuiltPct, perPart };
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

export function figures(r: BottleneckResult): Figure[] {
  const n = r.binding.length;
  const all = n === PARTS.length;
  const sole = n === 1;
  const s = lettering(r);
  const over = r.level - PLAN;
  const versus = over > 0 ? `${over} above the plan of ${PLAN}` : `of ${PLAN} planned`;

  const bindingValue = all ? 'All six' : sole ? LABEL[r.binding[0]] : n === 2 ? cap(who(r)) : `${cap(WORDS[n])} parts`;
  const bindingNote = all
    ? 'the chain is balanced and no capacity is idle'
    : sole
      ? 'the shortest stave: every other part waits on it'
      : `${who(r)} share the minimum and have to rise together`;

  const nextNames = r.next ? list(r.next.parts.map(lower)) : '';
  const headroomNote = r.next
    ? `gained by raising ${who(r)} ${sole ? 'alone' : 'together'}; ${nextNames} ${r.next.parts.length === 1 ? 'binds' : 'bind'} next, at ${r.next.level}`
    : 'no part stands above the level';

  return [
    {
      id: 'level',
      label: 'Deliverable level',
      value: String(r.level),
      small: all ? `${versus}, with all six parts level` : `${versus}, capped by ${who(r)}`,
      key: true,
    },
    { id: 'binding', label: 'Binding part', value: bindingValue, small: bindingNote },
    { id: 'headroom', label: 'Headroom', value: r.next ? `+${r.headroom}` : '0', small: headroomNote },
    {
      id: 'stranded',
      label: 'Capital stranded',
      value: `${fixed(s.strandedPct, 1)}%`,
      small: `${usdBn(s.stranded, s.d)} of US$${count(s.committed)}bn built but idle; ${usdBn(s.working, s.d)} at work, ${usdBn(s.unbuilt, s.d)} not built`,
    },
    {
      id: 'shadow',
      label: 'Shadow value of the binding part',
      value: sole ? '1' : '0',
      small: sole
        ? `one more unit of ${who(r)} adds one unit of output; one more of any other part adds nothing`
        : `${who(r)} bind together, so one more unit of any single part adds nothing`,
    },
  ];
}

export interface LedgerRow {
  key: PartKey | 'total';
  label: string;
  capacity: string;
  idle: string;
  /** US$ billions, as lettered. */
  stranded: string;
  /** Output added by one more unit of this part alone. */
  shadow: string;
  binding: boolean;
}

/** One row per part and a total. The stranded column adds up as printed. */
export function ledger(r: BottleneckResult): LedgerRow[] {
  const s = lettering(r);
  const rows: LedgerRow[] = r.parts.map((p, i) => ({
    key: p.key,
    label: p.label,
    capacity: String(p.capacity),
    idle: String(p.idle),
    stranded: fixed(s.perPart[i], s.d),
    shadow: p.shadow ? '+1' : '0',
    binding: p.binding,
  }));
  rows.push({
    key: 'total',
    label: 'Total',
    capacity: '',
    idle: String(r.parts.reduce((a, p) => a + p.idle, 0)),
    stranded: fixed(s.stranded, s.d),
    shadow: '',
    binding: false,
  });
  return rows;
}

/** Spoken value of one capacity scale (aria-valuetext). */
export function scaleSpoken(r: BottleneckResult, key: PartKey): string {
  const p = r.parts.find((x) => x.key === key)!;
  return p.binding ? `${p.capacity}, binding` : `${p.capacity}, ${p.idle} above the level`;
}

/** What the relief action will do next, in one sentence. */
export function reliefNote(r: BottleneckResult): string {
  if (!r.next) return 'All six parts are level. There is no bottleneck left to relieve: raise them together.';
  return `Raises ${who(r)} from ${r.level} to ${r.next.level}, the level of ${list(r.next.parts.map(lower))}.`;
}

/* ------------------------------------------------------------------ */
/* Drawing: Liebig's barrel, seen from the side and slightly above     */

export const VIEW = { w: 480, h: 460 };
/** The drawing is lettered at true size from this width up to VIEW.w. */
export const VIEW_MIN_W = 320;

const BASE = 370; // y of index 0 at the barrel's sides
const SCALE = 1.4; // pixels per index point
const RY = 28; // half-height of the rim ellipse: how far above the eye stands
const R_MAX = 132; // the barrel keeps its proportions on a wide sheet
const VALUE_Y = BASE + RY + 26;
const NAME_Y = [VALUE_Y + 14, VALUE_Y + 28]; // names sit on two rows, staggered

/**
 * Stave joints across the visible front, as fractions of the radius. A blend of
 * equal widths and true foreshortening: the barrel reads as round and the
 * outer staves stay wide enough to letter.
 */
const JOINTS = Array.from({ length: PARTS.length + 1 }, (_, i) => {
  const u = -1 + (2 * i) / PARTS.length;
  return 0.7 * u + 0.3 * Math.sin((u * Math.PI) / 2);
});

const r1 = (v: number) => Math.round(v * 10) / 10;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Plain-language description of the drawing, for the SVG <desc>. */
export function describe(r: BottleneckResult): string {
  const staves = r.parts.map((p) => `${p.label.toLowerCase()} ${p.capacity}`).join(', ');
  const n = r.binding.length;
  const head = `A barrel of six staves, one for each part: ${staves}. The dashed ring marks the plan at ${PLAN}.`;
  const gap = PLAN - r.level;
  const against = gap > 0 ? `${gap} below the plan` : gap < 0 ? `${-gap} above the plan` : 'level with the plan';
  if (n === PARTS.length) return `${head} All six staves stand at ${r.level}, ${against}, so the barrel is full to the brim.`;
  if (r.level === 0) return `${head} The barrel holds nothing: the ${who(r)} ${n === 1 ? 'stave stands' : 'staves stand'} at 0.`;
  const held = `The liquid stands at ${r.level}, ${against}, the height of the ${who(r)} ${n === 1 ? 'stave' : 'staves'}, and spills over ${n === 1 ? 'it' : 'them'}.`;
  const next = r.next ? ` ${cap(list(r.next.parts.map(lower)))} ${r.next.parts.length === 1 ? 'binds' : 'bind'} next, at ${r.next.level}.` : '';
  return `${head} ${held}${next}`;
}

/**
 * Inner SVG markup for the readout drawing. Pure, so the server and the client
 * draw the same thing. `w` is the drawing width in user units; the client
 * passes the rendered width so lettering stays at true size on a narrow screen.
 */
export function drawing(r: BottleneckResult, w: number = VIEW.w): string {
  const narrow = w < 420;
  const fs = narrow ? 11.5 : 13;
  const ml = narrow ? 52 : 76;
  const mr = narrow ? 48 : 76;
  const half = (w - ml - mr) / 2;
  const R = Math.min(R_MAX, half);
  const cx = ml + half;
  const level = r.level;
  const n = r.binding.length;

  const y = (v: number) => BASE - v * SCALE;
  const xs = JOINTS.map((t) => cx + R * t);
  // The rim is an ellipse: its front edge drops below the axis, its back edge rises above it.
  const lift = (x: number) => RY * Math.sqrt(Math.max(0, 1 - ((x - cx) / R) ** 2));
  const front = (x: number, v: number) => y(v) + lift(x);
  const back = (x: number, v: number) => y(v) - lift(x);
  const pt = (x: number, yy: number) => `${r1(x)} ${r1(yy)}`;
  const arc = (x: number, yy: number, sweep: 0 | 1) => `A${r1(R)} ${RY} 0 0 ${sweep} ${pt(x, yy)}`;
  const frontArc = (a: number, b: number, v: number) => `M${pt(a, front(a, v))}${arc(b, front(b, v), 0)}`;
  const stave = (i: number, v: number) =>
    `M${pt(xs[i], front(xs[i], 0))}L${pt(xs[i], front(xs[i], v))}${arc(xs[i + 1], front(xs[i + 1], v), 0)}L${pt(xs[i + 1], front(xs[i + 1], 0))}${arc(xs[i], front(xs[i], 0), 1)}Z`;

  const out: string[] = [];
  const left = cx - R;
  const right = cx + R;
  const PLAN_INK = 'fill:none;stroke:var(--line-2);stroke-width:0.9;stroke-dasharray:5 4';

  // Heading annotation.
  const held = n === PARTS.length ? 'all six staves level' : `held by ${n <= 2 ? who(r) : `${WORDS[n]} staves`}`;
  out.push(`<text class="note" x="4" y="24" font-size="17">Liebig's barrel</text>`);
  out.push(`<text class="dim" x="4" y="44" font-size="${fs}">Level ${level}, ${esc(held)}</text>`);

  // Ruler: the index, with the plan named at 100.
  const RX = left - 16;
  out.push(`<line class="ink-fine" x1="${r1(RX)}" y1="${y(0)}" x2="${r1(RX)}" y2="${y(CAPACITY_MAX)}"/>`);
  for (let v = 0; v <= CAPACITY_MAX; v += 25) {
    const major = v % 50 === 0;
    const ty = r1(y(v));
    out.push(`<line class="ink-fine" x1="${r1(RX - (major ? 7 : 4))}" y1="${ty}" x2="${r1(RX)}" y2="${ty}"/>`);
    if (major) out.push(`<text class="dim" x="${r1(RX - 11)}" y="${r1(ty + 4)}" font-size="${fs - 0.5}" text-anchor="end">${v}</text>`);
  }
  out.push(`<text class="dim" x="${r1(RX - 11)}" y="${r1(y(PLAN) + 4 + fs)}" font-size="${fs - 0.5}" text-anchor="end">plan</text>`);

  // The far half of the plan ring passes behind the barrel.
  out.push(`<path d="M${pt(left, y(PLAN))}${arc(right, y(PLAN), 1)}" style="${PLAN_INK}"/>`);

  // Far wall: the inside of each stave, standing clear of the liquid.
  r.parts.forEach((p, i) => {
    if (p.capacity <= level) return;
    const a = xs[i];
    const b = xs[i + 1];
    out.push(
      `<path d="M${pt(a, back(a, p.capacity))}${arc(b, back(b, p.capacity), 1)}L${pt(b, back(b, level))}${arc(a, back(a, level), 0)}Z" style="fill:var(--black);stroke:var(--line-3);stroke-width:0.75;stroke-linejoin:round"/>`,
    );
  });

  // The surface of the liquid, or the bare floor of an empty barrel.
  if (level > 0) {
    out.push(`<ellipse cx="${r1(cx)}" cy="${r1(y(level))}" rx="${r1(R)}" ry="${RY}" style="fill:var(--black);stroke:none"/>`);
    out.push(
      `<ellipse cx="${r1(cx)}" cy="${r1(y(level))}" rx="${r1(R)}" ry="${RY}" style="fill:url(#bn-surface);stroke:var(--line-2);stroke-width:0.75"/>`,
    );
  } else {
    out.push(`<ellipse class="metal" cx="${r1(cx)}" cy="${r1(y(0))}" rx="${r1(R)}" ry="${RY}"/>`);
  }

  // Near wall: the six staves, each cut at its own capacity.
  r.parts.forEach((p, i) => {
    out.push(`<path class="ink" d="${stave(i, p.capacity)}" style="fill:var(--panel);stroke-width:1"/>`);
  });

  // Two hoops, carried only by the staves tall enough to reach them.
  for (const [lo, hi] of [
    [5, 10],
    [30, 35],
  ]) {
    r.parts.forEach((p, i) => {
      if (p.capacity < hi) return;
      out.push(
        `<path class="ink-fine" d="${frontArc(xs[i], xs[i + 1], lo)}${frontArc(xs[i], xs[i + 1], hi)}" style="stroke:var(--line-2)"/>`,
      );
    });
  }

  // The liquid shown through the staves, up to the waterline.
  if (level > 0) {
    out.push(
      `<path d="M${pt(left, y(level))}${arc(right, y(level), 0)}L${pt(right, y(0))}${arc(left, y(0), 1)}Z" style="fill:url(#bn-water);stroke:none"/>`,
    );
    out.push(`<path class="ink-fine" d="${frontArc(left, right, level)}" style="stroke:var(--line-2)"/>`);
  }

  // The plan: the near half of the ring, carried across to the ruler.
  out.push(`<path d="${frontArc(left, right, PLAN)}" style="${PLAN_INK}"/>`);
  out.push(`<line x1="${r1(RX)}" y1="${y(PLAN)}" x2="${r1(left)}" y2="${y(PLAN)}" style="${PLAN_INK}"/>`);

  // The binding staves in gold, with the liquid running over them. A barrel
  // with all six staves level is full to the brim and has no low point to run over.
  r.parts.forEach((p, i) => {
    if (!p.binding) return;
    const a = xs[i];
    const b = xs[i + 1];
    out.push(`<path class="ink" d="${stave(i, level)}" style="stroke:var(--gold);stroke-width:1.5"/>`);
    out.push(`<path class="lead" d="${frontArc(a, b, level)}"/>`);
    if (level === 0 || n === PARTS.length) return;
    const streaks = n > 1 || b - a < 40 ? [0.34, 0.66] : [0.25, 0.5, 0.75];
    streaks.forEach((f, j) => {
      const x = a + (b - a) * f;
      out.push(
        `<line class="bn-spill" x1="${r1(x)}" y1="${r1(front(x, level) + 2)}" x2="${r1(x)}" y2="${r1(front(x, 0) + 5)}" style="fill:none;stroke:var(--line);stroke-width:0.75;stroke-dasharray:6 5;animation-delay:${-0.35 * j}s"/>`,
      );
    });
    const mid = (a + b) / 2;
    out.push(
      `<ellipse class="ink-fine" cx="${r1(mid)}" cy="${r1(front(mid, 0) + 6)}" rx="${r1((b - a) * 0.46)}" ry="3" style="stroke:var(--line-2)"/>`,
    );
  });

  // The level, pointed out on the ruler.
  const ly = r1(y(level));
  out.push(`<polygon class="lead-fill" points="${r1(RX + 2)},${ly} ${r1(RX + 10)},${r1(ly - 4.5)} ${r1(RX + 10)},${r1(ly + 4.5)}"/>`);

  // Headroom: a dimension line from the level to the next constraint.
  if (r.next) {
    const DX = right + 14;
    const ny = r1(y(r.next.level));
    out.push(`<line class="metal" x1="${r1(right + 3)}" y1="${ly}" x2="${r1(DX + 4)}" y2="${ly}"/>`);
    out.push(`<line class="metal" x1="${r1(right + 3)}" y1="${ny}" x2="${r1(DX + 4)}" y2="${ny}"/>`);
    if (ly - ny > 18) {
      out.push(
        `<line class="ink-fine" x1="${r1(DX)}" y1="${ly}" x2="${r1(DX)}" y2="${ny}" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`,
      );
    }
    out.push(
      `<text class="dim" x="${r1(DX + 7)}" y="${r1((ly + ny) / 2 + 4)}" font-size="${fs}" font-weight="600" style="fill:var(--line)">+${r.headroom}</text>`,
    );
  }

  // Lettering under each stave: the capacity, then the name in mono.
  const MONO = 'font-family:var(--font-mono);letter-spacing:0.04em';
  r.parts.forEach((p, i) => {
    const mid = (xs[i] + xs[i + 1]) / 2;
    const row = i % 2;
    const ink = p.binding ? 'var(--gold)' : 'var(--line)';
    const dim = p.binding ? 'var(--gold)' : 'var(--line-2)';
    out.push(
      `<line class="ink-fine" x1="${r1(mid)}" y1="${r1(front(mid, 0) + 11)}" x2="${r1(mid)}" y2="${VALUE_Y - 11}" style="stroke:var(--line-3)"/>`,
    );
    out.push(`<text x="${r1(mid)}" y="${VALUE_Y}" font-size="10.5" text-anchor="middle" style="${MONO};fill:${ink}">${p.capacity}</text>`);
    if (row === 1) {
      out.push(
        `<line class="ink-fine" x1="${r1(mid)}" y1="${VALUE_Y + 4}" x2="${r1(mid)}" y2="${NAME_Y[1] - 10}" style="stroke:var(--line-3)"/>`,
      );
    }
    out.push(
      `<text x="${r1(mid)}" y="${NAME_Y[row]}" font-size="10" text-anchor="middle" style="${MONO};fill:${dim}">${esc(p.label.toUpperCase())}</text>`,
    );
  });

  return out.join('');
}
