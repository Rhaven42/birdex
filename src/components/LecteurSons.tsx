import { useEffect, useMemo, useRef, useState } from 'react';
import sonsData from '../data/sons.json';
import { ESPECES } from '../data/species';
import type { Espece } from '../data/types';
import { rechercher } from '../lib/search';

export interface Enregistrement {
  id: string;
  type: string;
  auteur: string;
  lieu: string;
  date: string;
  duree: string;
  licence: string;
  fichier: string;
  page: string;
  sono?: string;
}

const SONS = (sonsData as { sons: Record<string, Enregistrement[]> }).sons;
/** 2 sons au maximum : le meilleur chant et le meilleur cri (la sélection est déjà triée par qualité). */
export function sonsDe(e: Espece): Enregistrement[] {
  const tous = SONS[e.nomScientifique] ?? [];
  const chant = tous.find((r) => /\bsong\b/i.test(r.type));
  const cri = tous.find((r) => r !== chant && !/\bsong\b/i.test(r.type));
  const choix = [chant, cri].filter((r): r is Enregistrement => !!r);
  for (const r of tous) if (choix.length < 2 && !choix.includes(r)) choix.push(r);
  return choix;
}

const TYPES: [RegExp, string][] = [
  [/alarm/i, 'Cri d’alarme'],
  [/nocturnal/i, 'Cri nocturne (migration)'],
  [/flight call/i, 'Cri en vol'],
  [/\bsong\b/i, 'Chant'],
  [/\bcall\b/i, 'Cri'],
  [/drumming/i, 'Tambourinage'],
];
const typeFr = (t: string) => TYPES.find(([r]) => r.test(t))?.[1] ?? 'Enregistrement';

/** Nom court de la licence Creative Commons à partir de son URL. */
function licenceCourte(url: string) {
  if (/publicdomain\/zero/i.test(url)) return 'CC0 (domaine public)';
  const m = url.match(/licenses\/([a-z-]+)\/([\d.]+)/i);
  return m ? `CC ${m[1].toUpperCase()} ${m[2]}` : 'Licence';
}

// Un seul enregistrement joue à la fois
const EVT = 'birdex:lecture';

function Piste({ r }: { r: Enregistrement }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [joue, setJoue] = useState(false);
  const [vitesse, setVitesse] = useState(1);
  const [boucle, setBoucle] = useState(false);
  const [progres, setProgres] = useState(0);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    const stop = (ev: Event) => {
      if ((ev as CustomEvent).detail !== r.id) audio.current?.pause();
    };
    window.addEventListener(EVT, stop);
    return () => window.removeEventListener(EVT, stop);
  }, [r.id]);

  useEffect(() => {
    if (audio.current) {
      audio.current.playbackRate = vitesse;
      // Au ralenti, le son devient aussi plus grave (comme une bande lue lentement) : les notes rapides deviennent audibles
      (audio.current as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = false;
    }
  }, [vitesse]);

  const basculer = async () => {
    const a = audio.current!;
    if (a.paused) {
      window.dispatchEvent(new CustomEvent(EVT, { detail: r.id }));
      try {
        await a.play();
      } catch {
        setErreur(true);
      }
    } else a.pause();
  };

  return (
    <li className="piste">
      <div className="piste-tete">
        <button className={`lecture ${joue ? 'pause' : ''}`} onClick={basculer} aria-label={`${joue ? 'Pause' : 'Écouter'} : ${typeFr(r.type)}`}>
          {joue ? '❚❚' : '▶'}
        </button>
        <div className="piste-titre">
          <strong>{typeFr(r.type)}</strong>
          <span>{r.duree} · {r.lieu}</span>
        </div>
      </div>
      {r.sono && (
        <div className="sono">
          <img src={r.sono} alt={`Sonogramme : ${typeFr(r.type)}`} loading="lazy" />
          <div className="sono-curseur" style={{ left: `${progres * 100}%` }} />
        </div>
      )}
      <div className="piste-options">
        <div className="segment petit-segment" role="group" aria-label="Vitesse de lecture">
          {[1, 0.75, 0.5].map((v) => (
            <button key={v} className={vitesse === v ? 'actif' : ''} onClick={() => setVitesse(v)}>
              ×{String(v).replace('.', ',')}
            </button>
          ))}
        </div>
        <label className="case">
          <input type="checkbox" checked={boucle} onChange={(ev) => setBoucle(ev.target.checked)} /> En boucle
        </label>
      </div>
      {erreur && <p className="erreur">Lecture impossible (hors connexion ?).</p>}
      <p className="credit">
        © {r.auteur} ·{' '}
        <a href={r.licence} target="_blank" rel="noreferrer">{licenceCourte(r.licence)}</a> ·{' '}
        <a href={r.page} target="_blank" rel="noreferrer">XC{r.id} sur xeno-canto</a>
      </p>
      <audio
        ref={audio}
        src={r.fichier}
        preload="none"
        loop={boucle}
        onPlay={() => setJoue(true)}
        onPause={() => setJoue(false)}
        onEnded={() => setJoue(false)}
        onTimeUpdate={(ev) => setProgres(ev.currentTarget.currentTime / (ev.currentTarget.duration || 1))}
      />
    </li>
  );
}

export default function LecteurSons({ e }: { e: Espece }) {
  const pistes = sonsDe(e);
  const [comparer, setComparer] = useState(false);
  const [q, setQ] = useState('');
  const [autre, setAutre] = useState<Espece | null>(null);
  const suggestions = useMemo(
    () => rechercher(q, ESPECES.filter((x) => x.id !== e.id && sonsDe(x).length), 5).map((r) => r.espece),
    [q, e.id],
  );

  if (!pistes.length) {
    return (
      <p>
        Pas encore d’enregistrement dans Birdex pour cette espèce. Écoutez-la sur{' '}
        <a href={`https://xeno-canto.org/explore?query=${encodeURIComponent(e.nomScientifique)}`} target="_blank" rel="noreferrer">xeno-canto ↗</a>.
      </p>
    );
  }

  return (
    <div className="lecteur">
      <ul className="pistes">{pistes.map((r) => <Piste key={r.id} r={r} />)}</ul>

      {!comparer ? (
        <button className="bouton secondaire" onClick={() => setComparer(true)}>⇄ Comparer avec une autre espèce</button>
      ) : (
        <div className="comparaison">
          <h3>Comparer avec…</h3>
          {!autre ? (
            <>
              <input type="search" value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Nom d’un oiseau (ex. : mésange charbonnière)" aria-label="Espèce à comparer" autoFocus />
              <ul className="suggestions-inline">
                {suggestions.map((x) => (
                  <li key={x.id}><button onClick={() => setAutre(x)}>{x.nom} <em>{x.nomScientifique}</em></button></li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p><strong>{autre.nom}</strong> <button className="lien" onClick={() => { setAutre(null); setQ(''); }}>Changer</button></p>
              <ul className="pistes">{sonsDe(autre).map((r) => <Piste key={r.id} r={r} />)}</ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
