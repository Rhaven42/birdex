import { describe, expect, it } from 'vitest';
import { CRITERES } from './criteres';
import { ESPECES } from './species';
import gbif from './gbif.json';

const enverguresWikidata = new Map(
  gbif.especes.filter((e) => e.envergure).map((e) => {
    const n = String(e.envergure).split('–').map(Number);
    return [e.nomScientifique, (n[0] + (n[1] ?? n[0])) / 2] as const;
  }),
);

describe('critères de la recherche guidée', () => {
  it('couvrent exactement les 355 espèces (pas de nom mal orthographié)', () => {
    const sci = new Set(ESPECES.map((e) => e.nomScientifique));
    expect(Object.keys(CRITERES).filter((s) => !sci.has(s))).toEqual([]);
    expect(ESPECES.filter((e) => !CRITERES[e.nomScientifique]).map((e) => e.nom)).toEqual([]);
  });
  it('concordent avec les milieux des fiches rédigées', () => {
    const vers: Record<string, string> = { jardin: 'J', ville: 'J', foret: 'F', campagne: 'C', garrigue: 'C', 'zone-humide': 'E', littoral: 'M', mer: 'M', falaise: 'R' };
    const ecarts: string[] = [];
    for (const e of ESPECES.filter((x) => x.redigee)) {
      const h = CRITERES[e.nomScientifique].habitats;
      for (const m of e.milieux) if (!h.includes(vers[m] as never)) ecarts.push(`${e.nom} : ${m}`);
    }
    expect(ecarts).toEqual([]);
  });
  it('les tailles sont cohérentes avec les envergures de Wikidata', () => {
    const incoherents: string[] = [];
    for (const [sci, c] of Object.entries(CRITERES)) {
      const env = enverguresWikidata.get(sci);
      if (!env) continue;
      if (c.tailles.includes('p') && !c.tailles.includes('m') && env > 40) incoherents.push(`${sci} petit mais ${env} cm`);
      if (c.tailles.includes('g') && !c.tailles.includes('m') && env < 65) incoherents.push(`${sci} grand mais ${env} cm`);
      if (c.tailles.length === 1 && c.tailles[0] === 'm' && (env < 25 || env > 130)) incoherents.push(`${sci} moyen mais ${env} cm`);
    }
    expect(incoherents).toEqual([]);
  });
});
