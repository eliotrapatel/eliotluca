// Beat: how fast a mechanical watch beats, what that means for the train, and
// what a rate error adds up to. Pure functions shared by the server render
// (default state) and the client (live recompute and the moving drawing).
// Deliberately ignored: isochronism, positional error, temperature, the real
// amplitude, beat error, and the gap between a timing machine and the wrist.

export type BeatKey = 'vph' | 'teeth' | 'rate' | 'reserve';

export type BeatInputs = Record<BeatKey, number>;

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

/** Illustrative defaults: a common modern rate, a classic escape wheel, a small gain. */
export const BEAT_DEFAULTS: BeatInputs = {
  vph: 28_800,
  teeth: 15,
  rate: 4,
  reserve: 42,
};

export const BEAT_FIELDS: Record<BeatKey, FieldSpec> = {
  vph: { q: 'vph', min: 3_600, max: 360_000, integer: true, noun: 'the beat rate in vibrations per hour', example: '28,800' },
  teeth: { q: 't', min: 5, max: 40, integer: true, noun: 'the number of escape wheel teeth', example: '15' },
  rate: { q: 'r', min: -600, max: 600, noun: 'the rate error in seconds per day', example: '4 or -6' },
  reserve: { q: 'pr', min: 1, max: 2_000, noun: 'the power reserve in hours', example: '42' },
};

export const BEAT_KEYS = Object.keys(BEAT_DEFAULTS) as BeatKey[];

/** Common beat rates, in vibrations per hour. */
export const PRESETS = [18_000, 21_600, 25_200, 28_800, 36_000] as const;

export function presetFor(vph: number): number | null {
  return PRESETS.find((p) => p === vph) ?? null;
}

/** Parse a typed number. Accepts "28800", "28,800", "28 800", "+4", "-4.5" and "4,5". */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().replace(/[\s_]/g, '').replace(/−/g, '-').replace(/^\+/, '');
  if (s === '') return null;
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const MINUS = '−';
const formats = new Map<number, Intl.NumberFormat>();

/** A number with thousands separators and at most `digits` decimals. */
export function count(v: number, digits = 0): string {
  let nf = formats.get(digits);
  if (!nf) {
    nf = new Intl.NumberFormat('en-GB', { maximumFractionDigits: digits });
    formats.set(digits, nf);
  }
  const s = nf.format(v);
  // A figure that rounds to zero carries no minus sign.
  return s === '-0' ? '0' : s.replace('-', MINUS);
}

/** How a value is written into its field: the rate error keeps its sign. */
export function fieldText(key: BeatKey, v: number): string {
  return key === 'rate' && v > 0 ? `+${v}` : String(v);
}

/** Validate one raw field value; returns the number or an error naming the problem and the fix. */
export function validateField(key: BeatKey, raw: string): { value: number } | { error: string } {
  const f = BEAT_FIELDS[key];
  const n = parseNumber(raw);
  if (n === null) {
    return { error: raw.trim() === '' ? `Enter ${f.noun}, for example ${f.example}.` : `Use digits only for ${f.noun}, for example ${f.example}.` };
  }
  if (f.integer && !Number.isInteger(n)) return { error: `Use a whole number for ${f.noun}, for example ${f.example}.` };
  if (n < f.min || n > f.max) {
    return { error: `That is outside the range. Enter ${f.noun} from ${count(f.min)} to ${count(f.max)}.` };
  }
  return { value: n };
}

export interface BeatResult {
  inputs: BeatInputs;
  /** Full oscillations per second: two vibrations each. */
  hz: number;
  /** Vibrations per second, which is also the steps of the seconds hand. */
  bps: number;
  beatMs: number;
  /** Each tooth of the escape wheel is released in two beats. */
  beatsPerTurn: number;
  turnSeconds: number;
  turnsPerMinute: number;
  beatsPerDay: number;
  beatsReserve: number;
  /** Rate error as parts per million; positive runs fast. */
  ppm: number;
  /** Beats gained (positive) or lost in one day at this rate error. */
  beatsOff: number;
  /** Accumulated error in seconds, signed, assuming the rate holds. */
  drift: { day: number; week: number; month: number; year: number };
}

