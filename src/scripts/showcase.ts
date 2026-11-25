// Interactive sandboxes for ThemeInspector (30 Valorant agents) and ProjectShowcase.
import { copyText } from './ui';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/* ---------- Valorant 30-agent switcher ---------- */
const valDataEl = document.getElementById('valAgentsData');
const valGrid = document.getElementById('valGrid');
const valRoles = document.getElementById('valRoles');
if (valDataEl && valGrid) {
  type Agent = {
    slug: string; theme: string; name: string; role: string; origin: string;
    number: string; signature: string; ultimate: string; accent: string; accent2: string; background: string;
  };
  const agents = JSON.parse(valDataEl.textContent ?? '[]') as Agent[];
  const preview = document.getElementById('valPreview');
  const valNum = document.getElementById('valNum');
  const valRole = document.getElementById('valRole');
  const valOrigin = document.getElementById('valOrigin');
  const valName = document.getElementById('valName');
  const valAbilities = document.getElementById('valAbilities');
  const valSwatches = document.getElementById('valSwatches');
  const valCmd = document.getElementById('valCmd');
  const valCmdText = document.getElementById('valCmdText');

  const selectAgent = (slug: string) => {
    const a = agents.find((x) => x.slug === slug);
    if (!a || !preview) return;
    preview.style.setProperty('--va', a.accent);
    preview.style.setProperty('--va2', a.accent2);
    preview.style.setProperty('--vbg', a.background);
    if (valNum) valNum.textContent = `#${a.number}`;
    if (valRole) valRole.textContent = a.role;
    if (valOrigin) valOrigin.textContent = a.origin;
    if (valName) valName.textContent = a.name;
    if (valAbilities) valAbilities.textContent = `Signature: ${a.signature} · Ultimate: ${a.ultimate}`;
    if (valSwatches) {
      valSwatches.innerHTML = [
        ['bg', a.background],
        ['accent', a.accent],
        ['accent2', a.accent2],
      ].map(([k, hex]) => `<button type="button" class="sw-card" data-copy="${esc(hex)}"><span class="sw-chip" style="background:${esc(hex)}"></span><span class="sw-meta"><strong>${k}</strong><code>${esc(hex)}</code></span></button>`).join('');
    }
    const cmd = `omarchy theme set ${a.theme}`;
    if (valCmd) valCmd.dataset.copy = cmd;
    if (valCmdText) valCmdText.textContent = cmd;
    valGrid.querySelectorAll<HTMLElement>('[data-val-slug]').forEach((btn) => {
      const on = btn.dataset.valSlug === slug;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-selected', String(on));
    });
  };

  valGrid.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-val-slug]');
    if (btn?.dataset.valSlug) selectAgent(btn.dataset.valSlug);
  });

  valRoles?.addEventListener('click', (e) => {
    const chip = (e.target as Element).closest<HTMLElement>('[data-val-role]');
    if (!chip) return;
    const role = chip.dataset.valRole ?? 'All';
    valRoles.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === chip));
    valGrid.querySelectorAll<HTMLElement>('[data-val-role]').forEach((btn) => {
      btn.hidden = role !== 'All' && btn.dataset.valRole !== role;
    });
  });
}

