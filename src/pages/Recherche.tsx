import { Link, useSearchParams } from 'react-router-dom';
import BarreRecherche from '../components/BarreRecherche';
import { ESPECES } from '../data/species';
import { zoneById } from '../data/zones';
import { rechercher } from '../lib/search';
import { useDecouvertes } from '../lib/hooks';
import { ABONDANCE, MOIS_LONGS, STATUT } from '../lib/format';
import { Silhouette } from '../components/ui';

function periode(m: number[]) {
  if (m.length === 12) return 'toute l’année';
  return `de ${MOIS_LONGS[m[0] - 1]} à ${MOIS_LONGS[m[m.length - 1] - 1]}`;
}

export default function Recherche() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const dec = useDecouvertes();
  const resultats = rechercher(q, ESPECES);

  return (
    <div className="page">
      <h1 className="titre-section">Recherche</h1>
      <BarreRecherche key={q} valeurInitiale={q} autoFocus={!q} />
      {q && (
        <p className="petit">
          {resultats.length} résultat{resultats.length > 1 ? 's' : ''} pour « {q} »
        </p>
      )}
      <ul className="resultats">
        {resultats.map(({ espece: e }) => (
          <li key={e.id}>
            <Link to={`/espece/${e.id}`} className="resultat">
              <Silhouette className={dec.has(e.id) ? 'trouvee' : ''} />
              <div>
                <strong>{e.nom}</strong> <em>{e.nomScientifique}</em>
                {dec.has(e.id) && <span className="badge ok">✓ Découverte</span>}
                <ul className="ou">
                  {e.presence.map((p) => (
                    <li key={p.zone}>
                      📍 <strong>{zoneById(p.zone)?.nom}</strong> : {STATUT[p.statut].toLowerCase()}, {ABONDANCE[p.abondance].toLowerCase()},{' '}
                      {periode(p.mois)}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {q && resultats.length === 0 && (
        <p className="vide">
          Aucun oiseau trouvé. Vérifiez l’orthographe ou essayez le nom scientifique. Birdex couvre pour l’instant l’Île-de-France et le Var.
        </p>
      )}
    </div>
  );
}
