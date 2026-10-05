import type { APIContext } from 'astro';
import { GROUPS, projects, type Group } from '../lib/ship';

// A plain-text summary for AI tools, built from the same project list as the site.
export function GET({ site }: APIContext) {
  const base = String(site ?? 'https://m7sh.github.io/m7sh').replace(/\/$/, '');
  const section = (g: Group) =>
    projects
      .filter((p) => p.group === g)
      .map((p) => `- [${p.name}](${p.site ?? `https://github.com/${p.repo}`}): ${p.tagline}${p.version ? ` Latest release ${p.version}.` : ''} Source: https://github.com/${p.repo}`)
      .join('\n');
  const body = `# m7sh.dev
> Mohammed Musharaf (m7sh / mush) is a Linux rice artisan, Wayland widget developer, and creator of ame, mush.workspace, and aesthetic Omarchy themes.

## ${GROUPS.omarchy}
${section('omarchy')}

## ${GROUPS.terminal}
${section('terminal')}

## ${GROUPS.themes}
${section('themes')}

## ${GROUPS.rice}
${section('rice')}

## On this site
- [Ship log](${base}/ship): every release across every project, with release notes. RSS: ${base}/ship.xml
- [Omarchy ecosystem](${base}/omarchy): bar plugins, widgets, and themes.
- One page per project with changelog: ${base}/p/<project>, e.g. ${base}/p/ame, ${base}/p/mush-workspace

## About
- Mohammed Musharaf, Electronics & Communication Engineering (VTU). Linux daily driver (Omarchy + Hyprland).
- GitHub: https://github.com/m7sh
- Email: mdmusharaf720@gmail.com
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
