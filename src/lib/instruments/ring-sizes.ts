// Ring sizes: one finger, six sizing systems. Pure functions shared by the
// server render (default state) and the client (live recompute).
// Everything is converted through the inner circumference in millimetres.
//
// Relations used:
//   US and Canada:   inner diameter (mm) = 11.63 + 0.8128 × US size
//   ISO 8653 / EU:   size = inner circumference (mm) = π × inner diameter. France uses the same number.
//   Italy, Spain and Switzerland: size = inner circumference (mm) − 40
//   UK and Australia: BS 6820:1987, size C = 40.0 mm circumference and 1.25 mm per letter,
//                     so A = 37.5 mm; Z+1 onwards continue at 1.25 mm per whole size.
//   Japan: no linear rule. Rows below are taken from the equivalency table in the
//          English Wikipedia article "Ring size" (read October 2026), which lists
//          Japanese sizes against inside diameter in inches; we interpolate linearly
//          between rows. Makers' own tables differ from it by up to about one size.

export type SystemId = 'circumference' | 'diameter' | 'us' | 'uk' | 'iso' | 'italy' | 'japan';

// The accepted range is chosen so that every nearest size the table shows can be
// typed back in. The floor is UK A exactly (37.5 mm round), so ISO rounds up to 38
// and US to ½. The ceiling, 25.25 mm (79.33 mm round), sits just above US 16¾
// (25.24 mm) and ISO 79 (25.15 mm), and above UK Z+8, so no nearest size overshoots it.
export const MIN_DIAMETER = 37.5 / Math.PI;
export const MAX_DIAMETER = 25.25;

/** UK and Australia letters (BS 6820:1987), as [label, circumference mm]. */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const UK_ROWS: { value: string; label: string; circ: number }[] = (() => {
  const rows: { value: string; label: string; circ: number }[] = [];
  for (let i = 0; i < LETTERS.length; i++) {
    const L = LETTERS[i];
    rows.push({ value: L, label: L, circ: 37.5 + 1.25 * i });
    rows.push({ value: `${L}.5`, label: `${L}½`, circ: 37.5 + 1.25 * (i + 0.5) });
  }
  for (let n = 1; n <= 8; n++) rows.push({ value: `Z+${n}`, label: `Z+${n}`, circ: 37.5 + 1.25 * (25 + n) });
  return rows;
})();

/** Japan: [inside diameter in inches, Japanese size]. Source in the header comment. */
const JAPAN_ROWS: [number, number][] = [
  [0.49, 1],
  [0.522, 2],
  [0.538, 3],
  [0.554, 4],
  [0.562, 5],
  [0.578, 6],
  [0.586, 7],
  [0.602, 8],
  [0.618, 9],
  [0.634, 10],
  [0.65, 11],
  [0.658, 12],
  [0.666, 13],
  [0.682, 14],
  [0.698, 15],
  [0.714, 16],
  [0.73, 17],
  [0.746, 18],
  [0.762, 19],
  [0.778, 20],
  [0.786, 21],
  [0.794, 22],
  [0.81, 23],
  [0.826, 24],
  [0.842, 25],
  [0.858, 26],
  [0.874, 27],
];
const JP = JAPAN_ROWS.map(([inch, size]) => ({ d: inch * 25.4, size }));

export const SYSTEMS: Record<SystemId, { label: string; short: string; unit: string; example: string }> = {
  diameter: { label: 'Inner diameter', short: 'diameter', unit: 'mm', example: '17' },
  circumference: { label: 'Inner circumference', short: 'circumference', unit: 'mm', example: '53.4' },
  us: { label: 'US and Canada', short: 'US', unit: 'US size', example: '6.5' },
  uk: { label: 'UK and Australia', short: 'UK', unit: 'UK letter', example: 'M½' },
  iso: { label: 'ISO 8653, EU and France', short: 'EU', unit: 'EU size', example: '53' },
  italy: { label: 'Italy, Spain and Switzerland', short: 'Italian', unit: 'size', example: '13' },
  japan: { label: 'Japan', short: 'Japanese', unit: 'JP size', example: '13' },
};
export const SYSTEM_IDS = Object.keys(SYSTEMS) as SystemId[];

export const DEFAULT_INPUT: { by: SystemId; value: string } = { by: 'diameter', value: '17' };

