import { Link } from 'react-router-dom';
import { especeById } from '../data/species';
import { zoneById } from '../data/zones';
import { useCarnet } from '../lib/hooks';
import { dateFr } from '../lib/format';
import { exporterJSON, supprimerObservation, toutEffacer } from '../lib/storage';

export default function Carnet() {
  const carnet = useCarnet();

  function exporter() {
    const url = URL.createObjectURL(new Blob([exporterJSON()], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `birdex-carnet-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <h1 className="titre-section">Carnet d’observations</h1>
      {carnet.length === 0 ? (
        <p className="vide">
          Votre carnet est vide. Ouvrez une fiche espèce et touchez « J’ai observé cet oiseau » pour commencer votre collection.
          <br />
          <Link to="/" className="bouton principal">Explorer la carte</Link>
        </p>
      ) : (
        <ul className="liste-obs">
          {carnet.map((o) => {
            const e = especeById(o.especeId);
            return (
              <li key={o.id}>
                {o.photo && <img src={o.photo} alt="" />}
                <div>
                  <Link to={`/espece/${o.especeId}`}><strong>{e?.nom ?? o.especeId}</strong></Link>
                  <div className="petit">
                    {dateFr(o.date)} · {o.zone === 'autre' ? 'Ailleurs' : zoneById(o.zone)?.nom}
                    {o.lieu && ` · ${o.lieu}`} · validation {o.validation}
                  </div>
                  {o.note && <p>{o.note}</p>}
                </div>
                <button
                  className="supprimer"
                  aria-label={`Supprimer l’observation de ${e?.nom}`}
                  onClick={() => confirm('Supprimer cette observation ?') && supprimerObservation(o.id)}
                >
                  🗑
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <section className="bloc donnees">
        <h2>Mes données</h2>
        <p className="petit">
          Birdex ne crée pas de compte : votre carnet est enregistré uniquement sur cet appareil. Aucune donnée n’est envoyée à un serveur.
          Seules les photos des fiches sont chargées depuis Wikimedia Commons.
        </p>
        <div className="actions">
          <button className="bouton secondaire" onClick={exporter} disabled={!carnet.length}>Exporter (JSON)</button>
          <button
            className="bouton danger"
            disabled={!carnet.length}
            onClick={() => confirm('Effacer définitivement tout le carnet et la collection ?') && toutEffacer()}
          >
            Tout effacer
          </button>
        </div>
      </section>
    </div>
  );
}
