// Résilience - logique SPA. Fonctions pures exportees pour les tests unitaires.

export const DURATIONS = {
  breathInhale: 4,
  breathExhale: 6,
  breathLeadIn: 60,
  grounding: 10,
  sugar: 15 * 60,
  sugarMsgInterval: 3 * 60,
  mealTotal: 20 * 60,
  mealPause: 10 * 60,
  mealWait: 10 * 60,
};

const SCREENS = ['anxiete', 'sucre', 'repas'];

export function fmt(total) {
  const s = Math.max(0, Math.round(total));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function parseDeepLink(input) {
  if (!input) return { screen: null, auto: false };
  const q = input.indexOf('?');
  const search = q >= 0 ? input.slice(q + 1) : input;
  const p = new URLSearchParams(search);
  const screen = p.get('screen');
  return { screen: SCREENS.includes(screen) ? screen : null, auto: p.get('auto') === '1' };
}

export function breathPhase(elapsed, inhale = DURATIONS.breathInhale, exhale = DURATIONS.breathExhale) {
  const cycle = inhale + exhale;
  const t = ((elapsed % cycle) + cycle) % cycle;
  if (t < inhale) return { phase: 'inhale', remaining: Math.ceil(inhale - t) || inhale };
  return { phase: 'exhale', remaining: Math.ceil(cycle - t) || exhale };
}

export const GROUNDING_STEPS = [
  { text: 'Nomme 5 choses que tu vois', cssVar: '--g1' },
  { text: 'Nomme 4 choses que tu entends', cssVar: '--g2' },
  { text: 'Nomme 3 choses que tu touches', cssVar: '--g3' },
  { text: 'Fais 2 longues respirations', cssVar: '--g4' },
  { text: 'Relâche 1 tension dans ton corps', cssVar: '--g5' },
];

export function groundingSteps() {
  return GROUNDING_STEPS;
}

export const SUGAR_PHRASES = [
  'Ne décide pas maintenant, attends de voir.',
  'Bois un grand verre d’eau.',
  'Marche un peu.',
  'Fais une activité manuelle.',
];

const MSG = {
  anxDone: 'C’est passé. Tu as fait redescendre la vague.',
  sugarEnd: 'Toujours envie ? Prends un fruit, assis, en le savourant, sans culpabiliser.',
  mealEat: 'Prends le temps de manger. Pose les couverts entre les bouchées.',
  mealPause: 'Fais une pause. Encore faim, ou habitude ?',
  mealEnd: 'Prends un fruit, assis, en le savourant, sans culpabiliser.',
};

// --- Historique (localStorage) ---

const HKEY = 'resilience-history';

export function dayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HKEY)) || []; } catch { return []; }
}

function clearHistory() {
  try { localStorage.removeItem(HKEY); } catch { /* stockage indisponible */ }
}

function recordAction(type, now = new Date()) {
  try {
    const h = loadHistory();
    h.push({ d: dayKey(now), type });
    localStorage.setItem(HKEY, JSON.stringify(h));
  } catch { /* stockage indisponible : on ignore */ }
}

export function aggregate(history, days, today = new Date()) {
  const base = new Date(today);
  base.setHours(0, 0, 0, 0);
  const keys = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    keys.push(dayKey(d));
  }
  const map = {};
  keys.forEach((k) => { map[k] = { anxiete: 0, sucre: 0 }; });
  history.forEach((r) => { if (map[r.d] && (r.type === 'anxiete' || r.type === 'sucre')) map[r.d][r.type] += 1; });
  return keys.map((k) => ({ day: k, anxiete: map[k].anxiete, sucre: map[k].sucre }));
}

