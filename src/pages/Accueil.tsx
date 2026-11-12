import { Link } from 'react-router-dom';
import FranceMap from '../components/FranceMap';
import BarreRecherche from '../components/BarreRecherche';
import { CarteEspece, Progression } from '../components/ui';
import { ESPECES } from '../data/species';
import { ZONES } from '../data/zones';
import { useDecouvertes } from '../lib/hooks';
import { MOIS_LONGS, moisCourant } from '../lib/format';
import { progressionZones } from '../lib/progression';

export default function Accueil() {
  const dec = useDecouvertes();
  const prog = progressionZones(dec);
  const m = moisCourant();
  // À chercher ce mois-ci : espèces communes dans au moins la moitié des régions ce mois-ci, faciles d'abord
  const ordre = { facile: 0, moyen: 1, difficile: 2 };
  const duMois = ESPECES.filter(
    (e) => !dec.has(e.id) && e.presence.filter((p) => p.mois.includes(m) && p.abondance === 'commune').length >= 7,
  )
    .sort((a, b) => ordre[a.difficulte ?? 'moyen'] - ordre[b.difficulte ?? 'moyen'] || Number(b.redigee) - Number(a.redigee))
    .slice(0, 6);

  return (
    <div className="page">
      <BarreRecherche />

      <section className="bloc">
        <h1 className="titre-section">Explorez la carte</h1>
        <FranceMap progression={prog} />
        <div className="progression-nationale">
          <Progression n={dec.size} total={ESPECES.length} label="Progression France" />
        </div>
        <ul className="liste-regions">
          {ZONES.map((z) => (
            <li key={z.id}>
              <Link to={`/zone/${z.id}`}>
                <span className="lr-nom">{z.nom}</span>
                <span className="lr-compte">{prog[z.id].n} / {prog[z.id].total}</span>
                <span className="progression-barre"><span style={{ width: `${(prog[z.id].n / prog[z.id].total) * 100}%` }} /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {duMois.length > 0 && (
        <section className="bloc">
          <h2 className="titre-section">À chercher en {MOIS_LONGS[m - 1]}</h2>
          <p className="petit">Des espèces faciles à trouver en ce moment dans la plupart des régions.</p>
          <div className="grille-especes">
            {duMois.map((e) => <CarteEspece key={e.id} e={e} decouverte={false} />)}
          </div>
        </section>
      )}

      <Link to="/charte" className="bandeau-charte">
        🤝 <span><strong>Charte du bon observateur</strong> : observer sans déranger</span> ›
      </Link>
    </div>
  );
}
