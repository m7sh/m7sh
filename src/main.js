/**
 * M7SH · MOHAMMED MUSHARAF PORTFOLIO
 * High-Performance Minimal Terminal Experience Engine
 */

(function () {
    'use strict';

    // --- CONFIG & STATE ---
    const CONFIG = {
        githubUser: 'm7sh',
        themes: ['obsidian', 'velvet-dusk', 'gruvbox', 'matrix', 'everpuccin'],
        themeLabels: {
            'obsidian': 'Obsidian',
            'velvet-dusk': 'Velvet Dusk',
            'gruvbox': 'Gruvbox',
            'matrix': 'Matrix',
            'everpuccin': 'Everpuccin'
        },
        defaultTheme: 'obsidian'
    };

    const state = {
        theme: localStorage.getItem('m7sh_theme') || CONFIG.defaultTheme,
        soundEnabled: localStorage.getItem('m7sh_sound_enabled') === 'true',
        matrixActive: false,
        commandHistory: [],
        historyIndex: -1,
        activeFilter: 'all'
    };

    // --- AUDIO SYNTHESIZER (Pure Web Audio API) ---
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.initialized = false;
        }

        init() {
            if (this.initialized) return;
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                    this.initialized = true;
                }
            } catch (e) {
                console.warn('AudioContext not supported', e);
            }
        }

        playTone(freqStart, freqEnd, type = 'sine', duration = 0.04, maxGain = 0.03) {
            if (!state.soundEnabled) return;
            this.init();
            if (!this.ctx) return;
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = type;
                osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
                if (freqEnd && freqEnd !== freqStart) {
                    osc.frequency.exponentialRampToValueAtTime(Math.max(10, freqEnd), this.ctx.currentTime + duration);
                }

                gain.gain.setValueAtTime(maxGain, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start();
                osc.stop(this.ctx.currentTime + duration);
            } catch (e) {}
        }

        tick() { this.playTone(1200, 700, 'sine', 0.025, 0.015); }
        blip() { this.playTone(480, 960, 'triangle', 0.05, 0.03); }
        key() { this.playTone(600 + Math.random() * 200, 300, 'triangle', 0.015, 0.01); }
        theme() {
            this.playTone(340, 680, 'sine', 0.08, 0.03);
            setTimeout(() => this.playTone(680, 1360, 'sine', 0.1, 0.025), 60);
        }
        success() {
            [440, 554, 659, 880].forEach((f, i) => {
                setTimeout(() => this.playTone(f, f * 1.05, 'sine', 0.12, 0.03), i * 65);
            });
        }
    }

    const sound = new SoundEngine();

    // --- TOAST NOTIFICATIONS ---
    function showToast(msg, icon = '✓') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span style="color: var(--primary); font-weight: bold;">${icon}</span> <span>${msg}</span>`;
        container.appendChild(toast);

        sound.blip();

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 250);
        }, 2800);
    }

    // --- CLIPBOARD COPY HELPER ---
    function copyToClipboard(text, label = 'Copied to clipboard') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showToast(label);
                sound.success();
            }).catch(() => fallbackCopy(text, label));
        } else {
            fallbackCopy(text, label);
        }
    }

    function fallbackCopy(text, label) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showToast(label);
            sound.success();
        } catch (err) {
            showToast('Failed to copy', '✕');
        }
        document.body.removeChild(ta);
    }

    // --- THEME ENGINE ---
    function applyTheme(themeName) {
        if (!CONFIG.themes.includes(themeName)) {
            themeName = CONFIG.defaultTheme;
        }

        state.theme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('m7sh_theme', themeName);

        const labelEl = document.getElementById('theme-btn-label');
        if (labelEl) {
            labelEl.textContent = CONFIG.themeLabels[themeName] || themeName;
        }

        sound.theme();
    }

    function cycleTheme() {
        const currentIndex = CONFIG.themes.indexOf(state.theme);
        const nextIndex = (currentIndex + 1) % CONFIG.themes.length;
        const nextTheme = CONFIG.themes[nextIndex];
        applyTheme(nextTheme);
        showToast(`Theme switched to ${CONFIG.themeLabels[nextTheme] || nextTheme}`, '🎨');
    }

    // --- SOUND TOGGLE ---
    function toggleSound() {
        state.soundEnabled = !state.soundEnabled;
        localStorage.setItem('m7sh_sound_enabled', state.soundEnabled);

        const indicator = document.getElementById('sound-indicator');
        if (indicator) {
            indicator.textContent = state.soundEnabled ? 'SFX: ON' : 'SFX: OFF';
            indicator.className = state.soundEnabled ? 'sound-on' : 'sound-off';
        }

        if (state.soundEnabled) {
            sound.init();
            sound.success();
            showToast('Audio synthesizer enabled', '🔊');
        } else {
            showToast('Audio synthesizer muted', '🔇');
        }
    }

    // --- MATRIX DIGITAL RAIN SIMULATION ---
    let matrixInterval = null;
    function toggleMatrixRain(forceState = null) {
        const canvas = document.getElementById('matrix-canvas');
        if (!canvas) return;

        state.matrixActive = forceState !== null ? forceState : !state.matrixActive;

        if (state.matrixActive) {
            canvas.classList.add('active');
            startMatrixAnimation(canvas);
            showToast('Matrix digital rain active (type "matrix" to toggle)', '⚡');
        } else {
            canvas.classList.remove('active');
            if (matrixInterval) {
                clearInterval(matrixInterval);
                matrixInterval = null;
            }
            showToast('Matrix simulation stopped', '⏹');
        }
    }

    function startMatrixAnimation(canvas) {
        if (matrixInterval) clearInterval(matrixInterval);
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
        const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>{}/*+=~$_';
        const alphabet = katakana + latin;

        const fontSize = 16;
        const columns = Math.floor(canvas.width / fontSize);
        const rainDrops = Array.from({ length: columns }).fill(1);

        matrixInterval = setInterval(() => {
            ctx.fillStyle = 'rgba(7, 9, 14, 0.08)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'var(--primary)';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < rainDrops.length; i++) {
                const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

                if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    rainDrops[i] = 0;
                }
                rainDrops[i]++;
            }
        }, 36);
    }

    // --- PROJECT FILTERING ---
    function setupProjectFilters() {
        const tabs = document.querySelectorAll('.filter-tab');
        const cards = document.querySelectorAll('.project-card');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                sound.tick();
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const filter = tab.getAttribute('data-filter');
                state.activeFilter = filter;

                cards.forEach(card => {
                    const cat = card.getAttribute('data-category');
                    if (filter === 'all' || cat === filter) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // Initialize counts
        const allCount = cards.length;
        const pluginCount = document.querySelectorAll('.project-card[data-category="plugin"]').length;
        const themeCount = document.querySelectorAll('.project-card[data-category="theme"]').length;
        const toolCount = document.querySelectorAll('.project-card[data-category="tool"]').length;

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setVal('count-all', allCount);
        setVal('count-plugin', pluginCount);
        setVal('count-theme', themeCount);
        setVal('count-tool', toolCount);
    }

    // --- INTERACTIVE VIRTUAL TERMINAL CLI ---
    const CLI_COMMANDS = {
        help: {
            desc: 'Display list of available commands',
            exec: () => `
