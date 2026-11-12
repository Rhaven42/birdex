import { Link } from 'react-router-dom';
import FranceMap from '../components/FranceMap';
import BarreRecherche from '../components/BarreRecherche';
import { CarteEspece, Progression } from '../components/ui';
import { ESPECES, especesDeZone } from '../data/species';
import { ZONES } from '../data/zones';
import { useDecouvertes } from '../lib/hooks';
import { MOIS_LONGS, moisCourant } from '../lib/format';
import { progressionZones } from '../lib/progression';

export default function Accueil() {
  const dec = useDecouvertes();
  const prog = progressionZones(dec);
  const m = moisCourant();
  // Suggestions du mois : espèces à découvrir, présentes ce mois-ci, faciles d'abord
  const ordre = { facile: 0, moyen: 1, difficile: 2 };
  const duMois = ESPECES.filter((e) => !dec.has(e.id) && e.presence.some((p) => p.mois.includes(m) && p.abondance !== 'rare'))
    .sort((a, b) => ordre[a.difficulte] - ordre[b.difficulte])
    .slice(0, 6);

  return (
    <div className="page">
      <BarreRecherche />

      <section className="bloc">
        <h1 className="titre-section">Explorez la carte</h1>
        <FranceMap progression={prog} />
        <div className="zones">
          {ZONES.map((z) => (
            <Link key={z.id} to={`/zone/${z.id}`} className="zone-carte">
              <div>
                <h2>{z.nom}</h2>
                <p>{z.type === 'region' ? 'Région' : `Département · ${z.region}`}</p>
              </div>
              <Progression n={prog[z.id].n} total={prog[z.id].total} label={`Progression ${z.nom}`} />
            </Link>
          ))}
        </div>
        <p className="petit">
          Phase test : Île-de-France et Var. Les autres territoires arrivent bientôt ({ESPECES.length} espèces référencées pour l’instant).
        </p>
      </section>

      {duMois.length > 0 && (
        <section className="bloc">
          <h2 className="titre-section">À chercher en {MOIS_LONGS[m - 1]}</h2>
          <div className="grille-especes">
            {duMois.map((e) => (
              <CarteEspece
                key={e.id}
                e={e}
                decouverte={false}
                sousTitre={ZONES.filter((z) => especesDeZone(z.id).includes(e)).map((z) => z.nom).join(' · ')}
              />
            ))}
          </div>
        </section>
      )}

      <Link to="/charte" className="bandeau-charte">
        🤝 <span><strong>Charte du bon observateur</strong> : observer sans déranger</span> ›
      </Link>
    </div>
  );
}
