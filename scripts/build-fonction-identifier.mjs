// Génère supabase/functions/identifier/index.ts (fonction serveur Supabase) avec la liste
// des espèces de Birdex intégrée : un seul fichier à copier dans l'éditeur de Supabase.
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const gbif = JSON.parse(readFileSync(new URL('src/data/gbif.json', ROOT)));
const redactions = readFileSync(new URL('src/data/redactions.ts', ROOT), 'utf8');
// Noms français rédigés (prioritaires) : « nom: '…', nomScientifique: '…' »
const nomsRediges = new Map([...redactions.matchAll(/\n    nom: '([^']+)',\n    nomScientifique: '([^']+)'/g)].map((m) => [m[2], m[1]]));
const especes = gbif.especes
  .map((e) => [e.nomScientifique, (nomsRediges.get(e.nomScientifique) ?? e.nom).replace(/’/g, "'")])
  .sort((a, b) => a[0].localeCompare(b[0]));

const modele = readFileSync(new URL('supabase/functions/identifier/modele.ts', ROOT), 'utf8');
const sortie = modele.replace('/*__ESPECES__*/[]', JSON.stringify(especes));
writeFileSync(new URL('supabase/functions/identifier/index.ts', ROOT), sortie);
console.log(`index.ts : ${especes.length} espèces intégrées.`);
