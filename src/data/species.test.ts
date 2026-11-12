import { describe, expect, it } from 'vitest';
import { ESPECES, especesDeZone, mois } from './species';
import { ZONES } from './zones';

describe('mois()', () => {
  it('gère le passage d’année', () => {
    expect(mois(10, 3)).toEqual([10, 11, 12, 1, 2, 3]);
    expect(mois(1, 12)).toHaveLength(12);
  });
});

describe('base d’espèces', () => {
  it('a des identifiants et noms scientifiques uniques', () => {
    expect(new Set(ESPECES.map((e) => e.id)).size).toBe(ESPECES.length);
    expect(new Set(ESPECES.map((e) => e.nomScientifique)).size).toBe(ESPECES.length);
  });
  it('chaque espèce est présente dans au moins une zone, avec des mois valides', () => {
    for (const e of ESPECES) {
      expect(e.presence.length, e.id).toBeGreaterThan(0);
      for (const p of e.presence) {
        expect(ZONES.map((z) => z.id)).toContain(p.zone);
        expect(p.mois.length).toBeGreaterThan(0);
        expect(p.mois.every((m) => m >= 1 && m <= 12)).toBe(true);
      }
    }
  });
  it('chaque zone test a des espèces', () => {
    for (const z of ZONES) expect(especesDeZone(z.id).length).toBeGreaterThan(20);
  });
  it('n’emploie jamais le terme « race »', () => {
    expect(JSON.stringify(ESPECES)).not.toMatch(/\brace\b/i);
  });
});
