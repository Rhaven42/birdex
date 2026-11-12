import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import geo from '../data/geo.json';
import { ZONES, zoneOfDepartement } from '../data/zones';
import type { ZoneId } from '../data/types';

type Box = [number, number, number, number];
const FRANCE: Box = [-10, -10, geo.width + 20, geo.height + 20];

function cadrer(codes: string[]): Box {
  const bs = geo.departements.filter((d) => codes.includes(d.code)).map((d) => d.bbox);
  const x0 = Math.min(...bs.map((b) => b[0]));
  const y0 = Math.min(...bs.map((b) => b[1]));
  const x1 = Math.max(...bs.map((b) => b[0] + b[2]));
  const y1 = Math.max(...bs.map((b) => b[1] + b[3]));
  const m = Math.max(x1 - x0, y1 - y0) * 0.25;
  const s = Math.max(x1 - x0, y1 - y0) + 2 * m;
  return [(x0 + x1) / 2 - s / 2, (y0 + y1) / 2 - s / 2, s, s];
}

/** Anime le viewBox (non animable en CSS). */
function useViewBox(cible: Box): Box {
  const [vb, setVb] = useState<Box>(cible);
  const courant = useRef(vb);
  useEffect(() => {
    const depart = courant.current;
    const t0 = performance.now();
    const reduit = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const pas = (t: number) => {
      const k = reduit ? 1 : Math.min(1, (t - t0) / 450);
      const e = 1 - Math.pow(1 - k, 3);
      const v = depart.map((d, i) => d + (cible[i] - d) * e) as Box;
      courant.current = v;
      setVb(v);
      if (k < 1) raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [cible]);
  return vb;
}

interface Props {
  progression: Record<ZoneId, { n: number; total: number }>;
  /** Mise en évidence (fiche espèce) : zones où l'espèce est présente */
  surlignage?: ZoneId[];
  compacte?: boolean;
}

export default function FranceMap({ progression, surlignage, compacte }: Props) {
  const navigate = useNavigate();
  const [focus, setFocus] = useState<'france' | ZoneId>('france');
  const [survol, setSurvol] = useState<string | null>(null);
  const cible = useMemo<Box>(() => (focus === 'france' ? FRANCE : cadrer(ZONES.find((z) => z.id === focus)!.departements)), [focus]);
  const vb = useViewBox(cible);
  const echelle = vb[2] / FRANCE[2];

  const remplissage = (code: string) => {
    const z = zoneOfDepartement(code);
    if (!z) return undefined;
    if (surlignage) return surlignage.includes(z) ? 'var(--orange)' : undefined;
    const p = progression[z];
    const r = p.total ? p.n / p.total : 0;
    return `color-mix(in srgb, var(--orange) ${Math.round(r * 100)}%, var(--teal))`;
  };

  const nomSurvol = survol ? geo.departements.find((d) => d.code === survol) : null;
  const zoneSurvol = survol ? zoneOfDepartement(survol) : undefined;

  return (
    <div className={`carte-france ${compacte ? 'compacte' : ''}`}>
      {!compacte && (
        <div className="carte-zoom" role="group" aria-label="Cadrage de la carte">
          <button className={focus === 'france' ? 'actif' : ''} onClick={() => setFocus('france')}>France</button>
          {ZONES.map((z) => (
            <button key={z.id} className={focus === z.id ? 'actif' : ''} onClick={() => setFocus(z.id)}>
              {z.nom}
            </button>
          ))}
        </div>
      )}
      <svg viewBox={vb.join(' ')} role="img" aria-label="Carte des départements de France métropolitaine">
        <g className="departements" strokeWidth={0.8 * echelle}>
          {geo.departements.map((d) => {
            const z = zoneOfDepartement(d.code);
            const fill = remplissage(d.code);
            return (
              <path
                key={d.code}
                d={d.d}
                className={z ? 'actif' : ''}
                style={fill ? { fill } : undefined}
                onMouseEnter={() => setSurvol(d.code)}
                onMouseLeave={() => setSurvol((s) => (s === d.code ? null : s))}
                onClick={() => z && !compacte && navigate(`/zone/${z}?dep=${d.code}`)}
                tabIndex={z && !compacte ? 0 : -1}
                role={z && !compacte ? 'link' : undefined}
                aria-label={z ? `${d.nom} (${d.code})` : undefined}
                onKeyDown={(ev) => ev.key === 'Enter' && z && !compacte && navigate(`/zone/${z}?dep=${d.code}`)}
              >
                <title>{`${d.nom} (${d.code})`}</title>
              </path>
            );
          })}
        </g>
        <g className="regions" strokeWidth={1.8 * echelle}>
          {geo.regions.map((r) => (
            <path key={r.code} d={r.d} />
          ))}
        </g>
      </svg>
      {!compacte && (
        <div className="carte-info" aria-live="polite">
          {nomSurvol ? (
            <>
              <strong>
                {nomSurvol.nom} ({nomSurvol.code})
              </strong>
              {zoneSurvol ? (
                <span>
                  {' '}
                  · {progression[zoneSurvol].n} / {progression[zoneSurvol].total} espèces — touchez pour explorer
                </span>
              ) : (
                <span> · bientôt disponible</span>
              )}
            </>
          ) : (
            <span>Touchez une zone colorée pour voir ses oiseaux.</span>
          )}
        </div>
      )}
    </div>
  );
}
