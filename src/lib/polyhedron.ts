// Leonardo's skeletal rhombicuboctahedron, drawn for Luca Pacioli's
// De divina proportione (1509): "Vigintisexbasium planum vacuum".
// Shared by the server render (first frame) and the client (rotation).

type V3 = [number, number, number];

export type FacePath = { d: string; cls: string };

const R2 = 1 + Math.SQRT2;

function vertices(): V3[] {
  const out: V3[] = [];
  const base: V3[] = [
    [1, 1, R2],
    [1, R2, 1],
    [R2, 1, 1],
  ];
  for (const [a, b, c] of base) {
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) out.push([a * sx, b * sy, c * sz]);
  }
  return out;
}

const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

function faceNormals(): V3[] {
  const ns: V3[] = [];
  // 6 axial squares
  for (const s of [-1, 1]) {
    ns.push([s, 0, 0], [0, s, 0], [0, 0, s]);
  }
  // 12 edge squares
  for (const a of [-1, 1])
    for (const b of [-1, 1]) {
      ns.push(norm([a, b, 0]), norm([a, 0, b]), norm([0, a, b]));
    }
  // 8 triangles
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) ns.push(norm([a, b, c]));
  return ns;
}

type Face = { n: V3; idx: number[] };

let cached: { verts: V3[]; faces: Face[] } | null = null;

export function geometry() {
  if (cached) return cached;
  const verts = vertices();
  const faces: Face[] = faceNormals().map((n) => {
    let max = -Infinity;
    for (const v of verts) max = Math.max(max, dot(v, n));
    const idx = verts.map((v, i) => [dot(v, n), i] as const).filter(([d]) => d > max - 1e-6).map(([, i]) => i);
    // Order the face's vertices around its centroid.
    const c: V3 = [0, 0, 0];
    for (const i of idx) for (let k = 0; k < 3; k++) c[k] += verts[i][k] / idx.length;
    const u = norm([verts[idx[0]][0] - c[0], verts[idx[0]][1] - c[1], verts[idx[0]][2] - c[2]]);
    const w: V3 = norm([n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]]);
    idx.sort((a, b) => {
      const pa: V3 = [verts[a][0] - c[0], verts[a][1] - c[1], verts[a][2] - c[2]];
      const pb: V3 = [verts[b][0] - c[0], verts[b][1] - c[1], verts[b][2] - c[2]];
      return Math.atan2(dot(pa, w), dot(pa, u)) - Math.atan2(dot(pb, w), dot(pb, u));
    });
    return { n, idx };
  });
  cached = { verts, faces };
  return cached;
}

function rotate(v: V3, yaw: number, pitch: number): V3 {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x1 = v[0] * cy + v[2] * sy;
  const z1 = -v[0] * sy + v[2] * cy;
  const y2 = v[1] * cp - z1 * sp;
  const z2 = v[1] * sp + z1 * cp;
  return [x1, y2, z2];
}

const LIGHT = norm([-0.45, -0.65, 0.62]);

export function render(yaw: number, pitch: number, size = 320, strut = 0.66): FacePath[] {
  const { verts, faces } = geometry();
  const c = size / 2;
  const scale = (size * 0.4) / 2.8;
  const cam = 11;
  const rv = verts.map((v) => rotate(v, yaw, pitch));
  const project = (p: V3): [number, number] => {
    const f = cam / (cam - p[2]);
    return [c + p[0] * scale * f, c + p[1] * scale * f];
  };

  const items = faces.map((face) => {
    const n = rotate(face.n, yaw, pitch);
    const pts = face.idx.map((i) => rv[i]);
    const cz = pts.reduce((s, p) => s + p[2], 0) / pts.length;
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cyy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const inner = pts.map((p): V3 => [cx + (p[0] - cx) * strut, cyy + (p[1] - cyy) * strut, cz + (p[2] - cz) * strut]);
    const outer2 = pts.map(project);
    const inner2 = inner.map(project);
    const poly = (ps: [number, number][]) => 'M' + ps.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z';
    const d = poly(outer2) + poly(inner2.slice().reverse());
    const facing = n[2];
    const lit = dot(n, LIGHT);
    let cls = 'pf-back';
    if (facing > 0) cls = lit > 0.42 ? 'pf-lit' : lit < 0.05 ? 'pf-shade' : 'pf-front';
    return { d, cls, z: cz };
  });

  items.sort((a, b) => a.z - b.z);
  return items.map(({ d, cls }) => ({ d, cls }));
}
