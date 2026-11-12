import { Component, useEffect, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import Accueil from './pages/Accueil';
import Zone from './pages/Zone';
import Fiche from './pages/Fiche';
import Recherche from './pages/Recherche';
import Collection from './pages/Collection';
import Carnet from './pages/Carnet';
import Charte from './pages/Charte';
import Badges from './pages/Badges';

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

const NAV = [
  { to: '/', label: 'Carte', icone: '🗺️' },
  { to: '/recherche', label: 'Recherche', icone: '🔍' },
  { to: '/collection', label: 'Collection', icone: '🪶' },
  { to: '/carnet', label: 'Carnet', icone: '📓' },
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
      </header>

      <main>
        <GardeFou cle={pathname}>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/zone/:id" element={<Zone />} />
          <Route path="/espece/:id" element={<Fiche />} />
          <Route path="/recherche" element={<Recherche />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/carnet" element={<Carnet />} />
          <Route path="/charte" element={<Charte />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="*" element={<div className="page"><p>Page introuvable.</p><Link to="/">Accueil</Link></div>} />
        </Routes>
        </GardeFou>
      </main>

      <nav className="nav-bas" aria-label="Navigation principale">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}>
            <span aria-hidden="true">{n.icone}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
