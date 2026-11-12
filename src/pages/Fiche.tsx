import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Calendrier from '../components/Calendrier';
import CarteRepartition from '../components/CarteRepartition';
import FormulaireObservation from '../components/FormulaireObservation';
import LecteurSons from '../components/LecteurSons';
import { Icone, type NomIcone } from '../components/Icones';
import { Badge, BadgeConservation, BadgeDifficulte, PhotoEspece } from '../components/ui';
import { DATE_MAJ, SOURCES_DONNEES, especeById } from '../data/species';
import { zoneById } from '../data/zones';
import { useCarnet, useResume } from '../lib/hooks';
import { DIFFICULTE, MILIEU, dateFr } from '../lib/format';
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

type Onglet = 'indices' | 'histoire' | 'caracteristiques' | 'vie' | 'carte' | 'sons' | 'observations' | 'sources';

export default function Fiche() {
  const { id = '' } = useParams();
  const e = especeById(id);
  const carnet = useCarnet();
  const navigate = useNavigate();
  const [form, setForm] = useState(false);
  const [bravo, setBravo] = useState(false);
  const [gagnes, setGagnes] = useState<EtatBadge[]>([]);
  const [choix, setChoix] = useState<Onglet | null>(null);
  if (!e) return <div className="page"><p>Espèce introuvable.</p><Link to="/">Retour</Link></div>;

  const mesObs = carnet.filter((o) => o.especeId === e.id);
  const decouverte = mesObs.length > 0;

  const cases: { id: Onglet; label: string; icone: NomIcone; verrou?: boolean }[] = [
    ...(!decouverte ? [{ id: 'indices' as const, label: 'Indices', icone: 'indice' as const }] : []),
    { id: 'histoire', label: 'Histoire', icone: 'histoire', verrou: !decouverte },
    { id: 'caracteristiques', label: 'Caractéristiques', icone: 'mesure', verrou: !decouverte },
    ...(e.redigee ? [{ id: 'vie' as const, label: 'Mode de vie', icone: 'feuille' as const, verrou: !decouverte }] : []),
    { id: 'carte', label: 'Où l’observer', icone: 'lieu' },
    { id: 'sons', label: 'Sons', icone: 'son' },
    { id: 'observations', label: `Observations${mesObs.length ? ` (${mesObs.length})` : ''}`, icone: 'carnet', verrou: !decouverte },
    { id: 'sources', label: 'Sources', icone: 'sources' },
  ];
  const onglet = cases.some((c) => c.id === choix) ? choix : decouverte ? 'histoire' : 'indices';
  const setOnglet = (o: Onglet) => setChoix(o);
  const caseActive = cases.find((c) => c.id === onglet)!;

  const contenu = (o: Onglet) => {
    switch (o) {
      case 'indices':
        return (
          <>
            <ul className="indices">
              {e.milieux.length > 0 && (
                <li><strong>Milieux :</strong> {e.milieux.map((m) => `${MILIEU[m].emoji} ${MILIEU[m].label}`).join(', ')}</li>
              )}
              {e.taille && <li><strong>Taille :</strong> {e.taille} cm</li>}
              <li><strong>Famille :</strong> {e.famille}</li>
              {e.signes.map((x) => <li key={x}>🔎 {x}</li>)}
            </ul>
            <p className="petit">Astuce : écoutez ses sons et regardez où et quand l’observer avant de partir.</p>
          </>
        );
      case 'histoire':
        return <DescriptionWikipedia titre={e.wiki ?? e.nomScientifique} />;
      case 'caracteristiques':
        return (
          <>
            <dl className="fiche-chiffres">
              {e.taille && <div><dt>Taille</dt><dd>{e.taille} cm</dd></div>}
              {e.envergure && <div><dt>Envergure</dt><dd>{e.envergure} cm</dd></div>}
              <div><dt>Famille</dt><dd>{e.famille}</dd></div>
              <div><dt>Ordre</dt><dd>{e.ordre}</dd></div>
              <div><dt>Régions</dt><dd>{e.presence.length} / 13</dd></div>
              {e.difficulte && <div><dt>Identification</dt><dd>{DIFFICULTE[e.difficulte]}</dd></div>}
            </dl>
            {e.redigee && (
              <>
                <p>{e.description}</p>
                <ul className="indices">{e.signes.map((x) => <li key={x}>🔎 {x}</li>)}</ul>
                <h3>Ne pas confondre</h3>
                <p>{e.confusions}</p>
              </>
            )}
            <div className="badges">
              <BadgeConservation e={e} />
              {e.protege && <Badge className="protege">🛡️ Espèce protégée</Badge>}
              {e.introduite && <Badge className="lr-na">🌍 Espèce introduite</Badge>}
            </div>
          </>
        );
      case 'vie':
        return (
          <>
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
          </>
        );
      case 'carte':
        return (
          <>
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
          </>
        );
      case 'sons':
        return (
          <>
            {!decouverte && <p className="petit">On entend souvent un oiseau bien avant de le voir : écoutez-le avant de partir.</p>}
            <LecteurSons e={e} />
            <p className="petit">⚠️ Ne diffusez pas ces sons dans la nature pour attirer les oiseaux, surtout en période de nidification.</p>
          </>
        );
      case 'observations':
        return (
          <>
            <ul className="liste-obs">
              {mesObs.map((x) => (
                <li key={x.id}>
                  {x.photo && <img src={x.photo} alt="" />}
                  <div>
                    <strong>{dateFr(x.date)}</strong> · {x.zone === 'autre' ? 'Ailleurs' : zoneById(x.zone)?.nom}
                    {x.lieu && ` · ${x.lieu}`}
                    {x.note && <p>{x.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
            <button className="bouton secondaire" onClick={() => setForm(true)}>+ Ajouter une observation</button>
          </>
        );
      case 'sources':
        return (
          <div className="sources">
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
              <li>Photo : Wikimedia Commons (auteur et licence sous la photo).</li>
              <li>Histoire : Wikipédia (CC BY-SA 4.0).</li>
              {e.redigee && <li>Caractéristiques et mode de vie rédigés à partir de l’INPN (MNHN) et de la LPO.</li>}
              <li>Sons : <a href="https://xeno-canto.org" target="_blank" rel="noreferrer">xeno-canto</a> (auteur et licence sous chaque enregistrement).</li>
            </ul>
            <p className="petit">Données générées le {dateFr(SOURCES_DONNEES.genereLe)} · fiches mises à jour le {dateFr(DATE_MAJ)}.</p>
          </div>
        );
    }
  };

  return (
    <div className="page fiche">
      <button className="retour" onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))}><Icone nom="retour" taille={18} /> Retour</button>

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
        <PhotoEspece e={e} verrouillee={!decouverte}>
          <div className="fiche-titres">
            <p className="famille">{e.famille}</p>
            <h1>{e.nom}</h1>
            <p className="sci">{e.nomScientifique}</p>
          </div>
        </PhotoEspece>
        <div className="badges fiche-badges">
          {decouverte && <Badge className="ok">✓ Découverte</Badge>}
          <BadgeDifficulte e={e} />
          {e.introduite && <Badge className="lr-na">Espèce introduite</Badge>}
          {e.nocturne && <Badge>Nocturne</Badge>}
        </div>
      </header>

      <nav className="cases" role="tablist" aria-label="Rubriques de la fiche">
        {cases.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={onglet === c.id}
            aria-controls="panneau-fiche"
            className={`case-fiche ${onglet === c.id ? 'active' : ''} ${c.verrou ? 'fermee' : ''}`}
            onClick={() => setOnglet(c.id)}
          >
            <span className="case-icone"><Icone nom={c.verrou ? 'cadenas' : c.icone} /></span>
            <span>{c.label}</span>
          </button>
        ))}
      </nav>

      <section className="bloc panneau" id="panneau-fiche" role="tabpanel" aria-label={caseActive.label}>
        <h2 className="titre-panneau"><Icone nom={caseActive.icone} /> {caseActive.label}</h2>
        {caseActive.verrou ? (
          <div className="verrou-panneau">
            <span className="verrou-icone"><Icone nom="cadenas" taille={32} /></span>
            <p>Cette rubrique se débloque quand vous avez vu l’oiseau : touchez le bouton orange en bas.</p>
          </div>
        ) : (
          contenu(caseActive.id)
        )}
      </section>

      <div className="action-fixe">
        <button className="bouton principal" onClick={() => setForm(true)}>
          {decouverte ? '👀 Je l’ai encore vu' : '👀 J’ai vu cet oiseau !'}
        </button>
      </div>

      {form && (
        <FormulaireObservation
          e={e}
          onFermer={() => setForm(false)}
          onValide={() => {
            setForm(false);
            setBravo(!decouverte);
            setChoix('histoire');
            setGagnes(nouveauxBadges(carnet, chargerCarnet()));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}
