import { describe, expect, it } from 'vitest';
import { especeById, especesProches } from './species';

describe('oiseaux de la même famille', () => {
  it('la Mésange charbonnière a pour cousines les autres mésanges, l’orite et la rémiz', () => {
    const noms = especesProches(especeById('mesange-charbonniere')!).map((e) => e.nom);
    for (const n of ['Mésange bleue', 'Mésange huppée', 'Mésange noire', 'Mésange nonnette', 'Mésange boréale', 'Mésange à longue queue', 'Rémiz penduline'])
      expect(noms).toContain(n);
    expect(noms).not.toContain('Mésange charbonnière');
  });
  it('les espèces de même nom passent en premier', () => {
    expect(especesProches(especeById('mesange-charbonniere')!)[0].nom).toMatch(/^Mésange/);
  });
});
