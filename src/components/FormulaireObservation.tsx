import { useState, type FormEvent } from 'react';
import type { Espece, ZoneId } from '../data/types';
import { ZONES } from '../data/zones';
import { ajouterObservation } from '../lib/storage';
import { reduireImage } from '../lib/media';

interface Props {
  e: Espece;
  onFermer: () => void;
  onValide: () => void;
  /** Préremplissage après une identification par photo */
  photoInitiale?: string;
  zoneInitiale?: ZoneId | 'autre';
  parIA?: boolean;
}

export default function FormulaireObservation({ e, onFermer, onValide, photoInitiale, zoneInitiale, parIA = false }: Props) {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(aujourdhui);
  const [zone, setZone] = useState<ZoneId | 'autre'>(zoneInitiale ?? e.presence[0]?.zone ?? 'autre');
  const [lieu, setLieu] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(photoInitiale);
  const [certain, setCertain] = useState(false);
  const [erreur, setErreur] = useState<string>();

  async function choisirPhoto(f?: File) {
    if (!f) return;
    try {
      setPhoto(await reduireImage(f));
    } catch {
      setErreur('Impossible de lire cette image.');
    }
  }

  function valider(ev: FormEvent) {
    ev.preventDefault();
    try {
      ajouterObservation({ especeId: e.id, date, zone, lieu: lieu.trim(), note: note.trim(), photo, validation: parIA ? 'ia' : 'manuelle' });
      onValide();
    } catch (err) {
      setErreur((err as Error).message);
    }
  }

  return (
    <div className="modale-fond" role="presentation" onClick={onFermer}>
      <form className="modale" role="dialog" aria-modal="true" aria-labelledby="titre-obs" onSubmit={valider} onClick={(ev) => ev.stopPropagation()}>
        <h2 id="titre-obs">J’ai observé : {e.nom}</h2>

        <label>
          Date
          <input type="date" value={date} max={aujourdhui} onChange={(ev) => setDate(ev.target.value)} required />
        </label>

        <label>
          Zone
          <select value={zone} onChange={(ev) => setZone(ev.target.value as ZoneId | 'autre')}>
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nom}
              </option>
            ))}
            <option value="autre">Ailleurs en France</option>
          </select>
        </label>

        <label>
          Lieu approximatif
          <input value={lieu} onChange={(ev) => setLieu(ev.target.value)} placeholder="Commune ou site (ex. : Hyères)" maxLength={80} />
        </label>
        {e.sensible && (
          <p className="alerte">
            🛡️ Espèce sensible : indiquez seulement la commune, jamais l’emplacement exact d’un nid ou d’un site de reproduction.
          </p>
        )}

        <label>
          Note personnelle
          <textarea value={note} onChange={(ev) => setNote(ev.target.value)} rows={3} placeholder="Comportement, chant entendu, nombre d’individus…" maxLength={1000} />
        </label>

        <label className="champ-photo">
          Photo (facultatif)
          <input type="file" accept="image/*" capture="environment" onChange={(ev) => choisirPhoto(ev.target.files?.[0])} />
        </label>
        {photo && <img className="apercu-photo" src={photo} alt="Aperçu de votre photo" />}

        <label className="case">
          <input type="checkbox" checked={certain} onChange={(ev) => setCertain(ev.target.checked)} />
          J’ai bien comparé avec les espèces ressemblantes et je suis sûr·e de mon identification.
        </label>

        {erreur && <p className="erreur">{erreur}</p>}

        <div className="modale-actions">
          <button type="button" className="bouton secondaire" onClick={onFermer}>
            Annuler
          </button>
          <button type="submit" className="bouton principal" disabled={!certain}>
            Valider l’observation
          </button>
        </div>
      </form>
    </div>
  );
}
