import { describe, expect, it } from 'vitest';
import { especesProbables, niveauConfiance } from './identification';

describe('identification par photo', () => {
  it('propose comme indice les espèces présentes dans la région ce mois-ci', () => {
    const corse = especesProbables('corse', 6);
    expect(corse).toContain('Sitta whiteheadi');
    expect(corse).not.toContain('Grus grus'); // grue cendrée : hivernante, absente en juin
    expect(especesProbables('idf', 6)).not.toContain('Sitta whiteheadi');
  });
  it('ne donne aucun indice sans région', () => {
    expect(especesProbables(null, 6)).toEqual([]);
  });
  it('code couleur de la confiance', () => {
    expect(niveauConfiance(85)).toBe('commune');
    expect(niveauConfiance(50)).toBe('peu-commune');
    expect(niveauConfiance(20)).toBe('rare');
  });
});