<span class="term-cyan">M7SH Virtual Terminal Shell v2.4 (Quickshell / Omarchy)</span>
Available commands:
  <span class="term-green">whoami</span>        Display developer identity and brief bio
  <span class="term-green">fastfetch</span>     Display system telemetry & ASCII architecture
  <span class="term-green">projects</span>      Inspect all public projects and repositories
  <span class="term-green">plugins</span>       List modular Omarchy status bar QML widgets
  <span class="term-green">themes</span>        List custom Omarchy desktop themes
  <span class="term-green">skills</span>        Display engineering capabilities & btop usage
  <span class="term-green">theme [name]</span>  Switch theme: obsidian, velvet-dusk, gruvbox, matrix, everpuccin
  <span class="term-green">matrix</span>        Toggle background matrix digital rain
  <span class="term-green">sound</span>         Toggle audio synthesizer (SFX)
  <span class="term-green">contact</span>       Print contact communication channels
  <span class="term-green">clear</span>         Clear terminal screen
  <span class="term-green">date</span>          Display current date and time
  <span class="term-green">echo [text]</span>   Print text back to terminal`
        },

        whoami: {
            desc: 'Display developer profile',
            exec: () => `
<span class="term-green">Mohammed Musharaf</span> (m7sh / mush)
• Role: Linux Rice Artisan & Creative Developer
• System: Omarchy Linux 4.0 • Hyprland (Wayland) • Quickshell
• Focus: Declarative QML status-bar architecture, Wayland desktop ricing & TUI tools
• GitHub: <a href="https://github.com/m7sh" target="_blank" class="term-cyan">https://github.com/m7sh</a>
• Portfolio: <a href="https://m7sh.github.io/m7sh/" target="_blank" class="term-cyan">https://m7sh.github.io/m7sh/</a>`
        },

        fastfetch: {
            desc: 'Run fastfetch system info',
            exec: () => `
<span class="art-green">   __  __  ______   _____  _    _  </span>  ┌─ System Telemetry ────────────────────────┐
<span class="art-green">  |  \\/  ||____  | /  ___|| |  | | </span>  │  User     : Mohammed Musharaf (m7sh)     │
<span class="art-green">  | .  . |    / /  \\ '--. | |__| | </span>  │  OS       : Omarchy Linux (Arch-based)   │
<span class="art-green">  | |\\/| |   / /    '--. \\|  __  | </span>  │  WM       : Hyprland (Wayland)           │
<span class="art-green">  | |  | |  / /    /\\__/ /| |  | | </span>  │ 󰸌 Theme    : Velvet Dusk • Gruvbox        │
<span class="art-green">  \\_|  |_/ /_/     \\____/ \\_|  |_/ </span>  │  Term     : Foot • Ghostty • Alacritty   │
                                     │ 🐚 Shell    : Zsh & Fish                   │
                                     │ 󰅩 Stack    : QML, Rust, Python, Linux IPC │
                                     └────────────────────────────────────────────┘`
        },

        projects: {
            desc: 'List all featured projects',
            exec: () => `
<span class="term-cyan">~/projects/ (12 repositories found)</span>
  🧩 <a href="https://github.com/m7sh/mush.workspace" target="_blank" class="term-green">mush.workspace</a>        Ubuntu/GNOME dynamic pill-and-dots workspace widget (QML)
  🎵 <a href="https://github.com/m7sh/omarchy-media" target="_blank" class="term-green">omarchy-media</a>         Minimal MPRIS playback status bar widget (QML)
  🏎️ <a href="https://github.com/m7sh/omarchy-f1" target="_blank" class="term-green">omarchy-f1</a>            Live Formula 1 telemetry & schedule bar widget (QML)
  🏏 <a href="https://github.com/m7sh/mush-omarchy-cricket" target="_blank" class="term-green">mush-cricket</a>          Real-time live cricket score telemetry widget (QML)
  🍂 <a href="https://github.com/m7sh/gruvbox-aesthetic" target="_blank" class="term-yellow">gruvbox-aesthetic</a>     Autumn golden & dark charcoal Gruvbox theme (Omarchy)
  🌆 <a href="https://github.com/m7sh/velvet-dusk-theme" target="_blank" class="term-yellow">velvet-dusk-theme</a>     Pastel lavender & dusty rose gradient theme (Omarchy)
  ⚔️ <a href="https://github.com/m7sh/god-of-war-theme" target="_blank" class="term-yellow">god-of-war-theme</a>      Spartan Crimson & obsidian slate theme (Omarchy)
  🌲 <a href="https://github.com/m7sh/everpuccin-m7sh" target="_blank" class="term-yellow">everpuccin-m7sh</a>       Catppuccin Mocha + Forest Green hybrid theme
  🌐 <a href="https://github.com/m7sh/omarchy-qutebrowser" target="_blank" class="term-cyan">omarchy-qutebrowser</a>   Dynamic theming & 0.90 Wayland transparency for Qutebrowser
  🎬 <a href="https://github.com/m7sh/MovieBox-Tui" target="_blank" class="term-cyan">MovieBox-Tui</a>          High-speed terminal movies & series streamer (Rust)
  🎙️ <a href="https://github.com/m7sh/Desktop-Voice-Assistant" target="_blank" class="term-cyan">voice_assistant.py</a>    Hands-free desktop automation voice assistant (Python)`
        },

        plugins: {
            desc: 'List Omarchy Quickshell plugins',
            exec: () => `
<span class="term-cyan">Omarchy Status Bar Plugins (QML / Quickshell):</span>
1. <span class="term-green">mush.workspace</span>     - Dynamic pill-and-dots workspace indicator
   Install: <code>omarchy plugin add https://github.com/m7sh/mush.workspace.git --enable</code>
2. <span class="term-green">omarchy-media</span>      - Minimal MPRIS playback widget
   Install: <code>omarchy plugin add https://github.com/m7sh/omarchy-media.git --enable</code>
3. <span class="term-green">omarchy-f1</span>         - Formula 1 live telemetry & schedule
   Install: <code>omarchy plugin add https://github.com/m7sh/omarchy-f1.git --enable</code>
4. <span class="term-green">mush-cricket</span>       - Real-time live cricket updates
   Install: <code>omarchy plugin add https://github.com/m7sh/mush-omarchy-cricket.git --enable</code>`
        },

        themes: {
            desc: 'List Omarchy desktop themes',
            exec: () => `
<span class="term-cyan">Omarchy Desktop Themes & Rices:</span>
• <span class="term-yellow">velvet-dusk</span>     - Lavender & rose gradient borders (#1E1B2E, #C4B5FD, #FDA4AF)
• <span class="term-yellow">gruvbox</span>         - Golden autumn dark palette (#282828, #D79921, #EBDBB2)
• <span class="term-yellow">god-of-war</span>      - Spartan Crimson obsidian theme (#121214, #DC2626, #9CA3AF)
• <span class="term-yellow">everpuccin</span>      - Catppuccin Mocha + Forest hues (#1e1e2e, #a6e3a1)
• <span class="term-yellow">hogwarts-night</span>  - Dark arcane candlelight & parchment gold (#0f141c, #d4af37)
• <span class="term-yellow">waffle-cat</span>      - Amber coffee & warm cream (#2b201a, #d97706)`
        },

        skills: {
            desc: 'Show skills allocation',
            exec: () => `
<span class="term-cyan">Technical Arsenal & Allocation:</span>
  QML & Qt Quick UI        [████████████████████████████░░░░] 88%
  Linux Ricing / Hyprland  [████████████████████████████████] 98%
  Shell Scripting (Zsh)    [████████████████████████████░░░░] 90%
  Python & Automation      [████████████████████████░░░░░░░░] 78%
  Rust & TUI Tooling       [████████████████████░░░░░░░░░░░░] 65%
  Web Stack / CSS3 / JS    [██████████████████████████░░░░░░] 82%`
        },

        contact: {
            desc: 'Display contact information',
            exec: () => `
<span class="term-cyan">Direct Communication Channels:</span>
  Email    : <a href="mailto:mdmusharaf720@gmail.com" class="term-green">mdmusharaf720@gmail.com</a>
  GitHub   : <a href="https://github.com/m7sh" target="_blank" class="term-green">https://github.com/m7sh</a>
  Website  : <a href="https://m7sh.github.io/m7sh/" target="_blank" class="term-green">https://m7sh.github.io/m7sh/</a>
  Status   : Open for collaboration on Linux Wayland tooling & rices`
        },

        date: {
            desc: 'Print current system time',
            exec: () => `<span class="term-cyan">${new Date().toLocaleString()}</span>`
        },

        matrix: {
            desc: 'Toggle matrix rain',
            exec: () => {
                toggleMatrixRain();
                return `<span class="term-green">Matrix simulation toggled: ${state.matrixActive ? 'ACTIVE' : 'OFF'}</span>`;
            }
        },

        sound: {
            desc: 'Toggle sound synthesizer',
            exec: () => {
                toggleSound();
                return `<span class="term-green">Sound synthesizer toggled: ${state.soundEnabled ? 'ON' : 'OFF'}</span>`;
            }
        },

        sudo: {
            desc: 'Superuser privilege check',
            exec: () => `<span class="term-red">mush is not in the sudoers file. This incident will be reported to Omarchy daemon.</span>`
        }
    };

    function executeCommand(rawCmd) {
        const trimmed = rawCmd.trim();
        if (!trimmed) return;

        state.commandHistory.push(trimmed);
        state.historyIndex = state.commandHistory.length;

        const parts = trimmed.split(' ');
        const mainCmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        const historyBox = document.getElementById('term-history-log');
        if (!historyBox) return;

        const entry = document.createElement('div');
        entry.className = 'term-cmd-entry';

        const cmdRow = document.createElement('div');
        cmdRow.className = 'term-cmd-row';
        cmdRow.innerHTML = `<span class="term-cmd-prompt">mush@omarchy:~$</span><span>${escapeHtml(trimmed)}</span>`;
        entry.appendChild(cmdRow);

        const resultRow = document.createElement('div');
        resultRow.className = 'term-cmd-result';

        // Execute handlers
        if (mainCmd === 'clear') {
            historyBox.innerHTML = '';
            sound.tick();
            return;
        } else if (mainCmd === 'theme') {
            const targetTheme = args[0] ? args[0].toLowerCase() : '';
            if (CONFIG.themes.includes(targetTheme)) {
                applyTheme(targetTheme);
                resultRow.innerHTML = `<span class="term-green">Switched theme to ${CONFIG.themeLabels[targetTheme] || targetTheme}</span>`;
            } else {
                resultRow.innerHTML = `<span class="term-yellow">Unknown theme "${escapeHtml(targetTheme)}". Available: ${CONFIG.themes.join(', ')}</span>`;
            }
        } else if (mainCmd === 'echo') {
            resultRow.textContent = args.join(' ');
        } else if (CLI_COMMANDS[mainCmd]) {
            sound.blip();
            resultRow.innerHTML = CLI_COMMANDS[mainCmd].exec();
        } else {
            sound.tick();
            resultRow.innerHTML = `<span class="term-red">zsh: command not found: ${escapeHtml(mainCmd)}. Type <span class="term-cyan">help</span> for commands.</span>`;
        }

        entry.appendChild(resultRow);
        historyBox.appendChild(entry);

        // Auto-scroll to bottom of terminal
        const container = document.getElementById('term-output-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function setupTerminalCLI() {
        const input = document.getElementById('term-input');
        if (!input) return;

        input.addEventListener('keydown', (e) => {
            sound.key();

            if (e.key === 'Enter') {
                const val = input.value;
                input.value = '';
                executeCommand(val);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (state.historyIndex > 0) {
                    state.historyIndex--;
                    input.value = state.commandHistory[state.historyIndex] || '';
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (state.historyIndex < state.commandHistory.length - 1) {
                    state.historyIndex++;
                    input.value = state.commandHistory[state.historyIndex] || '';
                } else {
                    state.historyIndex = state.commandHistory.length;
                    input.value = '';
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                const cur = input.value.trim().toLowerCase();
                if (cur) {
                    const matches = Object.keys(CLI_COMMANDS).concat(CONFIG.themes.map(t => `theme ${t}`)).filter(c => c.startsWith(cur));
                    if (matches.length === 1) {
                        input.value = matches[0];
                    }
                }
            }
        });

        // Clickable mini buttons in terminal header
        const clearBtn = document.getElementById('term-clear-btn');
        if (clearBtn) clearBtn.addEventListener('click', () => executeCommand('clear'));

        const helpBtn = document.getElementById('term-help-btn');
        if (helpBtn) helpBtn.addEventListener('click', () => executeCommand('help'));

        // Quick chip shortcuts below terminal
        document.querySelectorAll('.term-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const cmd = chip.getAttribute('data-cmd');
                if (cmd) {
                    input.value = cmd;
                    executeCommand(cmd);
                    input.focus();
                }
            });
        });
    }

    // --- COMMAND PALETTE MODAL (Ctrl+K / ⌘K) ---
    function setupCommandPalette() {
        const modal = document.getElementById('palette-modal');
        const input = document.getElementById('palette-input');
        const results = document.getElementById('palette-results');
        const openBtn = document.getElementById('open-palette-btn');
        const backdrop = document.getElementById('palette-backdrop');

        if (!modal || !input || !results) return;

        const PALETTE_ACTIONS = [
            { icon: '01', title: 'About & Bio', action: () => { location.hash = '#hero'; } },
            { icon: '02', title: 'Browse Projects (Plugins & Themes)', action: () => { location.hash = '#projects'; } },
            { icon: '03', title: 'Launch Interactive Virtual Terminal', action: () => { location.hash = '#terminal'; document.getElementById('term-input')?.focus(); } },
            { icon: '04', title: 'Inspect Technical Stack & Btop Gauge', action: () => { location.hash = '#stack'; } },
            { icon: '05', title: 'Communication Channels & Statusline', action: () => { location.hash = '#connect'; } },
            { icon: '🎨', title: 'Cycle Color Theme (Obsidian / Velvet / Gruvbox)', action: () => { cycleTheme(); } },
            { icon: '🔊', title: 'Toggle Audio Synthesizer (SFX)', action: () => { toggleSound(); } },
            { icon: '⚡', title: 'Toggle Matrix Digital Rain', action: () => { toggleMatrixRain(); } },
            { icon: '📋', title: 'Copy Email Address', action: () => { copyToClipboard('mdmusharaf720@gmail.com', 'Email copied: mdmusharaf720@gmail.com'); } },
            { icon: '🐙', title: 'Open GitHub Profile', action: () => { window.open('https://github.com/m7sh', '_blank'); } }
        ];

        function openPalette() {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            input.value = '';
            renderPaletteItems(PALETTE_ACTIONS);
            input.focus();
            sound.blip();
        }

        function closePalette() {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        }

        function renderPaletteItems(items) {
            results.innerHTML = '';
            if (items.length === 0) {
                results.innerHTML = '<div style="padding: 12px 16px; color: var(--text-subtle); font-family: var(--font-mono); font-size: 0.84rem;">No matching commands found.</div>';
                return;
            }

            items.forEach((item, index) => {
                const row = document.createElement('div');
                row.className = `palette-item ${index === 0 ? 'selected' : ''}`;
                row.innerHTML = `
                    <div class="palette-item-left">
                        <span class="palette-item-icon">${item.icon}</span>
                        <span>${escapeHtml(item.title)}</span>
                    </div>
                    <span class="palette-item-action">Jump ↵</span>`;

                row.addEventListener('click', () => {
                    item.action();
                    closePalette();
                    sound.tick();
                });

                results.appendChild(row);
            });
        }

        if (openBtn) openBtn.addEventListener('click', openPalette);
        if (backdrop) backdrop.addEventListener('click', closePalette);

        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (modal.classList.contains('active')) closePalette();
                else openPalette();
            } else if (e.key === 'Escape' && modal.classList.contains('active')) {
                closePalette();
            }
        });

        input.addEventListener('input', () => {
            const query = input.value.trim().toLowerCase();
            const filtered = PALETTE_ACTIONS.filter(item => item.title.toLowerCase().includes(query));
            renderPaletteItems(filtered);
        });

        input.addEventListener('keydown', (e) => {
            const selected = results.querySelector('.palette-item.selected');
            const all = Array.from(results.querySelectorAll('.palette-item'));
            const idx = all.indexOf(selected);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (idx >= 0 && idx < all.length - 1) {
                    selected.classList.remove('selected');
                    all[idx + 1].classList.add('selected');
                    all[idx + 1].scrollIntoView({ block: 'nearest' });
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (idx > 0) {
                    selected.classList.remove('selected');
                    all[idx - 1].classList.add('selected');
                    all[idx - 1].scrollIntoView({ block: 'nearest' });
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selected) selected.click();
            }
        });
    }

    // --- SETUP GLOBAL LISTENERS ---
    function setupGlobalActions() {
        // Theme Cycle Button
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) themeBtn.addEventListener('click', cycleTheme);

        // Sound Toggle Button
        const soundBtn = document.getElementById('sound-toggle-btn');
        if (soundBtn) soundBtn.addEventListener('click', toggleSound);

        // Copy Email Buttons
        document.querySelectorAll('.copy-email-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const email = btn.getAttribute('data-email') || 'mdmusharaf720@gmail.com';
                copyToClipboard(email, `Email copied: ${email}`);
            });
        });

        // Copy Command Buttons on project cards
        document.querySelectorAll('.card-copy-cmd').forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.getAttribute('data-copy');
                if (cmd) {
                    copyToClipboard(cmd, `Command copied: ${cmd}`);
                }
            });
        });

        // Initialize saved theme
        applyTheme(state.theme);

        // Initialize sound indicator
        const indicator = document.getElementById('sound-indicator');
        if (indicator && state.soundEnabled) {
            indicator.textContent = 'SFX: ON';
            indicator.className = 'sound-on';
        }
    }

    // --- INITIALIZE ON DOM READY ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        setupGlobalActions();
        setupProjectFilters();
        setupTerminalCLI();
        setupCommandPalette();
    }

})();
