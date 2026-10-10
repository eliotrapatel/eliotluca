// Solid: seven solids, their counts, their measures and their weight for a
// given edge and density, with a wireframe to turn. Pure functions shared by
// the server render (default state) and the client (live recompute, rotation).
// Deliberately ignored: wall thickness and hollow forms, material tolerances,
// rounded edges and finish. The weight is that of a full block.

type V3 = [number, number, number];
type Sides = 3 | 4 | 5;

export type SolidId =
  | 'tetrahedron'
  | 'cube'
  | 'octahedron'
  | 'dodecahedron'
  | 'icosahedron'
  | 'cuboctahedron'
  | 'rhombicuboctahedron';

export type SolidKey = 'edge' | 'density';

export interface SolidInputs {
  solid: SolidId;
  /** Edge length, mm. */
  edge: number;
  /** Density, g/cm³. */
  density: number;
}

export interface FieldSpec {
  /** Short key used in the query string. */
  q: string;
  min: number;
  max: number;
  /** How the field is named inside an error message. */
  noun: string;
  example: string;
  /** How the default is written in the field. */
  text: string;
}

/** Leonardo's solid, at an edge of one centimetre, in water. */
export const SOLID_DEFAULTS: SolidInputs = {
  solid: 'rhombicuboctahedron',
  edge: 10,
  density: 1,
};

export const SOLID_FIELDS: Record<SolidKey, FieldSpec> = {
  edge: { q: 'a', min: 1, max: 1000, noun: 'the edge length in millimetres', example: '10', text: '10' },
  density: { q: 'd', min: 0.01, max: 25, noun: 'the density in grams per cubic centimetre', example: '1.00', text: '1.00' },
};

export const SOLID_KEYS = Object.keys(SOLID_FIELDS) as SolidKey[];

/** Query key of the chosen solid. */
export const SOLID_QUERY = 's';

/* ------------------------------------------------------------------ */
/* The seven solids                                                    */

const S2 = Math.SQRT2;
const S3 = Math.sqrt(3);
const S5 = Math.sqrt(5);
const PHI = (1 + S5) / 2;

/** Every sign change of the non-zero coordinates. */
function signs([x, y, z]: V3): V3[] {
  const out: V3[] = [];
  for (const sx of x ? [1, -1] : [1]) for (const sy of y ? [1, -1] : [1]) for (const sz of z ? [1, -1] : [1]) out.push([x * sx, y * sy, z * sz]);
  return out;
}

const cyclic = ([x, y, z]: V3): V3[] => [
  [x, y, z],
  [y, z, x],
  [z, x, y],
];

