// Construit src/data/photos.json : une photo libre de droits par espèce, avec auteur et licence.
//  1. Image de référence de l'espèce sur Wikidata (propriété P18) ;
//     à défaut, image principale de l'article Wikipédia (recherche par nom scientifique).
//  2. Auteur, licence et miniatures via l'API de Wikimedia Commons (servie par fr.wikipedia.org).
//
// Usage :  NODE_USE_ENV_PROXY=1 node scripts/build-photos.mjs

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ROOT = new URL('..', import.meta.url);
const CACHE = new URL('data-src/cache/', ROOT);
mkdirSync(CACHE, { recursive: true });
const UA = 'BirdexDataBuilder/0.1 (open-source educational app; github.com/Rhaven42/birdex)';
const h = (x) => createHash('sha1').update(x).digest('hex').slice(0, 12);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, cle) {
  const f = new URL(cle + '.json', CACHE);
  if (existsSync(f)) return JSON.parse(readFileSync(f));
  for (let essai = 0; ; essai++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.ok) {
      const d = await r.json();
      writeFileSync(f, JSON.stringify(d));
      await sleep(1200);
      return d;
    }
    if ((r.status === 429 || r.status >= 500) && essai < 6) {
      await sleep(Math.max(Number(r.headers.get('retry-after') || 0) * 1000, 4000 * 2 ** essai));
      continue;
    }
    throw new Error(`${r.status} ${url}`);
  }
}
const api = (base, params) => `${base}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
const WP = 'https://fr.wikipedia.org/w/api.php';
const WD = 'https://www.wikidata.org/w/api.php';
const lots = (xs, n) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

const especes = JSON.parse(readFileSync(new URL('src/data/gbif.json', ROOT))).especes;

// 1a. Image P18 sur Wikidata
const fichier = {}; // nom scientifique → nom de fichier Commons
const avecQid = especes.filter((e) => e.qid);
for (const lot of lots(avecQid, 50)) {
  const ids = lot.map((e) => e.qid).join('|');
  const d = await getJSON(api(WD, { action: 'wbgetentities', ids, props: 'claims' }), `wd-p18-${h(ids)}`);
  for (const e of lot) {
    const f = d.entities?.[e.qid]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (f) fichier[e.nomScientifique] = f;
  }
}
// 1b. À défaut : image principale de l'article Wikipédia
const sans = especes.filter((e) => !fichier[e.nomScientifique]);
for (const lot of lots(sans, 40)) {
  const titres = lot.map((e) => e.wiki || e.nomScientifique).join('|');
  const d = await getJSON(api(WP, { action: 'query', prop: 'pageimages', piprop: 'name', titles: titres, redirects: '1' }), `wp-pi-${h(titres)}`);
  const parTitre = new Map();
  for (const p of d.query?.pages ?? []) if (p.pageimage) parTitre.set(p.title, p.pageimage);
  const alias = new Map([...(d.query?.normalized ?? []), ...(d.query?.redirects ?? [])].map((x) => [x.from, x.to]));
  for (const e of lot) {
    let t = e.wiki || e.nomScientifique;
    while (alias.has(t)) t = alias.get(t);
    if (parTitre.has(t)) fichier[e.nomScientifique] = parTitre.get(t);
  }
}
console.log(`${Object.keys(fichier).length}/${especes.length} espèces avec une image.`);

// 2. Auteur, licence, miniatures
const texte = (html) =>
  (html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const infos = {};
const noms = [...new Set(Object.values(fichier))];
for (const largeur of [330, 960]) {
  for (const lot of lots(noms, 50)) {
    const titres = lot.map((f) => `File:${f}`).join('|');
    const d = await getJSON(
      api(WP, { action: 'query', prop: 'imageinfo', titles: titres, iiprop: 'url|extmetadata', iiurlwidth: String(largeur), iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|Credit' }),
      `wp-ii-${largeur}-${h(titres)}`,
    );
    const alias = new Map((d.query?.normalized ?? []).map((x) => [x.to, x.from]));
    for (const p of d.query?.pages ?? []) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const nom = (alias.get(p.title) ?? p.title).replace(/^(File|Fichier):/, '');
      const cle = noms.find((f) => f.replace(/_/g, ' ') === nom.replace(/_/g, ' ')) ?? nom;
      const md = ii.extmetadata ?? {};
      const net = (u) => u.replace(/\?utm_.*$/, '');
      infos[cle] ??= {
        auteur: texte(md.Artist?.value) || texte(md.Credit?.value) || 'Auteur inconnu',
        licence: texte(md.LicenseShortName?.value) || 'Licence libre',
        licenceUrl: md.LicenseUrl?.value,
        source: ii.descriptionurl,
      };
      infos[cle][largeur === 330 ? 'miniature' : 'url'] = net(ii.thumburl || ii.url);
    }
  }
}

const photos = {};
for (const e of especes) {
  const f = fichier[e.nomScientifique];
  const i = f && infos[f];
  if (i?.url && i?.miniature) photos[e.nomScientifique] = { ...i, auteur: i.auteur.slice(0, 120) };
}
const manquantes = especes.filter((e) => !photos[e.nomScientifique]).map((e) => e.nom);
console.log(`photos.json : ${Object.keys(photos).length} photos.`, manquantes.length ? `Sans photo : ${manquantes.join(', ')}` : '');
writeFileSync(new URL('src/data/photos.json', ROOT), JSON.stringify({ genereLe: new Date().toISOString().slice(0, 10), photos }));
