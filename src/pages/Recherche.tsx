import { Link, useSearchParams } from 'react-router-dom';
import BarreRecherche from '../components/BarreRecherche';
import { ESPECES } from '../data/species';
import { zoneById } from '../data/zones';
import { rechercher } from '../lib/search';
import { useDecouvertes } from '../lib/hooks';
import { MOIS_LONGS, STATUT } from '../lib/format';
import type { Presence } from '../data/types';
import { Silhouette } from '../components/ui';
import { photoDe } from '../lib/media';
import { Icone } from '../components/Icones';
import GuideOiseau from '../components/GuideOiseau';

/** Période la plus fréquente parmi les régions (ex. « printemps–été, d’avril à août »). */
function resumePeriode(pres: Presence[]) {
  const compte = new Map<string, number>();
  for (const p of pres) compte.set(p.statut, (compte.get(p.statut) ?? 0) + 1);
  const statut = [...compte].sort((a, b) => b[1] - a[1])[0][0] as Presence['statut'];
  const mois = [...new Set(pres.filter((p) => p.statut === statut).flatMap((p) => p.mois))];
  if (mois.length >= 12) return 'Toute l’année';
  const tri = statut === 'hivernant' ? [...mois].sort((a, b) => ((a + 5) % 12) - ((b + 5) % 12)) : [...mois].sort((a, b) => a - b);
  return `${STATUT[statut]}, de ${MOIS_LONGS[tri[0] - 1]} à ${MOIS_LONGS[tri[tri.length - 1] - 1]}`;
}

export default function Recherche() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const dec = useDecouvertes();
  const resultats = rechercher(q, ESPECES);

  return (
    <div className="page">
      <h1 className="titre-section">Chercher un oiseau</h1>
      <p className="consigne">Vous connaissez son nom ? Tapez-le ici :</p>
      <BarreRecherche key={q} valeurInitiale={q} />
      {!q && <GuideOiseau />}
      {q && (
        <p className="petit">
          {resultats.length} résultat{resultats.length > 1 ? 's' : ''} pour « {q} »
        </p>
      )}
      <ul className="resultats">
        {resultats.map(({ espece: e }) => (
          <li key={e.id}>
            <Link to={`/espece/${e.id}`} className="resultat">
              {photoDe(e) ? (
                <img className={`resultat-photo ${dec.has(e.id) ? '' : 'nb'}`} src={photoDe(e)!.miniature} alt="" loading="lazy" />
              ) : (
                <Silhouette className={dec.has(e.id) ? 'trouvee' : ''} />
              )}
              <div>
                <strong>{e.nom}</strong> <em>{e.nomScientifique}</em>
                {dec.has(e.id) && <span className="badge ok">✓ Découverte</span>}
                <p className="ou">
                  <Icone nom="lieu" taille={15} /> {e.presence.length === 13 ? 'Toutes les régions' : `${e.presence.length} région${e.presence.length > 1 ? 's' : ''}`}
                  {' · '}
                  {e.presence
                    .filter((p) => p.abondance === 'commune')
                    .map((p) => zoneById(p.zone)?.nom)
                    .slice(0, 4)
                    .join(', ') || e.presence.map((p) => zoneById(p.zone)?.nom).slice(0, 4).join(', ')}
                  {e.presence.length > 4 ? '…' : ''}
                </p>
                <p className="ou"><Icone nom="soleil" taille={15} /> {resumePeriode(e.presence)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {q && resultats.length === 0 && (
        <p className="vide">
          Aucun oiseau trouvé. Vérifiez l’orthographe ou essayez le nom scientifique. Birdex référence les espèces observées régulièrement en France métropolitaine.
        </p>
      )}
    </div>
  );
}
