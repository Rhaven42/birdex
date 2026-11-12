import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Observation } from '../data/types';
import { abonner, chargerCarnet } from './storage';
import { photoEspece, resumeWikipedia, type Photo, type Resume } from './media';

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

export function usePhoto(titreWiki: string | undefined, actif = true): { photo: Photo | null; chargement: boolean } {
  const [etat, setEtat] = useState<{ titre: string; photo: Photo | null } | null>(null);
  useEffect(() => {
    if (!actif || !titreWiki) return;
    let vivant = true;
    photoEspece(titreWiki).then((photo) => vivant && setEtat({ titre: titreWiki, photo }));
    return () => {
      vivant = false;
    };
  }, [titreWiki, actif]);
  const ok = !!etat && etat.titre === titreWiki;
  return { photo: ok ? etat!.photo : null, chargement: actif && !!titreWiki && !ok };
}

export function useResume(titreWiki: string | undefined, actif = true): { resume: Resume | null; chargement: boolean } {
  const [etat, setEtat] = useState<{ titre: string; resume: Resume | null } | null>(null);
  useEffect(() => {
    if (!actif || !titreWiki) return;
    let vivant = true;
    resumeWikipedia(titreWiki).then((resume) => vivant && setEtat({ titre: titreWiki, resume }));
    return () => {
      vivant = false;
    };
  }, [titreWiki, actif]);
  const ok = !!etat && etat.titre === titreWiki;
  return { resume: ok ? etat!.resume : null, chargement: actif && !!titreWiki && !ok };
}