/** Seed points taken through their cyclic permutations and sign changes, without repeats. */
function orbit(...seeds: V3[]): V3[] {
  const seen = new Set<string>();
  const out: V3[] = [];
  for (const v of seeds.flatMap(cyclic).flatMap(signs)) {
    const key = v.map((c) => c.toFixed(9)).join(' ');
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
}

export interface SolidSpec {
  label: string;
  /** The name inside a sentence, with its article. */
  noun: string;
  vertices: number;
  edges: number;
  /** Faces by number of sides, for example [[3, 8], [4, 18]]. */
  faces: [Sides, number][];
  /** Exact constants for an edge of 1: area × a², volume × a³, radius × a. */
  area: number;
  volume: number;
  /** Radius of the circumscribed sphere. */
  radius: number;
  /** Vertex coordinates from the standard construction, at any scale. */
  points: () => V3[];
}

export const SOLIDS: Record<SolidId, SolidSpec> = {
  tetrahedron: {
    label: 'Tetrahedron',
    noun: 'a tetrahedron',
    vertices: 4,
    edges: 6,
    faces: [[3, 4]],
    area: S3,
    volume: 1 / (6 * S2),
    radius: Math.sqrt(6) / 4,
    // Four alternate corners of the cube.
    points: () => [
      [1, 1, 1],
      [1, -1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
    ],
  },
  cube: {
    label: 'Cube',
    noun: 'a cube',
    vertices: 8,
    edges: 12,
    faces: [[4, 6]],
    area: 6,
    volume: 1,
    radius: S3 / 2,
    points: () => orbit([1, 1, 1]),
  },
  octahedron: {
    label: 'Octahedron',
    noun: 'an octahedron',
    vertices: 6,
    edges: 12,
    faces: [[3, 8]],
    area: 2 * S3,
    volume: S2 / 3,
    radius: 1 / S2,
    points: () => orbit([1, 0, 0]),
  },
  dodecahedron: {
    label: 'Dodecahedron',
    noun: 'a dodecahedron',
    vertices: 20,
    edges: 30,
    faces: [[5, 12]],
    area: 3 * Math.sqrt(25 + 10 * S5),
    volume: (15 + 7 * S5) / 4,
    radius: (S3 * (1 + S5)) / 4,
    // The cube's corners, and a golden rectangle in each of the three planes.
    points: () => orbit([1, 1, 1], [0, 1 / PHI, PHI]),
  },
  icosahedron: {
    label: 'Icosahedron',
    noun: 'an icosahedron',
    vertices: 12,
    edges: 30,
    faces: [[3, 20]],
    area: 5 * S3,
    volume: (5 * (3 + S5)) / 12,
    radius: Math.sqrt(10 + 2 * S5) / 4,
    points: () => orbit([0, 1, PHI]),
  },
  cuboctahedron: {
    label: 'Cuboctahedron',
    noun: 'a cuboctahedron',
    vertices: 12,
    edges: 24,
    faces: [
      [3, 8],
      [4, 6],
    ],
    area: 6 + 2 * S3,
    volume: (5 * S2) / 3,
    radius: 1,
    points: () => orbit([1, 1, 0]),
  },
  rhombicuboctahedron: {
    label: 'Rhombicuboctahedron',
    noun: 'a rhombicuboctahedron',
    vertices: 24,
    edges: 48,
    faces: [
      [3, 8],
      [4, 18],
    ],
    area: 18 + 2 * S3,
    volume: (12 + 10 * S2) / 3,
    radius: Math.sqrt(5 + 2 * S2) / 2,
    points: () => orbit([1, 1, 1 + S2]),
  },
};

export const SOLID_IDS = Object.keys(SOLIDS) as SolidId[];

export function parseSolid(raw: string | null): SolidId | null {
  const s = (raw ?? '').trim().toLowerCase();
  return SOLID_IDS.find((id) => id === s) ?? null;
}

/* ------------------------------------------------------------------ */
/* Geometry: edges and faces found from the vertices alone             */

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

const EPS = 1e-9;

export interface Face {
  /** Outward unit normal. */
  n: V3;
  /** Distance of the face plane from the centre. */
  h: number;
  /** The vertices lying in the plane. */
  idx: number[];
}

export interface Edge {
  a: number;
  b: number;
  /** The two faces that meet along it. */
  f: number[];
}

export interface Geometry {
  /** Vertices scaled so the circumscribed sphere has radius 1. */
  verts: V3[];
  edges: Edge[];
  faces: Face[];
}

const cache = new Map<SolidId, Geometry>();

const faceCount = (s: SolidSpec) => s.faces.reduce((sum, [, count]) => sum + count, 0);

/**
 * Vertices, edges and faces of one solid. Edges are the vertex pairs at the
 * minimum distance; faces are the planes that leave every vertex on one side.
 * Expected V and E: 4/6, 8/12, 6/12, 20/30, 12/30, 12/24, 24/48.
 */
export function geometry(id: SolidId): Geometry {
  const hit = cache.get(id);
  if (hit) return hit;

  const s = SOLIDS[id];
  const raw = s.points();
  const k = 1 / len(raw[0]);
  const verts = raw.map(([x, y, z]): V3 => [x * k, y * k, z * k]);
  const n = verts.length;

  let shortest = Infinity;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) shortest = Math.min(shortest, len(sub(verts[i], verts[j])));

  const faces: Face[] = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let m = j + 1; m < n; m++) {
        const c = cross(sub(verts[j], verts[i]), sub(verts[m], verts[i]));
        const l = len(c);
        if (l < EPS) continue;
        // The centre is inside the solid, so the outward normal points away from it.
        const side = dot(c, verts[i]) < 0 ? -1 : 1;
        const u: V3 = [(c[0] * side) / l, (c[1] * side) / l, (c[2] * side) / l];
        const h = dot(u, verts[i]);
        if (faces.some((f) => dot(f.n, u) > 1 - EPS)) continue;
        if (verts.some((v) => dot(v, u) > h + EPS)) continue;
        faces.push({ n: u, h, idx: verts.flatMap((v, q) => (dot(v, u) > h - EPS ? [q] : [])) });
      }

  const edges: Edge[] = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      if (len(sub(verts[i], verts[j])) > shortest + EPS) continue;
      edges.push({ a: i, b: j, f: faces.flatMap((f, q) => (f.idx.includes(i) && f.idx.includes(j) ? [q] : [])) });
    }

  // The counts are known. A construction that misses them is a bug, not a state to draw.
  const sound =
    verts.length === s.vertices &&
    edges.length === s.edges &&
    faces.length === faceCount(s) &&
    s.faces.every(([sides, count]) => faces.filter((f) => f.idx.length === sides).length === count) &&
    edges.every((e) => e.f.length === 2) &&
    Math.abs(shortest * s.radius - 1) < EPS;
  if (!sound) throw new Error(`Solid: the coordinates of the ${id} do not match its known counts.`);

  const g = { verts, edges, faces };
  cache.set(id, g);
  return g;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */

