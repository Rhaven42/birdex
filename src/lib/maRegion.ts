import { useSyncExternalStore } from 'react';
import type { ZoneId } from '../data/types';
import { zoneById } from '../data/zones';

const CLE = 'birdex:ma-region';
const abonnes = new Set<() => void>();

export function lireMaRegion(): ZoneId | null {
  const z = localStorage.getItem(CLE);
  return z && zoneById(z) ? z : null;
}

export function choisirMaRegion(z: ZoneId): void {
  localStorage.setItem(CLE, z);
  abonnes.forEach((f) => f());
}

/** Région de l'utilisatrice, choisie une fois (null tant qu'elle n'a pas choisi). */
export function useMaRegion(): ZoneId | null {
  return useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    lireMaRegion,
  );
}