function buildChart(container) {
  const history = loadHistory();
  if (history.length === 0) {
    container.innerHTML = '<p class="hint-empty">Aucune donnée pour l’instant. Utilise les écrans Anxiété et Envie de sucre : ton historique apparaîtra ici.</p>';
    return;
  }
  const data = aggregate(history, 14);
  const W = 340; const H = 190; const padL = 26; const padR = 12; const padT = 12; const padB = 26;
  const iw = W - padL - padR; const ih = H - padT - padB;
  const n = data.length;
  const maxY = Math.max(1, ...data.map((d) => Math.max(d.anxiete, d.sucre)));
  const xAt = (i) => padL + (n === 1 ? iw / 2 : (iw * i) / (n - 1));
  const yAt = (v) => padT + ih * (1 - v / maxY);
  const poly = (type) => data.map((d, i) => `${xAt(i).toFixed(1)},${yAt(d[type]).toFixed(1)}`).join(' ');
  const dots = (type, color) => data.map((d, i) => `<circle cx="${xAt(i).toFixed(1)}" cy="${yAt(d[type]).toFixed(1)}" r="2.4" fill="${color}"/>`).join('');
  const label = (k) => `${k.slice(8)}/${k.slice(5, 7)}`;
  const xIdx = [0, Math.floor((n - 1) / 2), n - 1];
  const xLabels = xIdx.map((i) => `<text x="${xAt(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="ax">${label(data[i].day)}</text>`).join('');
  const yLabels = `<text x="${padL - 6}" y="${(yAt(maxY) + 4).toFixed(1)}" text-anchor="end" class="ax">${maxY}</text>`
    + `<text x="${padL - 6}" y="${(yAt(0) + 4).toFixed(1)}" text-anchor="end" class="ax">0</text>`;
  const grid = `<line x1="${padL}" y1="${yAt(maxY).toFixed(1)}" x2="${W - padR}" y2="${yAt(maxY).toFixed(1)}" class="grid"/>`
    + `<line x1="${padL}" y1="${yAt(0).toFixed(1)}" x2="${W - padR}" y2="${yAt(0).toFixed(1)}" class="grid"/>`;
  container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Historique des actions par jour">
    ${grid}${yLabels}${xLabels}
    <polyline fill="none" stroke="var(--anx)" stroke-width="2" points="${poly('anxiete')}"/>
    <polyline fill="none" stroke="var(--env)" stroke-width="2" points="${poly('sucre')}"/>
    ${dots('anxiete', 'var(--anx)')}${dots('sucre', 'var(--env)')}
  </svg>`;
}

// --- Timeline ---

function renderTimeline(el, segments) {
  el.innerHTML = '';
  const total = segments.reduce((a, s) => a + s.seconds, 0);
  segments.forEach((s) => {
    const seg = document.createElement('div');
    seg.className = 'tl-seg';
    seg.style.flexGrow = s.seconds;
    seg.style.background = s.color;
    el.appendChild(seg);
  });
  const cover = document.createElement('div');
  cover.className = 'tl-cover';
  el.appendChild(cover);
  const set = (elapsed) => { cover.style.width = `${Math.max(0, (1 - elapsed / total) * 100)}%`; };
  set(0);
  return { total, set };
}

// --- Wake lock (garde l'ecran allume pendant un timer) ---

let wakeLock = null;
let wakeWanted = false;

async function acquireWake() {
  wakeWanted = true;
  if (wakeLock || typeof navigator === 'undefined' || !navigator.wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch { /* refuse ou indisponible : on ignore */ }
}

function releaseWake() {
  wakeWanted = false;
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}

// --- Runtime ---

function countdown(seconds, onTick, onEnd) {
  let left = seconds;
  onTick(left);
  const iv = setInterval(() => {
    left -= 1;
    onTick(Math.max(0, left));
    if (left <= 0) { clearInterval(iv); if (onEnd) onEnd(); }
  }, 1000);
  return () => clearInterval(iv);
}

function fade(el, visible, done) {
  el.classList.toggle('show', visible);
  if (done) setTimeout(done, 400);
}

function swapMsg(el, text) {
  el.classList.remove('show');
  setTimeout(() => { el.textContent = text; el.classList.add('show'); }, 250);
}

export function init(doc = document) {
  const app = doc.getElementById('app');
  if (!app) return;

  const screens = {};
  doc.querySelectorAll('[data-screen]').forEach((el) => { screens[el.dataset.screen] = el; });
  const stops = { anxiete: null, sucre: null, repas: null };
  const starters = {
    anxiete: () => startAnxiete(doc),
    sucre: () => startSucre(doc),
    repas: () => startRepas(doc),
  };

  function stopScreen(name) { if (stops[name]) { stops[name](); stops[name] = null; } }
  function show(name) {
    Object.keys(screens).forEach((k) => screens[k].classList.toggle('active', k === name));
    app.dataset.current = name;
  }

  function go(name) {
    if (name === 'accueil') { SCREENS.forEach(stopScreen); releaseWake(); show('accueil'); return; }
    if (name === 'historique') { SCREENS.forEach(stopScreen); releaseWake(); buildChart(doc.getElementById('hist-chart')); show('historique'); return; }
    if (!SCREENS.includes(name)) return;
    if (name === 'anxiete' || name === 'sucre') recordAction(name);
    stopScreen(name);
    show(name);
    stops[name] = starters[name]();
  }

  doc.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => go(btn.dataset.go));
  });

  // Menu
  const menu = doc.getElementById('menu');
  doc.querySelectorAll('[data-menu]').forEach((btn) => {
    btn.addEventListener('click', () => menu.classList.toggle('open', btn.dataset.menu === 'open'));
  });

  // Theme
  const seg = doc.getElementById('theme-seg');
  function markTheme(t) {
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.theme === t));
  }
  seg.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => { setTheme(b.dataset.theme, doc); markTheme(b.dataset.theme); });
  });
  markTheme(loadTheme());
  applyTheme(loadTheme(), doc);

  // Effacer l'historique
  const clearBtn = doc.getElementById('hist-clear');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (typeof confirm === 'function' && !confirm('Effacer tout l’historique ?')) return;
    clearHistory();
    buildChart(doc.getElementById('hist-chart'));
  });

  // Le wake lock saute quand l'app passe en arriere-plan : on le reprend au retour.
  doc.addEventListener('visibilitychange', () => {
    if (wakeWanted && doc.visibilityState === 'visible') acquireWake();
  });

  function handle(url) { const { screen } = parseDeepLink(url); if (screen) go(screen); }
  const cap = typeof window !== 'undefined' ? window.Capacitor : null;
  if (cap && cap.Plugins && cap.Plugins.App) {
    const { App } = cap.Plugins;
    App.getLaunchUrl().then((r) => { if (r && r.url) handle(r.url); }).catch(() => {});
    App.addListener('appUrlOpen', (d) => handle(d.url));
    // Bouton "precedent" Android = fleche retour ; sur l'accueil, quitte l'app.
    App.addListener('backButton', () => {
      if (menu.classList.contains('open')) { menu.classList.remove('open'); return; }
      if ((app.dataset.current || 'accueil') !== 'accueil') go('accueil');
      else App.exitApp();
    });
  }
  if (typeof location !== 'undefined') handle(location.search);

  show(app.dataset.current || 'accueil');
}

const TKEY = 'resilience-theme';
function loadTheme() { try { return localStorage.getItem(TKEY) || 'system'; } catch { return 'system'; } }
function setTheme(t, doc = document) { try { localStorage.setItem(TKEY, t); } catch { /* ignore */ } applyTheme(t, doc); }
function applyTheme(t, doc = document) {
  const root = doc.documentElement;
  if (t === 'light' || t === 'dark') root.dataset.theme = t; else delete root.dataset.theme;
}

function startAnxiete(doc) {
  acquireWake();
  const breath = doc.getElementById('anx-breath');
  const circle = doc.getElementById('anx-circle');
  const num = doc.getElementById('anx-count');
  const word = doc.getElementById('anx-word');
  const step = doc.getElementById('anx-step');
  const stepText = doc.getElementById('anx-step-text');
  const stepTimer = doc.getElementById('anx-step-timer');
  const done = doc.getElementById('anx-done');
  const tl = renderTimeline(doc.getElementById('anx-tl'), [
    { seconds: DURATIONS.breathLeadIn, color: 'var(--anx)' },
    { seconds: GROUNDING_STEPS.length * DURATIONS.grounding, color: 'var(--env)' },
  ]);

  breath.classList.add('show');
  step.classList.remove('show');
  done.classList.remove('show');

  let cancelled = false;
  let elapsed = 0;
  let lastPhase = null;
  const timers = [];

  applyPhase('inhale');
  renderBreath();
  const iv = setInterval(() => {
    elapsed += 1;
    tl.set(elapsed);
    if (elapsed < DURATIONS.breathLeadIn) renderBreath();
    else { clearInterval(iv); grounding(); }
  }, 1000);
  timers.push(() => clearInterval(iv));

  function renderBreath() {
    const { phase, remaining } = breathPhase(elapsed);
    num.textContent = remaining;
    word.textContent = phase === 'inhale' ? 'Inspire' : 'Expire';
    if (phase !== lastPhase) { applyPhase(phase); lastPhase = phase; }
  }
  function applyPhase(phase) {
    circle.style.transitionDuration = `${phase === 'inhale' ? DURATIONS.breathInhale : DURATIONS.breathExhale}s`;
    circle.classList.toggle('big', phase === 'inhale');
  }

  function grounding() {
    if (cancelled) return;
    fade(breath, false, () => {
      let i = 0;
      showStep();
      function showStep() {
        if (cancelled) return;
        if (i >= GROUNDING_STEPS.length) { releaseWake(); fade(done, true); return; }
        const s = GROUNDING_STEPS[i];
        stepText.textContent = s.text;
        step.style.color = `var(${s.cssVar})`;
        fade(step, true);
        let left = DURATIONS.grounding;
        stepTimer.textContent = left;
        const t = setInterval(() => {
          elapsed += 1;
          tl.set(elapsed);
          left -= 1;
          if (left <= 0) { clearInterval(t); fade(step, false, () => { i += 1; showStep(); }); return; }
          stepTimer.textContent = left;
        }, 1000);
        timers.push(() => clearInterval(t));
      }
    });
  }

  return () => { cancelled = true; timers.forEach((f) => f()); };
}

function startSucre(doc) {
  const disp = doc.getElementById('sucre-timer');
  const btn = doc.getElementById('sucre-btn');
  const msg = doc.getElementById('sucre-msg');
  const tlEl = doc.getElementById('sucre-tl');

  let stopTimer = null;
  const timeouts = [];

  function clearAll() {
    if (stopTimer) { stopTimer(); stopTimer = null; }
    timeouts.forEach(clearTimeout);
    timeouts.length = 0;
  }

  function run() {
    acquireWake();
    const tl = renderTimeline(tlEl, [{ seconds: DURATIONS.sugar, color: 'var(--env)' }]);
    swapMsg(msg, SUGAR_PHRASES[0]);
    SUGAR_PHRASES.forEach((p, i) => {
      if (i === 0) return;
      timeouts.push(setTimeout(() => swapMsg(msg, p), i * DURATIONS.sugarMsgInterval * 1000));
    });
    let elapsed = 0;
    stopTimer = countdown(DURATIONS.sugar, (left) => { disp.textContent = fmt(left); elapsed = DURATIONS.sugar - left; tl.set(elapsed); }, () => {
      releaseWake();
      swapMsg(msg, MSG.sugarEnd);
      btn.textContent = 'Recommencer';
    });
    btn.textContent = 'Réinitialiser';
  }

  function reset() {
    clearAll();
    releaseWake();
    disp.textContent = fmt(DURATIONS.sugar);
    msg.classList.remove('show');
    renderTimeline(tlEl, [{ seconds: DURATIONS.sugar, color: 'var(--env)' }]);
    btn.textContent = 'Démarrer';
  }

  btn.onclick = () => { if (stopTimer) reset(); else run(); };
  run();

  return () => { clearAll(); btn.onclick = null; };
}

function startRepas(doc) {
  acquireWake();
  const disp = doc.getElementById('repas-timer');
  const box = doc.getElementById('repas-box');
  const msg = doc.getElementById('repas-msg');
  const again = doc.getElementById('repas-again');
  const wait = doc.getElementById('repas-wait');
  const waitDisp = doc.getElementById('repas-wait-timer');
  const end = doc.getElementById('repas-end');
  const tl = renderTimeline(doc.getElementById('repas-tl'), [{ seconds: DURATIONS.mealTotal, color: 'var(--rep)' }]);

  again.hidden = true;
  wait.classList.remove('show');
  end.classList.remove('show');
  box.classList.remove('done');
  swapMsg(msg, MSG.mealEat);

  let paused = false;
  let stopWait = null;
  const stopMain = countdown(DURATIONS.mealTotal, (left) => {
    disp.textContent = fmt(left);
    const elapsed = DURATIONS.mealTotal - left;
    tl.set(elapsed);
    if (!paused && elapsed >= DURATIONS.mealPause) { paused = true; swapMsg(msg, MSG.mealPause); msg.classList.add('flash'); }
  }, () => {
    releaseWake();
    box.classList.add('done');
    msg.classList.remove('show');
    again.hidden = false;
  });

  again.onclick = () => {
    again.hidden = true;
    acquireWake();
    wait.classList.add('show');
    stopWait = countdown(DURATIONS.mealWait, (left) => { waitDisp.textContent = fmt(left); }, () => { releaseWake(); end.classList.add('show'); });
  };

  return () => { stopMain(); if (stopWait) stopWait(); again.onclick = null; };
}