/* ---------- ame interactive TUI ---------- */
const ameBox = document.querySelector('[data-demo="ame"]');
if (ameBox) {
  const lists: Record<string, string[]> = {
    trending: ['Midnight City — M83 (04:03)', 'Resonance — HOME (03:32)', 'Nightcall — Kavinsky (04:18)', 'After Dark — Mr.Kitty (04:19)'],
    recs: ['Starboy — The Weeknd (03:50)', 'Instant Crush — Daft Punk (05:37)', 'Veridis Quo — Daft Punk (05:45)', 'Oblivion — M83 (05:56)'],
    queue: ['1. Midnight City — M83 [playing]', '2. Resonance — HOME', '3. Sunset — The Midnight'],
  };
  const listEl = document.getElementById('ameList');
  const trackEl = document.getElementById('ameTrack');
  const playBtn = document.getElementById('amePlay');
  const cavaEl = document.getElementById('ameCava');
  let curTab = 'trending';
  let curIdx = 0;
  let playing = true;

  const renderAme = () => {
    const rows = lists[curTab] ?? lists.trending;
    if (listEl) {
      listEl.innerHTML = rows.map((r, i) => `<button type="button" class="ame-row${i === curIdx ? ' on' : ''}" data-ame-idx="${i}"><span>${i === curIdx ? '▶' : ' '}</span><span>${esc(r)}</span></button>`).join('');
    }
    if (trackEl) trackEl.textContent = (rows[curIdx] ?? rows[0]).replace(/\s*\([^)]+\)$/, '');
    if (playBtn) playBtn.textContent = playing ? '⏸ Pause' : '▶ Play';
    cavaEl?.classList.toggle('paused', !playing);
  };

  ameBox.addEventListener('click', (e) => {
    const t = e.target as Element;
    const tab = t.closest<HTMLElement>('[data-ame-tab]');
    if (tab?.dataset.ameTab) {
      curTab = tab.dataset.ameTab;
      curIdx = 0;
      ameBox.querySelectorAll('[data-ame-tab]').forEach((b) => b.classList.toggle('on', b === tab));
      renderAme();
      return;
    }
    if (t.closest('[data-ame-vis]')) {
      cavaEl?.classList.toggle('off');
      t.closest('[data-ame-vis]')?.classList.toggle('on');
      return;
    }
    const row = t.closest<HTMLElement>('[data-ame-idx]');
    if (row) { curIdx = Number(row.dataset.ameIdx); playing = true; renderAme(); return; }
    if (t.closest('#amePlay')) { playing = !playing; renderAme(); }
    if (t.closest('#ameNext')) { curIdx = (curIdx + 1) % lists[curTab].length; playing = true; renderAme(); }
  });
  renderAme();
}

/* ---------- mush.workspace interactive bar ---------- */
const wsBar = document.getElementById('wsBar');
if (wsBar) {
  const info = document.getElementById('wsInfo');
  const hideBtn = document.getElementById('wsHideEmpty');
  const numBtn = document.getElementById('wsNumbers');
  let activeWs = 2;
  let hideEmpty = false;
  let showNums = false;

  const syncWs = () => {
    const dots = [...wsBar.querySelectorAll<HTMLElement>('[data-ws]')];
    dots.forEach((d) => {
      const n = Number(d.dataset.ws);
      const wins = Number(d.dataset.windows ?? 0);
      d.classList.toggle('on', n === activeWs);
      d.classList.toggle('numbered', showNums);
      d.hidden = hideEmpty && wins === 0 && n !== activeWs;
    });
    const cur = dots.find((d) => Number(d.dataset.ws) === activeWs);
    const w = Number(cur?.dataset.windows ?? 0);
    if (info) info.textContent = `Workspace ${activeWs} · ${w} window${w === 1 ? '' : 's'} (Hyprland IPC)`;
  };

  wsBar.addEventListener('click', (e) => {
    const dot = (e.target as Element).closest<HTMLElement>('[data-ws]');
    if (dot) { activeWs = Number(dot.dataset.ws); syncWs(); }
  });
  wsBar.addEventListener('wheel', (e) => {
    e.preventDefault();
    activeWs = Math.max(1, Math.min(5, activeWs + (e.deltaY > 0 ? 1 : -1)));
    syncWs();
  }, { passive: false });
  hideBtn?.addEventListener('click', () => {
    hideEmpty = !hideEmpty;
    hideBtn.classList.toggle('on', hideEmpty);
    hideBtn.textContent = `Hide empty: ${hideEmpty ? 'ON' : 'OFF'}`;
    syncWs();
  });
  numBtn?.addEventListener('click', () => {
    showNums = !showNums;
    numBtn.classList.toggle('on', showNums);
    numBtn.textContent = `Numbers: ${showNums ? 'ON' : 'OFF'}`;
    syncWs();
  });
  syncWs();
}

