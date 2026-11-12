import { useEffect, useState } from 'react';
import { etatMaj } from './natif';

/** Suit l'état de la mise à jour de l'application Android. */
export function useEtatMaj() {
  const [, forcer] = useState(0);
  useEffect(() => {
    const f = () => forcer((n) => n + 1);
    etatMaj.abonnes.add(f);
    return () => void etatMaj.abonnes.delete(f);
  }, []);
  return { statut: etatMaj.statut, message: etatMaj.message };
}
