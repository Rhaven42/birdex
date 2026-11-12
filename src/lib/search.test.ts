import { describe, expect, it } from 'vitest';
import { normaliser, rechercher } from './search';
import { ESPECES } from '../data/species';

const premier = (q: string) => rechercher(q, ESPECES)[0]?.espece.id;

describe('normaliser', () => {
  it('retire accents, casse et apostrophes typographiques', () => {
    expect(normaliser('Épervier d’Europe')).toBe("epervier d'europe");
  });
});

describe('rechercher', () => {
  it('trouve par nom commun exact', () => {
    expect(premier('Merle noir')).toBe('merle-noir');
  });
  it('trouve par début de nom (autocomplétion)', () => {
    expect(premier('rouge')).toMatch(/^rouge/);
    expect(premier('chard')).toBe('chardonneret-elegant');
  });
  it('trouve par nom scientifique', () => {
    expect(premier('erithacus')).toBe('rougegorge-familier');
    expect(premier('Parus major')).toBe('mesange-charbonniere');
  });
  it('tolère les fautes de frappe', () => {
    expect(premier('rouge gorge')).toBe('rougegorge-familier');
    expect(premier('chardoneret')).toBe('chardonneret-elegant');
    expect(premier('mesange bleu')).toBe('mesange-bleue');
    expect(premier('martin pecheur')).toBe('martin-pecheur-europe');
    expect(premier('huppe faciee')).toBe('huppe-fasciee');
    expect(premier('flament rose')).toBe('flamant-rose');
  });
  it('trouve par un mot du nom', () => {
    const ids = rechercher('mesange', ESPECES).map((r) => r.espece.id);
    expect(ids).toEqual(expect.arrayContaining(['mesange-bleue', 'mesange-charbonniere', 'mesange-a-longue-queue']));
  });
  it('n’ajoute pas de ressemblances approximatives quand le nom existe vraiment', () => {
    const noms = rechercher('chouette', ESPECES).map((r) => r.espece.nom);
    expect(noms).toContain('Chouette hulotte');
    expect(noms.some((n) => n.startsWith('Alouette'))).toBe(false);
  });
  it('ne renvoie rien pour une requête sans rapport ou vide', () => {
    expect(rechercher('xyzqwk', ESPECES)).toEqual([]);
    expect(rechercher('  ', ESPECES)).toEqual([]);
  });
});