export function compute(i: BeatInputs): BeatResult {
  const bps = i.vph / 3_600;
  const beatsPerTurn = i.teeth * 2;
  const turnSeconds = beatsPerTurn / bps;
  return {
    inputs: i,
    hz: i.vph / 7_200,
    bps,
    beatMs: 3_600_000 / i.vph,
    beatsPerTurn,
    turnSeconds,
    turnsPerMinute: 60 / turnSeconds,
    beatsPerDay: i.vph * 24,
    beatsReserve: i.vph * i.reserve,
    ppm: (i.rate / 86_400) * 1_000_000,
    beatsOff: i.rate * bps,
    drift: { day: i.rate, week: i.rate * 7, month: i.rate * 30, year: i.rate * 365 },
  };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */

/** +46.3 or −3.47; zero carries no sign. */
export function signed(v: number, digits: number): string {
  const s = count(Math.abs(v), digits);
  if (s === '0') return s;
  return (v > 0 ? '+' : MINUS) + s;
}

/** A span of seconds as "28 s", "24 min 20 s" or "1 h 12 min 5 s", unsigned. */
export function clock(seconds: number): string {
  const abs = Math.abs(seconds);
  if (Math.round(abs * 10) / 10 < 60) return `${count(abs, 1)} s`;
  const total = Math.round(abs);
  const h = Math.floor(total / 3_600);
  const m = Math.floor((total % 3_600) / 60);
  const s = total % 60;
  return `${h ? `${count(h)} h ` : ''}${m} min ${s} s`;
}

/** An accumulated error in words: "24 min 20 s fast", "28 s slow" or "on time". */
export function off(seconds: number): string {
  if (count(Math.abs(seconds), 1) === '0') return 'on time';
  return `${clock(seconds)} ${seconds > 0 ? 'fast' : 'slow'}`;
}

/** Hours as days and hours, for the power reserve: "1 day 18 hours". */
export function span(hours: number): string {
  const h = Math.round(hours * 10) / 10;
  const d = Math.floor(h / 24);
  const rest = Math.round((h - d * 24) * 10) / 10;
  const hrs = `${count(rest, 1)} ${rest === 1 ? 'hour' : 'hours'}`;
  if (d === 0) return hrs;
  return `${count(d)} ${d === 1 ? 'day' : 'days'}${rest ? ` ${hrs}` : ''}`;
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

export function figures(r: BeatResult): Figure[] {
  const i = r.inputs;
  const bps = count(r.bps, 2);
  const lost = Math.abs(r.beatsOff);
  const error =
    count(lost, 1) === '0'
      ? 'no gain and no loss'
      : `${signed(i.rate, 2)} s a day, ${count(lost, 1)} ${count(lost, 1) === '1' ? 'beat' : 'beats'} too ${r.beatsOff > 0 ? 'many' : 'few'}`;
  return [
    {
      id: 'hz',
      label: 'Frequency',
      value: `${count(r.hz, 3)} Hz`,
      small: `${count(i.vph)} vibrations an hour, two to each oscillation`,
      key: true,
    },
    {
      id: 'bps',
      label: 'Beats per second',
      value: bps,
      small: `${count(i.vph)} vph ÷ 3,600`,
    },
    {
      id: 'beat',
      label: 'One beat lasts',
      value: `${count(r.beatMs, 2)} ms`,
      small: `one full oscillation, ${count(r.beatMs * 2, 2)} ms`,
    },
    {
      id: 'hand',
      label: 'Seconds hand',
      value: `${bps} ${bps === '1' ? 'step' : 'steps'}`,
      small: 'each second, one step to a beat',
    },
    {
      id: 'turn',
      label: 'Escape wheel, one turn',
      value: `${count(r.turnSeconds, 2)} s`,
      small: `${count(i.teeth)} teeth, ${count(r.beatsPerTurn)} beats, ${count(r.turnsPerMinute, 2)} turns a minute`,
    },
    {
      id: 'day',
      label: 'Beats per day',
      value: count(r.beatsPerDay),
      small: `${count(r.beatsPerDay / 2)} oscillations`,
    },
    {
      id: 'reserve',
      label: 'Beats over the reserve',
      value: count(r.beatsReserve),
      small: i.reserve < 24 ? `${span(i.reserve)} of running` : `${count(i.reserve, 1)} hours, or ${span(i.reserve)}`,
    },
    {
      id: 'ppm',
      label: 'Rate error',
      value: `${signed(r.ppm, Math.abs(r.ppm) < 10 ? 2 : 1)} ppm`,
      small: error,
    },
  ];
}

export interface DriftRow {
  id: 'day' | 'week' | 'month' | 'year';
  label: string;
  value: string;
}

/** The rate error carried over longer spans, assuming it never changes. */
export function drift(r: BeatResult): DriftRow[] {
  return [
    { id: 'day', label: 'One day', value: off(r.drift.day) },
    { id: 'week', label: 'One week', value: off(r.drift.week) },
    { id: 'month', label: 'One month of 30 days', value: off(r.drift.month) },
    { id: 'year', label: 'One year of 365 days', value: off(r.drift.year) },
  ];
}

/* ------------------------------------------------------------------ */
/* Drawing: the balance from above, and one second cut into its beats  */

export const VIEW = { w: 440, h: 426 };

/** Degrees the balance turns each side of rest. Fixed: the drawing does not model amplitude. */
export const AMPLITUDE = 270;
/** Slow motion divides the speed of the drawing by this. */
export const SLOW = 10;

const CX = 220; // balance staff
const CY = 190;
const RIM = 96; // outside of the rim
const RIM_IN = 86;
const HUB = 13;
const COLLET = 8.5;
const SPRING_OUT = 54; // radius of the outer coil, at the stud
const TURNS = 7.5; // coils at rest
const STUD_AT = -40; // angle of the stud, in degrees from three o'clock
const MARK = -90; // the gold mark sits at twelve o'clock at rest

const SX0 = 48; // strip, start of the second
const SX1 = 424; // strip, end of the second
const BASE = 394; // rest line of the strip
const ARCH = 30; // height of a full swing on the strip

const f = (n: number) => Math.round(n * 10) / 10;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const pol = (r: number, a: number): [number, number] => [CX + r * Math.cos(rad(a)), CY + r * Math.sin(rad(a))];
const P = (p: [number, number]) => `${f(p[0])},${f(p[1])}`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Whole beats that fit in one second: the strip is read over that many. */
const wholeBeats = (bps: number) => Math.max(1, Math.floor(bps + 1e-9));

/**
 * The hairspring as a flat spiral. Its outer end is held by the stud and its
 * inner end is carried round by the collet, so turning the balance by `theta`
 * degrees winds or unwinds the coils between the same two radii.
 */
export function springPath(theta = 0): string {
  const sweep = TURNS * 360 - theta;
  const n = Math.ceil(sweep / 10);
  const start = STUD_AT - sweep;
  let d = '';
  for (let k = 0; k <= n; k++) {
    const s = k / n;
    d += `${k ? 'L' : 'M'}${P(pol(COLLET + s * (SPRING_OUT - COLLET), start + s * sweep))}`;
  }
  return d;
}

export interface Pose {
  /** SVG transform for everything fixed to the balance staff. */
  turn: string;
  spring: string;
  /** Where the gold dot sits on the strip. */
  x: number;
  y: number;
}

/**
 * The drawing after `beats` beats have elapsed (fractions allowed). The
 * balance passes through rest on every whole beat and reaches the end of its
 * swing halfway between two.
 */
export function pose(beats: number, bps: number): Pose {
  const swing = Math.sin(Math.PI * beats);
  const angle = AMPLITUDE * swing;
  const whole = wholeBeats(bps);
  const inStrip = ((beats % whole) + whole) % whole;
  return {
    turn: `rotate(${Math.round(angle * 100) / 100} ${CX} ${CY})`,
    spring: springPath(angle),
    x: f(SX0 + (inStrip / bps) * (SX1 - SX0)),
    y: f(BASE - ARCH * Math.abs(swing)),
  };
}

/** Three tapered arms from the hub to the rim, one of them under the gold mark. */
function arms(): string {
  let d = '';
  for (const a of [MARK, MARK + 120, MARK + 240]) {
    for (const side of [-1, 1]) {
      const inner = deg(Math.asin(4.2 / HUB)) * side;
      const outer = deg(Math.asin(2.8 / RIM_IN)) * side;
      d += `M${P(pol(HUB, a + inner))}L${P(pol(RIM_IN, a + outer))}`;
    }
  }
  return d;
}

/** Plain-language description of the drawing, for the SVG <desc>. */
export function describe(r: BeatResult): string {
  const bps = count(r.bps, 2);
  return (
    `A balance wheel with three arms and a flat hairspring, seen from above. At ${count(r.inputs.vph)} vibrations an hour ` +
    `it makes ${count(r.hz, 3)} full oscillations a second, turning ${AMPLITUDE} degrees each side of rest. ` +
    `Below it, one second is cut into ${bps} ${bps === '1' ? 'beat' : 'beats'} of ${count(r.beatMs, 2)} ms each.`
  );
}

/** Inner SVG markup for the readout drawing, at rest. Pure, so the server and the client draw the same thing. */
export function drawing(r: BeatResult): string {
  const out: string[] = [];
  const gold = 'style="fill:var(--gold);stroke:none"';

  // Heading annotation.
  out.push(`<text class="note" x="24" y="30" font-size="17">Balance and hairspring, from above</text>`);
  out.push(
    `<text class="dim" x="24" y="52" font-size="13">${esc(count(r.hz, 3))} Hz, ${AMPLITUDE}° each side of rest</text>`,
  );

  // Fixed in the plate: a construction circle and three indices for the gold mark.
  out.push(`<circle class="metal" cx="${CX}" cy="${CY}" r="${RIM + 8}"/>`);
  for (const a of [MARK, MARK + AMPLITUDE, MARK - AMPLITUDE]) {
    out.push(`<path class="ink" d="M${P(pol(RIM + 4, a))}L${P(pol(RIM + 13, a))}"/>`);
  }
  out.push(`<text class="dim" x="${CX}" y="${CY - RIM - 18}" font-size="12.5" text-anchor="middle">rest</text>`);
  out.push(`<text class="dim" x="${CX - RIM - 18}" y="${CY + 4}" font-size="12.5" text-anchor="end">+${AMPLITUDE}°</text>`);
  out.push(`<text class="dim" x="${CX + RIM + 18}" y="${CY + 4}" font-size="12.5">−${AMPLITUDE}°</text>`);

  // The balance: rim, arms, hub and the gold mark that makes the swing readable.
  out.push(
    `<g data-turn="">` +
      `<circle class="ink" cx="${CX}" cy="${CY}" r="${RIM}"/>` +
      `<circle class="ink-fine" cx="${CX}" cy="${CY}" r="${RIM_IN}"/>` +
      `<path class="ink-fine" d="${arms()}"/>` +
      `<circle class="ink-fine" cx="${CX}" cy="${CY}" r="${HUB}"/>` +
      `<circle cx="${f(pol((RIM + RIM_IN) / 2, MARK)[0])}" cy="${f(pol((RIM + RIM_IN) / 2, MARK)[1])}" r="3" ${gold}/>` +
      `</g>`,
  );

  // The hairspring lies above the arms; the client redraws it as the balance turns.
  out.push(`<path class="ink-fine" data-spring="" d="${springPath(0)}"/>`);

  // Collet and staff, turning with the balance.
  const slit = STUD_AT - TURNS * 360 + 180;
  out.push(
    `<g data-turn="">` +
      `<circle class="ink-fine" cx="${CX}" cy="${CY}" r="${COLLET}" style="fill:var(--ground)"/>` +
      `<path class="ink-fine" d="M${P(pol(2.4, slit))}L${P(pol(COLLET, slit))}"/>` +
      `<circle class="ink-fill" cx="${CX}" cy="${CY}" r="2.4"/>` +
      `</g>`,
  );

  // The stud holds the outer end of the spring and does not move.
  const stud = pol(SPRING_OUT, STUD_AT);
  const lead = pol(RIM + 22, STUD_AT);
  out.push(
    `<rect class="ink" x="${f(stud[0] - 3)}" y="${f(stud[1] - 3)}" width="6" height="6" style="fill:var(--ground)" transform="rotate(${STUD_AT} ${P(stud).replace(',', ' ')})"/>`,
  );
  out.push(`<polyline class="ink-fine" points="${P(pol(SPRING_OUT + 5, STUD_AT))} ${P(lead)} ${f(lead[0] + 9)},${f(lead[1])}"/>`);
  out.push(`<text class="note" x="${f(lead[0] + 13)}" y="${f(lead[1] + 4.5)}" font-size="14">stud, fixed end</text>`);

  // The strip: one second, an arch for every vibration, a mark for every beat.
  const bps = r.bps;
  const whole = wholeBeats(bps);
  const step = (SX1 - SX0) / bps;
  const beatsText = `${count(bps, 2)} ${count(bps, 2) === '1' ? 'beat' : 'beats'} of ${count(r.beatMs, 2)} ms`;
  out.push(`<text class="note" x="24" y="334" font-size="16">One second</text>`);
  out.push(`<text class="dim" x="${SX1}" y="334" font-size="13" text-anchor="end">${esc(beatsText)}</text>`);
  out.push(`<text class="dim" x="${SX0 - 7}" y="${BASE - ARCH + 4}" font-size="11" text-anchor="end">${AMPLITUDE}°</text>`);
  out.push(`<text class="dim" x="${SX0 - 7}" y="${BASE + 4}" font-size="11" text-anchor="end">rest</text>`);

  // Distance from rest over the second: it touches the rest line on every beat.
  const per = Math.max(4, Math.min(12, Math.round(1_200 / bps)));
  let arch = `M${SX0},${BASE}`;
  for (let k = 1; k <= Math.ceil(bps * per - 1e-9); k++) {
    const b = Math.min(k / per, bps);
    arch += `L${f(SX0 + b * step)},${f(BASE - ARCH * Math.abs(Math.sin(Math.PI * b)))}`;
  }
  out.push(`<path class="ink" d="${arch}"/>`);
  out.push(`<line class="ink-fine" x1="${SX0}" y1="${BASE}" x2="${SX1}" y2="${BASE}"/>`);

  // Beat marks under the rest line, numbered where there is room.
  const every = [1, 2, 5, 10, 20, 25, 50].find((n) => n * step >= 24) ?? 100;
  let marks = '';
  for (let k = 0; k <= whole; k++) {
    const x = f(SX0 + k * step);
    const lettered = k % every === 0;
    marks += `M${x},${BASE}V${BASE + (lettered ? 8 : 5)}`;
    if (lettered) out.push(`<text class="dim" x="${x}" y="${BASE + 22}" font-size="11.5" text-anchor="middle">${k}</text>`);
  }
  // The two ends of the second stand a little taller.
  marks += `M${SX0},${BASE}V${BASE + 11}M${SX1},${BASE}V${BASE + 11}`;
  out.push(`<path class="ink-fine" d="${marks}"/>`);

  // The index that travels along the strip in step with the balance.
  out.push(`<line data-stem="" x1="${SX0}" y1="${BASE}" x2="${SX0}" y2="${BASE}" style="stroke:var(--gold);stroke-width:1"/>`);
  out.push(`<circle data-dot="" cx="${SX0}" cy="${BASE}" r="3" ${gold}/>`);

  return out.join('');
}
