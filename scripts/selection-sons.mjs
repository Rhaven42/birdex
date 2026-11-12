const absolu = (u) => (u.startsWith('//') ? `https:${u}` : u);
// Sélection des enregistrements xeno-canto (testée dans selection-sons.test.mjs).

export const QUALITE = { A: 0, B: 1, C: 2, D: 3, E: 4 };
const duree = (s) => s.split(':').reduce((a, x) => a * 60 + Number(x), 0);
const estChant = (t) => /\bsong\b/i.test(t);
const estCri = (t) => /\bcall\b|alarm|flight call/i.test(t);

// Les cris nocturnes de migration et les cris en vol sont moins utiles sur le terrain que le cri habituel.
// Les cris de poussins au nid (« begging ») passent en dernier.
const penaliteCri = (t) => (/begging|nestling|hatchling/i.test(t) ? 3 : /nocturnal/i.test(t) ? 2 : /flight call/i.test(t) ? 1 : 0);

export function trier(recs, qualiteMax = 1) {
  const vus = new Set();
  return recs
    .filter((x) => !vus.has(x.id) && vus.add(x.id))
    .filter((x) => x.file && x.lic && QUALITE[x.q] !== undefined && QUALITE[x.q] <= qualiteMax) // qualité A ou B (C en dernier recours), fichier disponible
    .filter((x) => duree(x.length) >= 5 && duree(x.length) <= 120)
    // priorité : qualité, puis sans autre espèce audible en arrière-plan, puis durée proche de 30 s
    .sort((a, b) => QUALITE[a.q] - QUALITE[b.q] || (a.also?.length ? 1 : 0) - (b.also?.length ? 1 : 0) || Math.abs(duree(a.length) - 30) - Math.abs(duree(b.length) - 30));
}

export function choisir(recs) {
  let t = trier(recs);
  if (!t.length) t = trier(recs, 2);
  // 2 sons au maximum : le meilleur chant et le meilleur cri
  const chants = t.filter((x) => estChant(x.type)).slice(0, 1);
  const cris = t
    .filter((x) => estCri(x.type) && !estChant(x.type))
    .sort((a, b) => penaliteCri(a.type) - penaliteCri(b.type)) // tri stable : garde l'ordre qualité/durée à pénalité égale
    .slice(0, 1);
  const sel = [...chants, ...cris];
  for (const x of t) if (sel.length < 2 && !sel.includes(x)) sel.push(x); // compléter (espèces sans chant ou sans cri typique)
  return sel.map((x) => ({
    id: x.id,
    type: x.type,
    auteur: x.rec,
    lieu: [x.loc, x.cnt].filter(Boolean).join(', '),
    date: x.date,
    duree: x.length,
    licence: absolu(x.lic),
    fichier: x.file,
    page: absolu(x.url),
    sono: x.sono?.med ? absolu(x.sono.med) : undefined,
  }));
}

