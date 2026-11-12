import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Calendrier from '../components/Calendrier';
import FormulaireObservation from '../components/FormulaireObservation';
import FranceMap from '../components/FranceMap';
import { Badge, BadgeConservation, BadgeDifficulte, PhotoEspece, Silhouette } from '../components/ui';
import { DATE_MAJ, SOURCES, especeById } from '../data/species';
import { zoneById } from '../data/zones';
import { useCarnet } from '../lib/hooks';
import { MILIEU, dateFr } from '../lib/format';
import { progressionZones } from '../lib/progression';
import { nouveauxBadges, type EtatBadge } from '../lib/badges';
import { chargerCarnet } from '../lib/storage';

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
  const zones = e.presence.map((p) => p.zone);
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
                  <li key={b.id}>
                    {b.emoji} Badge obtenu : <strong>{b.titre}</strong>
                  </li>
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
            {decouverte && e.conservation.protege && <Badge className="protege">🛡️ Espèce protégée</Badge>}
            {e.nocturne && <Badge>🌙 Nocturne</Badge>}
          </div>
        </div>
      </header>

      {!decouverte && (
        <section className="bloc verrou">
          <h2>Indices pour la trouver</h2>
          <ul className="indices">
            <li><strong>Milieux :</strong> {e.milieux.map((m) => `${MILIEU[m].emoji} ${MILIEU[m].label}`).join(', ')}</li>
            <li><strong>Taille :</strong> {e.taille} cm</li>
            {e.signes.map((s) => <li key={s}>🔎 {s}</li>)}
          </ul>
          <button className="bouton principal large" onClick={() => setForm(true)}>
            👀 J’ai observé cet oiseau
          </button>
          <p className="petit">La fiche complète (photo, description, mœurs, statut…) se déverrouille quand vous validez une observation.</p>
        </section>
      )}

      <section className="bloc">
        <h2>Où et quand l’observer</h2>
        <FranceMap progression={progressionZones(new Set())} surlignage={zones} compacte />
        <Calendrier e={e} />
        {e.sensible && (
          <p className="alerte">
            🛡️ Espèce sensible : par mesure de protection, Birdex n’affiche que des zones larges, jamais de site précis.
          </p>
        )}
      </section>

      {decouverte && (
        <>
          <section className="bloc">
            <h2>Identification</h2>
            <dl className="mesures">
              <div><dt>Taille</dt><dd>{e.taille} cm</dd></div>
              <div><dt>Envergure</dt><dd>{e.envergure} cm</dd></div>
            </dl>
            <p>{e.description}</p>
            <ul className="indices">{e.signes.map((s) => <li key={s}>🔎 {s}</li>)}</ul>
            <h3>Ne pas confondre</h3>
            <p>{e.confusions}</p>
          </section>

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

          <section className="bloc">
            <h2>Chant et cris</h2>
            <p>
              Le lecteur intégré arrive dans la prochaine version. En attendant, écoutez les enregistrements libres de droits sur{' '}
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
            <ul>{SOURCES.map((s) => <li key={s}>{s}</li>)}</ul>
            <p className="petit">
              Dernière mise à jour : {dateFr(DATE_MAJ)}. Statut de conservation : Liste rouge des oiseaux nicheurs de France
              métropolitaine (2016).
            </p>
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
