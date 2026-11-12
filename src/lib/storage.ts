import type { Observation } from '../data/types';

// Le carnet est enregistré sur l'appareil ; avec un compte, il est aussi sauvegardé en ligne (lib/sync.ts).
const CLE = 'birdex:carnet:v1';
const CLE_SUPPRIMES = 'birdex:supprimes:v1'; // suppressions à propager au compte

// Prévenu à chaque modification faite par l'utilisateur (déclenche la synchronisation)
const modifsUtilisateur = new Set<() => void>();
export function surModificationUtilisateur(fn: () => void): () => void {
  modifsUtilisateur.add(fn);
  return () => modifsUtilisateur.delete(fn);
}
const signalerModification = () => modifsUtilisateur.forEach((fn) => fn());

type Nouvelle = Omit<Observation, 'id' | 'creeLe'>;

const listeners = new Set<() => void>();
export function abonner(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const notifier = () => listeners.forEach((fn) => fn());

export function chargerCarnet(): Observation[] {
  try {
    const brut = localStorage.getItem(CLE);
    const data = brut ? JSON.parse(brut) : [];
    if (!Array.isArray(data)) return [];
    // Migration : la zone test « Var » fait désormais partie de la région Provence-Alpes-Côte d'Azur
    return data.map((o: Observation) => ((o.zone as string) === 'var' ? { ...o, zone: 'paca' } : o));
  } catch {
    return [];
  }
}

function enregistrer(obs: Observation[]): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(obs));
  } catch (e) {
    throw new Error('Espace de stockage plein : supprimez quelques photos du carnet.', { cause: e });
  }
  notifier();
}

export function nouvelId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Repli : UUID v4 (format exigé par la base en ligne)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function chargerSupprimes(): string[] {
  try {
    const d = JSON.parse(localStorage.getItem(CLE_SUPPRIMES) || '[]');
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}
function noterSupprimes(ids: string[]) {
  localStorage.setItem(CLE_SUPPRIMES, JSON.stringify([...new Set([...chargerSupprimes(), ...ids])]));
}
export function oublierSupprimes(ids: string[]) {
  const reste = chargerSupprimes().filter((id) => !ids.includes(id));
  localStorage.setItem(CLE_SUPPRIMES, JSON.stringify(reste));
}

/** Applique le résultat d'une synchronisation (sans redéclencher de synchronisation). */
export function appliquerSynchro(ajouts: Observation[], retraits: string[], misesAJour: Map<string, Partial<Observation>> = new Map()): void {
  if (!ajouts.length && !retraits.length && !misesAJour.size) return;
  const retire = new Set(retraits);
  const carnet = chargerCarnet()
    .filter((o) => !retire.has(o.id))
    .map((o) => (misesAJour.has(o.id) ? { ...o, ...misesAJour.get(o.id) } : o));
  const ids = new Set(carnet.map((o) => o.id));
  const tout = [...carnet, ...ajouts.filter((o) => !ids.has(o.id))].sort((a, b) => b.creeLe.localeCompare(a.creeLe));
  enregistrer(tout);
}

export function ajouterObservation(o: Nouvelle): Observation {
  const obs: Observation = { ...o, id: nouvelId(), creeLe: new Date().toISOString() };
  enregistrer([obs, ...chargerCarnet()]);
  signalerModification();
  return obs;
}

export function supprimerObservation(id: string): void {
  enregistrer(chargerCarnet().filter((o) => o.id !== id));
  noterSupprimes([id]);
  signalerModification();
}

export function especesDecouvertes(carnet: Observation[] = chargerCarnet()): Set<string> {
  return new Set(carnet.map((o) => o.especeId));
}

/** Efface le carnet de cet appareil (avec un compte, l'effacement est propagé en ligne). */
export function toutEffacer(): void {
  noterSupprimes(chargerCarnet().map((o) => o.id));
  localStorage.removeItem(CLE);
  notifier();
  signalerModification();
}

/** Après déconnexion ou suppression du compte : repart d'un appareil vierge de toute trace de synchronisation. */
export function oublierToutLocal(): void {
  localStorage.removeItem(CLE);
  localStorage.removeItem(CLE_SUPPRIMES);
  notifier();
}

export function exporterJSON(): string {
  return JSON.stringify({ application: 'Birdex', exportLe: new Date().toISOString(), observations: chargerCarnet() }, null, 2);
}
