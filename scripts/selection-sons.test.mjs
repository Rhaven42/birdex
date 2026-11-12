import { describe, expect, it } from 'vitest';
import { choisir } from './selection-sons.mjs';

// Format documenté par l'API xeno-canto v3
const rec = (o) => ({
  id: '1', type: 'song', rec: 'Auteur', loc: 'Lieu', cnt: 'France', date: '2024-05-01', length: '0:30', q: 'A',
  lic: '//creativecommons.org/licenses/by-nc-sa/4.0/', file: 'https://xeno-canto.org/1/download',
  url: '//xeno-canto.org/1', sono: { med: '//xeno-canto.org/sounds/1/med.png' }, also: [], ...o,
});

describe('choisir', () => {
  it('garde au plus 2 chants et 2 cris', () => {
    const r = choisir([
      rec({ id: '1' }), rec({ id: '2' }), rec({ id: '3' }),
      rec({ id: '4', type: 'call' }), rec({ id: '5', type: 'alarm call' }), rec({ id: '6', type: 'call' }),
    ]);
    expect(r.map((x) => x.id)).toEqual(['1', '2', '4', '5']);
  });
  it('écarte les fichiers indisponibles, la mauvaise qualité et les durées extrêmes', () => {
    const r = choisir([rec({ id: 'a', file: '' }), rec({ id: 'b', q: 'C' }), rec({ id: 'c', length: '0:02' }), rec({ id: 'd', length: '5:00' }), rec({ id: 'ok' })]);
    expect(r.map((x) => x.id)).toEqual(['ok']);
  });
  it('préfère la qualité A puis les enregistrements sans autre espèce', () => {
    const r = choisir([rec({ id: 'b', q: 'B' }), rec({ id: 'bruit', also: ['Parus major'] }), rec({ id: 'propre' })]);
    expect(r.map((x) => x.id)).toEqual(['propre', 'bruit']);
  });
  it('rend les liens absolus et garde auteur et licence', () => {
    const [x] = choisir([rec({})]);
    expect(x).toMatchObject({ auteur: 'Auteur', licence: 'https://creativecommons.org/licenses/by-nc-sa/4.0/', page: 'https://xeno-canto.org/1', sono: 'https://xeno-canto.org/sounds/1/med.png' });
  });
  it('prend ce qui existe pour une espèce sans chant typique', () => {
    expect(choisir([rec({ id: 'x', type: 'drumming' })]).map((x) => x.id)).toEqual(['x']);
  });
});
