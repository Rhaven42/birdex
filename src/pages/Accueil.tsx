import { Link } from 'react-router-dom';
import BarreRecherche from '../components/BarreRecherche';
import { Anneau, Icone } from '../components/Icones';
import { CarteEspece, FondFlou } from '../components/ui';
import { ESPECES } from '../data/species';
import { zoneById } from '../data/zones';
import { useMaRegion } from '../lib/maRegion';
import { useCarnet, useDecouvertes } from '../lib/hooks';
import { MOIS_LONGS, moisCourant } from '../lib/format';
import { photoDe } from '../lib/media';
import { progressionZones } from '../lib/progression';

function salutation() {
  const h = new Date().getHours();
  return h < 6 ? 'Bonne nuit' : h < 18 ? 'Bonjour' : 'Bonsoir';
}

/** Oiseau du jour : une espèce commune, différente chaque jour (même choix pour toute la journée). */
function oiseauDuJour() {
  const communes = ESPECES.filter((e) => e.presence.filter((p) => p.abondance === 'commune').length >= 6 && photoDe(e));
  const jour = Math.floor(Date.now() / 86_400_000);
  return communes[(jour * 7919) % communes.length];
}

export default function Accueil() {
  const dec = useDecouvertes();
  const maRegion = useMaRegion();
  const carnet = useCarnet();
  const prog = progressionZones(dec);
  const m = moisCourant();
  const ordre = { facile: 0, moyen: 1, difficile: 2 };
  const duMois = ESPECES.filter(
    (e) => !dec.has(e.id) && e.presence.filter((p) => p.mois.includes(m) && p.abondance === 'commune').length >= 7,
  )
    .sort((a, b) => ordre[a.difficulte ?? 'moyen'] - ordre[b.difficulte ?? 'moyen'] || Number(b.redigee) - Number(a.redigee))
    .slice(0, 6);
  const jour = oiseauDuJour();
  const photoJour = jour && photoDe(jour);
  const regionsVisitees = new Set(carnet.map((o) => o.zone).filter((z) => z !== 'autre')).size;

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-texte">
          <p className="hero-salut">{salutation()} 👋</p>
          <h1>Quels oiseaux allez-vous découvrir aujourd’hui ?</h1>
          <div className="hero-chiffres">
            <span><strong>{dec.size}</strong> espèces</span>
            <span><strong>{carnet.length}</strong> observations</span>
            <span><strong>{regionsVisitees}</strong> régions</span>
          </div>
        </div>
        <Anneau n={dec.size} total={ESPECES.length} taille={92}>
          <strong>{dec.size}</strong>
          <small>/ {ESPECES.length}</small>
        </Anneau>
      </section>

      {maRegion ? (
        <section className="bloc ma-region-carte">
          <p className="mr-etiquette"><Icone nom="lieu" taille={20} /> Ma région</p>
          <Link to={`/zone/${maRegion}`} className="mr-lien">
            <span className="mr-nom">{zoneById(maRegion)?.nom}</span>
            <span className="mr-compte">{prog[maRegion].n} / {prog[maRegion].total} oiseaux découverts</span>
            <span className="progression-barre"><span style={{ width: `${(prog[maRegion].n / prog[maRegion].total) * 100}%` }} /></span>
            <span className="bouton principal">Voir les oiseaux de ma région</span>
          </Link>
          <div className="mr-autres">
            <Link to="/regions" className="bouton secondaire">Explorer une autre région</Link>
            <Link to="/regions?choix=1" className="lien-discret">Changer ma région</Link>
          </div>
        </section>
      ) : (
        <section className="bloc ma-region-carte">
          <h2 className="titre-section"><Icone nom="lieu" /> Où habitez-vous ?</h2>
          <p>Choisissez votre région une fois : Birdex vous montrera ses oiseaux en premier.</p>
          <Link to="/regions?choix=1" className="bouton principal large">Choisir ma région</Link>
          <Link to="/regions" className="bouton secondaire large">Voir toutes les régions</Link>
        </section>
      )}

      <BarreRecherche />

      {jour && photoJour && (
        <Link to={`/espece/${jour.id}`} className="oiseau-du-jour">
          <FondFlou src={photoJour.miniature} />
          <img src={photoJour.url} alt="" />
          <div className="odj-voile">
            <span className="odj-etiquette"><Icone nom="soleil" taille={16} /> Oiseau du jour</span>
            <strong>{jour.nom}</strong>
            <em>{jour.nomScientifique}</em>
          </div>
          <span className="odj-fleche"><Icone nom="suivant" /></span>
        </Link>
      )}

      {duMois.length > 0 && (
        <section className="bloc">
          <h2 className="titre-section"><Icone nom="jumelles" /> À chercher en {MOIS_LONGS[m - 1]}</h2>
          <p className="petit">Des oiseaux faciles à trouver en ce moment dans la plupart des régions.</p>
          <div className="grille-especes">
            {duMois.map((e) => <CarteEspece key={e.id} e={e} decouverte={false} />)}
          </div>
        </section>
      )}

      <Link to="/aide" className="lien-aide">
        <span className="la-icone" aria-hidden="true">?</span>
        <span><strong>Comment ça marche ?</strong><br />Toutes les réponses à vos questions</span>
        <Icone nom="suivant" />
      </Link>

      <Link to="/charte" className="bandeau-charte">
        <span className="bc-icone"><Icone nom="feuille" /></span>
        <span><strong>Charte du bon observateur</strong><br />Observer sans déranger</span>
        <Icone nom="suivant" />
      </Link>
    </div>
  );
}
