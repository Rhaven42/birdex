import { Link } from 'react-router-dom';
import { Anneau, Icone } from '../components/Icones';
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
      <section className="hero">
        <div className="hero-texte">
          <p className="hero-salut">Ma collection</p>
          <h1>{dec.size ? `${dec.size} espèce${dec.size > 1 ? 's' : ''} découverte${dec.size > 1 ? 's' : ''}` : 'Votre collection vous attend'}</h1>
          <div className="hero-chiffres">
            <span><strong>{carnet.length}</strong> observations</span>
            <span><strong>{familles.filter((f) => ESPECES.some((e) => e.famille === f && dec.has(e.id))).length}</strong> familles</span>
          </div>
        </div>
        <Anneau n={dec.size} total={ESPECES.length} taille={92} />
      </section>
      <Link to="/badges" className="lien-badges">
        <span className="lb-icone"><Icone nom="medaille" /></span>
        <span>Badges et défis</span>
        <span className="lb-compte">{badges.filter((b) => b.obtenu).length} / {badges.length}</span>
        <Icone nom="suivant" taille={18} />
      </Link>
      <section className="bloc">
        <h2>France métropolitaine</h2>
        <Progression n={dec.size} total={ESPECES.length} />
        <details>
          <summary>Détail par région</summary>
          {ZONES.map((z) => (
            <div key={z.id} className="sous-progression">
              <span>{z.nom}</span>
              <Progression n={prog[z.id].n} total={prog[z.id].total} label={z.nom} />
            </div>
          ))}
        </details>
      </section>
      <div className="grille-especes">
        {trie.map((e) => <CarteEspece key={e.id} e={e} decouverte={dec.has(e.id)} />)}
      </div>
    </div>
  );
}
