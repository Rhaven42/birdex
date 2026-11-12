import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import geo from '../data/geo.json';
import { CarteEspece } from '../components/ui';
import { Anneau, Icone } from '../components/Icones';
import { especesDeZone } from '../data/species';
import { zoneById } from '../data/zones';
import type { Milieu } from '../data/types';
import { useDecouvertes } from '../lib/hooks';
import { ABONDANCE, MILIEU, STATUT, moisCourant } from '../lib/format';
import { normaliser } from '../lib/search';

type Filtre = 'toutes' | 'decouvertes' | 'a-decouvrir';

export default function Zone() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const zone = zoneById(id);
  const dec = useDecouvertes();
  const [filtre, setFiltre] = useState<Filtre>('toutes');
  const [milieu, setMilieu] = useState<Milieu | ''>('');
  const [ceMois, setCeMois] = useState(false);
  const [texte, setTexte] = useState('');

  const especes = useMemo(() => (zone ? especesDeZone(zone.id) : []), [zone]);
  if (!zone) return <div className="page"><p>Zone inconnue.</p><Link to="/">Retour à la carte</Link></div>;

  const dep = geo.departements.find((d) => d.code === params.get('dep'));
  const m = moisCourant();
  const milieux = [...new Set(especes.flatMap((e) => e.milieux))];
  const liste = especes
    .filter((e) => (filtre === 'decouvertes' ? dec.has(e.id) : filtre === 'a-decouvrir' ? !dec.has(e.id) : true))
    .filter((e) => !milieu || e.milieux.includes(milieu))
    .filter((e) => !ceMois || e.presence.some((p) => p.zone === zone.id && p.mois.includes(m)))
    .filter((e) => !texte || normaliser(e.nom).includes(normaliser(texte)) || normaliser(e.nomScientifique).includes(normaliser(texte)))
    .sort((a, b) => Number(dec.has(b.id)) - Number(dec.has(a.id)) || a.nom.localeCompare(b.nom, 'fr'));
  const n = especes.filter((e) => dec.has(e.id)).length;

  return (
    <div className="page">
      <Link to="/" className="retour"><Icone nom="retour" taille={18} /> Carte</Link>
      <header className="entete-zone">
        <div className="hero">
          <div className="hero-texte">
            <p className="hero-salut">Région</p>
            <h1>{zone.nom}</h1>
            <div className="hero-chiffres">
              <span><strong>{n}</strong> / {especes.length} espèces découvertes</span>
            </div>
          </div>
          <Anneau n={n} total={especes.length} taille={84} />
        </div>
        {dep && (
          <p className="petit">
            Vous avez touché {dep.nom} ({dep.code}) : la liste couvre toute la région.
          </p>
        )}
        <p>{zone.description}</p>
        <p className="petit">{especes.length} espèces d’oiseaux vivent ou passent régulièrement dans cette région.</p>
        <details>
          <summary>Où observer ?</summary>
          <ul>{zone.sitesConseilles.map((s) => <li key={s}>{s}</li>)}</ul>
        </details>
      </header>

      <div className="filtres">
        <input className="filtre-texte" type="search" value={texte} onChange={(ev) => setTexte(ev.target.value)} placeholder={`Filtrer les ${especes.length} espèces…`} aria-label="Filtrer par nom" />
        <div className="segment" role="group" aria-label="Filtrer par découverte">
          {(['toutes', 'decouvertes', 'a-decouvrir'] as Filtre[]).map((f) => (
            <button key={f} className={filtre === f ? 'actif' : ''} onClick={() => setFiltre(f)}>
              {f === 'toutes' ? 'Toutes' : f === 'decouvertes' ? 'Découvertes' : 'À découvrir'}
            </button>
          ))}
        </div>
        <details className="plus-filtres">
          <summary>Plus de filtres</summary>
          <div>
            <select value={milieu} onChange={(ev) => setMilieu(ev.target.value as Milieu | '')} aria-label="Milieu">
              <option value="">Tous les milieux</option>
              {milieux.map((mi) => (
                <option key={mi} value={mi}>{MILIEU[mi].emoji} {MILIEU[mi].label}</option>
              ))}
            </select>
            <label className="case">
              <input type="checkbox" checked={ceMois} onChange={(ev) => setCeMois(ev.target.checked)} /> Présentes ce mois-ci
            </label>
          </div>
        </details>
      </div>

      <div className="grille-especes">
        {liste.map((e) => {
          const p = e.presence.find((x) => x.zone === zone.id)!;
          return <CarteEspece key={e.id} e={e} decouverte={dec.has(e.id)} sousTitre={<><span className={`pastille ab-${p.abondance}`}>{ABONDANCE[p.abondance]}</span> {STATUT[p.statut]}</>} />;
        })}
      </div>
      {liste.length === 0 && <p className="vide">Aucune espèce ne correspond à ces filtres.</p>}
    </div>
  );
}
