import { useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ESPECES } from '../data/species';
import { rechercher } from '../lib/search';

/** Recherche avec suggestions automatiques (tolérante aux fautes de frappe). */
export default function BarreRecherche({ valeurInitiale = '', autoFocus = false }: { valeurInitiale?: string; autoFocus?: boolean }) {
  const [q, setQ] = useState(valeurInitiale);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const navigate = useNavigate();
  const id = useId();
  const suggestions = useMemo(() => rechercher(q, ESPECES, 6), [q]);

  const aller = (especeId: string) => {
    setOuvert(false);
    navigate(`/espece/${especeId}`);
  };

  return (
    <form
      className="recherche"
      role="search"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (actif >= 0 && suggestions[actif]) return aller(suggestions[actif].espece.id);
        setOuvert(false);
        navigate(`/recherche?q=${encodeURIComponent(q)}`);
      }}
    >
      <input
        type="search"
        value={q}
        autoFocus={autoFocus}
        placeholder="Rechercher un oiseau"
        aria-label="Rechercher un oiseau"
        role="combobox"
        aria-expanded={ouvert && suggestions.length > 0}
        aria-controls={id}
        aria-autocomplete="list"
        onChange={(ev) => {
          setQ(ev.target.value);
          setOuvert(true);
          setActif(-1);
        }}
        onFocus={() => setOuvert(true)}
        onBlur={() => setTimeout(() => setOuvert(false), 150)}
        onKeyDown={(ev) => {
          if (ev.key === 'ArrowDown') setActif((a) => Math.min(a + 1, suggestions.length - 1));
          else if (ev.key === 'ArrowUp') setActif((a) => Math.max(a - 1, -1));
          else if (ev.key === 'Escape') setOuvert(false);
        }}
      />
      {ouvert && suggestions.length > 0 && (
        <ul className="suggestions" id={id} role="listbox">
          {suggestions.map((r, i) => (
            <li key={r.espece.id} role="option" aria-selected={i === actif} className={i === actif ? 'actif' : ''} onMouseDown={() => aller(r.espece.id)}>
              <span>{r.espece.nom}</span>
              <em>{r.espece.nomScientifique}</em>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
