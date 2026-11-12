import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FormulaireObservation from '../components/FormulaireObservation';
import { Icone } from '../components/Icones';
import { especeById, ESPECES } from '../data/species';
import type { Espece, ZoneId } from '../data/types';
import { ZONES, zoneById } from '../data/zones';
import { identifier, niveauConfiance, type ResultatIdentification } from '../lib/identification';
import { MOIS_LONGS, moisCourant } from '../lib/format';
import { photoDe, reduireImage } from '../lib/media';
import { comptesActifs } from '../lib/supabase';
import { useCarnet } from '../lib/hooks';
import { useSession } from '../lib/sync';

const parSci = new Map(ESPECES.map((e) => [e.nomScientifique, e]));

export default function Identifier() {
  const session = useSession();
  const carnet = useCarnet();
  const entree = useRef<HTMLInputElement>(null);
  const galerie = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string>();
  const [zone, setZone] = useState<ZoneId | ''>((carnet[0]?.zone !== 'autre' && carnet[0]?.zone) || '');
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string>();
  const [resultat, setResultat] = useState<ResultatIdentification>();
  const [choisie, setChoisie] = useState<Espece>();
  const [enregistree, setEnregistree] = useState<Espece>();
  const mois = moisCourant();

  async function charger(f?: File) {
    if (!f) return;
    setResultat(undefined);
    setErreur(undefined);
    setEnregistree(undefined);
    try {
      setPhoto(await reduireImage(f, 1024));
    } catch {
      setErreur('Impossible de lire cette image.');
    }
  }

  async function lancer() {
    if (!photo) return;
    setAttente(true);
    setErreur(undefined);
    setResultat(undefined);
    try {
      setResultat(await identifier(photo, zone || null, zone ? zoneById(zone)?.nom ?? null : null, mois));
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setAttente(false);
    }
  }

  const entete = (
    <section className="hero">
      <div className="hero-texte">
        <p className="hero-salut">Identifier un oiseau</p>
        <h1>Prenez-le en photo, l’IA vous propose des espèces</h1>
        <div className="hero-chiffres"><span>Suggestions à vérifier avec les fiches</span></div>
      </div>
      <span className="hero-icone"><Icone nom="appareil" taille={38} /></span>
    </section>
  );

  if (!comptesActifs || session === null) {
    return (
      <div className="page">
        {entete}
        <section className="bloc verrou-panneau">
          <span className="verrou-icone"><Icone nom="cadenas" taille={32} /></span>
          <p>L’identification par photo est réservée aux membres connectés (gratuit).</p>
          <Link to="/compte" className="bouton principal large">Créer un compte ou me connecter</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      {entete}

      <section className="bloc identification">
        {photo ? (
          <img className="apercu-identification" src={photo} alt="Votre photo" />
        ) : (
          <button className="zone-photo" onClick={() => entree.current?.click()}>
            <Icone nom="appareil" taille={44} />
            <strong>Prendre une photo</strong>
            <span>Cadrez l’oiseau au plus près, de profil si possible</span>
          </button>
        )}
        {/* value remis à vide : choisir à nouveau la même photo déclenche bien un changement */}
        <input ref={entree} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { void charger(e.target.files?.[0]); e.target.value = ''; }} />
        <input ref={galerie} type="file" accept="image/*" hidden onChange={(e) => { void charger(e.target.files?.[0]); e.target.value = ''; }} />
        <div className="actions">
          <button className="bouton secondaire" onClick={() => entree.current?.click()}>{photo ? 'Reprendre une photo' : 'Appareil photo'}</button>
          <button className="bouton secondaire" onClick={() => galerie.current?.click()}>Choisir dans la galerie</button>
        </div>

        <label className="champ-region">
          Où l’avez-vous vu ?
          <select value={zone} onChange={(e) => setZone(e.target.value as ZoneId | '')}>
            <option value="">Je ne sais pas / ailleurs</option>
            {ZONES.map((z) => <option key={z.id} value={z.id}>{z.nom}</option>)}
          </select>
          <span className="petit">La région et le mois ({MOIS_LONGS[mois - 1]}) aident à départager les espèces proches.</span>
        </label>

        <button className="bouton principal large" disabled={!photo || attente} onClick={lancer}>
          {attente ? 'Analyse en cours…' : <><Icone nom="etincelle" taille={20} /> Identifier cet oiseau</>}
        </button>
        {attente && <div className="analyse" role="status"><span /><span /><span /> L’IA examine le plumage, le bec et la silhouette…</div>}
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
      </section>

      {resultat && (
        <section className="bloc resultats-ia" aria-live="polite">
          {resultat.etat === 'pas_oiseau' ? (
            <p className="alerte">Je ne vois pas d’oiseau sur cette photo. Essayez de cadrer plus près.</p>
          ) : (
            <>
              <h2>{resultat.etat === 'incertain' ? 'Je ne suis pas sûr… voici les pistes' : 'Les oiseaux qui y ressemblent'}</h2>
              {resultat.etat === 'incertain' && (
                <p className="alerte">La photo ne permet pas de trancher avec certitude : comparez avec les fiches avant de valider.</p>
              )}
              <ul className="propositions">
                {resultat.propositions.map((p, i) => {
                  const e = parSci.get(p.nomScientifique);
                  if (!e) return null;
                  const ph = photoDe(e);
                  const niveau = niveauConfiance(p.confiance);
                  return (
                    <li key={p.nomScientifique} className={i === 0 ? 'premiere' : ''}>
                      {ph && <img src={ph.miniature} alt="" />}
                      <div className="prop-texte">
                        <strong>{e.nom}</strong>
                        <em>{e.nomScientifique}</em>
                        <div className="jauge" role="img" aria-label={`Confiance ${p.confiance} %`}>
                          <span className={`ab-${niveau}`} style={{ width: `${p.confiance}%` }} />
                        </div>
                        <span className={`pastille ab-${niveau}`}>Confiance {p.confiance} %</span>
                        <p>{p.criteres}</p>
                        <div className="actions">
                          <Link className="bouton secondaire" to={`/espece/${e.id}`}>Comparer avec la fiche</Link>
                          <button className="bouton principal" onClick={() => setChoisie(e)}>C’est celui-là !</button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {resultat.conseil && <p className="petit">💡 {resultat.conseil}</p>}
          <p className="petit">
            Suggestion de l’intelligence artificielle, pas une certitude. Il vous reste {resultat.restant} identification{resultat.restant > 1 ? 's' : ''} aujourd’hui.
          </p>
        </section>
      )}

      {enregistree && (
        <div className="bravo" role="status">
          🎉
          <div>
            <strong>{enregistree.nom}</strong> est ajouté à votre carnet.{' '}
            <Link to={`/espece/${enregistree.id}`} style={{ color: '#fff' }}>Voir la fiche</Link>
          </div>
        </div>
      )}

      {choisie && (
        <FormulaireObservation
          e={choisie}
          photoInitiale={photo}
          zoneInitiale={zone || undefined}
          parIA
          onFermer={() => setChoisie(undefined)}
          onValide={() => {
            setEnregistree(especeById(choisie.id));
            setChoisie(undefined);
            setResultat(undefined);
            setPhoto(undefined);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}
