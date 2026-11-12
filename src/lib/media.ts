// Photos issues de Wikimedia Commons, via l'API de Wikipédia (CORS autorisé avec origin=*).
// L'auteur et la licence sont récupérés pour être crédités sur chaque fiche.

export interface Photo {
  url: string;
  auteur: string;
  licence: string;
  licenceUrl?: string;
  source: string; // page de description du fichier sur Commons
}

const API = 'https://fr.wikipedia.org/w/api.php';
const CACHE = 'birdex:photos:v1';
const memo = new Map<string, Promise<Photo | null>>();

function lireCache(): Record<string, Photo | null> {
  try {
    return JSON.parse(localStorage.getItem(CACHE) || '{}');
  } catch {
    return {};
  }
}
function ecrireCache(titre: string, photo: Photo | null) {
  try {
    const c = lireCache();
    c[titre] = photo;
    localStorage.setItem(CACHE, JSON.stringify(c));
  } catch {
    /* cache facultatif */
  }
}

const texte = (html?: string) => (html ? new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() ?? '' : '');

async function api(params: Record<string, string>) {
  const u = new URL(API);
  Object.entries({ format: 'json', formatversion: '2', origin: '*', ...params }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u);
  if (!r.ok) throw new Error(`Wikipédia : ${r.status}`);
  return r.json();
}

async function charger(titreWiki: string): Promise<Photo | null> {
  const titre = titreWiki.replace(/’/g, "'");
  const page = await api({ action: 'query', prop: 'pageimages', piprop: 'name', titles: titre, redirects: '1' });
  const fichier: string | undefined = page?.query?.pages?.[0]?.pageimage;
  if (!fichier) return null;
  const info = await api({
    action: 'query',
    prop: 'imageinfo',
    titles: `File:${fichier}`,
    iiprop: 'url|extmetadata',
    iiurlwidth: '800',
  });
  const ii = info?.query?.pages?.[0]?.imageinfo?.[0];
  if (!ii) return null;
  const md = ii.extmetadata ?? {};
  return {
    url: ii.thumburl || ii.url,
    auteur: texte(md.Artist?.value) || 'Auteur inconnu',
    licence: texte(md.LicenseShortName?.value) || 'Voir la source',
    licenceUrl: md.LicenseUrl?.value,
    source: ii.descriptionurl,
  };
}

export function photoEspece(titreWiki: string): Promise<Photo | null> {
  const c = lireCache();
  if (titreWiki in c) return Promise.resolve(c[titreWiki]);
  if (!memo.has(titreWiki)) {
    memo.set(
      titreWiki,
      charger(titreWiki)
        .then((p) => {
          ecrireCache(titreWiki, p);
          return p;
        })
        .catch(() => {
          memo.delete(titreWiki); // réessayer plus tard (hors connexion…)
          return null;
        }),
    );
  }
  return memo.get(titreWiki)!;
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
