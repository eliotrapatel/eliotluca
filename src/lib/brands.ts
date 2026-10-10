// The three houses the header can switch between. Each wordmark is set in
// Gravesend Sans capitals with its own tracking; each keeps its own colours.
import { site } from '../data/site';

export type BrandId = 'eliot' | 'entity' | 'orbes';

export interface Brand {
  id: BrandId;
  name: string;
  text: string; // the wordmark, in capitals
  tracking: number; // em
  space: number; // extra word space, em
  href: string;
  ink: string;
  accent: string;
  ground: string;
  cta: { label: string; href: string; external?: boolean };
}

export const BRANDS: Record<BrandId, Brand> = {
  eliot: {
    id: 'eliot',
    name: 'Eliot Luca',
    text: 'ELIOT LUCA',
    tracking: 0.3,
    space: 0.12,
    href: '/',
    ink: '#f1efe9',
    accent: '#cdb68a',
    ground: '#050506',
    cta: { label: 'Get in touch', href: `mailto:${site.email}` },
  },
  entity: {
    id: 'entity',
    name: 'The Entity',
    text: 'THE ENTITY',
    tracking: 0.2,
    space: 0.12,
    href: '/work/the-entity',
    ink: '#f2f1ec',
    accent: '#7abdb4',
    ground: '#0c0c0a',
    cta: { label: 'Open THE ENTITY', href: 'https://joinentity.com', external: true },
  },
  orbes: {
    id: 'orbes',
    name: 'Orbes',
    text: 'ORBES',
    tracking: 0.62,
    space: 0,
    href: '/work/orbes',
    ink: '#f6f2ea',
    accent: '#f6f2ea',
    ground: '#0a0a0a',
    cta: { label: 'Visit ORBES', href: 'https://verify.theorbes.com', external: true },
  },
};

export const BRAND_ORDER: BrandId[] = ['eliot', 'entity', 'orbes'];

export const brandForPath = (path: string): BrandId =>
  path.startsWith('/work/the-entity') ? 'entity' : path.startsWith('/work/orbes') ? 'orbes' : 'eliot';
