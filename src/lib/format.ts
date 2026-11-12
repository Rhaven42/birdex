import type { Abondance, CategorieUICN, Difficulte, Milieu, StatutPresence } from '../data/types';

export const MOIS_COURTS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
export const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const STATUT: Record<StatutPresence, string> = {
  sedentaire: 'Toute l’année',
  estivant: 'Printemps–été',
  hivernant: 'Hiver',
  passage: 'En migration',
};
export const ABONDANCE: Record<Abondance, string> = { commune: 'Commune', 'peu-commune': 'Peu commune', rare: 'Rare' };
export const DIFFICULTE: Record<Difficulte, string> = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' };
export const MILIEU: Record<Milieu, { label: string; emoji: string }> = {
  jardin: { label: 'Jardins et parcs', emoji: '🌳' },
  ville: { label: 'Villes', emoji: '🏙️' },
  foret: { label: 'Forêts', emoji: '🌲' },
  campagne: { label: 'Campagnes', emoji: '🌾' },
  'zone-humide': { label: 'Zones humides', emoji: '💧' },
  littoral: { label: 'Littoral', emoji: '🏖️' },
  mer: { label: 'Mer', emoji: '🌊' },
  garrigue: { label: 'Garrigues', emoji: '🌿' },
  falaise: { label: 'Falaises et rochers', emoji: '⛰️' },
};
export const UICN: Record<CategorieUICN, { label: string; classe: string }> = {
  LC: { label: 'Préoccupation mineure', classe: 'lr-lc' },
  NT: { label: 'Quasi menacée', classe: 'lr-nt' },
  VU: { label: 'Vulnérable', classe: 'lr-vu' },
  EN: { label: 'En danger', classe: 'lr-en' },
  CR: { label: 'En danger critique', classe: 'lr-cr' },
  DD: { label: 'Données insuffisantes', classe: 'lr-na' },
  EX: { label: 'Éteinte', classe: 'lr-cr' },
};

export const moisCourant = () => new Date().getMonth() + 1;
export const dateFr = (iso: string) =>
  new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
