import type { Espece } from '../data/types';

/** Minuscules, sans accents, apostrophes unifiées, espaces normalisés. */
export function normaliser(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`´]/g, "'")
    .replace(/œ/g, 'oe')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const compact = (s: string) => s.replace(/[^a-z0-9]/g, '');
const mots = (s: string) => s.split(/[^a-z0-9]+/).filter(Boolean);

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

const similarite = (a: string, b: string) => 1 - levenshtein(a, b) / Math.max(a.length, b.length);

/** Ressemblance entre un mot tapé et un mot du nom (tolère préfixe et fautes). */
function simMot(q: string, m: string): number {
  if (m.startsWith(q)) return 1;
  if (q.length < 3) return 0;
  let s = similarite(q, m);
  if (q.length >= 4 && m.length > q.length) s = Math.max(s, similarite(q, m.slice(0, q.length)) - 0.05);
  return s;
}

function scoreTexte(q: string, cible: string): number {
  if (!q) return 0;
  if (cible === q) return 100;
  if (cible.startsWith(q)) return 90;
  const qc = compact(q);
  const cc = compact(cible);
  if (qc && cc.startsWith(qc)) return 88;
  if (cible.includes(q) || (qc.length >= 3 && cc.includes(qc))) return 80;

  const qm = mots(q);
  const cm = mots(cible);
  if (!qm.length || !cm.length) return 0;
  const sims = qm.map((w) => Math.max(...cm.map((m) => simMot(w, m))));
  const min = Math.min(...sims);
  const moy = sims.reduce((a, b) => a + b, 0) / sims.length;
  let best = min >= 0.65 ? 40 + 35 * moy : 0;

  // Mots collés ou séparés différemment (« rouge gorge » / « rougegorge »)
  if (qc.length >= 4) {
    const s = similarite(qc, cc.slice(0, qc.length + 1));
    const s2 = similarite(qc, cc);
    const sc = Math.max(s, s2);
    if (sc >= 0.75) best = Math.max(best, 40 + 35 * sc);
  }
  return best;
}

export interface Resultat {
  espece: Espece;
  score: number;
}

export function rechercher(requete: string, especes: Espece[], limite = 20): Resultat[] {
  const q = normaliser(requete);
  if (!q) return [];
  return especes
    .map((espece) => ({
      espece,
      score: Math.max(scoreTexte(q, normaliser(espece.nom)), scoreTexte(q, normaliser(espece.nomScientifique)) - 1),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.espece.nom.localeCompare(b.espece.nom, 'fr'))
    .slice(0, limite);
}
