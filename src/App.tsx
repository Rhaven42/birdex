import { Component, useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import Accueil from './pages/Accueil';
import Zone from './pages/Zone';
import Fiche from './pages/Fiche';
import Recherche from './pages/Recherche';
import Collection from './pages/Collection';
import Carnet from './pages/Carnet';
import Charte from './pages/Charte';
import Badges from './pages/Badges';
import Compte from './pages/Compte';
import Identifier from './pages/Identifier';
import { identificationActive } from './lib/identification';
import { comptesActifs } from './lib/supabase';
import { useSession, useEtatSynchro } from './lib/sync';
import { nouvelApk, PAGE_APK } from './lib/natif';

function BandeauNouvelApk() {
  const [visible, setVisible] = useState(nouvelApk.disponible);
  useEffect(() => {
    const f = () => setVisible(true);
    nouvelApk.abonnes.add(f);
    return () => void nouvelApk.abonnes.delete(f);
  }, []);
  if (!visible) return null;
  return (
    <div className="bandeau-maj" role="status">
      <span>Une nouvelle version de l’application est disponible.</span>
      <a href={PAGE_APK} target="_blank" rel="noreferrer" className="bouton principal">Installer</a>
    </div>
  );
}
import { Icone, type NomIcone } from './components/Icones';

class GardeFou extends Component<{ children: ReactNode; cle: string }, { erreur: boolean; cle: string }> {
  state = { erreur: false, cle: this.props.cle };
  static getDerivedStateFromError() {
    return { erreur: true };
  }
  static getDerivedStateFromProps(p: { cle: string }, s: { erreur: boolean; cle: string }) {
    return p.cle !== s.cle ? { erreur: false, cle: p.cle } : null;
  }
  render() {
    return this.state.erreur ? (
      <div className="page vide">
        <p>Oups, un problème est survenu sur cette page.</p>
        <Link to="/" className="bouton principal">Retour à la carte</Link>
      </div>
    ) : (
      this.props.children
    );
  }
}

function BoutonCompte() {
  const session = useSession();
  const synchro = useEtatSynchro();
  return (
    <Link to="/compte" className={`bouton-compte ${session ? 'connecte' : ''}`} aria-label={session ? 'Mon compte (connecté)' : 'Créer un compte ou se connecter'}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
      </svg>
      {session && <span className={`point-synchro ${synchro.statut}`} />}
    </Link>
  );
}

const NAV: { to: string; label: string; icone: NomIcone }[] = [
  { to: '/', label: 'Carte', icone: 'carte' },
  { to: '/recherche', label: 'Recherche', icone: 'recherche' },
  { to: '/collection', label: 'Collection', icone: 'collection' },
  { to: '/carnet', label: 'Carnet', icone: 'carnet' },
];

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <header className="entete">
        <Link to="/" className="logo" aria-label="Birdex – accueil">
          <img src="./emblem.webp" alt="" width="44" height="44" />
          <span className="logo-texte">
            <span className="logo-nom">Bird<span>ex</span></span>
            <span className="logo-sous">L’encyclopédie des oiseaux</span>
          </span>
        </Link>
        {comptesActifs && <BoutonCompte />}
      </header>

      <BandeauNouvelApk />
      <main>
        <GardeFou cle={pathname}>
        <div className="transition-page" key={pathname}>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/zone/:id" element={<Zone />} />
          <Route path="/espece/:id" element={<Fiche />} />
          <Route path="/recherche" element={<Recherche />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/carnet" element={<Carnet />} />
          <Route path="/charte" element={<Charte />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/compte" element={<Compte />} />
          <Route path="/identifier" element={<Identifier />} />
          <Route path="*" element={<div className="page"><p>Page introuvable.</p><Link to="/">Accueil</Link></div>} />
        </Routes>
        </div>
        </GardeFou>
      </main>

      <nav className={`nav-bas ${identificationActive ? 'cinq' : ''}`} aria-label="Navigation principale">
        {(identificationActive ? [...NAV.slice(0, 2), { to: '/identifier', label: 'Identifier', icone: 'appareil' as const }, ...NAV.slice(2)] : NAV).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={n.to === '/identifier' ? 'nav-identifier' : undefined}>
            <span className="nav-icone"><Icone nom={n.icone} /></span>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
