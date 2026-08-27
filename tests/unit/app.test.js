import { describe, it, expect } from 'vitest';
import { fmt, parseDeepLink, breathPhase, groundingSteps, DURATIONS, aggregate, dayKey } from '../../www/app.js';

describe('fmt', () => {
  it('formate mm:ss', () => {
    expect(fmt(0)).toBe('0:00');
    expect(fmt(9)).toBe('0:09');
    expect(fmt(65)).toBe('1:05');
    expect(fmt(15 * 60)).toBe('15:00');
  });
  it('borne les negatifs a 0', () => {
    expect(fmt(-5)).toBe('0:00');
  });
});

describe('parseDeepLink', () => {
  it('lit un query browser', () => {
    expect(parseDeepLink('?screen=repas&auto=1')).toEqual({ screen: 'repas', auto: true });
  });
  it('lit un deep-link natif', () => {
    expect(parseDeepLink('resilience://open?screen=anxiete&auto=1')).toEqual({ screen: 'anxiete', auto: true });
  });
  it('rejette un ecran inconnu', () => {
    expect(parseDeepLink('?screen=foo').screen).toBeNull();
  });
  it('gere l absence d entree', () => {
    expect(parseDeepLink('')).toEqual({ screen: null, auto: false });
  });
});

describe('breathPhase', () => {
  it('inspire sur les 4 premieres secondes', () => {
    expect(breathPhase(0)).toEqual({ phase: 'inhale', remaining: 4 });
    expect(breathPhase(3)).toEqual({ phase: 'inhale', remaining: 1 });
  });
  it('expire sur les 6 suivantes', () => {
    expect(breathPhase(4)).toEqual({ phase: 'exhale', remaining: 6 });
    expect(breathPhase(9)).toEqual({ phase: 'exhale', remaining: 1 });
  });
  it('boucle sur 10s', () => {
    expect(breathPhase(10)).toEqual({ phase: 'inhale', remaining: 4 });
  });
  it('amorce = 6 cycles de 10s', () => {
    expect(DURATIONS.breathLeadIn / (DURATIONS.breathInhale + DURATIONS.breathExhale)).toBe(6);
  });
});

describe('groundingSteps', () => {
  it('a 5 etapes 5-4-3-2-1', () => {
    const steps = groundingSteps();
    expect(steps).toHaveLength(5);
    expect(steps[0].text).toMatch(/^Nomme 5/);
    expect(steps[1].text).toMatch(/^Nomme 4/);
    expect(steps[2].text).toMatch(/^Nomme 3/);
    expect(steps[3].text).toMatch(/2 longues respirations/);
    expect(steps[4].text).toMatch(/1 tension/);
  });
  it('a une couleur distincte par etape', () => {
    const vars = groundingSteps().map((s) => s.cssVar);
    expect(new Set(vars).size).toBe(5);
  });
});

describe('aggregate', () => {
  const today = new Date(2026, 7, 27); // 2026-08-27 (local)
  it('compte par jour et par type sur la fenetre', () => {
    const hist = [
      { d: '2026-08-27', type: 'anxiete' },
      { d: '2026-08-27', type: 'anxiete' },
      { d: '2026-08-27', type: 'sucre' },
      { d: '2026-08-26', type: 'sucre' },
      { d: '2020-01-01', type: 'anxiete' }, // hors fenetre -> ignore
    ];
    const rows = aggregate(hist, 14, today);
    expect(rows).toHaveLength(14);
    expect(rows[13]).toEqual({ day: '2026-08-27', anxiete: 2, sucre: 1 });
    expect(rows[12]).toEqual({ day: '2026-08-26', anxiete: 0, sucre: 1 });
  });
  it('dayKey est une date locale YYYY-MM-DD', () => {
    expect(dayKey(today)).toBe('2026-08-27');
  });
});
