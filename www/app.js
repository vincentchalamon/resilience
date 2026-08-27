// Trousse anti-crise - logique SPA. Fonctions pures exportees pour les tests unitaires.

export const DURATIONS = {
  breathInhale: 4,
  breathExhale: 6,
  breathLeadIn: 60,
  grounding: 10,
  sugar: 15 * 60,
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
  { text: 'Fais 2 longues expirations', cssVar: '--g4' },
  { text: 'Relache 1 tension dans ton corps', cssVar: '--g5' },
];

export function groundingSteps() {
  return GROUNDING_STEPS;
}

export const SUGAR_PHRASES = [
  'Ne decide pas maintenant, attends de voir.',
  'Bois un grand verre d’eau.',
  'Marche un peu.',
  'Fais une activite manuelle.',
];

// --- Runtime (DOM) ---

function countdown(seconds, onTick, onEnd) {
  let left = seconds;
  onTick(left);
  const iv = setInterval(() => {
    left -= 1;
    onTick(Math.max(0, left));
    if (left <= 0) {
      clearInterval(iv);
      if (onEnd) onEnd();
    }
  }, 1000);
  return () => clearInterval(iv);
}

export function init(doc = document) {
  const app = doc.getElementById('app');
  if (!app) return;

  const screens = {};
  doc.querySelectorAll('[data-screen]').forEach((el) => { screens[el.dataset.screen] = el; });

  const stops = { anxiete: null, sucre: null, repas: null };

  function stopScreen(name) {
    if (stops[name]) { stops[name](); stops[name] = null; }
  }

  function show(name) {
    Object.keys(screens).forEach((k) => screens[k].classList.toggle('active', k === name));
    app.dataset.current = name;
  }

  function go(name) {
    if (name === 'accueil') {
      SCREENS.forEach(stopScreen);
      show('accueil');
      return;
    }
    if (!SCREENS.includes(name)) return;
    stopScreen(name);
    show(name);
    stops[name] = starters[name]();
  }

  const starters = {
    anxiete: () => startAnxiete(doc),
    sucre: () => startSucre(doc),
    repas: () => startRepas(doc),
  };

  doc.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => go(btn.dataset.go));
  });

  // Deep-link (browser query + Capacitor natif)
  function handle(url) {
    const { screen } = parseDeepLink(url);
    if (screen) go(screen);
  }
  const cap = typeof window !== 'undefined' ? window.Capacitor : null;
  if (cap && cap.Plugins && cap.Plugins.App) {
    const { App } = cap.Plugins;
    App.getLaunchUrl().then((r) => { if (r && r.url) handle(r.url); }).catch(() => {});
    App.addListener('appUrlOpen', (d) => handle(d.url));
  }
  if (typeof location !== 'undefined') handle(location.search);

  show(app.dataset.current || 'accueil');
}

function fade(el, visible, done) {
  el.classList.toggle('show', visible);
  if (done) setTimeout(done, 400);
}

