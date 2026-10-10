// How the lockup moves. Each letter cycles through the alphabet and settles,
// left to right (decode). The name composes, holds still for a second, comes
// apart and composes again; switching house decodes one name into the other.
// Visitors who asked for less motion see the lockup at rest.
import { BRANDS, type BrandId } from './brands';
import { CAP, UPM, glyph, layout, round, seat, type Layout } from './wordmark';

const NS = 'http://www.w3.org/2000/svg';
const POOL = 'ABCDEGHKMNOPRSTUVXYZ';
const OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const IN = 'cubic-bezier(0.7, 0, 0.84, 0)';

const HOLD = 1000; // the name at rest, between composing and coming apart
const GAP = 280; // the empty beat before it composes again

export const prefersStill = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const layoutOf = (id: BrandId): Layout => {
  const b = BRANDS[id];
  return layout(b.text, b.tracking, b.space);
};

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/** A fresh, empty wordmark canvas `w` font units wide, inside `box`. */
function canvas(box: HTMLElement, w: number) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'wm');
  svg.setAttribute('viewBox', `0 0 ${round(w)} ${CAP}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.style.width = `${round(w) / UPM}em`;
  box.replaceChildren(svg);
  return svg;
}

/** The resting wordmark, drawn into `box`. */
export function restInto(box: HTMLElement, L: Layout) {
  const svg = canvas(box, L.width);
  for (const g of L.glyphs) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', g.d);
    p.setAttribute('transform', seat(g.x));
    svg.appendChild(p);
  }
}

/**
 * One slot per letter: the old letter, a scramble, then the new letter.
 * `offset` delays the slots, so several words can decode as one line.
 */
export function decodeInto(box: HTMLElement, from: Layout | null, to: Layout | null, alive: () => boolean, offset = 0) {
  const a = from?.glyphs ?? [];
  const b = to?.glyphs ?? [];
  const n = Math.max(a.length, b.length);
  const svg = canvas(box, Math.max(from?.width ?? 0, to?.width ?? 0));
  const slots = Array.from({ length: n }, () => svg.appendChild(document.createElementNS(NS, 'path')));
  const start = (k: number) => (k + offset) * 38;
  const end = (k: number) => 300 + (k + offset) * 68;
  const last = end(n - 1) + 20;
  const pick = new Array<string>(n).fill('A');
  const flip = new Array<number>(n).fill(-1);
  const show = (p: SVGPathElement, d: string, x: number, scrambling: boolean) => {
    p.setAttribute('d', d);
    p.setAttribute('transform', seat(x));
    if (scrambling) p.setAttribute('class', 'scr');
    else p.removeAttribute('class');
  };

  return new Promise<void>((done) => {
    const t0 = performance.now();
    const tick = (now: number) => {
      if (!alive()) return done();
      const t = now - t0;
      for (let k = 0; k < n; k++) {
        const p = slots[k];
        if (t < start(k)) {
          if (a[k]) show(p, a[k].d, a[k].x, false);
          else p.setAttribute('d', '');
        } else if (t < end(k)) {
          const step = Math.floor(t / 55);
          if (flip[k] !== step) {
            flip[k] = step;
            pick[k] = POOL[(Math.random() * POOL.length) | 0];
          }
          const box = b[k] ?? a[k];
          const gl = glyph(pick[k]);
          show(p, gl.d, box.x + (box.w - gl.w) / 2, true);
        } else if (b[k]) show(p, b[k].d, b[k].x, false);
        else p.setAttribute('d', '');
      }
      if (t < last) requestAnimationFrame(tick);
      else done();
    };
    requestAnimationFrame(tick);
  });
}

/**
 * Words that decode together as one line (the name in the hero): compose,
 * hold, come apart, again. Each element holds one word.
 */
export class NameLoop {
  private words: { box: HTMLElement; L: Layout; offset: number }[] = [];
  private token = 0;

  constructor(boxes: HTMLElement[], tracking: number) {
    let offset = 0;
    for (const box of boxes) {
      const L = layout(box.dataset.word ?? '', tracking);
      this.words.push({ box, L, offset });
      offset += L.glyphs.length;
    }
  }

  stop() {
    this.token++;
  }

  rest() {
    for (const w of this.words) restInto(w.box, w.L);
  }

  private all(dir: 'in' | 'out', alive: () => boolean) {
    return Promise.all(
      this.words.map((w) => decodeInto(w.box, dir === 'out' ? w.L : null, dir === 'in' ? w.L : null, alive, w.offset)),
    );
  }

  async loop({ intro = false } = {}) {
    this.stop();
    if (prefersStill()) return this.rest();
    const token = this.token;
    const alive = () => token === this.token;
    if (intro) await this.all('in', alive);
    if (!alive()) return;
    this.rest();
    while (alive()) {
      await wait(HOLD);
      if (!alive()) return;
      await this.all('out', alive);
      if (!alive()) return;
      await wait(GAP);
      if (!alive()) return;
      await this.all('in', alive);
      if (alive()) this.rest();
    }
  }
}

export class LogoStage {
  root: HTMLElement;
  word: HTMLElement;
  brand: BrandId;
  token = 0;
  private anims: Animation[] = [];
  private looping = false;

  constructor(root: HTMLElement) {
    this.root = root;
    this.word = root.querySelector<HTMLElement>('.lk-word')!;
    this.brand = (root.dataset.brand as BrandId) ?? 'eliot';
  }

  /* ---------- drawing ---------- */

  rest(id: BrandId = this.brand) {
    const L = layoutOf(id);
    restInto(this.word, L);
    this.word.style.width = `${round(L.width) / UPM}em`;
  }

  play(node: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    const a = node.animate(frames, { fill: 'both', ...opts });
    this.anims.push(a);
    return a;
  }

  decode(from: Layout | null, to: Layout | null) {
    const token = this.token;
    return decodeInto(this.word, from, to, () => token === this.token);
  }

  /* ---------- moves ---------- */

  stop() {
    this.token++;
    this.looping = false;
    for (const a of this.anims) a.cancel();
    this.anims = [];
    for (const m of this.root.querySelectorAll('.lk-mark')) m.classList.remove('is-moving');
  }

  mark(id: BrandId) {
    return this.root.querySelector<HTMLElement>(`.lk-mark[data-brand="${id}"]`);
  }

  setBrand(id: BrandId) {
    this.brand = id;
    this.root.dataset.brand = id;
    const name = this.root.querySelector('[data-lk-name]');
    if (name) name.textContent = BRANDS[id].name;
    for (const m of this.root.querySelectorAll<HTMLElement>('.lk-mark')) m.classList.toggle('is-on', m.dataset.brand === id);
  }

  async compose({ mark = false } = {}) {
    if (prefersStill()) return this.rest();
    const token = this.token;
    const m = this.mark(this.brand);
    if (mark && m) this.play(m, [{ opacity: 0, transform: 'rotate(-45deg) scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 1100, easing: OUT });
    await this.decode(null, layoutOf(this.brand));
    if (token === this.token) this.rest();
  }

  async decompose() {
    if (prefersStill()) return;
    await this.decode(layoutOf(this.brand), null);
  }

  /** Compose, hold, come apart, again, until stopped. */
  async loop({ intro = false } = {}) {
    if (prefersStill()) return this.rest();
    this.stop();
    const token = this.token;
    this.looping = true;
    const live = () => token === this.token && this.looping;
    if (intro) await this.compose({ mark: true });
    else this.rest();
    while (live()) {
      await wait(HOLD);
      if (!live()) return;
      await this.decompose();
      if (!live()) return;
      await wait(GAP);
      if (!live()) return;
      await this.compose();
    }
  }

  async switchTo(id: BrandId) {
    if (id === this.brand) return;
    this.stop();
    const token = this.token;
    const from = this.brand;
    if (prefersStill()) {
      this.setBrand(id);
      return this.rest();
    }
    const L1 = layoutOf(from);
    const L2 = layoutOf(id);
    this.swapMarks(from, id);
    this.setBrand(id);
    if (Math.abs(L1.width - L2.width) > 1) {
      this.play(this.word, [{ width: `${round(L1.width) / UPM}em` }, { width: `${round(L2.width) / UPM}em` }], {
        duration: 900,
        easing: OUT,
        fill: 'none',
      });
    }
    this.word.style.width = `${round(L2.width) / UPM}em`;
    await this.decode(L1, L2);
    if (token !== this.token) return;
    this.anims = [];
    this.rest();
  }

  swapMarks(from: BrandId, to: BrandId) {
    const a = this.mark(from);
    const b = this.mark(to);
    if (a) {
      a.classList.add('is-moving');
      this.play(a, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'rotate(-90deg) scale(.5)' }], { duration: 420, easing: IN })
        .finished.then(() => a.classList.remove('is-moving'))
        .catch(() => {});
    }
    if (b) this.play(b, [{ opacity: 0, transform: 'rotate(90deg) scale(.5)' }, { opacity: 1, transform: 'none' }], { duration: 1000, delay: 260, easing: OUT });
  }
}
