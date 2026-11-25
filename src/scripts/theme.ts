// Omarchy themes for the whole site. T (Shift+T backwards) cycles; the menu picks.
export const THEMES = ['velvet-dusk', 'cyber-dusk', 'cappuccino-night', 'gruvbox', 'everpuccin', 'blacula', 'god-of-war', 'hogwarts-night', 'matugen-theme', 'tokyo-night', 'catppuccin', 'matte-black', 'paper'];

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const btn = document.getElementById('themeBtn');
const menu = document.getElementById('themeMenu');

type Listener = () => void;
const listeners = new Set<Listener>();
/** Canvas code that caches colors re-reads them after a theme change. */
export const onThemeChange = (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn); };

function buildMenu() {
  if (!menu) return;
  menu.innerHTML =
    THEMES.map((t) => `<button type="button" role="menuitemradio" aria-checked="false" data-theme-pick="${t}"><span class="swatches" data-theme="${t}"><i style="background:var(--bg);outline:1px solid var(--line)"></i><i style="background:var(--accent)"></i><i style="background:var(--accent2)"></i></span>${t}</button>`).join('') +
    '<div class="hint">Press <kbd>T</kbd> anywhere to flip through themes. Built for Omarchy & Hyprland.</div>';
}

function syncChrome() {
  const cur = root.dataset.theme ?? 'velvet-dusk';
  const name = document.getElementById('themeName');
  if (name) name.textContent = cur;
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
  menu?.querySelectorAll<HTMLButtonElement>('[data-theme-pick]').forEach((item) => {
    const on = item.dataset.themePick === cur;
    item.classList.toggle('on', on);
    item.setAttribute('aria-checked', String(on));
  });
}

function setMenuOpen(open: boolean, restoreFocus = false) {
  menu?.classList.toggle('open', open);
  btn?.setAttribute('aria-expanded', String(open));
  if (!open && restoreFocus) btn?.focus();
}

export function setTheme(name: string, origin?: Element | null) {
  if (!THEMES.includes(name)) return;
  const apply = () => {
    root.dataset.theme = name;
    try { localStorage.setItem('m7sh-theme', name); } catch { /* Theme still applies without storage. */ }
    syncChrome();
    listeners.forEach((fn) => fn());
  };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  if (!doc.startViewTransition || reduced) return apply();
  const r = (origin ?? btn)?.getBoundingClientRect();
  const x = r ? r.left + r.width / 2 : innerWidth - 60;
  const y = r ? r.top + r.height / 2 : 30;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  doc.startViewTransition(apply).ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' },
    );
  }).catch(() => {});
}

export function toast(html: string) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = html;
  t.classList.add('show');
  clearTimeout(Number(t.dataset.timer));
  t.dataset.timer = String(setTimeout(() => t.classList.remove('show'), 1400));
}

export function toastTheme(name: string) {
  toast(`<span class="swatches"><i style="background:var(--accent)"></i><i style="background:var(--accent2)"></i></span> ${name}`);
}

buildMenu();
syncChrome();

btn?.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = !menu?.classList.contains('open');
  setMenuOpen(open);
  if (open) {
    (menu?.querySelector<HTMLElement>('[data-theme-pick].on') ?? menu?.querySelector<HTMLElement>('[data-theme-pick]'))?.focus();
  }
});

menu?.addEventListener('click', (e) => {
  const pick = (e.target as Element).closest<HTMLElement>('[data-theme-pick]');
  if (pick?.dataset.themePick) {
    setTheme(pick.dataset.themePick, pick);
    toastTheme(pick.dataset.themePick);
  }
});

menu?.addEventListener('keydown', (e) => {
  const items = [...menu.querySelectorAll<HTMLButtonElement>('[data-theme-pick]')];
  const idx = items.indexOf(document.activeElement as HTMLButtonElement);
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    items[(idx + 1) % items.length]?.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    items[(idx - 1 + items.length) % items.length]?.focus();
  } else if (e.key === 'Home') {
    e.preventDefault();
    items[0]?.focus();
  } else if (e.key === 'End') {
    e.preventDefault();
    items[items.length - 1]?.focus();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    setMenuOpen(false, true);
  }
});

document.addEventListener('click', (e) => {
  const target = e.target as Element;
  const preview = target.closest?.<HTMLElement>('[data-theme-preview]');
  if (preview?.dataset.themePreview) {
    e.preventDefault();
    setTheme(preview.dataset.themePreview, preview);
    toastTheme(preview.dataset.themePreview);
    return;
  }
  if (!target.closest?.('#themeMenu') && menu?.classList.contains('open')) {
    setMenuOpen(false);
  }
});

document.addEventListener('keydown', (e) => {
  const target = e.target as Element;
  if (target.closest?.('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape' && menu?.classList.contains('open')) {
    setMenuOpen(false, true);
    return;
  }
  if (document.getElementById('cmdBackdrop')?.hidden === false) return;
  if (e.key !== 't' && e.key !== 'T') return;
  const i = THEMES.indexOf(root.dataset.theme ?? 'velvet-dusk');
  const next = THEMES[(i + (e.shiftKey ? THEMES.length - 1 : 1)) % THEMES.length];
  setTheme(next);
  toastTheme(next);
});
