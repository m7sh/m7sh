/** Canonical site identity for Mohammed Musharaf (m7sh). */
const envSite = (import.meta.env.SITE ?? 'https://m7sh.github.io/m7sh').replace(/\/$/, '');
const envBase = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

export const BASE_PATH = envBase;
export const SITE_URL = envBase && !envSite.endsWith(envBase) ? `${envSite}${envBase}` : envSite;
export const SITE_NAME = 'm7sh';
export const SITE_TAGLINE = 'Linux rice artisan, Wayland widgets & terminal tools.';
export const FOUNDER = 'Mohammed Musharaf';
export const GITHUB = 'm7sh';
export const TWITTER = '@m7sh';
export const EMAIL = 'mdmusharaf720@gmail.com';
export const SUPPORT_EMAIL = 'mdmusharaf720@gmail.com';
export const PRIVACY_EMAIL = 'mdmusharaf720@gmail.com';
export const BILLING_EMAIL = 'mdmusharaf720@gmail.com';

/** Build a site-relative path honoring BASE_PATH. */
export function withBase(path: string): string {
  if (!path) return BASE_PATH || '/';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('mailto:')) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${clean}` || '/';
}

/** Build a canonical absolute URL preserving subpaths like /m7sh. */
export function siteUrl(path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const root = SITE_URL.replace(/\/$/, '');
  return clean === '/' ? `${root}/` : `${root}${clean}`;
}
