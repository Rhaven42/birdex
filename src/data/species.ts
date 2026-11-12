import gbif from './gbif.json';
import { REDACTIONS } from './redactions';
import type { CategorieUICN, Espece, Presence, ZoneId } from './types';

export { DATE_MAJ } from './redactions';

/** Mois de a à b inclus (gère le passage d'une année à l'autre, ex. 10 → 3). */
export function mois(a: number, b: number): number[] {
  const out: number[] = [];
  let m = a;
  for (;;) {
    out.push(m);
    if (m === b) break;
    m = (m % 12) + 1;
  }
  return out;
}

export const SOURCES_DONNEES = {
  periode: gbif.periode,
  genereLe: gbif.genereLe,
};

const parSci = new Map(REDACTIONS.map((r) => [r.nomScientifique, r]));

/**
 * Toutes les espèces : une seule fiche par espèce pour toute la France.
 * Répartition, nom et taxonomie : GBIF + Wikidata ; textes enrichis : rédaction (52 espèces).
 */
export const ESPECES: Espece[] = gbif.especes
  .map((g): Espece => {
    const r = parSci.get(g.nomScientifique);
    const presence = g.presence as Presence[];
    return {
      ...(r ?? {}),
      id: r?.id ?? g.id,
      nom: r?.nom ?? g.nom,
      nomScientifique: g.nomScientifique,
      famille: g.famille,
      ordre: g.ordre,
      taille: r?.taille ?? g.taille,
      envergure: r?.envergure ?? g.envergure,
      milieux: r?.milieux ?? [],
      signes: r?.signes ?? [],
      wiki: r?.wiki ?? g.wiki,
      uicn: g.iucn as CategorieUICN | undefined,
      introduite: g.introduite,
      // Protection : espèces menacées au niveau mondial ou très rares partout → localisation jamais précise
      sensible:
        r?.sensible ||
        ['VU', 'EN', 'CR'].includes(g.iucn ?? '') ||
        presence.every((p) => p.abondance === 'rare'),
      redigee: !!r,
      gbif: g.key,
      qid: g.qid,
      presence,
    };
  })
  .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

const parId = new Map(ESPECES.map((e) => [e.id, e]));
export const especeById = (id: string): Espece | undefined => parId.get(id);

const cacheZone = new Map<ZoneId, Espece[]>();
export function especesDeZone(zone: ZoneId): Espece[] {
  if (!cacheZone.has(zone)) cacheZone.set(zone, ESPECES.filter((e) => e.presence.some((p) => p.zone === zone)));
  return cacheZone.get(zone)!;
}
