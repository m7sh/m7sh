import { setTheme, toastTheme } from './theme';
import { copyText } from './ui';

type PaletteEntry = {
  id: string;
  name: string;
  theme: string;
  accent: string;
  palette: { mode: string; border: string; swatches: { name: string; hex: string }[] } | null;
};

const dataEl = document.getElementById('riceData');
if (dataEl) {
  const { paletteKeys } = JSON.parse(dataEl.textContent ?? '{}') as { paletteKeys: PaletteEntry[] };
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

  const tokensEl = document.getElementById('riceTokens');
  const borderPreview = document.getElementById('riceBorderPreview');
  const termPre = document.getElementById('riceTermPre')?.querySelector('code');
  const themesWrap = document.getElementById('riceThemes');

  let activeThemeId = paletteKeys[0]?.id ?? 'velvet-dusk';
  let termMode = 'ame';

  const renderTokens = () => {
    const entry = paletteKeys.find((x) => x.id === activeThemeId) ?? paletteKeys[0];
    if (!entry?.palette) return;
    if (borderPreview) borderPreview.style.background = entry.palette.border;
    if (tokensEl) {
      tokensEl.innerHTML = entry.palette.swatches.slice(0, 6).map((sw) =>
        `<button type="button" class="rtok" data-copy="${esc(sw.hex)}"><i style="background:${esc(sw.hex)}"></i><span>${esc(sw.name)}</span><code>${esc(sw.hex)}</code></button>`,
      ).join('');
    }
  };

  const renderTerm = () => {
    if (!termPre) return;
    const entry = paletteKeys.find((x) => x.id === activeThemeId) ?? paletteKeys[0];
    if (termMode === 'fetch') {
      termPre.textContent = [
        'mush@omarchy',
        '------------',
        'OS      Omarchy Linux (Arch)',
        'WM      Hyprland (Wayland)',
        `Theme   ${entry?.name ?? 'Velvet Dusk'}`,
        'Shell   Quickshell + Zsh',
        'Term    Ghostty / Foot',
        'Audio   PipeWire + CAVA',
      ].join('\n');
    } else {
      termPre.textContent = [
        '$ ame --guest',
        '[t] Trending   [r] Recs   [q] Queue',
        '',
        '▶ Midnight City — M83        02:14 / 04:03',
        '━━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━ 55%',
        'CAVA: ▁▃▅▇█▆▄▂▅▇█▅▃▁',
      ].join('\n');
    }
  };

  themesWrap?.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-rice-theme]');
    if (!btn?.dataset.riceTheme) return;
    activeThemeId = btn.dataset.riceId ?? activeThemeId;
    themesWrap.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === btn));
    setTheme(btn.dataset.riceTheme, btn);
    toastTheme(btn.dataset.riceTheme);
    renderTokens();
    renderTerm();
  });

  document.getElementById('riceWs')?.addEventListener('click', (e) => {
    const dot = (e.target as Element).closest<HTMLElement>('[data-rws]');
    if (!dot) return;
    document.querySelectorAll('#riceWs [data-rws]').forEach((d) => d.classList.toggle('on', d === dot));
  });

  const tracks = ['ame · Midnight City — M83', 'Spotify · Starlight — Muse', 'mpv · Nightcall — Kavinsky'];
  let tr = 0;
  let playing = true;
  document.getElementById('riceMedia')?.addEventListener('click', () => {
    playing = !playing;
    if (playing) tr = (tr + 1) % tracks.length;
    document.getElementById('riceEq')?.classList.toggle('paused', !playing);
    const label = document.getElementById('riceTrack');
    if (label) label.textContent = playing ? tracks[tr] : `⏸ ${tracks[tr]}`;
  });

  const tickers = ['🏎️ Monza GP · 6h 39m', '🏏 IND 300-5 vs SL · Stumps', '⚡ CPU 14% · RAM 6.2G'];
  let tk = 0;
  document.getElementById('riceTicker')?.addEventListener('click', (e) => {
    tk = (tk + 1) % tickers.length;
    (e.currentTarget as HTMLElement).textContent = tickers[tk];
  });

  document.querySelectorAll<HTMLElement>('[data-rwin]').forEach((win) => {
    win.addEventListener('click', () => {
      document.querySelectorAll('[data-rwin]').forEach((w) => w.classList.remove('active'));
      win.classList.add('active');
    });
  });

  document.querySelector('.rice-term-tabs')?.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-rterm]');
    if (!b?.dataset.rterm) return;
    termMode = b.dataset.rterm;
    document.querySelectorAll('[data-rterm]').forEach((x) => x.classList.toggle('on', x === b));
    renderTerm();
  });

  const syncClock = () => {
    const c = document.getElementById('riceClock');
    if (c) c.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  syncClock();
  setInterval(syncClock, 30e3);

  renderTokens();
  renderTerm();

  /* ---------- Installer generator ---------- */
  const outCode = document.getElementById('instOutput');
  const countEl = document.getElementById('instCount');
  const copyBtn = document.getElementById('instCopyBtn');
  let latestCmd = '';

  const rebuildCmd = () => {
    const inputs = [...document.querySelectorAll<HTMLInputElement>('#instTheme input:checked, #instPlugins input:checked, #instTools input:checked')];
    const cmds = inputs.map((i) => i.value.trim()).filter(Boolean);
    if (countEl) countEl.textContent = `${cmds.length} command${cmds.length === 1 ? '' : 's'} queued`;
    latestCmd = cmds.length ? cmds.join(' && \\\n  ') : '# Select at least one theme, plugin, or tool above.';
    if (outCode) outCode.textContent = latestCmd;
  };

  document.querySelector('.rice-grid')?.addEventListener('change', rebuildCmd);
  copyBtn?.addEventListener('click', () => {
    if (!latestCmd || latestCmd.startsWith('#')) return;
    copyText(latestCmd.replace(/ \\\n {2}/g, ' '));
  });
  rebuildCmd();
}
