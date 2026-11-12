import { beforeEach, describe, expect, it } from 'vitest';
import { ajouterObservation, chargerCarnet, especesDecouvertes, supprimerObservation, toutEffacer } from './storage';

class MemStorage {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

beforeEach(() => {
  (globalThis as any).localStorage = new MemStorage();
});

const obs = (especeId: string) => ({ especeId, date: '2026-05-01', zone: 'idf' as const, lieu: 'Paris', note: '', validation: 'manuelle' as const });

describe('carnet d’observations', () => {
  it('est vide au départ', () => {
    expect(chargerCarnet()).toEqual([]);
    expect(especesDecouvertes().size).toBe(0);
  });
  it('déverrouille une espèce quand on ajoute une observation', () => {
    ajouterObservation(obs('merle-noir'));
    expect(especesDecouvertes().has('merle-noir')).toBe(true);
    expect(chargerCarnet()[0]).toMatchObject({ especeId: 'merle-noir', lieu: 'Paris' });
  });
  it('reverrouille l’espèce si sa seule observation est supprimée', () => {
    const a = ajouterObservation(obs('merle-noir'));
    ajouterObservation(obs('merle-noir'));
    supprimerObservation(a.id);
    expect(especesDecouvertes().has('merle-noir')).toBe(true);
    supprimerObservation(chargerCarnet()[0].id);
    expect(especesDecouvertes().has('merle-noir')).toBe(false);
  });
  it('efface toutes les données (droit à l’effacement)', () => {
    ajouterObservation(obs('merle-noir'));
    toutEffacer();
    expect(chargerCarnet()).toEqual([]);
  });
});
