import './pixel-band';
import { SEEN_KEY, lastSeen, updateNavCount } from './ui';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Feed: new markers, filters, commits toggle, expanders ---------- */
const feed = document.getElementById('feed');
const commitFeed = document.getElementById('commitFeed');
const empty = document.getElementById('shipEmpty');
const modeWrap = document.getElementById('shipMode');

if (feed) {
  const entries = [...feed.querySelectorAll<HTMLElement>('.entry')];
  const commitEntries = [...(commitFeed?.querySelectorAll<HTMLElement>('.entry') ?? [])];

  const markNew = () => {
    const seen = lastSeen();
    let n = 0;
    for (const e of entries) {
      const isNew = Number(e.dataset.at) > seen;
      e.classList.toggle('new', isNew);
      const tag = e.querySelector<HTMLElement>('.newtag');
      if (tag) tag.hidden = !isNew;
      if (isNew) n++;
    }
    const bar = document.getElementById('newbar');
    const count = document.getElementById('newCount');
    if (bar && count) {
      bar.hidden = n === 0;
      count.innerHTML = `<b>${n} new release${n === 1 ? '' : 's'}</b> since your last visit`;
    }
  };
  markNew();
  document.getElementById('markRead')?.addEventListener('click', () => {
    try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* Markers just reset next visit. */ }
    const inView = [...feed.querySelectorAll<HTMLElement>('.entry.new .newtag')].filter((t) => { const r = t.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
    const done = () => { markNew(); updateNavCount(); };
    if (reduced || !inView.length) return done();
    inView.forEach((t, i) => t.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(1.25)', opacity: 1, offset: 0.35 }, { transform: 'scale(0)', opacity: 0 }], { duration: 320, delay: i * 70, easing: 'ease-in', fill: 'forwards' }));
    setTimeout(done, 320 + inView.length * 70);
  });

  // Relabel today and yesterday in the visitor's time zone.
  const key = (d: Date) => d.toLocaleDateString('en-CA');
  const today = key(new Date()), yesterday = key(new Date(Date.now() - 864e5));
  feed.querySelectorAll<HTMLElement>('.day').forEach((day) => {
    const label = day.querySelector('.dl');
    if (label && day.dataset.day === today) label.textContent = 'Today';
    else if (label && day.dataset.day === yesterday) label.textContent = 'Yesterday';
  });

  const params = new URLSearchParams(location.search);
  let mode: 'releases' | 'commits' = params.get('view') === 'commits' ? 'commits' : 'releases';
  let group = params.get('group') ?? 'all';
  let project: string | null = params.get('project');

  const syncUrl = () => {
    const url = new URL(location.href);
    if (mode === 'commits') url.searchParams.set('view', 'commits'); else url.searchParams.delete('view');
    if (group !== 'all') url.searchParams.set('group', group); else url.searchParams.delete('group');
    if (project) url.searchParams.set('project', project); else url.searchParams.delete('project');
    history.replaceState(null, '', url);
  };

  const apply = () => {
    const list = mode === 'commits' ? commitEntries : entries;
    if (commitFeed) commitFeed.hidden = mode !== 'commits';
    feed.hidden = mode !== 'releases';

    let shown = 0;
    for (const e of list) {
      const okGroup = group === 'all' || e.dataset.group === group;
      const okProject = !project || e.dataset.project === project;
      const show = okGroup && okProject;
      e.hidden = !show;
      if (show) shown++;
    }
    if (mode === 'releases') {
      feed.querySelectorAll<HTMLElement>('.day').forEach((day) => {
        day.hidden = !day.querySelector('.entry:not([hidden])');
      });
    }
    if (empty) empty.hidden = shown > 0;
    modeWrap?.querySelectorAll<HTMLElement>('[data-ship-mode]').forEach((b) => b.classList.toggle('on', b.dataset.shipMode === mode));

    const chipPool = mode === 'commits' ? commitEntries : entries;
    document.querySelectorAll<HTMLElement>('.chip[data-f]').forEach((c) => {
      const f = c.dataset.f ?? 'all';
      const n = f === 'all' ? chipPool.length : chipPool.filter((e) => e.dataset.group === f).length;
      const sm = c.querySelector('small');
      if (sm) sm.textContent = String(n);
      c.classList.toggle('muted', n === 0);
      c.classList.toggle('on', f === group && !project);
    });
    document.querySelectorAll<HTMLElement>('.side-row').forEach((r) => r.classList.toggle('on', r.dataset.fp === project));
    syncUrl();
  };

  const resetAll = () => {
    group = 'all';
    project = null;
    apply();
  };

  modeWrap?.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-ship-mode]');
    if (!b?.dataset.shipMode) return;
    mode = b.dataset.shipMode === 'commits' ? 'commits' : 'releases';
    apply();
  });

  document.getElementById('chips')?.addEventListener('click', (e) => {
    const chip = (e.target as Element).closest<HTMLElement>('[data-f]');
    if (!chip) return;
    group = chip.dataset.f ?? 'all';
    project = null;
    apply();
  });
  document.querySelectorAll<HTMLElement>('.side-row').forEach((row) => row.addEventListener('click', () => {
    project = project === row.dataset.fp ? null : row.dataset.fp ?? null;
    group = 'all';
    apply();
    document.querySelector('.ship-layout')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }));
  document.getElementById('shipReset')?.addEventListener('click', resetAll);
  document.getElementById('shipShowCommits')?.addEventListener('click', () => { mode = 'commits'; apply(); });
  apply();
}
