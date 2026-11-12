import { describe, expect, it } from 'vitest';
import { BADGES, defisSaisonniers, evaluerBadges, nouveauxBadges, saisonDe } from './badges';
import type { Observation } from '../data/types';

let i = 0;
const obs = (especeId: string, date = '2026-05-10'): Observation => ({
  id: String(i++), especeId, date, zone: 'idf', lieu: '', note: '', validation: 'manuelle', creeLe: date,
});

describe('badges', () => {
  it('aucun badge obtenu avec un carnet vide', () => {
    expect(evaluerBadges([]).filter((b) => b.obtenu)).toEqual([]);
  });
  it('« Premier envol » dès la première espèce', () => {
    const b = evaluerBadges([obs('merle-noir')]).find((x) => x.id === 'premier-envol')!;
    expect(b.obtenu).toBe(true);
  });
  it('« Premier rapace » avec un faucon', () => {
    const b = (c: Observation[]) => evaluerBadges(c).find((x) => x.id === 'premier-rapace')!;
    expect(b([obs('merle-noir')]).obtenu).toBe(false);
    expect(b([obs('faucon-crecerelle')]).obtenu).toBe(true);
  });
  it('« Toutes les mésanges » exige les trois mésanges', () => {
    const b = (c: Observation[]) => evaluerBadges(c).find((x) => x.id === 'toutes-les-mesanges')!;
    const deux = [obs('mesange-bleue'), obs('mesange-charbonniere')];
    expect(b(deux)).toMatchObject({ obtenu: false, n: 2, total: 3 });
    expect(b([...deux, obs('mesange-a-longue-queue')]).obtenu).toBe(true);
  });
  it('compte les espèces distinctes, pas les observations répétées', () => {
    const b = evaluerBadges([obs('merle-noir'), obs('merle-noir'), obs('merle-noir')]).find((x) => x.id === 'oiseaux-du-jardin')!;
    expect(b.n).toBe(1);
  });
  it('détecte les badges nouvellement obtenus', () => {
    expect(nouveauxBadges([], [obs('faucon-crecerelle')]).map((b) => b.id)).toEqual(
      expect.arrayContaining(['premier-envol', 'premier-rapace']),
    );
    expect(nouveauxBadges([obs('merle-noir')], [obs('merle-noir'), obs('pie-bavarde')]).map((b) => b.id)).not.toContain('premier-envol');
  });
  it('chaque badge a un total atteignable', () => {
    for (const b of BADGES) expect(b.total, b.id).toBeGreaterThan(0);
  });
});

describe('défis saisonniers', () => {
  it('détermine la saison (l’hiver chevauche deux années)', () => {
    expect(saisonDe(new Date('2026-04-01'))).toMatchObject({ id: 'printemps-2026' });
    expect(saisonDe(new Date('2026-12-15'))).toMatchObject({ id: 'hiver-2026' });
    expect(saisonDe(new Date('2027-02-10'))).toMatchObject({ id: 'hiver-2026' });
  });
  it('ne compte que les observations de la saison en cours', () => {
    const c = [obs('merle-noir', '2026-04-02'), obs('pie-bavarde', '2026-05-20'), obs('pinson-des-arbres', '2025-04-02')];
    const [defi] = defisSaisonniers(c, new Date('2026-05-25'));
    expect(defi.n).toBe(2);
    expect(defi.obtenu).toBe(false);
  });
});
