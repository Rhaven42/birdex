const absolu = (u) => (u.startsWith('//') ? `https:${u}` : u);
// Sélection des enregistrements xeno-canto (testée dans selection-sons.test.mjs).

export const QUALITE = { A: 0, B: 1, C: 2, D: 3, E: 4 };
const duree = (s) => s.split(':').reduce((a, x) => a * 60 + Number(x), 0);
const estChant = (t) => /\bsong\b/i.test(t);
const estCri = (t) => /\bcall\b|alarm|flight call/i.test(t);

export function trier(recs) {
  return recs
    .filter((x) => x.file && x.lic && QUALITE[x.q] !== undefined && QUALITE[x.q] <= 1) // qualité A ou B, fichier disponible
    .filter((x) => duree(x.length) >= 5 && duree(x.length) <= 120)
    // priorité : qualité, puis sans autre espèce audible en arrière-plan, puis durée proche de 30 s
    .sort((a, b) => QUALITE[a.q] - QUALITE[b.q] || (a.also?.length ? 1 : 0) - (b.also?.length ? 1 : 0) || Math.abs(duree(a.length) - 30) - Math.abs(duree(b.length) - 30));
}

export function choisir(recs) {
  const t = trier(recs);
  const chants = t.filter((x) => estChant(x.type)).slice(0, 2);
  const cris = t.filter((x) => estCri(x.type) && !estChant(x.type)).slice(0, 2);
  const sel = [...chants, ...cris];
  if (!sel.length) sel.push(...t.slice(0, 2)); // espèces sans chant typique (rapaces, oiseaux d'eau…)
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

