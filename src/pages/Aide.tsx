import { Link, useNavigate } from 'react-router-dom';
import { Icone } from '../components/Icones';
import { revoirBienvenue } from '../components/Bienvenue';

const QUESTIONS: [string, string][] = [
  ['Comment trouver les oiseaux de chez moi ?', 'Sur l’accueil, touchez « Voir les oiseaux de ma région ». La liste montre les oiseaux qui vivent ou passent près de chez vous.'],
  ['J’ai vu un oiseau, que faire ?', 'Ouvrez sa fiche (touchez-le dans la liste, ou cherchez son nom avec la loupe), puis touchez le gros bouton orange « J’ai vu cet oiseau ! ». Il rejoint votre collection.'],
  ['Je ne connais pas son nom…', 'Touchez « Chercher » en bas, puis, dans « Quel est cet oiseau ? », touchez sa taille (petit, moyen ou grand) et l’endroit où vous l’avez vu. Birdex vous montre les oiseaux possibles, les plus courants en premier. Si vous connaissez une partie du nom, tapez-la, même avec une faute.'],
  ['Comment écouter son chant ?', 'Sur la fiche de l’oiseau, touchez la case « Sons », puis le rond orange ▶. Le bouton « ×0,5 » le fait chanter plus lentement.'],
  ['Pourquoi certaines photos sont en noir et blanc ?', 'Ce sont les oiseaux que vous n’avez pas encore vus. Ils passent en couleur dès que vous les ajoutez à votre collection.'],
  ['Comment changer de région ?', 'Sur l’accueil, sous « Ma région », touchez « Changer ma région ».'],
  ['Le texte est trop petit', 'Touchez le petit bonhomme en haut à droite, puis choisissez « Grand » ou « Très grand » dans « Taille du texte ».'],
  ['Comment ne pas perdre ma collection ?', 'Touchez le petit bonhomme en haut à droite et créez un compte avec votre e-mail et un mot de passe. Votre collection sera sauvegardée et vous la retrouverez sur un autre téléphone.'],
];

export default function Aide() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <Link to="/" className="retour"><Icone nom="retour" taille={18} /> Accueil</Link>
      <h1 className="titre-section">Comment ça marche ?</h1>
      <div className="faq">
        {QUESTIONS.map(([q, r]) => (
          <details key={q} className="bloc">
            <summary>{q}</summary>
            <p>{r}</p>
          </details>
        ))}
      </div>
      <button
        className="bouton secondaire large"
        onClick={() => {
          revoirBienvenue();
          navigate('/');
          location.reload();
        }}
      >
        Revoir la présentation
      </button>
      <p className="petit"><Link to="/charte">Charte du bon observateur</Link></p>
    </div>
  );
}
