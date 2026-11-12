// Photos (Wikimedia Commons, préparées à l'avance) et descriptions Wikipédia (chargées à la demande).

import photosData from '../data/photos.json';
import type { Espece } from '../data/types';

export interface Photo {
  url: string; // ~960 px, pour la fiche
  miniature: string; // ~330 px, pour les grilles
  auteur: string;
  licence: string;
  licenceUrl?: string;
  source: string; // page du fichier sur Wikimedia Commons
}
const PHOTOS = (photosData as { photos: Record<string, Photo> }).photos;
/** Photo libre de droits de l'espèce (préparée par scripts/build-photos.mjs). */
export const photoDe = (e: Pick<Espece, 'nomScientifique'>): Photo | undefined => PHOTOS[e.nomScientifique];

const API = 'https://fr.wikipedia.org/w/api.php';
async function api(params: Record<string, string>) {
  const u = new URL(API);
  Object.entries({ format: 'json', formatversion: '2', origin: '*', ...params }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u);
  if (!r.ok) throw new Error(`Wikipédia : ${r.status}`);
  return r.json();
}

export interface Resume {
  texte: string;
  url: string;
}
const memoResume = new Map<string, Promise<Resume | null>>();
/** Introduction de l'article Wikipédia (licence CC BY-SA 4.0), chargée dans le navigateur. */
export function resumeWikipedia(titreWiki: string): Promise<Resume | null> {
  const titre = titreWiki.replace(/’/g, "'");
  if (!memoResume.has(titre)) {
    memoResume.set(
      titre,
      api({ action: 'query', prop: 'extracts', exintro: '1', explaintext: '1', exsentences: '6', titles: titre, redirects: '1' })
        .then((d) => {
          const page = d?.query?.pages?.[0];
          if (!page?.extract) return null;
          return { texte: page.extract.trim(), url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}` };
        })
        .catch(() => {
          memoResume.delete(titre);
          return null;
        }),
    );
  }
  return memoResume.get(titre)!;
}

/** Réduit une photo d'observation pour la stocker sur l'appareil. */
export async function reduireImage(fichier: File, max = 720): Promise<string> {
  const bmp = await createImageBitmap(fichier);
  const r = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * r);
  c.height = Math.round(bmp.height * r);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.72);
}
