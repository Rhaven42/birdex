// Construit src/data/sexes.json : une photo de mâle et une de femelle par espèce.
// Source : iNaturalist (observations de « qualité recherche » dont le sexe est annoté),
// photos sous licence libre ; auteur et licence conservés pour les crédits.
//
// Usage :  NODE_USE_ENV_PROXY=1 node scripts/build-sexes.mjs

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const CACHE = new URL('data-src/cache/', ROOT);
mkdirSync(CACHE, { recursive: true });
const UA = 'BirdexDataBuilder/0.1 (open-source educational app; github.com/Rhaven42/birdex)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LICENCES = ['cc0', 'cc-by', 'cc-by-sa', 'cc-by-nc', 'cc-by-nc-sa'];
const SEXE = { male: 11, femelle: 10 }; // valeurs de l'annotation « Sex » (term_id 9) sur iNaturalist
const EUROPE = 97391;
// Noms employés par iNaturalist quand ils diffèrent du référentiel GBIF
const NOMS = {
  'Aquila clanga': ['Clanga clanga'], 'Aquila pomarina': ['Clanga pomarina'],
  'Phalacrocorax aristotelis': ['Gulosus aristotelis'], 'Phylloscopus sibillatrix': ['Phylloscopus sibilatrix'],
  'Serinus citrinella': ['Carduelis citrinella'], 'Serinus corsicanus': ['Carduelis corsicana'],
};

async function getJSON(url, cle) {
  const f = new URL(cle + '.json', CACHE);
  if (existsSync(f)) return JSON.parse(readFileSync(f));
  for (let essai = 0; ; essai++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.ok) {
      const d = await r.json();
      writeFileSync(f, JSON.stringify(d));
      await sleep(1100);
      return d;
    }
    if ((r.status === 429 || r.status >= 500) && essai < 6) {
      await sleep(5000 * 2 ** essai);
      continue;
    }
    throw new Error(`${r.status} ${url}`);
  }
}

/** Valeur d'une annotation iNaturalist (ex. 1 = stade de vie, 22 = type de preuve), si elle n'est pas contestée. */
function valeurAnnotation(o, terme) {
  const a = (o.annotations ?? []).find((x) => x.controlled_attribute_id === terme && (x.vote_score ?? 0) >= 0);
  return a?.controlled_value_id;
}

function photoDe(obs) {
  for (const o of obs) {
    const ph = (o.photos ?? []).find((p) => LICENCES.includes(p.license_code));
    if (!ph) continue;
    return {
      url: ph.url.replace('/square.', '/medium.'),
      miniature: ph.url.replace('/square.', '/small.'),
      auteur: (ph.attribution ?? '').replace(/^\(c\)\s*/i, '').replace(/,\s*some rights reserved.*$/i, '').replace(/,\s*no rights reserved.*$/i, '').trim() || 'Auteur inconnu',
      licence: ph.license_code.toUpperCase().replace('CC-', 'CC ').replace(/-/g, '-'),
      source: `https://www.inaturalist.org/observations/${o.id}`,
    };
  }
  return undefined;
}

const especes = JSON.parse(readFileSync(new URL('src/data/gbif.json', ROOT))).especes;
const sortie = {};
let n = 0;
for (const e of especes) {
  const res = {};
  for (const [sexe, valeur] of Object.entries(SEXE)) {
    for (const nom of [e.nomScientifique, ...(NOMS[e.nomScientifique] ?? [])]) {
      for (const place of [EUROPE, null]) {
        const q = new URLSearchParams({
          taxon_name: nom, term_id: '9', term_value_id: String(valeur), quality_grade: 'research',
          photo_license: LICENCES.join(','), order_by: 'votes', per_page: '30',
          ...(place ? { place_id: String(place) } : {}),
        });
        const d = await getJSON(`https://api.inaturalist.org/v1/observations?${q}`, `inat30-${sexe}-${nom.replace(/\W+/g, '_')}-${place ?? 'monde'}`);
        // n'accepter que l'espèce demandée (ou une de ses sous-espèces)
        const obs = (d.results ?? [])
          .filter((o) => o.taxon?.name === nom || o.taxon?.name?.startsWith(nom + ' '))
          // Oiseau adulte, et l'oiseau lui-même (pas un nid, des œufs, des plumes ou des poussins)
          .filter((o) => valeurAnnotation(o, 1) === 2) // Life Stage = Adult
          .filter((o) => [undefined, 24].includes(valeurAnnotation(o, 22))); // Evidence of Presence = Organism (ou non précisé)
        res[sexe] = photoDe(obs);
        if (res[sexe]) break;
      }
      if (res[sexe]) break;
    }
  }
  if (res.male && res.femelle) sortie[e.nomScientifique] = res;
  if (++n % 25 === 0) console.log(`${n}/${especes.length}`);
}
writeFileSync(new URL('src/data/sexes.json', ROOT), JSON.stringify({ genereLe: new Date().toISOString().slice(0, 10), sexes: sortie }));
console.log(`sexes.json : ${Object.keys(sortie).length} espèces avec une photo de mâle ET de femelle.`);
