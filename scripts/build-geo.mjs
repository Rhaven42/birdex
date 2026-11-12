// Convertit les contours GeoJSON (france-geojson, Licence Ouverte) en tracés SVG compacts.
// Projection simple adaptée à la France métropolitaine : x = lon·cos(46.5°), y = -lat.
import { readFileSync, writeFileSync } from 'node:fs';

const K = Math.cos((46.5 * Math.PI) / 180);
const W = 1000;
const load = (f) => JSON.parse(readFileSync(new URL(`../geo-src/${f}`, import.meta.url)));
const deps = load('departements-version-simplifiee.geojson');
const regs = load('regions-version-simplifiee.geojson');

const rings = (g) => (g.type === 'Polygon' ? g.coordinates : g.coordinates.flat());
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const f of deps.features)
  for (const r of rings(f.geometry))
    for (const [lon, lat] of r) {
      const x = lon * K, y = -lat;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
const s = W / (maxX - minX);
const H = Math.round((maxY - minY) * s);
const P = (lon, lat) => [((lon * K - minX) * s).toFixed(1), ((-lat - minY) * s).toFixed(1)];

function toPath(g) {
  return rings(g)
    .map((r) => {
      const pts = r.map(([a, b]) => P(a, b));
      const out = [];
      let prev = '';
      for (const [x, y] of pts) {
        const k = `${x},${y}`;
        if (k !== prev) out.push(k);
        prev = k;
      }
      return 'M' + out.join('L') + 'Z';
    })
    .join('');
}
function bbox(g) {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const r of rings(g)) for (const [lon, lat] of r) {
    const [x, y] = P(lon, lat).map(Number);
    a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y);
  }
  return [Math.round(a), Math.round(b), Math.round(c - a), Math.round(d - b)];
}

// Rattache chaque département à sa région : point intérieur du département testé dans les polygones régionaux.
function dansAnneau(pt, r) {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const dansGeom = (pt, g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).some((poly) => dansAnneau(pt, poly[0]) && !poly.slice(1).some((h) => dansAnneau(pt, h)));
function regionDe(f) {
  // On teste plusieurs sommets du contour : la région majoritaire l'emporte (frontières simplifiées).
  const votes = {};
  const r0 = rings(f.geometry)[0];
  const pas = Math.max(1, Math.floor(r0.length / 40));
  for (let i = 0; i < r0.length; i += pas) {
    const [x, y] = r0[i];
    const [cx, cy] = r0.reduce(([a, b], [p, q]) => [a + p / r0.length, b + q / r0.length], [0, 0]);
    const pt = [x + (cx - x) * 0.15, y + (cy - y) * 0.15]; // légèrement vers l'intérieur
    const reg = regs.features.find((g) => dansGeom(pt, g.geometry));
    if (reg) votes[reg.properties.code] = (votes[reg.properties.code] ?? 0) + 1;
  }
  const best = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  if (!best) throw new Error(`Région introuvable pour ${f.properties.nom}`);
  return best[0];
}

const out = {
  width: W,
  height: H,
  departements: deps.features
    .map((f) => ({ code: f.properties.code, nom: f.properties.nom, region: regionDe(f), d: toPath(f.geometry), bbox: bbox(f.geometry) }))
    .sort((a, b) => a.code.localeCompare(b.code)),
  regions: regs.features.map((f) => ({ code: f.properties.code, nom: f.properties.nom, d: toPath(f.geometry), bbox: bbox(f.geometry) })),
};
writeFileSync(new URL('../src/data/geo.json', import.meta.url), JSON.stringify(out));
console.log(`geo.json : ${out.departements.length} départements, ${out.regions.length} régions, ${W}x${H}`);
