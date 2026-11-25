import type { APIContext } from 'astro';
import { SITE_URL } from '../lib/site';

export function GET({ site }: APIContext) {
  const base = (site ? String(site) : SITE_URL).replace(/\/$/, '');
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap-index.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
