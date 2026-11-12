import type { Espece } from '../data/types';
import { zoneById } from '../data/zones';
import { ABONDANCE, MOIS_COURTS, MOIS_LONGS, STATUT, moisCourant } from '../lib/format';

/** Périodes de présence de l'espèce dans chaque zone, mois par mois. */
export default function Calendrier({ e }: { e: Espece }) {
  const now = moisCourant();
  return (
    <div className="calendrier">
      {e.presence.map((p) => (
        <div key={p.zone} className="calendrier-ligne">
          <div className="calendrier-titre">
            <strong>{zoneById(p.zone)?.nom}</strong>
            <span>
              {STATUT[p.statut]} · <span className={`pastille ab-${p.abondance}`}>{ABONDANCE[p.abondance]}</span>
            </span>
          </div>
          <ol className="calendrier-mois">
            {MOIS_COURTS.map((m, i) => {
              const present = p.mois.includes(i + 1);
              return (
                <li
                  key={i}
                  className={`${present ? `present ab-${p.abondance}` : ''} ${now === i + 1 ? 'maintenant' : ''}`}
                  title={`${MOIS_LONGS[i]} : ${present ? 'présent' : 'absent'}`}
                >
                  <span aria-hidden="true">{m}</span>
                  <span className="sr-only">
                    {MOIS_LONGS[i]} : {present ? 'présent' : 'absent'}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
