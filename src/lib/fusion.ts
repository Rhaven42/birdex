import type { Observation } from '../data/types';

/** Ligne de la table public.observations (Supabase). */
export interface LigneObservation {
  id: string;
  espece_id: string;
  date: string;
  zone: string;
  lieu: string;
  note: string;
  photo_chemin: string | null;
  validation: 'manuelle' | 'ia';
  cree_le: string;
  supprime: boolean;
}

export const estUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export function versLigne(o: Observation, photoChemin: string | null): Omit<LigneObservation, 'supprime'> {
  return {
    id: o.id,
    espece_id: o.especeId,
    date: o.date,
    zone: o.zone,
    lieu: o.lieu,
    note: o.note,
    photo_chemin: photoChemin,
    validation: o.validation,
    cree_le: o.creeLe,
  };
}

export function depuisLigne(l: LigneObservation, photo?: string): Observation {
  return {
    id: l.id,
    especeId: l.espece_id,
    date: l.date,
    zone: l.zone,
    lieu: l.lieu,
    note: l.note,
    photo,
    photoChemin: l.photo_chemin ?? undefined,
    validation: l.validation,
    creeLe: l.cree_le,
  };
}

export interface Plan {
  /** Observations locales absentes du compte : à envoyer */
  aEnvoyer: Observation[];
  /** Observations du compte absentes du téléphone : à récupérer */
  aRecevoir: LigneObservation[];
  /** Observations supprimées depuis un autre appareil : à retirer du téléphone */
  aRetirer: string[];
  /** Suppressions faites sur ce téléphone : à propager au compte */
  aSupprimer: string[];
}

/**
 * Fusion « union » : les observations ne sont jamais modifiées après coup,
 * il suffit donc d'ajouter ce qui manque de chaque côté et de propager les suppressions.
 */
export function planifier(local: Observation[], distant: LigneObservation[], supprimesIci: string[]): Plan {
  const parId = new Map(distant.map((l) => [l.id, l]));
  const ici = new Set(local.map((o) => o.id));
  const supp = new Set(supprimesIci);
  return {
    aEnvoyer: local.filter((o) => !parId.has(o.id)),
    aRecevoir: distant.filter((l) => !l.supprime && !ici.has(l.id) && !supp.has(l.id)),
    aRetirer: local.filter((o) => parId.get(o.id)?.supprime).map((o) => o.id),
    aSupprimer: supprimesIci.filter((id) => parId.has(id) && !parId.get(id)!.supprime),
  };
}