/* ---------- omarchy-media MPRIS demo ---------- */
const mprisBox = document.querySelector('[data-demo="media"]');
if (mprisBox) {
  const tracks: Record<string, string[]> = {
    Spotify: ['After Hours — The Weeknd', 'Starlight — Muse', 'Genesis — Justice'],
    'ame (mpv)': ['Midnight City — M83', 'Nightcall — Kavinsky', 'Resonance — HOME'],
    Qutebrowser: ['Hyprland Wayland Ricing Walkthrough', 'Lofi Chill Beats Radio'],
  };
  let src = 'Spotify';
  let idx = 0;
  let playing = true;
  const txt = document.getElementById('mprisTxt');
  const eq = document.getElementById('mprisEq');
  const toggle = document.getElementById('mprisToggle');
  const meta = document.getElementById('mprisMeta');

  const sync = () => {
    const list = tracks[src];
    if (txt) txt.textContent = `${src} · ${list[idx % list.length]}`;
    if (toggle) toggle.textContent = playing ? '⏸' : '▶';
    eq?.classList.toggle('paused', !playing);
    if (meta) meta.textContent = playing ? 'MPRIS D-Bus active · equalizer syncing' : 'Paused · 8s grace timer before bar collapse';
  };

  mprisBox.addEventListener('click', (e) => {
    const t = e.target as Element;
    const s = t.closest<HTMLElement>('[data-mpris-src]');
    if (s?.dataset.mprisSrc) {
      src = s.dataset.mprisSrc;
      idx = 0;
      playing = true;
      mprisBox.querySelectorAll('[data-mpris-src]').forEach((b) => b.classList.toggle('on', b === s));
      sync();
      return;
    }
    if (t.closest('#mprisToggle')) { playing = !playing; sync(); }
    if (t.closest('#mprisNext')) { idx++; playing = true; sync(); }
  });
  sync();
}

/* ---------- omarchy-iptv demo ---------- */
const iptvStage = document.getElementById('iptvStage');
const iptvBox = document.querySelector('[data-demo="iptv"]');
if (iptvBox && iptvStage) {
  const channels = [
    { name: 'F1 Pitlane Feed', badge: '4K', fav: true, epg: 'Monza GP Qualifying Replay · 18:00–20:00' },
    { name: 'Cricket World HD', badge: 'FHD', fav: true, epg: 'IND vs AUS 2nd Test Day 3 · Live' },
    { name: 'Linux & Open Source TV', badge: 'HD', fav: false, epg: 'Wayland Compositor Deep Dive · 19:00' },
    { name: 'Documentary World', badge: '4K', fav: false, epg: 'Alpine Peaks · Next: Deep Oceans' },
  ];
  let tab = 'live';
  let sel = 0;
  const renderIptv = () => {
    const list = tab === 'favs' ? channels.filter((c) => c.fav) : channels;
    if (tab === 'epg') {
      iptvStage.innerHTML = list.map((c) => `<div class="epg-row"><strong>${esc(c.name)}</strong><span class="ver">${c.badge}</span><span>${esc(c.epg)}</span></div>`).join('');
      return;
    }
    const active = list[sel % list.length] ?? list[0];
    iptvStage.innerHTML = `
      <div class="iptv-list">${list.map((c, i) => `<button type="button" class="ame-row${i === sel % list.length ? ' on' : ''}" data-iptv-i="${i}"><span>${c.fav ? '★' : '·'} ${esc(c.name)}</span><span class="ver">${c.badge}</span></button>`).join('')}</div>
      <div class="iptv-now"><span>Now: ${esc(active.epg)}</span><button type="button" class="demo-btn" data-iptv-play="${esc(active.name)}">▶ mpv --cache=yes</button></div>
    `;
  };
  iptvBox.addEventListener('click', (e) => {
    const t = e.target as Element;
    const tb = t.closest<HTMLElement>('[data-iptv-tab]');
    if (tb?.dataset.iptvTab) {
      tab = tb.dataset.iptvTab;
      iptvBox.querySelectorAll('[data-iptv-tab]').forEach((b) => b.classList.toggle('on', b === tb));
      renderIptv();
      return;
    }
    const row = t.closest<HTMLElement>('[data-iptv-i]');
    if (row) { sel = Number(row.dataset.iptvI); renderIptv(); return; }
    const play = t.closest<HTMLElement>('[data-iptv-play]');
    if (play) copyText(`mpv --wayland-app-id=omarchy-iptv-player --cache=yes "${play.dataset.iptvPlay}"`);
  });
  renderIptv();
}

