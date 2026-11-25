// Global command palette (Ctrl/Cmd+K or /): jump to projects, switch themes, or copy install commands.
import { THEMES, setTheme, toastTheme } from './theme';
import { copyText } from './ui';

type PaletteProject = {
  id: string;
  name: string;
  group: string;
  tagline: string;
  accent: string;
  version: string | null;
  stars: number;
  install: string | null;
  site: string | null;
  repo: string;
  theme: string | null;
};

type PaletteEntry = {
  kind: 'nav' | 'project' | 'theme';
  label: string;
  meta: string;
  search: string;
  accent?: string;
  href?: string;
  external?: boolean;
  install?: string | null;
  theme?: string | null;
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const backdrop = document.getElementById('cmdBackdrop');
const input = document.getElementById('cmdInput') as HTMLInputElement | null;
const list = document.getElementById('cmdList');
const dataEl = document.getElementById('paletteData');
const trigger = document.getElementById('cmdBtn');

if (backdrop && input && list && dataEl) {
  const { base, projects } = JSON.parse(dataEl.textContent ?? '{}') as { base: string; projects: PaletteProject[] };
  const route = (p: string) => `${base}${p}` || '/';

  const items: PaletteEntry[] = [
    { kind: 'nav', label: 'Home', meta: 'Hero activity grid & featured work', search: 'home index hero activity', href: route('/') },
    { kind: 'nav', label: 'Ship log', meta: 'All GitHub releases, commits & RSS feed', search: 'ship log releases commits changelog updates', href: route('/ship') },
    { kind: 'nav', label: 'Omarchy ecosystem', meta: 'Status bar plugins, themes & rices', search: 'omarchy plugins widgets themes ecosystem', href: route('/omarchy') },
    { kind: 'nav', label: 'Rice Lab & Installer', meta: 'Interactive Hyprland simulator & one-line installer', search: 'rice lab simulator hyprland quickshell installer generator', href: route('/rice') },
    { kind: 'nav', label: 'Setup & Dotfiles', meta: 'Omarchy daily driver, keybindings & tech stack', search: 'setup uses dotfiles hyprland keybindings hardware stack', href: route('/setup') },
    { kind: 'nav', label: 'RSS Feed', meta: 'ship.xml atom/rss release stream', search: 'rss xml feed subscribe', href: route('/ship.xml') },
    ...projects.map((p): PaletteEntry => ({
      kind: 'project',
      label: p.name,
      meta: `${p.group}${p.version ? ` · ${p.version}` : ''}${p.stars ? ` · ★ ${p.stars}` : ''}`,
      search: `${p.id} ${p.name} ${p.group} ${p.tagline} ${p.install ?? ''}`.toLowerCase(),
      accent: p.accent,
      href: route(`/p/${p.id}`),
      install: p.install,
      theme: p.theme,
    })),
    ...THEMES.map((t): PaletteEntry => ({
      kind: 'theme',
      label: `Theme: ${t}`,
      meta: 'Apply palette live across site',
      search: `theme palette color ${t}`,
      theme: t,
    })),
  ];

  let filtered = items;
  let active = 0;
  let lastFocus: HTMLElement | null = null;

  const render = () => {
    const q = input.value.trim().toLowerCase();
    const terms = q ? q.split(/\s+/) : [];
    filtered = terms.length
      ? items.filter((item) => terms.every((t) => item.search.includes(t) || item.label.toLowerCase().includes(t)))
      : items;
    if (active >= filtered.length) active = Math.max(0, filtered.length - 1);

    if (!filtered.length) {
      list.innerHTML = '<div class="cmd-empty">No matching projects, routes, or themes.</div>';
      return;
    }

    list.innerHTML = filtered
      .map((item, i) => {
        const badge =
          item.kind === 'theme'
            ? '<span class="cmd-tag">palette</span>'
            : item.kind === 'nav'
              ? '<span class="cmd-tag">route</span>'
              : item.install
                ? `<button type="button" class="cmd-copy" data-cmd-copy="${i}" title="Copy install command">$ copy</button>`
                : '';
        const dot =
          item.kind === 'theme'
            ? `<span class="swatches" data-theme="${esc(item.theme ?? '')}" aria-hidden="true"><i style="background:var(--accent)"></i><i style="background:var(--accent2)"></i></span>`
            : `<span class="cmd-dot" style="background:${esc(item.accent ?? 'var(--accent)')}" aria-hidden="true"></span>`;
        return `<div class="cmd-item${i === active ? ' on' : ''}" role="option" aria-selected="${i === active}" data-idx="${i}">
          ${dot}
          <div class="cmd-main"><strong>${esc(item.label)}</strong><span>${esc(item.meta)}</span></div>
          ${badge}
        </div>`;
      })
      .join('');
  };

  const highlight = (next: number) => {
    if (!filtered.length) return;
    active = (next + filtered.length) % filtered.length;
    const rows = list.querySelectorAll<HTMLElement>('.cmd-item');
    rows.forEach((el, i) => {
      const on = i === active;
      el.classList.toggle('on', on);
      el.setAttribute('aria-selected', String(on));
    });
    rows[active]?.scrollIntoView({ block: 'nearest' });
  };

  const open = () => {
    if (!backdrop.hidden) return;
    lastFocus = document.activeElement as HTMLElement | null;
    backdrop.hidden = false;
    input.value = '';
    active = 0;
    render();
    requestAnimationFrame(() => input.focus());
  };

  const close = () => {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    lastFocus?.focus();
    lastFocus = null;
  };

  const run = (idx: number, copyOnly = false) => {
    const item = filtered[idx];
    if (!item) return;
    if (copyOnly && item.install) {
      copyText(item.install);
      close();
      return;
    }
    if (item.kind === 'theme' && item.theme) {
      setTheme(item.theme, trigger);
      toastTheme(item.theme);
      close();
      return;
    }
    if (item.href) {
      close();
      if (item.external) window.open(item.href, '_blank', 'noreferrer');
      else location.href = item.href;
    }
  };

  trigger?.addEventListener('click', open);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  input.addEventListener('input', () => {
    active = 0;
    render();
  });
  list.addEventListener('click', (e) => {
    const target = e.target as Element;
    const cp = target.closest<HTMLElement>('[data-cmd-copy]');
    if (cp) {
      e.stopPropagation();
      run(Number(cp.dataset.cmdCopy), true);
      return;
    }
    const row = target.closest<HTMLElement>('.cmd-item');
    if (row) run(Number(row.dataset.idx));
  });
  list.addEventListener('pointermove', (e) => {
    const row = (e.target as Element).closest<HTMLElement>('.cmd-item');
    if (row && Number(row.dataset.idx) !== active) highlight(Number(row.dataset.idx));
  });

  document.addEventListener('keydown', (e) => {
    const isK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
    const target = e.target as Element;
    const inField = Boolean(target.closest?.('input, textarea, select, [contenteditable]'));
    if (isK || (e.key === '/' && !inField && backdrop.hidden)) {
      e.preventDefault();
      if (backdrop.hidden) open();
      else close();
      return;
    }
    if (backdrop.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); highlight(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); run(active, e.shiftKey); }
  });
}
