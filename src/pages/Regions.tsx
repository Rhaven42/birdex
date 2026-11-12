import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import FranceMap from '../components/FranceMap';
import { Icone } from '../components/Icones';
import { ZONES } from '../data/zones';
import type { ZoneId } from '../data/types';
import { useDecouvertes } from '../lib/hooks';
import { choisirMaRegion, useMaRegion } from '../lib/maRegion';
import { progressionZones } from '../lib/progression';

/** Choisir sa région (une fois) ou aller voir les oiseaux d'une autre région. */
export default function Regions() {
  const [params] = useSearchParams();
  const choix = params.get('choix') === '1';
  const navigate = useNavigate();
  const maRegion = useMaRegion();
  const prog = progressionZones(useDecouvertes());

  const aller = (z: ZoneId) => {
    if (choix) {
      choisirMaRegion(z);
      navigate('/');
    } else navigate(`/zone/${z}`);
  };

  return (
    <div className="page">
      <Link to="/" className="retour"><Icone nom="retour" taille={18} /> Accueil</Link>
      <h1 className="titre-section">{choix ? 'Dans quelle région habitez-vous ?' : 'Toutes les régions'}</h1>
      <p className="consigne">{choix ? 'Touchez votre région sur la carte ou dans la liste.' : 'Touchez une région pour voir ses oiseaux.'}</p>

      <section className="bloc">
        <FranceMap
          libelle="Carte des régions de France"
          selection={maRegion}
          couleur={(z) => (z === maRegion ? 'var(--orange)' : undefined)}
          onChoisir={aller}
        />
      </section>

      <ul className="gros-choix">
        {ZONES.map((z) => (
          <li key={z.id}>
            <button className={z.id === maRegion ? 'ma-region' : ''} onClick={() => aller(z.id)}>
              <span className="gc-nom">{z.nom}</span>
              {!choix && <span className="gc-compte">{prog[z.id].n} / {prog[z.id].total} oiseaux</span>}
              {z.id === maRegion && <span className="pastille ab-commune">Ma région</span>}
              <Icone nom="suivant" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
