import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Calendrier from '../components/Calendrier';
import CarteRepartition from '../components/CarteRepartition';
import FormulaireObservation from '../components/FormulaireObservation';
import { Badge, BadgeConservation, BadgeDifficulte, PhotoEspece, Silhouette } from '../components/ui';
import { DATE_MAJ, SOURCES_DONNEES, especeById } from '../data/species';
import { zoneById } from '../data/zones';
import { useCarnet, useResume } from '../lib/hooks';
import { MILIEU, dateFr } from '../lib/format';
import { nouveauxBadges, type EtatBadge } from '../lib/badges';
import { chargerCarnet } from '../lib/storage';

function DescriptionWikipedia({ titre }: { titre?: string }) {
  const { resume, chargement } = useResume(titre);
  if (!titre) return <p className="petit">Pas encore de description pour cette espèce.</p>;
  if (chargement) return <p className="petit">Chargement de la description…</p>;
  if (!resume) return <p className="petit">Description indisponible (hors connexion ?).</p>;
  return (
    <>
      {resume.texte.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
      <p className="petit">
        Source : <a href={resume.url} target="_blank" rel="noreferrer">Wikipédia ↗</a>, texte sous licence{' '}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>.
      </p>
    </>
  );
}

export default function Fiche() {
  const { id = '' } = useParams();
  const e = especeById(id);
  const carnet = useCarnet();
  const navigate = useNavigate();
  const [form, setForm] = useState(false);
  const [bravo, setBravo] = useState(false);
  const [gagnes, setGagnes] = useState<EtatBadge[]>([]);
  if (!e) return <div className="page"><p>Espèce introuvable.</p><Link to="/">Retour</Link></div>;

  const mesObs = carnet.filter((o) => o.especeId === e.id);
  const decouverte = mesObs.length > 0;
  const xenoCanto = `https://xeno-canto.org/explore?query=${encodeURIComponent(e.nomScientifique)}`;

  return (
    <div className="page fiche">
      <button className="retour" onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))}>‹ Retour</button>

      {(bravo || gagnes.length > 0) && (
        <div className="bravo" role="status">
          🎉
          <div>
            {bravo && (
              <>
                <strong>Nouvelle espèce découverte !</strong> {e.nom} rejoint votre collection.
              </>
            )}
            {gagnes.length > 0 && (
              <ul className="bravo-badges">
                {gagnes.map((b) => (
                  <li key={b.id}>{b.emoji} Badge obtenu : <strong>{b.titre}</strong></li>
                ))}
              </ul>
            )}
          </div>
          <button onClick={() => { setBravo(false); setGagnes([]); }} aria-label="Fermer">×</button>
        </div>
      )}

      <header className="fiche-entete">
        {decouverte ? (
          <PhotoEspece e={e} />
        ) : (
          <div className="photo-fiche verrouillee">
            <Silhouette />
            <span className="cadenas-grand">🔒 Fiche à découvrir</span>
          </div>
        )}
        <div className="fiche-titres">
          <p className="famille">{e.famille}</p>
          <h1>{e.nom}</h1>
          <p className="sci">{e.nomScientifique}</p>
          <div className="badges">
            <BadgeDifficulte e={e} />
            {decouverte && <BadgeConservation e={e} />}
            {decouverte && e.protege && <Badge className="protege">🛡️ Espèce protégée</Badge>}
            {e.introduite && <Badge className="lr-na">🌍 Espèce introduite</Badge>}
            {e.nocturne && <Badge>🌙 Nocturne</Badge>}
          </div>
        </div>
      </header>

      {!decouverte && (
        <section className="bloc verrou">
          <h2>Indices pour la trouver</h2>
          <ul className="indices">
            {e.milieux.length > 0 && (
              <li><strong>Milieux :</strong> {e.milieux.map((m) => `${MILIEU[m].emoji} ${MILIEU[m].label}`).join(', ')}</li>
            )}
            {e.taille && <li><strong>Taille :</strong> {e.taille} cm</li>}
            <li><strong>Famille :</strong> {e.famille}</li>
            {e.signes.map((s) => <li key={s}>🔎 {s}</li>)}
          </ul>
          <button className="bouton principal large" onClick={() => setForm(true)}>👀 J’ai observé cet oiseau</button>
          <p className="petit">La fiche complète se déverrouille quand vous validez une observation.</p>
        </section>
      )}

      <section className="bloc">
        <h2>Où et quand l’observer en France</h2>
        <CarteRepartition e={e} />
        <details className="calendrier-details">
          <summary>Calendrier de présence par région</summary>
          <Calendrier e={e} />
        </details>
        {e.sensible && (
          <p className="alerte">
            🛡️ Espèce sensible : Birdex n’affiche que des régions entières, jamais de site précis. Ne diffusez pas la localisation de ses nids.
          </p>
        )}
      </section>

      {decouverte && (
        <>
          <section className="bloc">
            <h2>Identification</h2>
            {(e.taille || e.envergure) && (
              <dl className="mesures">
                {e.taille && <div><dt>Taille</dt><dd>{e.taille} cm</dd></div>}
                {e.envergure && <div><dt>Envergure</dt><dd>{e.envergure} cm</dd></div>}
              </dl>
            )}
            {e.redigee ? (
              <>
                <p>{e.description}</p>
                <ul className="indices">{e.signes.map((s) => <li key={s}>🔎 {s}</li>)}</ul>
                <h3>Ne pas confondre</h3>
                <p>{e.confusions}</p>
              </>
            ) : (
              <DescriptionWikipedia titre={e.wiki} />
            )}
          </section>

          {e.redigee && (
            <section className="bloc">
              <h2>Mode de vie</h2>
              <h3>Habitat</h3>
              <p>{e.habitat}</p>
              <p className="milieux">{e.milieux.map((m) => <Badge key={m}>{MILIEU[m].emoji} {MILIEU[m].label}</Badge>)}</p>
              <h3>Alimentation</h3>
              <p>{e.alimentation}</p>
              <h3>Comportement</h3>
              <p>{e.comportement}</p>
              <h3>Reproduction</h3>
              <p>{e.reproduction}</p>
              <h3>Statut</h3>
              <p>{e.statutMigratoire}</p>
            </section>
          )}

          <section className="bloc">
            <h2>Chant et cris</h2>
            <p>
              Le lecteur intégré arrive bientôt. En attendant, écoutez les enregistrements libres sur{' '}
              <a href={xenoCanto} target="_blank" rel="noreferrer">xeno-canto ↗</a>.
            </p>
            <p className="petit">⚠️ Ne diffusez pas de chants pour attirer les oiseaux, surtout en période de nidification.</p>
          </section>

          <section className="bloc">
            <h2>Mes observations ({mesObs.length})</h2>
            <ul className="liste-obs">
              {mesObs.map((o) => (
                <li key={o.id}>
                  {o.photo && <img src={o.photo} alt="" />}
                  <div>
                    <strong>{dateFr(o.date)}</strong> · {o.zone === 'autre' ? 'Ailleurs' : zoneById(o.zone)?.nom}
                    {o.lieu && ` · ${o.lieu}`}
                    {o.note && <p>{o.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
            <button className="bouton secondaire" onClick={() => setForm(true)}>+ Ajouter une observation</button>
          </section>

          <section className="bloc sources">
            <h2>Sources</h2>
            <ul>
              <li>
                Répartition : observations partagées sur <a href={`https://www.gbif.org/species/${e.gbif}`} target="_blank" rel="noreferrer">GBIF</a>{' '}
                ({SOURCES_DONNEES.periode}), regroupées par région.
              </li>
              {e.qid && (
                <li>
                  Nom, mensurations, statut UICN : <a href={`https://www.wikidata.org/wiki/${e.qid}`} target="_blank" rel="noreferrer">Wikidata</a>.
                </li>
              )}
              {e.redigee && <li>Textes rédigés à partir de l’INPN (MNHN) et de la LPO.</li>}
              {!e.redigee && e.wiki && <li>Description : Wikipédia (CC BY-SA 4.0).</li>}
            </ul>
            <p className="petit">Données générées le {dateFr(SOURCES_DONNEES.genereLe)} · fiches mises à jour le {dateFr(DATE_MAJ)}.</p>
          </section>
        </>
      )}

      {form && (
        <FormulaireObservation
          e={e}
          onFermer={() => setForm(false)}
          onValide={() => {
            setForm(false);
            setBravo(!decouverte);
            setGagnes(nouveauxBadges(carnet, chargerCarnet()));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}