function startAnxiete(doc) {
  const circle = doc.getElementById('anx-circle');
  const num = doc.getElementById('anx-count');
  const breathWrap = doc.getElementById('anx-breath');
  const step = doc.getElementById('anx-step');
  const stepTimer = doc.getElementById('anx-step-timer');
  const done = doc.getElementById('anx-done');

  breathWrap.classList.add('show');
  step.classList.remove('show');
  done.classList.remove('show');

  let cancelled = false;
  let clear = null;

  // Phase 1: respiration
  let elapsed = 0;
  let lastPhase = null;
  applyPhase('inhale');
  render();
  const iv = setInterval(() => {
    elapsed += 1;
    if (elapsed >= DURATIONS.breathLeadIn) { clearInterval(iv); grounding(); return; }
    render();
  }, 1000);
  clear = () => clearInterval(iv);

  function render() {
    const { phase, remaining } = breathPhase(elapsed);
    num.textContent = remaining;
    if (phase !== lastPhase) { applyPhase(phase); lastPhase = phase; }
  }
  function applyPhase(phase) {
    const dur = phase === 'inhale' ? DURATIONS.breathInhale : DURATIONS.breathExhale;
    circle.style.transitionDuration = `${dur}s`;
    circle.classList.toggle('big', phase === 'inhale');
  }

  // Phase 2: ancrage
  function grounding() {
    if (cancelled) return;
    fade(breathWrap, false, () => {
      let i = 0;
      showStep();
      function showStep() {
        if (cancelled) return;
        if (i >= GROUNDING_STEPS.length) { finish(); return; }
        const s = GROUNDING_STEPS[i];
        step.textContent = s.text;
        step.style.color = `var(${s.cssVar})`;
        fade(step, true);
        let left = DURATIONS.grounding;
        stepTimer.textContent = left;
        const t = setInterval(() => {
          left -= 1;
          if (left <= 0) {
            clearInterval(t);
            fade(step, false, () => { i += 1; showStep(); });
            return;
          }
          stepTimer.textContent = left;
        }, 1000);
        clear = () => { clearInterval(t); };
      }
    });
  }

  function finish() {
    if (cancelled) return;
    fade(done, true);
  }

  return () => {
    cancelled = true;
    if (clear) clear();
  };
}

function startSucre(doc) {
  const disp = doc.getElementById('sucre-timer');
  const btn = doc.getElementById('sucre-btn');
  const end = doc.getElementById('sucre-end');
  const phraseEls = Array.from(doc.querySelectorAll('#sucre-phrases li'));

  let stopTimer = null;
  end.classList.remove('show');
  phraseEls.forEach((el) => el.classList.remove('show'));

  function run() {
    phraseEls.forEach((el, i) => setTimeout(() => el.classList.add('show'), i * 25 * 1000));
    stopTimer = countdown(DURATIONS.sugar, (left) => { disp.textContent = fmt(left); }, () => {
      end.classList.add('show');
      btn.textContent = 'Recommencer';
    });
    btn.textContent = 'Reinitialiser';
  }

  function reset() {
    if (stopTimer) { stopTimer(); stopTimer = null; }
    disp.textContent = fmt(DURATIONS.sugar);
    end.classList.remove('show');
    phraseEls.forEach((el) => el.classList.remove('show'));
    btn.textContent = 'Demarrer';
  }

  btn.onclick = () => { if (stopTimer) { reset(); } else { run(); } };
  run();

  return () => { if (stopTimer) stopTimer(); btn.onclick = null; };
}

function startRepas(doc) {
  const disp = doc.getElementById('repas-timer');
  const alert = doc.getElementById('repas-alert');
  const again = doc.getElementById('repas-again');
  const wait = doc.getElementById('repas-wait');
  const waitDisp = doc.getElementById('repas-wait-timer');
  const end = doc.getElementById('repas-end');

  alert.classList.remove('show');
  again.hidden = true;
  wait.classList.remove('show');
  end.classList.remove('show');
  disp.parentElement.classList.remove('done');

  let alerted = false;
  let stopMain = null;
  let stopWait = null;

  stopMain = countdown(DURATIONS.mealTotal, (left) => {
    disp.textContent = fmt(left);
    if (!alerted && DURATIONS.mealTotal - left >= DURATIONS.mealPause) {
      alerted = true;
      alert.classList.add('show');
      setTimeout(() => alert.classList.remove('show'), 20 * 1000);
    }
  }, () => {
    disp.parentElement.classList.add('done');
    again.hidden = false;
  });

  again.onclick = () => {
    again.hidden = true;
    wait.classList.add('show');
    stopWait = countdown(DURATIONS.mealWait, (left) => { waitDisp.textContent = fmt(left); }, () => {
      end.classList.add('show');
    });
  };

  return () => {
    if (stopMain) stopMain();
    if (stopWait) stopWait();
    again.onclick = null;
  };
}
