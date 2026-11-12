import { describe, expect, it } from 'vitest';
import { depuisLigne, estUuid, planifier, versLigne, type LigneObservation } from './fusion';
import type { Observation } from '../data/types';

const o = (id: string, extra: Partial<Observation> = {}): Observation => ({
  id, especeId: 'merle-noir', date: '2026-11-01', zone: 'idf', lieu: 'Paris', note: '', validation: 'manuelle', creeLe: '2026-11-01T10:00:00Z', ...extra,
});
const l = (id: string, supprime = false): LigneObservation => ({ ...versLigne(o(id), null), supprime });

describe('planifier la synchronisation', () => {
  it('envoie ce qui n’est que sur le téléphone et récupère ce qui n’est que dans le compte', () => {
    const p = planifier([o('a'), o('b')], [l('b'), l('c')], []);
    expect(p.aEnvoyer.map((x) => x.id)).toEqual(['a']);
    expect(p.aRecevoir.map((x) => x.id)).toEqual(['c']);
    expect(p.aRetirer).toEqual([]);
  });
  it('retire du téléphone ce qui a été supprimé depuis un autre appareil', () => {
    const p = planifier([o('a')], [l('a', true)], []);
    expect(p.aRetirer).toEqual(['a']);
    expect(p.aEnvoyer).toEqual([]);
  });
  it('propage une suppression faite sur ce téléphone et ne la récupère pas', () => {
    const p = planifier([], [l('a')], ['a']);
    expect(p.aSupprimer).toEqual(['a']);
    expect(p.aRecevoir).toEqual([]);
  });
  it('ne récupère pas une observation déjà supprimée dans le compte', () => {
    expect(planifier([], [l('x', true)], []).aRecevoir).toEqual([]);
  });
  it('premier envoi : tout le carnet du téléphone part vers un compte vide', () => {
    expect(planifier([o('a'), o('b')], [], []).aEnvoyer).toHaveLength(2);
  });
});

describe('conversion', () => {
  it('aller-retour sans perte', () => {
    const obs = o('3f1c2d4e-0000-4000-8000-000000000001', { note: 'Dans le parc', photoChemin: 'u/x.jpg' });
    const ligne = { ...versLigne(obs, 'u/x.jpg'), supprime: false };
    expect(depuisLigne(ligne)).toEqual({ ...obs, photo: undefined });
  });
  it('reconnaît un identifiant UUID', () => {
    expect(estUuid('3f1c2d4e-0000-4000-8000-000000000001')).toBe(true);
    expect(estUuid('1731400000-abc')).toBe(false);
  });
});