/* ---------- omarchy-f1 interactive tabs ---------- */
const f1Box = document.querySelector('[data-demo="f1"]');
const f1Stage = document.getElementById('f1Stage');
if (f1Box && f1Stage) {
  const views: Record<string, string> = {
    schedule: `<div class="epg-row"><strong>FP1 · Free Practice 1</strong><span class="ver">Done</span></div><div class="epg-row"><strong>Qualifying</strong><span class="ver">Done</span></div><div class="epg-row"><strong>Italian Grand Prix · Monza</strong><span class="ver" style="border-color:var(--pc)">in 6h 39m</span></div>`,
    drivers: `<div class="epg-row"><strong>1. Max Verstappen · Red Bull</strong><span class="ver">393 pts</span></div><div class="epg-row"><strong>2. Lando Norris · McLaren</strong><span class="ver">331 pts</span></div><div class="epg-row"><strong>3. Charles Leclerc · Ferrari</strong><span class="ver">307 pts</span></div>`,
    constructors: `<div class="epg-row"><strong>1. McLaren Formula 1 Team</strong><span class="ver">593 pts</span></div><div class="epg-row"><strong>2. Scuderia Ferrari</strong><span class="ver">557 pts</span></div><div class="epg-row"><strong>3. Oracle Red Bull Racing</strong><span class="ver">544 pts</span></div>`,
  };
  const renderF1 = (k: string) => { f1Stage.innerHTML = views[k] ?? views.schedule; };
  f1Box.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-f1-tab]');
    if (!b?.dataset.f1Tab) return;
    f1Box.querySelectorAll('[data-f1-tab]').forEach((x) => x.classList.toggle('on', x === b));
    renderF1(b.dataset.f1Tab);
  });
  renderF1('schedule');
}

/* ---------- omarchy-cricket interactive tabs ---------- */
const crBox = document.querySelector('[data-demo="cricket"]');
const crStage = document.getElementById('crStage');
if (crBox && crStage) {
  const views: Record<string, string> = {
    live: `<div class="epg-row"><strong>🇮🇳 India 300-5 vs 🇱🇰 Sri Lanka</strong><span class="ver">Day 1: Stumps</span></div><div class="epg-row"><strong>Over ticker: 1 · 4 · • · W · 6 · 2</strong><span class="ver">CRR 3.45</span></div>`,
    scorecard: `<div class="epg-row"><strong>Batsman A* · 112 (148)</strong><span class="ver">14×4 · 2×6 · SR 75.6</span></div><div class="epg-row"><strong>Batsman B · 48 (71)</strong><span class="ver">6×4 · 1×6 · SR 67.6</span></div>`,
    upcoming: `<div class="epg-row"><strong>🇮🇳 India vs 🇦🇺 Australia · 1st Test</strong><span class="ver">In 2 days</span></div><div class="epg-row"><strong>IPL Fixture Preview</strong><span class="ver">T20 · 19:30 IST</span></div>`,
  };
  const renderCr = (k: string) => { crStage.innerHTML = views[k] ?? views.live; };
  crBox.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-cr-tab]');
    if (!b?.dataset.crTab) return;
    crBox.querySelectorAll('[data-cr-tab]').forEach((x) => x.classList.toggle('on', x === b));
    renderCr(b.dataset.crTab);
  });
  renderCr('live');
}

/* ---------- MovieBox-TUI interactive preview ---------- */
const mbBox = document.querySelector('[data-demo="moviebox"]');
const mbStage = document.getElementById('mbStage');
if (mbBox && mbStage) {
  const modes: Record<string, string[]> = {
    stream: ['[1] Dune: Part Two (2024) · 4K · Subtitles synced', '[2] Oppenheimer (2023) · FHD · Multi-Source', '[3] Severance S02 · Batch Download [d]'],
    tv: ['[LIVE] Formula 1 Pitlane · FHD · mpv', '[LIVE] World News 24 · HD · mpv', '[LIVE] Science & Space · 4K · mpv'],
    addon: ['[ADDON] Community HTTP Catalog v2 · Active', '[ADDON] Subtitle Provider Sync · OpenSubtitles'],
  };
  let mode = 'stream';
  let idx = 0;
  const renderMb = () => {
    const rows = modes[mode] ?? modes.stream;
    mbStage.innerHTML = rows.map((r, i) => `<button type="button" class="ame-row${i === idx ? ' on' : ''}" data-mb-i="${i}"><span>${i === idx ? '>' : ' '}</span><span>${esc(r)}</span></button>`).join('') +
      `<div class="ame-player" style="margin-top:12px"><span class="dim">Ctrl+P: switch mirror · d: batch download · Enter: launch mpv</span></div>`;
  };
  mbBox.addEventListener('click', (e) => {
    const t = e.target as Element;
    const m = t.closest<HTMLElement>('[data-mb-mode]');
    if (m?.dataset.mbMode) {
      mode = m.dataset.mbMode; idx = 0;
      mbBox.querySelectorAll('[data-mb-mode]').forEach((b) => b.classList.toggle('on', b === m));
      renderMb(); return;
    }
    const r = t.closest<HTMLElement>('[data-mb-i]');
    if (r) { idx = Number(r.dataset.mbI); renderMb(); }
  });
  renderMb();
}

