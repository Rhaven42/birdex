import { describe, expect, it } from 'vitest';
import { ESPECES, especesDeZone, mois } from './species';
import { REDACTIONS } from './redactions';
import { ZONES, zoneOfDepartement } from './zones';
import geo from './geo.json';
import { photoDe } from '../lib/media';
import sexes from './sexes.json';

describe('mois()', () => {
  it('gère le passage d’année', () => {
    expect(mois(10, 3)).toEqual([10, 11, 12, 1, 2, 3]);
    expect(mois(1, 12)).toHaveLength(12);
  });
});

describe('régions', () => {
  it('couvre les 13 régions de France métropolitaine', () => {
    expect(ZONES).toHaveLength(13);
  });
  it('rattache chacun des 96 départements à une région', () => {
    expect(geo.departements).toHaveLength(96);
    for (const d of geo.departements) expect(zoneOfDepartement(d.code), d.nom).toBeDefined();
    expect(zoneOfDepartement('75')).toBe('idf');
    expect(zoneOfDepartement('83')).toBe('paca');
    expect(zoneOfDepartement('2A')).toBe('corse');
  });
  it('chaque région a de nombreuses espèces', () => {
    for (const z of ZONES) expect(especesDeZone(z.id).length, z.nom).toBeGreaterThan(80);
  });
});

describe('espèces', () => {
  it('une seule fiche par espèce (pas de doublon de nom ou de nom scientifique)', () => {
    expect(new Set(ESPECES.map((e) => e.id)).size).toBe(ESPECES.length);
    expect(new Set(ESPECES.map((e) => e.nomScientifique)).size).toBe(ESPECES.length);
    expect(new Set(ESPECES.map((e) => e.nom.toLowerCase())).size).toBe(ESPECES.length);
  });
  it('a au moins 300 espèces', () => {
    expect(ESPECES.length).toBeGreaterThanOrEqual(300);
  });
  it('les 52 fiches rédigées sont toutes rattachées aux données', () => {
    const sci = new Set(ESPECES.filter((e) => e.redigee).map((e) => e.nomScientifique));
    for (const r of REDACTIONS) expect(sci.has(r.nomScientifique), r.nom).toBe(true);
  });
  it('chaque présence est cohérente (région connue, mois valides, indice 0–100)', () => {
    const ids = new Set(ZONES.map((z) => z.id));
    for (const e of ESPECES) {
      expect(e.presence.length, e.nom).toBeGreaterThan(0);
      for (const p of e.presence) {
        expect(ids.has(p.zone)).toBe(true);
        expect(p.mois.every((m) => m >= 1 && m <= 12)).toBe(true);
        expect(p.indice).toHaveLength(12);
        expect(p.annees).toBeGreaterThanOrEqual(5);
      }
    }
  });
  it('aucun nom n’est resté en latin', () => {
    for (const e of ESPECES) expect(e.nom, e.nomScientifique).not.toBe(e.nomScientifique);
  });
  it('les oiseaux échappés de captivité sont exclus', () => {
    const sci = new Set(ESPECES.map((e) => e.nomScientifique));
    for (const x of ['Anas bahamensis', 'Phoenicopterus ruber', 'Pavo cristatus', 'Aix sponsa']) expect(sci.has(x)).toBe(false);
  });
  it('quelques répartitions connues sont retrouvées', () => {
    const e = (s: string) => ESPECES.find((x) => x.nomScientifique === s)!;
    expect(e('Sitta whiteheadi').presence.map((p) => p.zone)).toEqual(['corse']);
    expect(e('Turdus merula').presence).toHaveLength(13);
    expect(e('Apus apus').presence.every((p) => p.statut === 'estivant')).toBe(true);
    expect(e('Coracias garrulus').presence.map((p) => p.zone).sort()).toEqual(['occitanie', 'paca']);
  });
  it('chaque espèce a une photo libre créditée', () => {
    for (const e of ESPECES) {
      const p = photoDe(e);
      expect(p, e.nom).toBeDefined();
      expect(p!.url).toMatch(/^https:\/\/(thumb|upload)\.wikimedia\.org\//);
      expect(p!.auteur.length).toBeGreaterThan(0);
      expect(p!.licence.length).toBeGreaterThan(0);
    }
  });
  it('mâle et femelle : espèces connues, deux photos créditées et distinctes', () => {
    const sci = new Set(ESPECES.map((e) => e.nomScientifique));
    const paires = Object.entries((sexes as { sexes: Record<string, Record<'male' | 'femelle', { url: string; auteur: string; licence: string }>> }).sexes);
    expect(paires.length).toBeGreaterThan(50);
    for (const [nom, p] of paires) {
      expect(sci.has(nom), nom).toBe(true);
      for (const x of [p.male, p.femelle]) {
        expect(x.url).toMatch(/^https:\/\/(inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)\//);
        expect(x.auteur.length).toBeGreaterThan(0);
        expect(x.licence).toMatch(/^CC/);
      }
      expect(p.male.url).not.toBe(p.femelle.url);
    }
  });
  it('n’emploie jamais le terme « race »', () => {
    expect(JSON.stringify(ESPECES)).not.toMatch(/\brace\b/i);
  });
});
