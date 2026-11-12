import { CRITERES, type Habitat, type Taille } from '../data/criteres';
import { ESPECES } from '../data/species';
import type { Espece, ZoneId } from '../data/types';

export interface Choix {
  taille?: Taille;
  habitat?: Habitat;
  /** Région où l'oiseau a été vu (null = toute la France) */
  zone?: ZoneId | null;
  /** Mois de l'observation (1–12) ; les oiseaux absents ce mois-là sont écartés */
  mois?: number;
}

const RANG = { commune: 0, 'peu-commune': 1, rare: 2 } as const;

/** Oiseaux qui correspondent aux choix, les plus courants (donc les plus probables) en premier. */
export function oiseauxPossibles(c: Choix, especes: Espece[] = ESPECES): Espece[] {
  const res: { e: Espece; rang: number; vus: number }[] = [];
  for (const e of especes) {
    const cr = CRITERES[e.nomScientifique];
    if (!cr) continue;
    if (c.taille && !cr.tailles.includes(c.taille)) continue;
    if (c.habitat && !cr.habitats.includes(c.habitat)) continue;
    const presences = c.zone ? e.presence.filter((p) => p.zone === c.zone) : e.presence;
    const ceMois = c.mois ? presences.filter((p) => p.mois.includes(c.mois!)) : presences;
    if (!ceMois.length) continue;
    res.push({ e, rang: Math.min(...ceMois.map((p) => RANG[p.abondance])), vus: ceMois.reduce((a, p) => a + p.observations, 0) });
  }
  // Les plus courants d'abord ; à abondance égale, ceux qu'on croise le plus souvent (nombre d'observations)
  return res.sort((a, b) => a.rang - b.rang || b.vus - a.vus).map((x) => x.e);
}