/* ---------- Voice Assistant simulator ---------- */
const voiceBox = document.querySelector('[data-demo="voice"]');
const voiceStage = document.getElementById('voiceStage');
if (voiceBox && voiceStage) {
  const cmds: Record<string, { heard: string; action: string; reply: string }> = {
    terminal: { heard: 'Open terminal', action: 'hyprctl dispatch exec ghostty', reply: 'Launching Ghostty on active workspace.' },
    stats: { heard: 'System stats', action: 'psutil.cpu_percent() / memory()', reply: 'CPU 14% · RAM 6.2/32 GB · Omarchy Linux.' },
    music: { heard: 'Play music', action: 'playerctl play-pause', reply: 'Resumed playback via MPRIS D-Bus.' },
  };
  const renderVoice = (k: string) => {
    const c = cmds[k] ?? cmds.terminal;
    voiceStage.innerHTML = `<div style="display:grid;gap:8px"><div><span class="p">mic&gt;</span> <span class="hl">"${esc(c.heard)}"</span></div><div><span class="dim">exec:</span> <code>${esc(c.action)}</code></div><div><span class="p">tts&gt;</span> ${esc(c.reply)}</div></div>`;
  };
  voiceBox.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-voice-cmd]');
    if (!b?.dataset.voiceCmd) return;
    voiceBox.querySelectorAll('[data-voice-cmd]').forEach((x) => x.classList.toggle('on', x === b));
    renderVoice(b.dataset.voiceCmd);
  });
  renderVoice('terminal');
}

/* ---------- Umrah Journey multilingual preview ---------- */
const umrahBox = document.querySelector('[data-demo="umrah"]');
const umrahStage = document.getElementById('umrahStage');
if (umrahBox && umrahStage) {
  const copy: Record<string, { dir: 'ltr' | 'rtl'; title: string; dua: string; sub: string; counterLabel: string }> = {
    en: { dir: 'ltr', title: 'Step 2 · Talbiyah & Entering Makkah', dua: 'Labbayk Allahumma labbayk, labbayka la sharika laka labbayk...', sub: 'Here I am, O Allah, here I am. There is no partner for You.', counterLabel: 'Tawaf circuit' },
    ar: { dir: 'rtl', title: 'الخطوة ٢ · التلبية ودخول مكة', dua: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ', sub: 'إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ لَا شَرِيكَ لَكَ', counterLabel: 'شوط الطواف' },
    ur: { dir: 'rtl', title: 'مرحلہ ۲ · تلبیہ اور مکہ مکرمہ میں داخلہ', dua: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ', sub: 'حاضر ہوں اے اللہ، میں حاضر ہوں، تیرا کوئی شریک نہیں۔', counterLabel: 'طواف چکر' },
  };
  let lang = 'en';
  let circuit = 1;
  const renderUmrah = () => {
    const d = copy[lang] ?? copy.en;
    umrahStage.dir = d.dir;
    umrahStage.innerHTML = `
      <div class="umrah-card">
        <strong>${esc(d.title)}</strong>
        <p class="umrah-dua">${esc(d.dua)}</p>
        <p class="umrah-sub">${esc(d.sub)}</p>
        <div class="umrah-ctrl">
          <button type="button" class="demo-btn" id="umrahStep">${esc(d.counterLabel)}: ${circuit} / 7 (+1)</button>
          <a class="link" style="padding:6px 10px;font-size:12px" href="https://umrah-journey.umrahguide.workers.dev" target="_blank" rel="noreferrer">Open live app ↗</a>
        </div>
      </div>
    `;
  };
  umrahBox.addEventListener('click', (e) => {
    const t = e.target as Element;
    const b = t.closest<HTMLElement>('[data-umrah-lang]');
    if (b?.dataset.umrahLang) {
      lang = b.dataset.umrahLang;
      umrahBox.querySelectorAll('[data-umrah-lang]').forEach((x) => x.classList.toggle('on', x === b));
      renderUmrah();
      return;
    }
    if (t.closest('#umrahStep')) {
      circuit = (circuit % 7) + 1;
      renderUmrah();
    }
  });
  renderUmrah();
}
