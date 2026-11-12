import { ESPECES, especesDeZone } from '../data/species';
import type { Espece, Observation } from '../data/types';
import { MOIS_LONGS } from './format';

export interface DefinitionBadge {
  id: string;
  titre: string;
  description: string;
  emoji: string;
  categorie: 'Premiers pas' | 'Milieux' | 'Familles' | 'Territoires' | 'Expert';
  /** Espèces qui comptent pour ce badge (absent : on compte les observations) */
  especes?: string[];
  total: number;
}

export interface EtatBadge extends DefinitionBadge {
  n: number;
  obtenu: boolean;
}

const ids = (f: (e: Espece) => boolean) => ESPECES.filter(f).map((e) => e.id);
const moitie = (l: unknown[]) => Math.ceil(l.length / 2);

const MESANGES = ids((e) => e.nom.startsWith('Mésange'));
const RAPACES = ids((e) => ['Accipitridés', 'Falconidés'].includes(e.famille));
const NOCTURNES = ids((e) => !!e.nocturne);
const JARDIN = ids((e) => e.milieux.includes('jardin'));
const HUMIDES = ids((e) => e.milieux.includes('zone-humide'));
const LITTORAL = ids((e) => e.milieux.includes('littoral') || e.milieux.includes('mer'));
const MIDI = ids((e) => e.presence.every((p) => p.zone === 'var'));
const DIFFICILES = ids((e) => e.difficulte === 'difficile');
const MIGRATEURS = ids((e) => e.presence.some((p) => p.statut === 'nicheur'));
const IDF = especesDeZone('idf').map((e) => e.id);
const VAR = especesDeZone('var').map((e) => e.id);
const TOUTES = ESPECES.map((e) => e.id);

export const BADGES: DefinitionBadge[] = [
  { id: 'premier-envol', titre: 'Premier envol', emoji: '🐣', categorie: 'Premiers pas', description: 'Découvrir votre première espèce.', especes: TOUTES, total: 1 },
  { id: 'carnet-assidu', titre: 'Carnet assidu', emoji: '📓', categorie: 'Premiers pas', description: 'Noter 10 observations dans le carnet.', total: 10 },
  { id: 'dix-especes', titre: 'Jumelles affûtées', emoji: '🔭', categorie: 'Premiers pas', description: 'Découvrir 10 espèces.', especes: TOUTES, total: 10 },
  { id: 'oiseaux-du-jardin', titre: 'Oiseaux du jardin', emoji: '🌳', categorie: 'Milieux', description: 'Découvrir 10 espèces des jardins et parcs.', especes: JARDIN, total: 10 },
  { id: 'zones-humides', titre: 'Pieds dans l’eau', emoji: '💧', categorie: 'Milieux', description: 'Découvrir 5 espèces des zones humides.', especes: HUMIDES, total: 5 },
  { id: 'embruns', titre: 'Embruns', emoji: '🌊', categorie: 'Milieux', description: 'Découvrir 3 espèces du littoral ou de la mer.', especes: LITTORAL, total: 3 },
  { id: 'toutes-les-mesanges', titre: 'Toutes les mésanges', emoji: '🐤', categorie: 'Familles', description: 'Découvrir toutes les mésanges référencées.', especes: MESANGES, total: MESANGES.length },
  { id: 'premier-rapace', titre: 'Premier rapace', emoji: '🦅', categorie: 'Familles', description: 'Découvrir un rapace diurne (buse, faucon, épervier…).', especes: RAPACES, total: 1 },
  { id: 'oiseaux-de-nuit', titre: 'Oiseau de nuit', emoji: '🦉', categorie: 'Familles', description: 'Découvrir une chouette ou un hibou.', especes: NOCTURNES, total: 1 },
  { id: 'grands-voyageurs', titre: 'Grands voyageurs', emoji: '🧭', categorie: 'Familles', description: 'Découvrir 5 espèces migratrices venues nicher chez nous.', especes: MIGRATEURS, total: 5 },
  { id: 'explorateur-idf', titre: 'Explorateur francilien', emoji: '🗼', categorie: 'Territoires', description: 'Découvrir la moitié des espèces d’Île-de-France.', especes: IDF, total: moitie(IDF) },
  { id: 'explorateur-var', titre: 'Explorateur varois', emoji: '☀️', categorie: 'Territoires', description: 'Découvrir la moitié des espèces du Var.', especes: VAR, total: moitie(VAR) },
  { id: 'couleurs-du-midi', titre: 'Couleurs du Midi', emoji: '🌿', categorie: 'Territoires', description: 'Découvrir 5 espèces méditerranéennes absentes d’Île-de-France.', especes: MIDI, total: Math.min(5, MIDI.length) },
  { id: 'oeil-expert', titre: 'Œil d’expert', emoji: '🎯', categorie: 'Expert', description: 'Découvrir 5 espèces difficiles à identifier.', especes: DIFFICILES, total: Math.min(5, DIFFICILES.length) },
];

