import { ESPECES } from '../data/species';
import type { ZoneId } from '../data/types';
import { comptesActifs, supabase } from './supabase';

// Interrupteur : activé une fois la fonction serveur « identifier » déployée dans Supabase et testée
const IDENTIFICATION_OUVERTE = false;
export const identificationActive = IDENTIFICATION_OUVERTE && comptesActifs;

export interface Proposition {
  nomScientifique: string;
  confiance: number; // 0–100
  criteres: string;
}
export interface ResultatIdentification {
  etat: 'identifie' | 'incertain' | 'pas_oiseau';
  propositions: Proposition[];
  conseil: string;
  restant: number;
}

/** Espèces régulièrement observées dans la région ce mois-ci (indice donné à l'IA). */
export function especesProbables(zone: ZoneId | null, mois: number): string[] {
  if (!zone) return [];
  return ESPECES.filter((e) => e.presence.some((p) => p.zone === zone && p.mois.includes(mois))).map((e) => e.nomScientifique);
}

/** Niveau de confiance affiché : vert ≥ 70, orange ≥ 40, rouge en dessous. */
export function niveauConfiance(c: number): 'commune' | 'peu-commune' | 'rare' {
  return c >= 70 ? 'commune' : c >= 40 ? 'peu-commune' : 'rare';
}

/** Envoie la photo (data URL JPEG) à la fonction serveur « identifier ». */
export async function identifier(photo: string, zone: ZoneId | null, nomRegion: string | null, mois: number): Promise<ResultatIdentification> {
  if (!supabase) throw new Error('Les comptes ne sont pas activés.');
  const image = photo.replace(/^data:image\/\w+;base64,/, '');
  const { data, error } = await supabase.functions.invoke('identifier', {
    body: { image, mois, region: nomRegion, probables: especesProbables(zone, mois) },
  });
  if (error) {
    // La fonction renvoie { erreur } avec un message lisible
    const ctx = (error as { context?: Response }).context;
    let message = 'Identification impossible pour le moment. Vérifiez votre connexion.';
    if (ctx && typeof ctx.json === 'function') {
      try {
        const corps = await ctx.json();
        if (corps?.erreur) message = corps.erreur;
      } catch {
        /* réponse non JSON */
      }
    }
    throw new Error(message);
  }
  return data as ResultatIdentification;
}