const circOfDiameter = (d: number) => Math.PI * d;
const diameterOfCirc = (c: number) => c / Math.PI;
const usDiameter = (s: number) => 11.63 + 0.8128 * s;
const usOfDiameter = (d: number) => (d - 11.63) / 0.8128;

/** Japanese size (fractional) for an inner diameter, or null outside the table. */
function japanOfDiameter(d: number): number | null {
  if (d < JP[0].d - 1e-9 || d > JP[JP.length - 1].d + 1e-9) return null;
  for (let i = 1; i < JP.length; i++) {
    if (d <= JP[i].d) {
      const a = JP[i - 1];
      const b = JP[i];
      return a.size + ((d - a.d) / (b.d - a.d)) * (b.size - a.size);
    }
  }
  return JP[JP.length - 1].size;
}

/** Inner diameter for a (fractional) Japanese size, interpolated between rows. */
function diameterOfJapan(s: number): number | null {
  if (s < 1 || s > 27) return null;
  for (let i = 1; i < JP.length; i++) {
    if (s <= JP[i].size) {
      const a = JP[i - 1];
      const b = JP[i];
      return a.d + ((s - a.size) / (b.size - a.size)) * (b.d - a.d);
    }
  }
  return JP[JP.length - 1].d;
}

/** Parse "16.5" or "16,5". */
export function parseDecimal(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const mm = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtMm = (v: number) => mm.format(v);
const whole = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

export function fmtUs(s: number): string {
  const n = Math.floor(s + 1e-9);
  const q = Math.round((s - n) * 4);
  const frac = ['', '¼', '½', '¾'][q] ?? '';
  return n === 0 && frac ? frac : `${n}${frac}`;
}

/** Range of each system that maps to the accepted diameters, for messages. */
function rangeText(by: SystemId): string {
  switch (by) {
    case 'diameter':
      return '11.94 to 25.25 mm';
    case 'circumference':
      return '37.5 to 79.32 mm';
    case 'us':
      return 'US ½ to 16¾';
    case 'iso':
      return '38 to 79';
    case 'italy':
      return '1 to 39';
    case 'japan':
      return '1 to 27';
    case 'uk':
      return 'A to Z+8';
  }
}

/** A diameter for an out-of-range message: a third decimal when two would read as the limit itself. */
function fmtEdge(d: number): string {
  const two = fmtMm(d);
  return two === fmtMm(MIN_DIAMETER) || two === fmtMm(MAX_DIAMETER) ? (Math.round(d * 1000) / 1000).toFixed(3) : two;
}

export type Parsed = { ok: true; diameter: number } | { ok: false; error: string };

/** Convert one typed size into an inner diameter, with an error that names the problem and the fix. */
export function toDiameter(by: SystemId, raw: string): Parsed {
  const sys = SYSTEMS[by];
  if (by === 'uk') {
    const row = UK_ROWS.find((r) => r.value === raw);
    if (!row) return { ok: false, error: 'Choose a UK letter from the list, A to Z+8.' };
    return { ok: true, diameter: diameterOfCirc(row.circ) };
  }
  if (raw.trim() === '') return { ok: false, error: `Enter a ${sys.short} size, for example ${sys.example}.` };
  const n = parseDecimal(raw);
  if (n === null) return { ok: false, error: `Use digits only, for example ${sys.example}.` };
  let d: number | null;
  switch (by) {
    case 'diameter':
      d = n;
      break;
    case 'circumference':
    case 'iso':
      d = diameterOfCirc(n);
      break;
    case 'us':
      d = usDiameter(n);
      break;
    case 'italy':
      if (n < 1) return { ok: false, error: 'Italian sizes start at 1. Enter a size from 1 to 39.' };
      d = diameterOfCirc(n + 40);
      break;
    case 'japan':
      if (!Number.isInteger(n)) return { ok: false, error: 'Japanese sizes are whole numbers. Enter one from 1 to 27.' };
      d = diameterOfJapan(n);
      if (d === null) return { ok: false, error: 'The Japanese table here runs from 1 to 27. Enter a size in that range.' };
      break;
  }
  if (d < MIN_DIAMETER - 1e-9 || d > MAX_DIAMETER + 1e-9) {
    return {
      ok: false,
      error: `That is an inner diameter of ${fmtEdge(d)} mm, outside what this tool covers. Enter ${rangeText(by)}.`,
    };
  }
  return { ok: true, diameter: d };
}

export interface Equivalent {
  id: string;
  system: string;
  size: string;
  /** Exact inner circumference and diameter of that nearest size (mm), or null when off the scale. */
  circ: number | null;
  diameter: number | null;
}

export interface RingResult {
  diameter: number;
  circumference: number;
  rows: Equivalent[];
}

export function compute(diameter: number): RingResult {
  const c = circOfDiameter(diameter);
  const rows: Equivalent[] = [];

  const iso = Math.round(c);
  rows.push({ id: 'iso', system: 'ISO 8653 and EU', size: whole.format(iso), circ: iso, diameter: diameterOfCirc(iso) });
  rows.push({ id: 'fr', system: 'France', size: whole.format(iso), circ: iso, diameter: diameterOfCirc(iso) });

  const it = Math.round(c - 40);
  rows.push(
    it >= 1
      ? { id: 'it', system: 'Italy, Spain and Switzerland', size: whole.format(it), circ: it + 40, diameter: diameterOfCirc(it + 40) }
      : { id: 'it', system: 'Italy, Spain and Switzerland', size: 'Below 1', circ: null, diameter: null },
  );

  const us = Math.max(0, Math.round(usOfDiameter(diameter) * 4) / 4);
  const usD = usDiameter(us);
  rows.push({ id: 'us', system: 'US and Canada', size: fmtUs(us), circ: circOfDiameter(usD), diameter: usD });

  let uk = UK_ROWS[0];
  for (const r of UK_ROWS) if (Math.abs(r.circ - c) < Math.abs(uk.circ - c) - 1e-9) uk = r;
  rows.push({ id: 'uk', system: 'UK and Australia', size: uk.label, circ: uk.circ, diameter: diameterOfCirc(uk.circ) });

  const jf = japanOfDiameter(diameter);
  if (jf === null) {
    rows.push({ id: 'jp', system: 'Japan', size: diameter < JP[0].d ? 'Below 1' : 'Above 27', circ: null, diameter: null });
  } else {
    const j = Math.round(jf);
    const jd = diameterOfJapan(j)!;
    rows.push({ id: 'jp', system: 'Japan', size: whole.format(j), circ: circOfDiameter(jd), diameter: jd });
  }

  return { diameter, circumference: c, rows };
}

/** The value to show in the input when switching system, from the current diameter. */
export function valueIn(by: SystemId, diameter: number): string {
  const c = circOfDiameter(diameter);
  // Round to hundredths, but never past the accepted range, so the value shown can be accepted as typed.
  const r2 = (v: number, lo: number, hi: number) =>
    String(Math.min(Math.floor(hi * 100) / 100, Math.max(Math.ceil(lo * 100) / 100, Math.round(v * 100) / 100)));
  switch (by) {
    case 'diameter':
      return r2(diameter, MIN_DIAMETER, MAX_DIAMETER);
    case 'circumference':
      return r2(c, circOfDiameter(MIN_DIAMETER), circOfDiameter(MAX_DIAMETER));
    case 'iso':
      return String(Math.round(c));
    case 'italy': {
      // Below Italian 1 the finger is off that scale; clamping to 1 would quietly change the finger.
      const it = Math.round(c - 40);
      return it >= 1 ? String(it) : '';
    }
    case 'us':
      return String(Math.max(0, Math.round(usOfDiameter(diameter) * 4) / 4));
    case 'japan': {
      const j = japanOfDiameter(diameter);
      return j === null ? '' : String(Math.round(j));
    }
    case 'uk': {
      let uk = UK_ROWS[0];
      for (const r of UK_ROWS) if (Math.abs(r.circ - c) < Math.abs(uk.circ - c) - 1e-9) uk = r;
      return uk.value;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Drawing: plan and section A-A of a plain court band                 */

export const VIEW = { w: 400, h: 300 };
export const BAND = { width: 3, thickness: 1.8 }; // mm, for the drawing only

const r1 = (v: number) => Math.round(v * 10) / 10;

export function describe(r: RingResult): string {
  return `Plan and section of a ring with an inner diameter of ${fmtMm(r.diameter)} mm and an inner circumference of ${fmtMm(r.circumference)} mm.`;
}

export function drawing(r: RingResult): string {
  const k = 7.2; // drawing units per millimetre
  const cx = 140;
  const cy = 140;
  const Ri = (r.diameter / 2) * k;
  const Ro = (r.diameter / 2 + BAND.thickness) * k;
  const Rm = (Ri + Ro) / 2;
  const sx = 330; // section centre
  const hw = (BAND.width / 2) * k;
  const out: string[] = [];
  const pt = (rad: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${r1(cx + rad * Math.cos(a))},${r1(cy + rad * Math.sin(a))}`;
  };
  const arc = (rad: number, a0: number, a1: number, sweep = 1) =>
    `M${pt(rad, a0)} A${r1(rad)},${r1(rad)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${sweep} ${pt(rad, a1)}`;

  // Centre lines and the shared horizontal axis of both views.
  out.push(`<line class="metal" x1="${r1(cx - Ro - 8)}" y1="${cy}" x2="${r1(sx + hw + 14)}" y2="${cy}"/>`);
  out.push(`<line class="metal" x1="${cx}" y1="${r1(cy - Ro - 12)}" x2="${cx}" y2="${r1(cy + Ro + 12)}"/>`);

  // Plan: shadow on the lower right, heightening on the upper left.
  out.push(
    `<path d="${arc(Ro, 10, 120)} L${pt(Ri, 120)} ${arc(Ri, 120, 10, 0).replace(/^M[^A]+/, '')} Z" style="fill:url(#hatch-ink);stroke:none;opacity:0.7"/>`,
  );
  out.push(`<path class="lead" d="${arc(Rm, 195, 285)}"/>`);
  out.push(`<circle class="ink" cx="${cx}" cy="${cy}" r="${r1(Ro)}"/>`);
  out.push(`<circle class="ink" cx="${cx}" cy="${cy}" r="${r1(Ri)}"/>`);

  // Circumference: an arc dimension on the inner circle, lettered along the left.
  const ra = Ro + 11;
  const label = `circumference ${fmtMm(r.circumference)} mm`;
  // Open the arc wide enough for the lettering (about 6.6 units per character at this size).
  const half = Math.min(80, Math.max(52, ((label.length * 6.6) / (2 * (ra + 5))) * (180 / Math.PI) + 7));
  const a0 = 180 - half;
  const a1 = 180 + half;
  out.push(`<path class="ink-fine" d="${arc(ra, a0, a1)}" marker-start="url(#arrow)" marker-end="url(#arrow)" style="fill:none"/>`);
  out.push(`<path id="ring-circ-path" d="${arc(ra + 5, a0, a1)}" style="fill:none;stroke:none"/>`);
  out.push(
    `<text class="dim" font-size="13"><textPath href="#ring-circ-path" startOffset="50%" text-anchor="middle">${label}</textPath></text>`,
  );
  // The arc dimension reads the inner circle: short leaders to it.
  out.push(`<line class="ink-fine" x1="${pt(Ri + 2, a0).split(',')[0]}" y1="${pt(Ri + 2, a0).split(',')[1]}" x2="${pt(ra + 3, a0).split(',')[0]}" y2="${pt(ra + 3, a0).split(',')[1]}" style="opacity:0.55"/>`);
  out.push(`<line class="ink-fine" x1="${pt(Ri + 2, a1).split(',')[0]}" y1="${pt(Ri + 2, a1).split(',')[1]}" x2="${pt(ra + 3, a1).split(',')[0]}" y2="${pt(ra + 3, a1).split(',')[1]}" style="opacity:0.55"/>`);

  // Cutting plane A-A through the plan, viewed from the right.
  for (const sgn of [-1, 1]) {
    const yEnd = r1(cy + sgn * (Ro + 12));
    const yIn = r1(cy + sgn * (Ro + 3));
    out.push(`<line class="ink-bold" x1="${cx}" y1="${yIn}" x2="${cx}" y2="${yEnd}"/>`);
    out.push(`<line class="ink-fine" x1="${cx}" y1="${yEnd}" x2="${cx + 16}" y2="${yEnd}" marker-end="url(#arrow)"/>`);
    out.push(`<text class="dim" x="${cx + 21}" y="${r1(Number(yEnd) + 4)}" font-size="13.5" style="fill:var(--line)">A</text>`);
  }

  // Projection lines from the plan to the section.
  for (const y of [cy - Ro, cy - Ri, cy + Ri, cy + Ro]) {
    out.push(`<line class="metal" x1="${r1(cx + Ro + 10)}" y1="${r1(y)}" x2="${r1(sx - hw - 6)}" y2="${r1(y)}" style="opacity:0.7"/>`);
  }

  // Section A-A: two cut profiles (court shape: domed outside, eased inside), hatched.
  const profile = (yOuter: number, yInner: number) => {
    const dir = Math.sign(yInner - yOuter); // +1 when the inner face lies below the outer one
    const x0 = r1(sx - hw);
    const x1 = r1(sx + hw);
    const oc = r1(yOuter + dir * 2.4); // outer corners; the dome peaks on the outer radius
    const op = r1(yOuter - dir * 2.4);
    const ic = r1(yInner - dir * 1); // inner corners; the eased face peaks on the bore
    const ip = r1(yInner + dir * 1);
    return `M${x0},${ic} L${x0},${oc} Q${sx},${op} ${x1},${oc} L${x1},${ic} Q${sx},${ip} ${x0},${ic} Z`;
  };
  const top = profile(cy - Ro, cy - Ri);
  const bot = profile(cy + Ro, cy + Ri);
  out.push(`<path d="${top}" style="fill:url(#hatch-ink);stroke:none"/>`);
  out.push(`<path d="${bot}" style="fill:url(#hatch-ink);stroke:none"/>`);
  out.push(`<path class="ink" d="${top}"/>`);
  out.push(`<path class="ink" d="${bot}"/>`);
  // The far half of the band, seen through the cut.
  out.push(`<line class="ink-fine" x1="${r1(sx - hw)}" y1="${r1(cy - Ri)}" x2="${r1(sx - hw)}" y2="${r1(cy + Ri)}"/>`);
  out.push(`<line class="ink-fine" x1="${r1(sx + hw)}" y1="${r1(cy - Ri)}" x2="${r1(sx + hw)}" y2="${r1(cy + Ri)}"/>`);
  out.push(`<rect x="${r1(sx - hw)}" y="${r1(cy - Ri)}" width="${r1(hw * 2)}" height="${r1(Ri * 2)}" style="fill:url(#hatch);stroke:none;opacity:0.55"/>`);

  // Inner diameter: the governing dimension, on the section.
  const dx = sx + hw + 34;
  out.push(`<line class="ink-fine" x1="${r1(sx + hw + 4)}" y1="${r1(cy - Ri)}" x2="${r1(dx + 5)}" y2="${r1(cy - Ri)}"/>`);
  out.push(`<line class="ink-fine" x1="${r1(sx + hw + 4)}" y1="${r1(cy + Ri)}" x2="${r1(dx + 5)}" y2="${r1(cy + Ri)}"/>`);
  out.push(
    `<line class="ink-fine" x1="${dx}" y1="${r1(cy - Ri + 0.5)}" x2="${dx}" y2="${r1(cy + Ri - 0.5)}" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`,
  );
  out.push(
    `<text class="dim" font-size="14.5" text-anchor="middle" transform="translate(${dx - 7} ${cy}) rotate(-90)" style="fill:var(--line)">Ø ${fmtMm(r.diameter)} mm</text>`,
  );

  // Band width, under the section.
  const wy = r1(cy + Ro + 16);
  out.push(`<line class="ink-fine" x1="${r1(sx - hw)}" y1="${r1(cy + Ro + 4)}" x2="${r1(sx - hw)}" y2="${r1(Number(wy) + 4)}"/>`);
  out.push(`<line class="ink-fine" x1="${r1(sx + hw)}" y1="${r1(cy + Ro + 4)}" x2="${r1(sx + hw)}" y2="${r1(Number(wy) + 4)}"/>`);
  out.push(`<line class="ink-fine" x1="${r1(sx - hw - 14)}" y1="${wy}" x2="${r1(sx - hw)}" y2="${wy}" marker-end="url(#arrow)"/>`);
  out.push(`<line class="ink-fine" x1="${r1(sx + hw + 14)}" y1="${wy}" x2="${r1(sx + hw)}" y2="${wy}" marker-end="url(#arrow)"/>`);
  out.push(`<text class="dim" x="${r1(sx + hw + 18)}" y="${r1(Number(wy) + 4)}" font-size="12.5">${BAND.width} mm</text>`);

  // View titles.
  out.push(`<text class="note" x="${cx}" y="${VIEW.h - 10}" font-size="16" text-anchor="middle">Plan</text>`);
  out.push(`<text class="note" x="${sx}" y="${VIEW.h - 10}" font-size="16" text-anchor="middle">Section A-A</text>`);

  return out.join('');
}
