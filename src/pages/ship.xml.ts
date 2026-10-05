import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { notesHtml, releases } from '../lib/ship';

// The ship log as RSS: every release with its notes.
export function GET(context: APIContext) {
  return rss({
    title: 'm7sh.dev ship log',
    description: "Every release across Mohammed Musharaf's projects and themes.",
    site: context.site ?? 'https://m7sh.github.io/m7sh',
    items: releases.slice(0, 100).map((r) => ({
      title: `${r.project.name} ${r.tag}`,
      link: r.url,
      pubDate: new Date(r.at),
      content: notesHtml(r.body, r.project),
      categories: [r.project.name],
    })),
  });
}
