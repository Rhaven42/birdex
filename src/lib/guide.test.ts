import { describe, expect, it } from 'vitest';
import { oiseauxPossibles } from './guide';

const noms = (r: ReturnType<typeof oiseauxPossibles>) => r.map((e) => e.nom);

describe('recherche guidée « Quel est cet oiseau ? »', () => {
  it('petit oiseau au jardin en Île-de-France en janvier : mésanges et rougegorge, pas de martinet', () => {
    const r = noms(oiseauxPossibles({ taille: 'p', habitat: 'J', zone: 'idf', mois: 1 }));
    expect(r).toEqual(expect.arrayContaining(['Mésange charbonnière', 'Mésange bleue', 'Rougegorge familier']));
    expect(r).not.toContain('Martinet noir'); // absent en hiver
    expect(r).not.toContain('Merle noir'); // taille moyenne
  });
  it('grand oiseau au bord de mer en Bretagne : goélands, pas de mésange', () => {
    const r = noms(oiseauxPossibles({ taille: 'g', habitat: 'M', zone: 'bretagne', mois: 7 }));
    expect(r.some((n) => n.startsWith('Goéland'))).toBe(true);
    expect(r.some((n) => n.startsWith('Mésange'))).toBe(false);
  });
  it('les oiseaux les plus courants sortent en premier', () => {
    const r = oiseauxPossibles({ taille: 'm', habitat: 'J', zone: 'idf', mois: 5 });
    const rangs = r.map((e) => e.presence.find((p) => p.zone === 'idf')!.abondance);
    expect(rangs.indexOf('rare') === -1 || rangs.indexOf('commune') < rangs.indexOf('rare')).toBe(true);
    expect(noms(r).slice(0, 15)).toContain('Merle noir');
  });
  it('au jardin, les oiseaux les plus familiers sortent en tête', () => {
    const r = noms(oiseauxPossibles({ taille: 'p', habitat: 'J', zone: 'idf', mois: 1 })).slice(0, 6);
    expect(r).toEqual(expect.arrayContaining(['Mésange charbonnière', 'Mésange bleue', 'Rougegorge familier']));
  });
  it('un oiseau limite (petit ou moyen) apparaît dans les deux tailles', () => {
    expect(noms(oiseauxPossibles({ taille: 'p', zone: 'idf' }))).toContain('Martinet noir');
    expect(noms(oiseauxPossibles({ taille: 'm', zone: 'idf' }))).toContain('Martinet noir');
  });
  it('sans aucun choix : tous les oiseaux de la région', () => {
    expect(oiseauxPossibles({ zone: 'corse' }).length).toBe(186);
  });
});
