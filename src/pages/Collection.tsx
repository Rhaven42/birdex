import { Link } from 'react-router-dom';
import { CarteEspece, Progression } from '../components/ui';
import { evaluerBadges } from '../lib/badges';
import { ESPECES } from '../data/species';
import { ZONES } from '../data/zones';
import { useCarnet, useDecouvertes } from '../lib/hooks';
import { progressionZones } from '../lib/progression';

export default function Collection() {
  const dec = useDecouvertes();
  const carnet = useCarnet();
  const prog = progressionZones(dec);
  const badges = evaluerBadges(carnet);
  const familles = [...new Set(ESPECES.map((e) => e.famille))].sort((a, b) => a.localeCompare(b, 'fr'));
  const trie = [...ESPECES].sort((a, b) => Number(dec.has(b.id)) - Number(dec.has(a.id)) || a.nom.localeCompare(b.nom, 'fr'));

  return (
    <div className="page">
      <h1 className="titre-section">Ma collection</h1>
      <div className="stats">
        <div><strong>{dec.size}</strong><span>espèces</span></div>
        <div><strong>{carnet.length}</strong><span>observations</span></div>
        <div><strong>{familles.filter((f) => ESPECES.some((e) => e.famille === f && dec.has(e.id))).length}</strong><span>familles</span></div>
      </div>
      <Link to="/badges" className="lien-badges">
        <span aria-hidden="true">🏅</span>
        <span>Badges et défis</span>
        <span>{badges.filter((b) => b.obtenu).length} / {badges.length} ›</span>
      </Link>
      <section className="bloc">
        <h2>France (zones test)</h2>
        <Progression n={dec.size} total={ESPECES.length} />
        {ZONES.map((z) => (
          <div key={z.id} className="sous-progression">
            <span>{z.nom}</span>
            <Progression n={prog[z.id].n} total={prog[z.id].total} label={z.nom} />
          </div>
        ))}
      </section>
      <div className="grille-especes">
        {trie.map((e) => <CarteEspece key={e.id} e={e} decouverte={dec.has(e.id)} />)}
      </div>
    </div>
  );
}