export function evaluerBadges(carnet: Observation[]): EtatBadge[] {
  const vues = new Set(carnet.map((o) => o.especeId));
  return BADGES.map((b) => {
    const n = Math.min(b.total, b.especes ? b.especes.filter((id) => vues.has(id)).length : carnet.length);
    return { ...b, n, obtenu: n >= b.total };
  });
}

export function nouveauxBadges(avant: Observation[], apres: Observation[]): EtatBadge[] {
  const deja = new Set(evaluerBadges(avant).filter((b) => b.obtenu).map((b) => b.id));
  return evaluerBadges(apres).filter((b) => b.obtenu && !deja.has(b.id));
}

// ───────────── Défis saisonniers ─────────────

const SAISONS = [
  { nom: 'hiver', mois: [12, 1, 2], article: 'en hiver' },
  { nom: 'printemps', mois: [3, 4, 5], article: 'au printemps' },
  { nom: 'ete', mois: [6, 7, 8], article: 'en été' },
  { nom: 'automne', mois: [9, 10, 11], article: 'en automne' },
];

export function saisonDe(d: Date) {
  const m = d.getMonth() + 1;
  const s = SAISONS.find((x) => x.mois.includes(m))!;
  // L'hiver de décembre 2026 à février 2027 est « hiver-2026 »
  const annee = s.nom === 'hiver' && m <= 2 ? d.getFullYear() - 1 : d.getFullYear();
  return { ...s, annee, id: `${s.nom}-${annee}` };
}

const dateObs = (o: Observation) => new Date(`${o.date}T12:00:00`);

export interface EtatDefi {
  id: string;
  titre: string;
  description: string;
  emoji: string;
  n: number;
  total: number;
  obtenu: boolean;
}

export function defisSaisonniers(carnet: Observation[], maintenant = new Date()): EtatDefi[] {
  const saison = saisonDe(maintenant);
  const especesSaison = new Set(carnet.filter((o) => saisonDe(dateObs(o)).id === saison.id).map((o) => o.especeId));
  const m = maintenant.getMonth() + 1;
  const a = maintenant.getFullYear();
  const especesMois = new Set(
    carnet.filter((o) => dateObs(o).getMonth() + 1 === m && dateObs(o).getFullYear() === a).map((o) => o.especeId),
  );
  const defi = (id: string, titre: string, description: string, emoji: string, n: number, total: number): EtatDefi => ({
    id, titre, description, emoji, n: Math.min(n, total), total, obtenu: n >= total,
  });
  return [
    defi(saison.id, `5 espèces ${saison.article}`, `Observer 5 espèces différentes ${saison.article} ${saison.nom === 'hiver' ? `${saison.annee}–${saison.annee + 1}` : saison.annee}.`, '🍃', especesSaison.size, 5),
    defi(`mois-${a}-${m}`, `3 espèces en ${MOIS_LONGS[m - 1]}`, `Observer 3 espèces différentes ce mois-ci.`, '📅', especesMois.size, 3),
  ];
}
