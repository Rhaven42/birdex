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

/** Familles d'oiseaux si proches qu'on les présente ensemble (ex. mésanges, orite et rémiz). */
const FAMILLES_VOISINES: string[][] = [
  ['Paridae', 'Aegithalidae', 'Remizidae', 'Panuridae'],
  ['Alaudidae', 'Motacillidae'],
  ['Phylloscopidae', 'Acrocephalidae', 'Locustellidae', 'Cettiidae', 'Cisticolidae', 'Sylviidae', 'Regulidae'],
  ['Sittidae', 'Certhiidae', 'Tichodromidae'],
  ['Stercorariidae', 'Laridae'],
  ['Hydrobatidae', 'Procellariidae'],
  ['Phalacrocoracidae', 'Sulidae'],
  ['Accipitridae', 'Pandionidae'],
];

/** Premier mot du nom français (« Mésange », « Pouillot », « Grive »…), sans article. */
const premierMot = (nom: string) => nom.split(/[\s-]/)[0].toLowerCase();

/**
 * Les « variantes » d'un oiseau : les autres espèces de sa famille (ou d'une famille très proche)
 * et celles qui portent le même nom de groupe (toutes les « Mésanges », tous les « Pouillots »…).
 * Les plus faciles à voir en premier.
 */
export function especesProches(e: Espece, max = 12): Espece[] {
  const voisines = new Set(FAMILLES_VOISINES.find((g) => g.includes(e.famille)) ?? [e.famille]);
  const mot = premierMot(e.nom);
  const poids = (x: Espece) => x.presence.reduce((a, p) => a + p.observations, 0);
  return ESPECES.filter((x) => x.id !== e.id && (voisines.has(x.famille) || premierMot(x.nom) === mot))
    .sort((a, b) => Number(premierMot(b.nom) === mot) - Number(premierMot(a.nom) === mot) || Number(b.famille === e.famille) - Number(a.famille === e.famille) || poids(b) - poids(a))
    .slice(0, max);
}