/** Parse a typed number. Accepts "1000", "1,000", "1 000", "2.5" and "2,5". */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().replace(/[\s_  ]/g, '');
  if (s === '') return null;
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const plain = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 3 });

/** Validate one raw field value; returns the number or an error naming the problem and the fix. */
export function validateField(key: SolidKey, raw: string): { value: number } | { error: string } {
  const f = SOLID_FIELDS[key];
  const n = parseNumber(raw);
  if (n === null) {
    return { error: raw.trim() === '' ? `Enter ${f.noun}, for example ${f.example}.` : `Use digits only for ${f.noun}, for example ${f.example}.` };
  }
  if (n < f.min || n > f.max) {
    return { error: `That is outside the range. Enter ${f.noun} from ${plain.format(f.min)} to ${plain.format(f.max)}.` };
  }
  return { value: n };
}

/* ------------------------------------------------------------------ */
/* Measures                                                            */

export interface SolidResult {
  inputs: SolidInputs;
  spec: SolidSpec;
  vertices: number;
  edges: number;
  faces: number;
  /** V − E + F, which is 2 for every convex solid. */
  euler: number;
  /** Surface area, cm². */
  area: number;
  /** Volume, cm³. */
  volume: number;
  /** Diameter of the circumscribed sphere, mm. */
  diameter: number;
  /** Weight of the full solid, g. */
  weight: number;
}

export function compute(i: SolidInputs): SolidResult {
  const s = SOLIDS[i.solid];
  // The edge is entered in millimetres; area and volume read in centimetres.
  const a = i.edge / 10;
  const faces = faceCount(s);
  const volume = s.volume * a ** 3;
  return {
    inputs: i,
    spec: s,
    vertices: s.vertices,
    edges: s.edges,
    faces,
    euler: s.vertices - s.edges + faces,
    area: s.area * a ** 2,
    volume,
    diameter: 2 * s.radius * i.edge,
    weight: volume * i.density,
  };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */

const MINUS = '−';

const fmt0 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const fmt1 = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt2 = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sig3 = new Intl.NumberFormat('en-GB', { maximumSignificantDigits: 3 });
const sig4 = new Intl.NumberFormat('en-GB', { maximumSignificantDigits: 4 });
const fmtDensity = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 3 });

