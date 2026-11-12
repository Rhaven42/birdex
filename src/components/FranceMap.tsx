import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import geo from '../data/geo.json';
import { ZONES, zoneById, zoneOfDepartement } from '../data/zones';
import type { ZoneId } from '../data/types';

type Box = [number, number, number, number];
export const FRANCE: Box = [-10, -10, geo.width + 20, geo.height + 20];

function cadrer(codes: string[]): Box {
  const bs = geo.departements.filter((d) => codes.includes(d.code)).map((d) => d.bbox);
  const x0 = Math.min(...bs.map((b) => b[0]));
  const y0 = Math.min(...bs.map((b) => b[1]));
  const x1 = Math.max(...bs.map((b) => b[0] + b[2]));
  const y1 = Math.max(...bs.map((b) => b[1] + b[3]));
  const s = Math.max(x1 - x0, y1 - y0) * 1.3;
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
}

/** Carte d'accueil : chaque région est colorée selon votre progression. */
export default function FranceMap({ progression }: Props) {
  const navigate = useNavigate();
  const [focus, setFocus] = useState<'france' | ZoneId>('france');
  const [survol, setSurvol] = useState<string | null>(null);
  const cible = useMemo<Box>(() => (focus === 'france' ? FRANCE : cadrer(zoneById(focus)!.departements)), [focus]);
  const vb = useViewBox(cible);
  const echelle = vb[2] / FRANCE[2];

  const remplissage = (code: string) => {
    const z = zoneOfDepartement(code)!;
    const p = progression[z];
    const r = p?.total ? p.n / p.total : 0;
    return `color-mix(in srgb, var(--orange) ${Math.round(Math.sqrt(r) * 100)}%, var(--teal))`;
  };
  const ouvrir = (code: string) => {
    const z = zoneOfDepartement(code);
    if (z) navigate(`/zone/${z}?dep=${code}`);
  };

  const dep = survol ? geo.departements.find((d) => d.code === survol) : null;
  const zs = survol ? zoneOfDepartement(survol) : undefined;

  return (
    <div className="carte-france">
      <label className="carte-zoom">
        <span className="sr-only">Cadrer la carte sur une région</span>
        <select value={focus} onChange={(e) => setFocus(e.target.value)}>
          <option value="france">🇫🇷 France entière</option>
          {ZONES.map((z) => (
            <option key={z.id} value={z.id}>{z.nom}</option>
          ))}
        </select>
      </label>
      <svg viewBox={vb.join(' ')} role="group" aria-label="Carte des régions de France : touchez une région">
        <g className="departements" strokeWidth={0.8 * echelle}>
          {geo.departements.map((d) => (
            <path
              key={d.code}
              d={d.d}
              className="actif"
              style={{ fill: remplissage(d.code) }}
              onMouseEnter={() => setSurvol(d.code)}
              onMouseLeave={() => setSurvol((s) => (s === d.code ? null : s))}
              onClick={() => ouvrir(d.code)}
              tabIndex={0}
              role="link"
              aria-label={`${d.nom} (${d.code}), ${zoneById(zoneOfDepartement(d.code) ?? '')?.nom ?? ''}`}
              onKeyDown={(ev) => ev.key === 'Enter' && ouvrir(d.code)}
            >
              <title>{`${d.nom} (${d.code})`}</title>
            </path>
          ))}
        </g>
        <g className="regions" strokeWidth={2 * echelle}>
          {geo.regions.map((r) => <path key={r.code} d={r.d} />)}
        </g>
      </svg>
      <div className="carte-info" aria-live="polite">
        {dep && zs ? (
          <>
            <strong>{zoneById(zs)?.nom}</strong> · {dep.nom} ({dep.code}) · {progression[zs].n} / {progression[zs].total} espèces
          </>
        ) : (
          <span>Touchez une région pour voir ses oiseaux. Plus elle est orange, plus vous en avez découvert.</span>
        )}
      </div>
    </div>
  );
}
