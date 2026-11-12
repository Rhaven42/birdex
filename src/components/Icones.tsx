import type { ReactNode, SVGProps } from 'react';

/** Jeu d'icônes Birdex : traits arrondis, rendu identique sur tous les téléphones. */
const traces: Record<string, ReactNode> = {
  carte: (
    <>
      <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5V4l-6 2.5L9 4Z" />
      <path d="M9 4v13M15 6.5v13" />
    </>
  ),
  recherche: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  collection: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  carnet: (
    <>
      <path d="M6 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5Z" />
      <path d="M8.5 3.5v17M11.5 8h4M11.5 11.5h4" />
    </>
  ),
  histoire: (
    <>
      <path d="M3.5 5.5c2.5-1.3 5.5-1.3 8.5.5v13c-3-1.8-6-1.8-8.5-.5v-13Z" />
      <path d="M20.5 5.5c-2.5-1.3-5.5-1.3-8.5.5v13c3-1.8 6-1.8 8.5-.5v-13Z" />
    </>
  ),
  mesure: (
    <>
      <rect x="2.5" y="8" width="19" height="8" rx="1.5" />
      <path d="M6.5 8v3M10 8v4.5M13.5 8v3M17 8v4.5" />
    </>
  ),
  feuille: (
    <>
      <path d="M5 19c0-8 5-13.5 14-14-.5 9-6 14-14 14Z" />
      <path d="M5 19 13 11" />
    </>
  ),
  lieu: (
    <>
      <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  son: (
    <>
      <path d="M9 18V5.5l11-2v12.5" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  jumelles: (
    <>
      <circle cx="6.5" cy="15.5" r="3.5" />
      <circle cx="17.5" cy="15.5" r="3.5" />
      <path d="M10 15.5h4M5 12l2-7h3l.5 7M19 12l-2-7h-3l-.5 7" />
    </>
  ),
  sources: (
    <>
      <path d="M6.5 3.5h11v17l-5.5-3.5-5.5 3.5v-17Z" />
    </>
  ),
  indice: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
    </>
  ),
  cadenas: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  retour: <path d="m14.5 5-7 7 7 7" />,
  suivant: <path d="m9.5 5 7 7-7 7" />,
  soleil: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  medaille: (
    <>
      <circle cx="12" cy="14.5" r="5.5" />
      <path d="M8.5 10 6 3.5h4l2 4.5 2-4.5h4L15.5 10" />
    </>
  ),
};

export type NomIcone = keyof typeof traces;

export function Icone({ nom, taille = 24, ...rest }: { nom: NomIcone; taille?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {traces[nom]}
    </svg>
  );
}

/** Anneau de progression (pourcentage au centre). */
export function Anneau({ n, total, taille = 96, epaisseur = 10, children }: { n: number; total: number; taille?: number; epaisseur?: number; children?: ReactNode }) {
  const r = (taille - epaisseur) / 2;
  const c = 2 * Math.PI * r;
  const part = total ? Math.min(1, n / total) : 0;
  return (
    <div className="anneau" style={{ width: taille, height: taille }} role="img" aria-label={`${n} sur ${total}`}>
      <svg width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`}>
        <defs>
          <linearGradient id="degrade-anneau" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--teal)" />
            <stop offset="100%" stopColor="var(--orange)" />
          </linearGradient>
        </defs>
        <circle cx={taille / 2} cy={taille / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={epaisseur} />
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={r}
          fill="none"
          stroke="url(#degrade-anneau)"
          strokeWidth={epaisseur}
          strokeLinecap="round"
          strokeDasharray={`${Math.max(part * c, part ? 0.01 : 0)} ${c}`}
          transform={`rotate(-90 ${taille / 2} ${taille / 2})`}
          className="anneau-progres"
        />
      </svg>
      <div className="anneau-centre">{children ?? `${Math.round(part * 100)} %`}</div>
    </div>
  );
}
