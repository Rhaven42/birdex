import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CLE = 'birdex:bienvenue-vue';
export const bienvenueVue = () => localStorage.getItem(CLE) === '1';
export const revoirBienvenue = () => localStorage.removeItem(CLE);

const ETAPES = [
  {
    emoji: '🗺️',
    titre: 'Choisissez votre région',
    texte: 'Birdex vous montre les oiseaux qui vivent près de chez vous.',
  },
  {
    emoji: '🐦',
    titre: 'Découvrez les oiseaux',
    texte: 'Touchez un oiseau pour voir sa photo, écouter son chant et savoir quand le chercher.',
  },
  {
    emoji: '👀',
    titre: 'Vous en avez vu un ?',
    texte: 'Touchez le gros bouton orange « J’ai vu cet oiseau ! ». Il rejoint votre collection.',
  },
];

/** Présentation en 3 étapes, montrée au premier lancement (puis depuis « Comment ça marche ? »). */
export default function Bienvenue({ onFin }: { onFin: () => void }) {
  const [etape, setEtape] = useState(0);
  const navigate = useNavigate();
  const e = ETAPES[etape];
  const derniere = etape === ETAPES.length - 1;

  const terminer = () => {
    localStorage.setItem(CLE, '1');
    onFin();
    // Première fois : choisir sa région ; sinon retour à l'accueil
    navigate(localStorage.getItem('birdex:ma-region') ? '/' : '/regions?choix=1');
  };

  return (
    <div className="bienvenue" role="dialog" aria-modal="true" aria-labelledby="titre-bienvenue">
      <div className="bv-carte">
        <img src="./logo-birdex.webp" alt="Birdex" className="bv-logo" />
        <p className="bv-etape">Étape {etape + 1} sur {ETAPES.length}</p>
        <div className="bv-emoji" aria-hidden="true">{e.emoji}</div>
        <h1 id="titre-bienvenue">{e.titre}</h1>
        <p className="bv-texte">{e.texte}</p>
        <div className="bv-points" aria-hidden="true">
          {ETAPES.map((_, i) => <span key={i} className={i === etape ? 'actif' : ''} />)}
        </div>
        <button className="bouton principal large" onClick={() => (derniere ? terminer() : setEtape(etape + 1))}>
          {derniere ? 'C’est parti !' : 'Suivant'}
        </button>
        {etape > 0 && <button className="bouton secondaire large" onClick={() => setEtape(etape - 1)}>Retour</button>}
        {!derniere && (
          <button className="lien-discret" onClick={terminer}>Passer la présentation</button>
        )}
      </div>
    </div>
  );
}
