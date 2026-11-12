import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import geo from '../data/geo.json';
import type { Espece } from '../data/types';
import { zoneById, zoneOfRegionCode } from '../data/zones';
import { ABONDANCE, MOIS_LONGS, STATUT, moisCourant } from '../lib/format';
import { FRANCE } from './FranceMap';

/** Couleurs d'abondance : vert = commune, orange = peu commune, rouge = rare. */
export const COULEUR_ABONDANCE = { commune: 'var(--ab-commune)', 'peu-commune': 'var(--ab-peu)', rare: 'var(--ab-rare)' } as const;

/**
 * Carte de répartition d'une espèce en France, région par région.
 * « Toute l'année » : couleur selon l'abondance ; un mois précis : selon la fréquence d'observation ce mois-là.
 */
export default function CarteRepartition({ e }: { e: Espece }) {
  const navigate = useNavigate();
  const [mois, setMois] = useState(0); // 0 = toute l'année
  const [choix, setChoix] = useState<string | null>(null);
  const parZone = new Map(e.presence.map((p) => [p.zone, p]));

  /** Couleur de la région : abondance si l'espèce y est présente (ce mois-ci, si un mois est choisi). */
  const couleur = (codeRegion: string) => {
    const p = parZone.get(zoneOfRegionCode(codeRegion) ?? '');
    if (!p) return undefined;
    if (mois && !p.mois.includes(mois)) return undefined;
    return COULEUR_ABONDANCE[p.abondance];
  };

  const pChoisie = choix ? parZone.get(choix) : undefined;
  const nbRegions = e.presence.length;

  return (
    <div className="repartition">
      <p className="repartition-resume">
        Observée régulièrement dans <strong>{nbRegions} région{nbRegions > 1 ? 's' : ''}</strong> sur 13
        {mois ? <> · en <strong>{MOIS_LONGS[mois - 1]}</strong></> : null}
      </p>
      <svg viewBox={FRANCE.join(' ')} role="group" aria-label={`Carte de répartition : ${e.nom}`}>
        <g className="rep-regions">
          {geo.regions.map((r) => {
            const k = couleur(r.code);
            const z = zoneOfRegionCode(r.code);
            return (
              <path
                key={r.code}
                d={r.d}
                style={{ fill: k }}
                className={`${k ? 'present' : ''} ${choix === z ? 'choisie' : ''}`}
                onClick={() => setChoix(z ?? null)}
                tabIndex={0}
                role="button"
                aria-label={`${r.nom} : ${k ? 'présente' : 'absente ou très rare'}`}
                onKeyDown={(ev) => ev.key === 'Enter' && setChoix(z ?? null)}
              >
                <title>{r.nom}</title>
              </path>
            );
          })}
        </g>
      </svg>

      <label className="curseur-mois">
        <span>{mois ? MOIS_LONGS[mois - 1] : 'Toute l’année'}</span>
        <input
          type="range"
          min={0}
          max={12}
          value={mois}
          onChange={(ev) => setMois(Number(ev.target.value))}
          aria-label="Choisir le mois affiché"
          aria-valuetext={mois ? MOIS_LONGS[mois - 1] : 'Toute l’année'}
        />
        <button type="button" className="lien" onClick={() => setMois(mois === moisCourant() ? 0 : moisCourant())}>
          {mois === moisCourant() ? 'Toute l’année' : 'Ce mois-ci'}
        </button>
      </label>

      <div className="legende" aria-hidden="true">
        <span><i style={{ background: 'var(--ab-commune)' }} /> Commune</span>
        <span><i style={{ background: 'var(--ab-peu)' }} /> Peu commune</span>
        <span><i style={{ background: 'var(--ab-rare)' }} /> Rare</span>
        <span><i style={{ background: '#e6edf4' }} /> Absente{mois ? ' ce mois-ci' : ''}</span>
      </div>

      {choix && (
        <div className="repartition-detail" role="status">
          <strong>{zoneById(choix)?.nom}</strong> :{' '}
          {pChoisie ? (
            <>
              {STATUT[pChoisie.statut].toLowerCase()}, {ABONDANCE[pChoisie.abondance].toLowerCase()} · notée {pChoisie.annees} années sur 11
              <button type="button" className="lien" onClick={() => navigate(`/zone/${choix}`)}>Voir la région ›</button>
            </>
          ) : (
            'pas d’observation régulière.'
          )}
        </div>
      )}
      <p className="petit">
        D’après {e.presence.reduce((a, p) => a + p.observations, 0).toLocaleString('fr-FR')} observations faites par des naturalistes depuis 2015.{' '}
        <a href={`https://www.gbif.org/species/${e.gbif}`} target="_blank" rel="noreferrer">Voir les points d’observation ↗</a>
      </p>
    </div>
  );
}
