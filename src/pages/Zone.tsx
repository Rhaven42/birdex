import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import geo from '../data/geo.json';
import { CarteEspece, Progression } from '../components/ui';
import { especesDeZone } from '../data/species';
import { zoneById } from '../data/zones';
import type { Milieu } from '../data/types';
import { useDecouvertes } from '../lib/hooks';
import { ABONDANCE, MILIEU, STATUT, moisCourant } from '../lib/format';

type Filtre = 'toutes' | 'decouvertes' | 'a-decouvrir';

export default function Zone() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const zone = zoneById(id);
  const dec = useDecouvertes();
  const [filtre, setFiltre] = useState<Filtre>('toutes');
  const [milieu, setMilieu] = useState<Milieu | ''>('');
  const [ceMois, setCeMois] = useState(false);

  const especes = useMemo(() => (zone ? especesDeZone(zone.id) : []), [zone]);
  if (!zone) return <div className="page"><p>Zone inconnue.</p><Link to="/">Retour à la carte</Link></div>;

  const dep = geo.departements.find((d) => d.code === params.get('dep'));
  const m = moisCourant();
  const milieux = [...new Set(especes.flatMap((e) => e.milieux))];
  const liste = especes
    .filter((e) => (filtre === 'decouvertes' ? dec.has(e.id) : filtre === 'a-decouvrir' ? !dec.has(e.id) : true))
    .filter((e) => !milieu || e.milieux.includes(milieu))
    .filter((e) => !ceMois || e.presence.some((p) => p.zone === zone.id && p.mois.includes(m)))
    .sort((a, b) => Number(dec.has(b.id)) - Number(dec.has(a.id)) || a.nom.localeCompare(b.nom, 'fr'));
  const n = especes.filter((e) => dec.has(e.id)).length;

  return (
    <div className="page">
      <Link to="/" className="retour">‹ Carte</Link>
      <header className="entete-zone">
        <h1>{zone.nom}</h1>
        {dep && zone.type === 'region' && (
          <p className="petit">
            Vous avez choisi {dep.nom} ({dep.code}) : les données sont pour l’instant établies à l’échelle de la région.
          </p>
        )}
        <Progression n={n} total={especes.length} />
        <p>{zone.description}</p>
        <details>
          <summary>Où observer ?</summary>
          <ul>{zone.sitesConseilles.map((s) => <li key={s}>{s}</li>)}</ul>
        </details>
      </header>

      <div className="filtres">
        <div className="segment" role="group" aria-label="Filtrer par découverte">
          {(['toutes', 'decouvertes', 'a-decouvrir'] as Filtre[]).map((f) => (
            <button key={f} className={filtre === f ? 'actif' : ''} onClick={() => setFiltre(f)}>
              {f === 'toutes' ? 'Toutes' : f === 'decouvertes' ? 'Découvertes' : 'À découvrir'}
            </button>
          ))}
        </div>
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

      <div className="grille-especes">
        {liste.map((e) => {
          const p = e.presence.find((x) => x.zone === zone.id)!;
          return <CarteEspece key={e.id} e={e} decouverte={dec.has(e.id)} sousTitre={`${STATUT[p.statut]} · ${ABONDANCE[p.abondance]}`} />;
        })}
      </div>
      {liste.length === 0 && <p className="vide">Aucune espèce ne correspond à ces filtres.</p>}
    </div>
  );
}
