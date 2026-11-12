import { useState } from 'react';
import type { Habitat, Taille } from '../data/criteres';
import { ZONES, zoneById } from '../data/zones';
import type { ZoneId } from '../data/types';
import { oiseauxPossibles } from '../lib/guide';
import { MOIS_LONGS, moisCourant } from '../lib/format';
import { useDecouvertes } from '../lib/hooks';
import { useMaRegion } from '../lib/maRegion';
import { CarteEspece, Silhouette } from './ui';

const TAILLES: [Taille, string, string, number][] = [
  ['p', 'Petit', 'comme un moineau', 34],
  ['m', 'Moyen', 'comme un merle ou un pigeon', 48],
  ['g', 'Grand', 'comme un canard ou plus', 64],
];
const HABITATS: [Habitat, string, string][] = [
  ['J', '🏡', 'Jardin, parc, ville'],
  ['F', '🌳', 'Forêt, bois'],
  ['C', '🌾', 'Champs, prairies'],
  ['E', '💧', 'Lac, rivière, marais'],
  ['M', '🏖️', 'Bord de mer, plage'],
  ['R', '⛰️', 'Montagne, rochers'],
];
const PAR_PAGE = 24;

/** « Quel est cet oiseau ? » : taille + milieu (+ région et mois) → oiseaux possibles. */
export default function GuideOiseau() {
  const maRegion = useMaRegion();
  const dec = useDecouvertes();
  const [taille, setTaille] = useState<Taille>();
  const [habitat, setHabitat] = useState<Habitat>();
  const [zone, setZone] = useState<ZoneId | ''>(maRegion ?? '');
  const [ceMois, setCeMois] = useState(true);
  const [nb, setNb] = useState(PAR_PAGE);
  const mois = moisCourant();

  const commence = !!(taille || habitat);
  const res = commence ? oiseauxPossibles({ taille, habitat, zone: zone || null, mois: ceMois ? mois : undefined }) : [];
  const basculer = <T,>(v: T, actuel: T | undefined, set: (x: T | undefined) => void) => {
    set(actuel === v ? undefined : v);
    setNb(PAR_PAGE);
  };

  return (
    <section className="bloc guide" aria-labelledby="titre-guide">
      <h2 id="titre-guide">Quel est cet oiseau ?</h2>
      <p className="consigne">Vous ne connaissez pas son nom ? Touchez sa taille et l’endroit où vous l’avez vu.</p>

      <h3>1. Sa taille</h3>
      <div className="choix-tailles" role="group" aria-label="Taille de l’oiseau">
        {TAILLES.map(([v, label, exemple, px]) => (
          <button key={v} className={taille === v ? 'actif' : ''} aria-pressed={taille === v} onClick={() => basculer(v, taille, setTaille)}>
            <span className="ct-silhouette" style={{ width: px, height: px }}><Silhouette /></span>
            <strong>{label}</strong>
            <span>{exemple}</span>
          </button>
        ))}
      </div>

      <h3>2. Où l’avez-vous vu ?</h3>
      <div className="choix-milieux" role="group" aria-label="Milieu">
        {HABITATS.map(([v, emoji, label]) => (
          <button key={v} className={habitat === v ? 'actif' : ''} aria-pressed={habitat === v} onClick={() => basculer(v, habitat, setHabitat)}>
            <span aria-hidden="true">{emoji}</span> {label}
          </button>
        ))}
      </div>

      <details className="plus-filtres">
        <summary>Région et période : {zone ? zoneById(zone)?.nom : 'toute la France'}{ceMois ? `, en ${MOIS_LONGS[mois - 1]}` : ''}</summary>
        <div>
          <select value={zone} onChange={(e) => { setZone(e.target.value as ZoneId | ''); setNb(PAR_PAGE); }} aria-label="Région">
            <option value="">Toute la France</option>
            {ZONES.map((z) => <option key={z.id} value={z.id}>{z.nom}</option>)}
          </select>
          <label className="case">
            <input type="checkbox" checked={ceMois} onChange={(e) => { setCeMois(e.target.checked); setNb(PAR_PAGE); }} /> Vu ce mois-ci
          </label>
        </div>
      </details>

      {commence && (
        <div className="resultats-guide" aria-live="polite">
          <p className="consigne">
            {res.length ? (
              <><strong>{res.length} oiseau{res.length > 1 ? 'x' : ''} possible{res.length > 1 ? 's' : ''}</strong>, les plus courants en premier. Touchez-en un pour comparer.</>
            ) : (
              'Aucun oiseau ne correspond. Essayez une autre taille ou un autre endroit.'
            )}
          </p>
          <div className="grille-especes">
            {res.slice(0, nb).map((e) => <CarteEspece key={e.id} e={e} decouverte={dec.has(e.id)} enCouleur />)}
          </div>
          {res.length > nb && (
            <button className="bouton secondaire large" onClick={() => setNb(nb + PAR_PAGE)}>Voir plus d’oiseaux ({res.length - nb} autres)</button>
          )}
          <button className="lien-discret" onClick={() => { setTaille(undefined); setHabitat(undefined); }}>Recommencer</button>
        </div>
      )}
    </section>
  );
}
