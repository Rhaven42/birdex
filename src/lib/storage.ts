import type { Observation } from '../data/types';

// Tout reste sur l'appareil (pas de compte pour le MVP).
const CLE = 'birdex:carnet:v1';

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
    return Array.isArray(data) ? data : [];
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

function nouvelId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ajouterObservation(o: Nouvelle): Observation {
  const obs: Observation = { ...o, id: nouvelId(), creeLe: new Date().toISOString() };
  enregistrer([obs, ...chargerCarnet()]);
  return obs;
}

export function supprimerObservation(id: string): void {
  enregistrer(chargerCarnet().filter((o) => o.id !== id));
}

export function especesDecouvertes(carnet: Observation[] = chargerCarnet()): Set<string> {
  return new Set(carnet.map((o) => o.especeId));
}

export function toutEffacer(): void {
  localStorage.removeItem(CLE);
  notifier();
}

export function exporterJSON(): string {
  return JSON.stringify({ application: 'Birdex', exportLe: new Date().toISOString(), observations: chargerCarnet() }, null, 2);
}