/** A measure with the decimals its size deserves: 8.71, 871.4, 8,714, 0.118. */
export function measure(v: number): string {
  if (v >= 1000) return fmt0.format(v);
  if (v >= 100) return fmt1.format(v);
  if (v >= 1) return fmt2.format(v);
  return sig3.format(v);
}

/** Grams, or kilograms from 1,000 g. */
export function weight(g: number): string {
  return g >= 1000 ? `${measure(g / 1000)} kg` : `${measure(g)} g`;
}

export const edgeText = (mm: number) => `${plain.format(mm)} mm`;
export const densityText = (d: number) => `${fmtDensity.format(d)} g/cm³`;

const SHAPES: Record<Sides, string> = { 3: 'triangles', 4: 'squares', 5: 'pentagons' };

/** The face types, for example "8 triangles, 18 squares". */
export function faceText(s: SolidSpec): string {
  return s.faces.map(([sides, count]) => `${count} ${SHAPES[sides]}`).join(', ');
}

/** A constant applied to a power of the edge, for example "8.714 × the edge cubed". */
function power(k: number, word: string): string {
  return Math.abs(k - 1) < EPS ? `the edge ${word}` : `${sig4.format(k)} × the edge ${word}`;
}

/* ------------------------------------------------------------------ */
/* Readout figures and counts                                          */

export interface Figure {
  id: string;
  label: string;
  value: string;
  small: string;
  key?: boolean;
}

export function figures(r: SolidResult): Figure[] {
  const s = r.spec;
  return [
    {
      id: 'volume',
      label: 'Volume',
      value: `${measure(r.volume)} cm³`,
      small: power(s.volume, 'cubed'),
      key: true,
    },
    {
      id: 'weight',
      label: 'Weight',
      value: weight(r.weight),
      small: `at ${densityText(r.inputs.density)}`,
    },
    {
      id: 'area',
      label: 'Surface area',
      value: `${measure(r.area)} cm²`,
      small: power(s.area, 'squared'),
    },
    {
      id: 'sphere',
      label: 'Circumscribed sphere',
      value: `${measure(r.diameter)} mm`,
      small: `diameter, through all ${s.vertices} vertices`,
    },
  ];
}

export interface Count {
  id: string;
  label: string;
  detail: string;
  value: string;
  total?: boolean;
}

