import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Observation } from '../data/types';
import { abonner, chargerCarnet } from './storage';
import { photoEspece, type Photo } from './media';

let cache: Observation[] | null = null;
abonner(() => (cache = null));
const snapshot = () => (cache ??= chargerCarnet());

/** Carnet d'observations réactif (mis à jour à chaque ajout/suppression). */
export function useCarnet(): Observation[] {
  return useSyncExternalStore(abonner, snapshot);
}

export function useDecouvertes(): Set<string> {
  const carnet = useCarnet();
  return new Set(carnet.map((o) => o.especeId));
}

export function usePhoto(titreWiki: string, actif = true): { photo: Photo | null; chargement: boolean } {
  const [etat, setEtat] = useState<{ titre: string; photo: Photo | null } | null>(null);
  useEffect(() => {
    if (!actif) return;
    let vivant = true;
    photoEspece(titreWiki).then((photo) => vivant && setEtat({ titre: titreWiki, photo }));
    return () => {
      vivant = false;
    };
  }, [titreWiki, actif]);
  const ok = etat?.titre === titreWiki;
  return { photo: ok ? etat!.photo : null, chargement: actif && !ok };
}
