import geo from '../data/geo.json';
import { zoneOfRegionCode } from '../data/zones';
import type { ZoneId } from '../data/types';

export const FRANCE: [number, number, number, number] = [-10, -10, geo.width + 20, geo.height + 20];

/** Noms courts affichés sur la carte (lisibles même sur un petit écran). */
const NOMS_COURTS: Record<string, string> = {
  idf: 'Paris', cvl: 'Centre', bfc: 'Bourgogne', normandie: 'Normandie', hdf: 'Nord',
  'grand-est': 'Grand Est', pdl: 'Loire', bretagne: 'Bretagne', 'nouvelle-aquitaine': 'Aquitaine',
  occitanie: 'Occitanie', ara: 'Rhône-Alpes', paca: 'Provence', corse: 'Corse',
};
// Petits ajustements de position des noms (centre de la région ≠ centre du rectangle)
const DECALAGE: Record<string, [number, number]> = { idf: [0, 0], pdl: [-10, 10], ara: [10, 10], hdf: [10, 30], paca: [12, -10], corse: [-48, 0], normandie: [-20, 20], bretagne: [10, 0], 'grand-est': [10, 10] };

interface Props {
  /** Couleur de remplissage de chaque région (absente = gris clair) */
  couleur?: (z: ZoneId) => string | undefined;
  /** Région mise en avant (contour épais) */
  selection?: ZoneId | null;
  onChoisir: (z: ZoneId) => void;
  libelle: string;
}

/** Carte des 13 régions : on touche n'importe où dans une région, son nom est écrit dessus. */
export default function FranceMap({ couleur, selection, onChoisir, libelle }: Props) {
  return (
    <svg className="carte-regions" viewBox={FRANCE.join(' ')} role="group" aria-label={libelle}>
      {geo.regions.map((r) => {
        const z = zoneOfRegionCode(r.code)!;
        return (
          <path
            key={r.code}
            d={r.d}
            className={selection === z ? 'choisie' : ''}
            style={{ fill: couleur?.(z) }}
            role="button"
            tabIndex={0}
            aria-label={r.nom}
            onClick={() => onChoisir(z)}
            onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && onChoisir(z)}
          >
            <title>{r.nom}</title>
          </path>
        );
      })}
      <g className="noms-regions" aria-hidden="true">
        {geo.regions.map((r) => {
          const z = zoneOfRegionCode(r.code)!;
          const [dx, dy] = DECALAGE[z] ?? [0, 0];
          const x = r.bbox[0] + r.bbox[2] / 2 + dx;
          const y = r.bbox[1] + r.bbox[3] / 2 + dy;
          return (
            <text key={r.code} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={z === 'idf' ? 34 : 42}>
              {NOMS_COURTS[z]}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
