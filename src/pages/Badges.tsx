import { Link } from 'react-router-dom';
import { Anneau, Icone } from '../components/Icones';
import { BADGES, defisSaisonniers, evaluerBadges, type EtatDefi, type EtatBadge } from '../lib/badges';
import { useCarnet } from '../lib/hooks';

function Medaille({ b }: { b: EtatBadge | EtatDefi }) {
  const pct = Math.round((b.n / b.total) * 100);
  return (
    <li className={`medaille ${b.obtenu ? 'obtenue' : ''}`}>
      <span className="medaille-emoji" aria-hidden="true">{b.emoji}</span>
      <div className="medaille-texte">
        <strong>{b.titre}</strong>
        <span>{b.description}</span>
        <div className="progression-barre" role="progressbar" aria-valuenow={b.n} aria-valuemax={b.total} aria-label={b.titre}>
          <div style={{ width: `${pct}%` }} />
        </div>
        <span className="medaille-compte">{b.obtenu ? '✓ Obtenu' : `${b.n} / ${b.total}`}</span>
      </div>
    </li>
  );
}

export default function Badges() {
  const carnet = useCarnet();
  const badges = evaluerBadges(carnet);
  const defis = defisSaisonniers(carnet);
  const categories = [...new Set(BADGES.map((b) => b.categorie))];
  const nb = badges.filter((b) => b.obtenu).length;

  return (
    <div className="page">
      <Link to="/collection" className="retour"><Icone nom="retour" taille={18} /> Collection</Link>
      <section className="hero">
        <div className="hero-texte">
          <p className="hero-salut">Badges et défis</p>
          <h1>{nb} badge{nb > 1 ? 's' : ''} obtenu{nb > 1 ? 's' : ''}</h1>
          <div className="hero-chiffres"><span>Chaque observation validée vous fait progresser</span></div>
        </div>
        <Anneau n={nb} total={badges.length} taille={84}>
          <strong>{nb}</strong>
          <small>/ {badges.length}</small>
        </Anneau>
      </section>

      <section className="bloc">
        <h2>Défis du moment</h2>
        <ul className="medailles">{defis.map((d) => <Medaille key={d.id} b={d} />)}</ul>
      </section>

      {categories.map((c) => (
        <section key={c} className="bloc">
          <h2>{c}</h2>
          <ul className="medailles">
            {badges.filter((b) => b.categorie === c).map((b) => <Medaille key={b.id} b={b} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}
