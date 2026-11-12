// Construit src/data/gbif.json à partir de sources vérifiables :
//  - GBIF (gbif.org) : observations d'oiseaux en France métropolitaine, 2015–2025,
//    agrégées par région administrative (GADM niveau 1) et par mois ;
//  - Wikidata : nom français, taille, envergure, statut UICN mondial, article Wikipédia.
//
// Usage :  NODE_USE_ENV_PROXY=1 node scripts/build-birds.mjs
// Les réponses brutes sont mises en cache dans data-src/cache (relancer = sans réseau).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const h = (x) => createHash('sha1').update(x).digest('hex').slice(0, 12);

const ROOT = new URL('..', import.meta.url);
const CACHE = new URL('data-src/cache/', ROOT);
mkdirSync(CACHE, { recursive: true });
const UA = 'BirdexDataBuilder/0.1 (open-source educational app; github.com/Rhaven42/birdex)';
const ANNEES = '2015,2025';
const AVES = 212; // classe Aves dans le référentiel GBIF

// ───────────── utilitaires ─────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJSON(url, { cle, pause = 0 } = {}) {
  const f = cle ? new URL(cle + '.json', CACHE) : null;
  if (f && existsSync(f)) return JSON.parse(readFileSync(f));
  for (let essai = 0; ; essai++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (r.ok) {
      const d = await r.json();
      if (f) writeFileSync(f, JSON.stringify(d));
      if (pause) await sleep(pause);
      return d;
    }
    if ((r.status === 429 || r.status >= 500) && essai < 6) {
      await sleep(Math.max(Number(r.headers.get('retry-after') || 0) * 1000, 3000 * 2 ** essai));
      continue;
    }
    throw new Error(`${r.status} ${url}`);
  }
}
async function parLots(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").toLowerCase().trim();
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ───────────── 1. Régions ─────────────
const geo = JSON.parse(readFileSync(new URL('src/data/geo.json', ROOT)));
const gadm = await getJSON('https://api.gbif.org/v1/geocode/gadm/FRA/subdivisions', { cle: 'gadm-fra' });
const ID_COURT = {
  'Île-de-France': 'idf', 'Provence-Alpes-Côte d\'Azur': 'paca', 'Auvergne-Rhône-Alpes': 'ara',
  'Bourgogne-Franche-Comté': 'bfc', 'Bretagne': 'bretagne', 'Centre-Val de Loire': 'cvl', 'Corse': 'corse',
  'Grand Est': 'grand-est', 'Hauts-de-France': 'hdf', 'Normandie': 'normandie', 'Nouvelle-Aquitaine': 'nouvelle-aquitaine',
  'Occitanie': 'occitanie', 'Pays de la Loire': 'pdl',
};
const REGIONS = geo.regions.map((r) => {
  const g = gadm.find((x) => norm(x.name) === norm(r.nom));
  if (!g) throw new Error(`Région GADM introuvable : ${r.nom}`);
  if (!ID_COURT[r.nom]) throw new Error(`Identifiant manquant : ${r.nom}`);
  return { id: ID_COURT[r.nom], code: r.code, nom: r.nom, gid: g.id };
});
console.log(`${REGIONS.length} régions :`, REGIONS.map((r) => `${r.id}=${r.gid}`).join(' '));

// ───────────── 2. Comptages GBIF région × mois × espèce ─────────────
const base = `https://api.gbif.org/v1/occurrence/search?taxonKey=${AVES}&year=${ANNEES}&occurrenceStatus=PRESENT&limit=0&facet=speciesKey&facetLimit=3000`;
const taches = REGIONS.flatMap((r) => Array.from({ length: 12 }, (_, i) => ({ r, m: i + 1 })));
const comptages = {}; // comptages[region][mois] = { total, especes: {key: n} }
await parLots(taches, 4, async ({ r, m }) => {
  const d = await getJSON(`${base}&gadmGid=${r.gid}&month=${m}`, { cle: `gbif-${r.gid}-${m}` });
  comptages[r.id] ??= {};
  comptages[r.id][m] = { total: d.count, especes: Object.fromEntries(d.facets[0].counts.map((c) => [c.name, c.count])) };
});
// Comptages par année : une espèce n'est « régulière » dans une région que si elle y est notée la plupart des années
// (évite qu'un seul oiseau égaré, observé par des centaines de personnes, apparaisse comme présent).
const LES_ANNEES = Array.from({ length: 11 }, (_, i) => 2015 + i);
const annees = {}; // annees[region][annee] = {key: n}
const baseAn = `https://api.gbif.org/v1/occurrence/search?taxonKey=${AVES}&occurrenceStatus=PRESENT&limit=0&facet=speciesKey&facetLimit=3000`;
await parLots(REGIONS.flatMap((r) => LES_ANNEES.map((a) => ({ r, a }))), 4, async ({ r, a }) => {
  const d = await getJSON(`${baseAn}&gadmGid=${r.gid}&year=${a}`, { cle: `gbif-an-${r.gid}-${a}` });
  annees[r.id] ??= {};
  annees[r.id][a] = Object.fromEntries(d.facets[0].counts.map((c) => [c.name, c.count]));
});
console.log('Comptages GBIF chargés.');

// ───────────── 3. Taxonomie GBIF et fusion des synonymes ─────────────
// Le référentiel GBIF garde parfois l'ancien et le nouveau nom d'une même espèce comme deux
// clés distinctes : on additionne leurs observations sous le nom actuel.
const SYNONYMES = {
  'Parus montanus': 'Poecile montanus',
  'Sylvia melanocephala': 'Curruca melanocephala',
  'Sylvia subalpina': 'Curruca subalpina',
  'Sylvia cantillans': 'Curruca iberiae', // « Fauvette passerinette » au sens large
  'Sylvia communis': 'Curruca communis',
  'Sylvia curruca': 'Curruca curruca',
  'Sylvia hortensis': 'Curruca hortensis',
  'Sylvia undata': 'Curruca undata',
  'Sylvia sarda': 'Curruca sarda',
  'Sylvia conspicillata': 'Curruca conspicillata',
  'Saxicola torquatus': 'Saxicola rubicola', // anciennes données : le Tarier pâtre était rattaché à S. torquatus
  'Oceanodroma leucorhoa': 'Hydrobates leucorhous',
  'Carduelis citrinella': 'Serinus citrinella',
  'Carduelis corsicana': 'Serinus corsicanus',
  'Puffinus gravis': 'Ardenna gravis',
  'Puffinus griseus': 'Ardenna grisea',
  'Calidris falcinellus': 'Calidris falcinellus',
  'Porzana parva': 'Zapornia parva',
  'Porzana pusilla': 'Zapornia pusilla',
};
// Espèces rares mais régulières en France (indigènes, non « erratiques » d'après la liste de la
// Commission de l'avifaune française / liste rouge UICN France) : peu observées, souvent un ou deux
// mois par an seulement. Seuils assouplis, mais toujours notées au moins 5 années sur 11 dans la région.
const RARES_REGULIERES = new Set([
  'Anser fabalis', 'Zapornia parva', 'Zapornia pusilla', 'Stercorarius longicaudus', 'Phylloscopus ibericus',
  'Acrocephalus paludicola', 'Larus hyperboreus', 'Alle alle', 'Buteo lagopus', 'Chlidonias leucopterus',
  'Carpodacus erythrinus', 'Emberiza melanocephala', 'Passer hispaniolensis', 'Anthus cervinus', 'Microcarbo pygmaeus',
]);
// Parmi elles, celles qui nichent en France (statut « nicheur » de la liste rouge UICN France) ;
// les autres, vues seulement quelques semaines au printemps ou en été, sont des migratrices de passage.
const RARES_NICHEUSES = new Set(['Zapornia parva', 'Zapornia pusilla', 'Phylloscopus ibericus', 'Carpodacus erythrinus', 'Emberiza melanocephala', 'Passer hispaniolensis']);
// Oiseaux échappés de captivité, domestiques ou relâchés, non installés durablement en France.
const EXCLUES = new Set([
  'Anas bahamensis', 'Phoenicopterus ruber', 'Phoeniconaias minor', 'Callipepla californica', 'Aix sponsa',
  'Euodice malabarica', 'Anser cygnoides', 'Anser indicus', 'Pavo cristatus', 'Psittacula eupatria',
  'Streptopelia roseogrisea', 'Syrmaticus reevesii', 'Pelecanus rufescens', 'Cairina moschata',
  'Anas platyrhynchos domesticus', 'Columba livia domestica',
]);
// Espèces introduites par l'homme et installées à l'état sauvage (signalées dans l'application).
const INTRODUITES = new Set([
  'Branta canadensis', 'Aix galericulata', 'Cygnus atratus', 'Alopochen aegyptiaca', 'Threskiornis aethiopicus',
  'Psittacula krameri', 'Myiopsitta monachus', 'Oxyura jamaicensis', 'Leiothrix lutea', 'Phasianus colchicus',
  'Tadorna ferruginea',
]);

const toutesCles = [...new Set(REGIONS.flatMap((r) => Object.values(comptages[r.id]).flatMap((x) => Object.keys(x.especes))))];
const totalNational = (k) => REGIONS.reduce((a, r) => a + Object.values(comptages[r.id]).reduce((b, x) => b + (x.especes[k] ?? 0), 0), 0);
const candidates = toutesCles.filter((k) => totalNational(k) >= 20);
const taxo = {};
await parLots(candidates, 6, async (k) => {
  const d = await getJSON(`https://api.gbif.org/v1/species/${k}`, { cle: `sp-${k}` });
  taxo[k] = { sci: d.canonicalName, famille: d.family, ordre: d.order, rang: d.rank };
});
const groupes = new Map(); // nom scientifique actuel → clés GBIF
for (const k of candidates) {
  const t = taxo[k];
  if (t.rang !== 'SPECIES') continue;
  const sci = SYNONYMES[t.sci] ?? t.sci;
  if (EXCLUES.has(sci)) continue;
  if (!groupes.has(sci)) groupes.set(sci, []);
  groupes.get(sci).push(k);
}

// ───────────── 4. Présence par région ─────────────
// Part de l'espèce dans les observations du mois (corrige l'effort d'observation inégal selon les mois).
const MIN_ANNUEL = 40; // observations sur 2015–2025 dans la région
const PART_MIN = 5e-5; // 0,005 % des observations d'oiseaux de la région
const MIN_MOIS = 3; // présent au moins 3 mois → exclut la plupart des oiseaux égarés
const MIN_ANNEES = 5; // noté (≥ 3 observations) au moins 5 années sur 11

function presence(cles, region, souple = false) {
  const c = comptages[region.id];
  const n = Array.from({ length: 12 }, (_, i) => cles.reduce((a, k) => a + (c[i + 1].especes[k] ?? 0), 0));
  const parts = n.map((x, i) => x / c[i + 1].total);
  const annuel = n.reduce((a, b) => a + b, 0);
  const totalRegion = Object.values(c).reduce((a, x) => a + x.total, 0);
  const pic = Math.max(...parts);
  if (souple ? annuel < 15 : annuel < MIN_ANNUEL || annuel / totalRegion < PART_MIN) return null;
  const nbAnnees = LES_ANNEES.filter((a) => cles.reduce((x, k) => x + (annees[region.id][a][k] ?? 0), 0) >= 3).length;
  if (nbAnnees < MIN_ANNEES) return null;
  // Un mois compte si l'espèce y atteint au moins 20 % de sa fréquence maximale, avec 5 observations minimum.
  const mois = parts.map((p, i) => (p >= 0.2 * pic && n[i] >= (souple ? 2 : 5) ? i + 1 : 0)).filter(Boolean);
  if (mois.length < (souple ? 1 : MIN_MOIS)) return null;
  const has = (...ms) => ms.some((m) => mois.includes(m));
  let statut;
  if (mois.length >= 10 || (has(6) && has(1))) statut = 'sedentaire';
  else if (has(5, 6, 7) && !has(12, 1)) statut = 'estivant';
  else if (has(12, 1) && !has(5, 6, 7)) statut = 'hivernant';
  else statut = 'passage';
  // Abondance : fréquence relative au pic, pondérée par la régularité (présente presque chaque année ?)
  let abondance = pic >= 2e-3 ? 'commune' : pic >= 3e-4 ? 'peu-commune' : 'rare';
  if (nbAnnees < 9 && abondance === 'commune') abondance = 'peu-commune';
  if (nbAnnees < 7) abondance = 'rare';
  if (souple && abondance === 'commune') abondance = 'peu-commune';
  // Indice mensuel 0–100 (pour la carte animée par mois)
  const indice = parts.map((p) => Math.round((p / pic) * 100));
  return { zone: region.id, statut, abondance, mois, observations: annuel, annees: nbAnnees, indice };
}

const retenues = [];
for (const [sci, cles] of groupes) {
  const souple = RARES_REGULIERES.has(sci);
  const pres = REGIONS.map((r) => presence(cles, r, souple)).filter(Boolean);
  if (souple && !RARES_NICHEUSES.has(sci)) for (const p of pres) if (p.statut === 'estivant') p.statut = 'passage';
  if (!pres.length) continue;
  // Oiseau égaré : uniquement « rare », dans une ou deux régions → écarté
  if (!souple && pres.length <= 2 && pres.every((p) => p.abondance === 'rare')) continue;
  const principale = cles.find((k) => taxo[k].sci === sci) ?? cles.sort((x, y) => totalNational(y) - totalNational(x))[0];
  retenues.push({ key: principale, cles, sci, famille: taxo[principale].famille, ordre: taxo[principale].ordre, rang: 'SPECIES', presence: pres });
}
console.log(`${toutesCles.length} taxons observés, ${groupes.size} espèces après fusion, ${retenues.length} retenues.`);

// ───────────── 5. Wikidata (séquentiel, poli) ─────────────
const IUCN = { Q211005: 'LC', Q719675: 'NT', Q278113: 'VU', Q11394: 'EN', Q219127: 'CR', Q3245245: 'DD', Q237350: 'EX' };
const UNITES = { Q174728: 1, Q11573: 100, Q174789: 0.1 }; // cm, m, mm → cm
function quantites(claims, p) {
  return (claims?.[p] ?? [])
    .map((c) => c.mainsnak?.datavalue?.value)
    .filter(Boolean)
    .map((v) => Number(v.amount) * (UNITES[v.unit.split('/').pop()] ?? NaN))
    .filter((x) => Number.isFinite(x) && x > 0);
}
const fourchette = (xs) => {
  if (!xs.length) return undefined;
  const a = Math.round(Math.min(...xs));
  const b = Math.round(Math.max(...xs));
  return a === b ? `${a}` : `${a}–${b}`;
};
// Recherche groupée : 40 identifiants GBIF par requête (haswbstatement avec « | » = OU).
const toutes = retenues.flatMap((s) => s.cles.map((k) => ({ k, s })));
const lots = [];
for (let i = 0; i < toutes.length; i += 40) lots.push(toutes.slice(i, i + 40));
const parCle = new Map(toutes.map(({ k, s }) => [String(k), s]));
for (const [i, lot] of lots.entries()) {
  const q = 'haswbstatement:' + lot.map(({ k }) => `P846=${k}`).join('|');
  const r = await getJSON(
    `https://www.wikidata.org/w/api.php?action=query&list=search&srlimit=100&srsearch=${encodeURIComponent(q)}&format=json`,
    { cle: `wds-lot-${h(q)}`, pause: 1500 },
  );
  const qids = r.query.search.map((x) => x.title);
  for (let j = 0; j < qids.length; j += 50) {
    const ents = (
      await getJSON(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qids.slice(j, j + 50).join('|')}&props=labels|claims|sitelinks&languages=fr&sitefilter=frwiki&format=json`,
        { cle: `wde-lot-${h(qids.slice(j, j + 50).join('|'))}`, pause: 1500 },
      )
    ).entities;
    for (const [qid, e] of Object.entries(ents)) {
      for (const c of e.claims?.P846 ?? []) {
        const s = parCle.get(String(c.mainsnak?.datavalue?.value));
        if (!s || s.qid) continue;
        s.qid = qid;
        s.fr = e.labels?.fr?.value;
        s.wiki = e.sitelinks?.frwiki?.title;
        s.iucn = IUCN[e.claims?.P141?.[0]?.mainsnak?.datavalue?.value?.id];
        s.taille = fourchette(quantites(e.claims, 'P2043'));
        s.envergure = fourchette(quantites(e.claims, 'P2050'));
      }
    }
  }
  console.log(`Wikidata : lot ${i + 1}/${lots.length}`);
}

// Cas ambigus : nom normalisé choisi parmi les noms vernaculaires proposés par GBIF.
const NOMS_FR = {
  'Bubulcus ibis': 'Héron garde-bœufs',
  'Hydrobates leucorhous': 'Océanite cul-blanc',
  'Muscicapa tyrrhenica': 'Gobemouche tyrrhénien, Gobemouche méditerranéen',
};
// ───────────── 5 bis. Noms français manquants : noms vernaculaires GBIF ─────────────
const latin = (s) => !s.fr || norm(s.fr) === norm(s.sci) || s.cles.some((k) => norm(s.fr) === norm(taxo[k].sci)) || Object.values(taxo).some((t) => t.sci && norm(t.sci) === norm(s.fr));
for (const s of retenues.filter(latin)) {
  const noms = new Map();
  for (const k of s.cles) {
    const v = await getJSON(`https://api.gbif.org/v1/species/${k}/vernacularNames?limit=200`, { cle: `vn-${k}` });
    for (const x of v.results.filter((x) => x.language === 'fra')) {
      const nom = x.vernacularName.trim();
      noms.set(nom, (noms.get(nom) ?? 0) + 1);
    }
  }
  const tri = [...noms].sort((a, b) => b[1] - a[1] || Number(a[0].includes(',')) - Number(b[0].includes(',')));
  console.log(`  ${s.sci} : ${tri.map(([n, c]) => `${n} (${c})`).join(' | ') || 'aucun'}`);
  s.fr = NOMS_FR[s.sci] ?? tri[0]?.[0];
  if (NOMS_FR[s.sci] && !noms.has(NOMS_FR[s.sci])) throw new Error(`Nom imposé absent des noms GBIF : ${s.sci}`);
}

// ───────────── 6. Export ─────────────
const sans = retenues.filter((s) => !s.fr);
if (sans.length) console.log('Sans nom français (exclues) :', sans.map((s) => s.sci).join(', '));
const especes = retenues
  .filter((s) => s.fr && s.rang === 'SPECIES')
  .map((s) => ({
    key: Number(s.key),
    id: slug(s.fr),
    nom: nettoyerNom(s),
    nomScientifique: s.sci,
    famille: s.famille,
    ordre: s.ordre,
    taille: s.taille,
    envergure: s.envergure,
    iucn: s.iucn,
    wiki: s.wiki,
    qid: s.qid,
    introduite: INTRODUITES.has(s.sci) || undefined,
    presence: s.presence,
  }))
  .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

function nettoyerNom(s) {
  let n = s.fr.split(',')[0].trim();
  if (s.sci === 'Muscicapa tyrrhenica') n = 'Gobemouche tyrrhénien';
  return n.charAt(0).toUpperCase() + n.slice(1);
}
const ids = new Set();
for (const e of especes) {
  if (ids.has(e.id)) e.id = `${e.id}-${slug(e.nomScientifique)}`;
  ids.add(e.id);
}

writeFileSync(
  new URL('src/data/gbif.json', ROOT),
  JSON.stringify({
    genereLe: new Date().toISOString().slice(0, 10),
    periode: ANNEES.replace(',', '–'),
    criteres: { MIN_ANNUEL, PART_MIN, MIN_MOIS, MIN_ANNEES },
    regions: REGIONS,
    especes,
  }),
);
console.log(`gbif.json : ${especes.length} espèces, ${REGIONS.length} régions.`);
