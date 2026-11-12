import { useState } from 'react';

export type TailleTexte = 'normal' | 'grand' | 'tres-grand';
const CLE = 'birdex:taille-texte';

export function appliquerTailleTexte(t: TailleTexte = lireTailleTexte()): void {
  const h = document.documentElement;
  h.classList.remove('texte-normal', 'texte-tres-grand');
  if (t === 'normal') h.classList.add('texte-normal');
  if (t === 'tres-grand') h.classList.add('texte-tres-grand');
}

export function lireTailleTexte(): TailleTexte {
  const t = localStorage.getItem(CLE);
  return t === 'normal' || t === 'tres-grand' ? t : 'grand';
}

export function useTailleTexte(): [TailleTexte, (t: TailleTexte) => void] {
  const [t, setT] = useState(lireTailleTexte);
  return [
    t,
    (nouvelle) => {
      localStorage.setItem(CLE, nouvelle);
      appliquerTailleTexte(nouvelle);
      setT(nouvelle);
    },
  ];
}