/** Vertices, edges and faces, closed by Euler's check. */
export function counts(r: SolidResult): Count[] {
  return [
    { id: 'vertices', label: 'Vertices', detail: '', value: String(r.vertices) },
    { id: 'edges', label: 'Edges', detail: '', value: String(r.edges) },
    { id: 'faces', label: 'Faces', detail: faceText(r.spec), value: String(r.faces) },
    {
      id: 'euler',
      label: `V ${MINUS} E + F`,
      detail: `${r.vertices} ${MINUS} ${r.edges} + ${r.faces}`,
      value: String(r.euler),
      total: true,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Drawing: the wireframe inside its circumscribed sphere              */

export const VIEW = { w: 360, h: 388 };

/** The angle of the server render, and where Reset returns. */
export const HOME = { yaw: -0.62, pitch: 0.42 };

const CX = 180; // centre of the sphere
const CY = 200;
const RAD = 136; // drawn radius of the sphere's outline
const CAM = 5; // eye distance in sphere radii: a light perspective
const SCALE = (RAD * Math.sqrt(CAM * CAM - 1)) / CAM;
const DIM_Y = 356; // dimension line under the sphere

const r2 = (v: number) => v.toFixed(2);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Plain-language description of the drawing, for the SVG <desc>. */
export function describe(r: SolidResult): string {
  const s = r.spec;
  return (
    `Wireframe of ${s.noun} with an edge of ${edgeText(r.inputs.edge)}: ${r.vertices} vertices, ${r.edges} edges and ${r.faces} faces (${faceText(s)}), ` +
    `inside its circumscribed sphere, ${measure(r.diameter)} mm across. ` +
    `Surface ${measure(r.area)} cm², volume ${measure(r.volume)} cm³, weight ${weight(r.weight)} at ${densityText(r.inputs.density)}.`
  );
}

/**
 * Inner SVG markup for the readout drawing at a given turn (radians). Pure, so
 * the server and the client draw the same thing. The solid is scaled to its
 * sphere, not to the edge: the lettering carries the size.
 */
export function drawing(r: SolidResult, yaw: number, pitch: number): string {
  const { verts, edges, faces } = geometry(r.inputs.solid);
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const turn = (v: V3): V3 => {
    const x = v[0] * cy + v[2] * sy;
    const z = -v[0] * sy + v[2] * cy;
    return [x, v[1] * cp - z * sp, v[1] * sp + z * cp];
  };

  const rv = verts.map(turn);
  const pts = rv.map((p): [string, string] => {
    const f = CAM / (CAM - p[2]);
    return [r2(CX + p[0] * SCALE * f), r2(CY + p[1] * SCALE * f)];
  });
  // A face shows when the eye, at distance CAM on the z axis, is on its outer side.
  const shows = faces.map((f) => turn(f.n)[2] * CAM > f.h);

  const front: string[] = [];
  const back: string[] = [];
  const lit = new Set<number>();
  for (const e of edges) {
    const seg = `M${pts[e.a][0]} ${pts[e.a][1]}L${pts[e.b][0]} ${pts[e.b][1]}`;
    if (e.f.some((q) => shows[q])) {
      front.push(seg);
      lit.add(e.a).add(e.b);
    } else {
      back.push(seg);
    }
  }
  let near = 0;
  for (let i = 1; i < rv.length; i++) if (rv[i][2] > rv[near][2]) near = i;

  const out: string[] = [];

  // Lettering: the name and the one length that fixes the solid.
  out.push(`<text class="sd-name" x="2" y="18">${esc(r.spec.label)}</text>`);
  out.push(`<text class="sd-dim" x="2" y="36">Edge ${esc(edgeText(r.inputs.edge))}</text>`);

  // The circumscribed sphere, then the far edges under the near ones.
  out.push(`<circle class="sd-sphere" cx="${CX}" cy="${CY}" r="${RAD}"/>`);
  out.push(`<path class="sd-back" d="${back.join('')}"/>`);
  out.push(`<path class="sd-front" d="${front.join('')}"/>`);
  for (const i of lit) {
    if (i !== near) out.push(`<circle class="sd-node" cx="${pts[i][0]}" cy="${pts[i][1]}" r="1.3"/>`);
  }
  // The single accent: the vertex nearest the eye.
  out.push(`<circle class="sd-near" cx="${pts[near][0]}" cy="${pts[near][1]}" r="2.8"/>`);

  // Dimension line across the sphere, with draughtsman's ticks.
  const x0 = CX - RAD;
  const x1 = CX + RAD;
  out.push(
    `<path class="sd-rule" d="M${x0} ${DIM_Y - 7}V${DIM_Y + 7}M${x1} ${DIM_Y - 7}V${DIM_Y + 7}M${x0} ${DIM_Y}H${x1}M${x0 - 3.5} ${DIM_Y + 3.5}l7 -7M${x1 - 3.5} ${DIM_Y + 3.5}l7 -7"/>`,
  );
  out.push(`<text class="sd-dim" x="${CX}" y="${DIM_Y + 22}" text-anchor="middle">Sphere Ø ${esc(measure(r.diameter))} mm</text>`);

  return out.join('');
}
