import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Espece } from '../data/types';
import { DIFFICULTE, UICN } from '../lib/format';
import { photoDe } from '../lib/media';
import { useEffect, useState, type ImgHTMLAttributes } from 'react';

export function Silhouette({ className = '' }: { className?: string }) {
  return (
    <svg className={`silhouette ${className}`} viewBox="0 0 100 100" aria-hidden="true">
      <path d="M22 66c0-17 13-29 29-30 4-10 13-15 22-12l13 4-11 4c3 8 2 18-4 26-5 7-13 11-23 13L33 86l-4-3 9-11c-10-1-16-4-16-6z" />
      <path d="M48 76l-2 10M56 74l1 11" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" />
      <circle cx="74" cy="31" r="2.2" className="silhouette-oeil" />
    </svg>
  );
}

export function Progression({ n, total, label }: { n: number; total: number; label?: string }) {
  const pct = total ? Math.round((n / total) * 100) : 0;
  return (
    <div className="progression" role="progressbar" aria-valuenow={n} aria-valuemin={0} aria-valuemax={total} aria-label={label ?? 'Progression'}>
      <div className="progression-texte">
        <strong>
          {n} / {total}
        </strong>{' '}
        espèces découvertes
      </div>
      <div className="progression-barre">
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`badge ${className}`}>{children}</span>;
}

export function BadgeDifficulte({ e }: { e: Espece }) {
  if (!e.difficulte) return null;
  return <Badge className={`diff-${e.difficulte}`}>Identification : {DIFFICULTE[e.difficulte]}</Badge>;
}

export function BadgeConservation({ e }: { e: Espece }) {
  if (!e.uicn) return null;
  const c = UICN[e.uicn];
  return (
    <Badge className={c.classe}>
      <abbr title={`Liste rouge mondiale de l’UICN : ${c.label}`}>UICN {e.uicn}</abbr> · {c.label}
    </Badge>
  );
}

/** Image qui réessaie deux fois (refus temporaires du serveur d'images quand beaucoup de photos se chargent). */
function ImageFiable({ src, onEchec, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { src: string; onEchec: () => void }) {
  const [essai, setEssai] = useState(0);
  const [attente, setAttente] = useState(false);
  useEffect(() => {
    setEssai(0);
  }, [src]);
  useEffect(() => {
    if (!attente) return;
    const t = setTimeout(() => {
      setAttente(false);
      setEssai((n) => n + 1);
    }, 1500 * (essai + 1));
    return () => clearTimeout(t);
  }, [attente, essai]);
  if (attente) return null;
  return (
    <img
      {...rest}
      src={essai ? `${src}${src.includes('?') ? '&' : '?'}essai=${essai}` : src}
      onError={() => (essai < 2 ? setAttente(true) : onEchec())}
    />
  );
}

/**
 * Fond flou tiré de la même photo : la photo elle-même est affichée en entier (tête, corps et queue,
 * jamais recadrée), et ce fond comble les bords au lieu de bandes vides.
 */
export function FondFlou({ src }: { src: string }) {
  return <span className="fond-flou" aria-hidden="true" style={{ backgroundImage: `url("${src}")` }} />;
}

export function CarteEspece({ e, decouverte, sousTitre, enCouleur = false }: { e: Espece; decouverte: boolean; sousTitre?: ReactNode; enCouleur?: boolean }) {
  const photo = photoDe(e);
  const [ko, setKo] = useState(false);
  return (
    <Link to={`/espece/${e.id}`} className={`carte-espece ${decouverte ? 'decouverte' : 'verrouillee'} ${enCouleur ? 'en-couleur' : ''}`}>
      <div className="carte-espece-visuel">
        {photo && !ko ? (
          <>
            <FondFlou src={photo.miniature} />
            <ImageFiable src={photo.miniature} alt="" loading="lazy" decoding="async" onEchec={() => setKo(true)} />
          </>
        ) : (
          <Silhouette />
        )}
        {!decouverte && <span className="cadenas" aria-label="À découvrir">🔒</span>}
      </div>
      <div className="carte-espece-texte">
        <span className="carte-espece-nom">{e.nom}</span>
        <span className="carte-espece-sci">{e.nomScientifique}</span>
        {sousTitre && <span className="carte-espece-sous">{sousTitre}</span>}
      </div>
    </Link>
  );
}

export function PhotoEspece({ e, verrouillee = false, children }: { e: Espece; verrouillee?: boolean; children?: ReactNode }) {
  const photo = photoDe(e);
  const [ko, setKo] = useState(false);
  if (!photo || ko)
    return (
      <div className="photo-fiche photo-absente">
        <Silhouette />
        <p>{photo ? 'Photo indisponible (hors connexion ?)' : 'Pas encore de photo'}</p>
        {verrouillee && <span className="cadenas-grand">🔒 Fiche à découvrir</span>}
        {children && <div className="photo-voile">{children}</div>}
      </div>
    );
  return (
    <figure className={`photo-fiche ${verrouillee ? 'a-decouvrir' : ''}`}>
      <div className="photo-cadre">
        <FondFlou src={photo.miniature} />
        <ImageFiable src={photo.url} alt={`${e.nom} (${e.nomScientifique})`} onEchec={() => setKo(true)} />
        {verrouillee && <span className="bandeau-decouvrir">🔒 À découvrir</span>}
        {children && <div className="photo-voile">{children}</div>}
      </div>
      <figcaption>
        © {photo.auteur} ·{' '}
        {photo.licenceUrl ? (
          <a href={photo.licenceUrl} target="_blank" rel="noreferrer">{photo.licence}</a>
        ) : (
          photo.licence
        )}{' '}
        · <a href={photo.source} target="_blank" rel="noreferrer">Wikimedia Commons</a>
      </figcaption>
    </figure>
  );
}
