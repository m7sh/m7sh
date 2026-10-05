// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const isGhPages = process.env.GITHUB_PAGES === 'true' || Boolean(process.env.GITHUB_ACTIONS && !process.env.VERCEL);
const SITE = process.env.SITE_URL || (isGhPages ? 'https://m7sh.github.io/m7sh' : 'https://m7sh.github.io');
const base = process.env.BASE_PATH || (isGhPages ? '/m7sh' : '/');

// https://astro.build/config
export default defineConfig({
  site: SITE,
  base,
  output: 'static',
  adapter: isGhPages ? undefined : vercel({
    isr: false,
  }),
  integrations: [
    sitemap(),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  redirects: {
    '/about': '/#hero',
    '/work': '/#apps',
    '/projects': '/#apps',
    '/contact': 'https://github.com/m7sh',
    '/pages/about.html': '/#hero',
    '/pages/work.html': '/#apps',
    '/pages/stack.html': '/#apps',
    '/pages/contact.html': 'https://github.com/m7sh',
  },
  vite: {
    resolve: {},
  },
});
