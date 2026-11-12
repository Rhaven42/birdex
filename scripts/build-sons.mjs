// Construit src/data/sons.json : une sélection d'enregistrements xeno-canto par espèce.
// La clé API (compte xeno-canto) est lue dans la variable d'environnement XC_KEY ;
// elle n'est jamais écrite dans le dépôt ni dans l'application.
//
// Usage :  XC_KEY=… node scripts/build-sons.mjs
// (sur GitHub : workflow « Sons xeno-canto », avec le secret XC_KEY du dépôt)

import { readFileSync, writeFileSync } from 'node:fs';
import { choisir } from './selection-sons.mjs';

const KEY = process.env.XC_KEY;
if (!KEY) {
  console.error('Variable XC_KEY manquante : clé API visible sur https://xeno-canto.org/account');
  process.exit(1);
}
const ROOT = new URL('..', import.meta.url);
const UA = 'BirdexDataBuilder/0.1 (open-source educational app; github.com/Rhaven42/birdex)';
const especes = JSON.parse(readFileSync(new URL('src/data/gbif.json', ROOT))).especes;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function chercher(query) {
  const url = `https://xeno-canto.org/api/3/recordings?query=${encodeURIComponent(query)}&per_page=100&key=${KEY}`;
  for (let essai = 0; ; essai++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.ok) return (await r.json()).recordings ?? [];
    if (r.status === 401) throw new Error('Clé xeno-canto refusée (401) : vérifiez le secret XC_KEY.');
    if ((r.status === 429 || r.status >= 500) && essai < 5) {
      await sleep(3000 * 2 ** essai);
      continue;
    }
    throw new Error(`xeno-canto ${r.status} pour ${query}`);
  }
}

// Noms employés par xeno-canto (référentiel IOC) quand ils diffèrent du référentiel GBIF.
const NOMS_XC = {
  'Aquila clanga': ['Clanga clanga'],
  'Aquila pomarina': ['Clanga pomarina'],
  'Phalacrocorax aristotelis': ['Gulosus aristotelis'],
  'Phylloscopus sibillatrix': ['Phylloscopus sibilatrix'],
  'Serinus citrinella': ['Carduelis citrinella'],
  'Serinus corsicanus': ['Carduelis corsicana'],
};

const sons = {};
let n = 0;
for (const e of especes) {
  let recs = [];
  for (const nom of [e.nomScientifique, ...(NOMS_XC[e.nomScientifique] ?? [])]) {
    const sp = `sp:"${nom}" grp:birds`;
    // Priorité aux enregistrements faits en France, puis en Europe, puis ailleurs (espèces introduites)
    recs = recs.concat(await chercher(`${sp} cnt:france`));
    if (choisir(recs).length < 2) recs = recs.concat(await chercher(`${sp} area:europe`));
    if (!choisir(recs).length) recs = recs.concat(await chercher(sp));
    if (choisir(recs).length >= 2) break;
  }
  const sel = choisir(recs);
  if (sel.length) sons[e.nomScientifique] = sel;
  if (++n % 25 === 0) console.log(`${n}/${especes.length} espèces traitées`);
  await sleep(400);
}

writeFileSync(new URL('src/data/sons.json', ROOT), JSON.stringify({ genereLe: new Date().toISOString().slice(0, 10), sons }));
console.log(`sons.json : ${Object.keys(sons).length} espèces avec enregistrements.`);
