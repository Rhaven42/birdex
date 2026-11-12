import { useState } from 'react';
import sexesData from '../data/sexes.json';
import type { Espece } from '../data/types';

interface PhotoSexe {
  url: string;
  miniature: string;
  auteur: string;
  licence: string;
  source: string;
}
const SEXES = (sexesData as { sexes: Record<string, { male: PhotoSexe; femelle: PhotoSexe }> }).sexes;
export const aMaleFemelle = (e: Espece) => !!SEXES[e.nomScientifique];

function Photo({ p, titre, symbole }: { p: PhotoSexe; titre: string; symbole: string }) {
  const [ko, setKo] = useState(false);
  return (
    <figure className="mf-photo">
      {ko ? <div className="mf-absente">Photo indisponible</div> : <img src={p.url} alt={`${titre}`} loading="lazy" onError={() => setKo(true)} />}
      <figcaption>
        <strong><span aria-hidden="true">{symbole}</span> {titre}</strong>
        <a href={p.source} target="_blank" rel="noreferrer" className="mf-credit">© {p.auteur} · {p.licence} · iNaturalist</a>
      </figcaption>
    </figure>
  );
}

/** Photos d'un mâle et d'une femelle côte à côte, pour les différencier. */
export default function MaleFemelle({ e }: { e: Espece }) {
  const s = SEXES[e.nomScientifique];
  if (!s) return null;
  return (
    <section className="bloc male-femelle" aria-labelledby="titre-mf">
      <h2 id="titre-mf">Le mâle et la femelle</h2>
      <div className="mf-grille">
        <Photo p={s.male} titre="Mâle" symbole="♂" />
        <Photo p={s.femelle} titre="Femelle" symbole="♀" />
      </div>
      <p className="petit">Chez certaines espèces, le mâle et la femelle se ressemblent beaucoup : comparez la couleur de la tête, de la poitrine et du dos.</p>
    </section>
  );
}
