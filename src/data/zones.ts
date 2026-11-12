import geo from './geo.json';
import gbif from './gbif.json';
import type { Zone, ZoneId } from './types';

/** Présentation des régions : géographie et grands sites ornithologiques reconnus. */
const TEXTES: Record<string, Pick<Zone, 'description' | 'sitesConseilles'>> = {
  idf: {
    description:
      'Une région très urbanisée, mais riche en parcs, forêts domaniales (Fontainebleau, Rambouillet, Saint-Germain) et vallées humides (Seine, Marne, Oise).',
    sitesConseilles: ['Bois de Vincennes et de Boulogne, parcs parisiens', 'Forêt de Fontainebleau', 'Étangs de Saint-Quentin-en-Yvelines', 'Bords de Seine et de Marne'],
  },
  cvl: {
    description: 'La vallée de la Loire et ses bancs de sable, les étangs de la Brenne et de la Sologne, et de grandes forêts comme celle d’Orléans.',
    sitesConseilles: ['Parc naturel régional de la Brenne', 'Val de Loire (îles et grèves)', 'Sologne', 'Forêt d’Orléans'],
  },
  bfc: {
    description: 'Du massif du Jura aux prairies inondables de la Saône, en passant par le Morvan et les plateaux calcaires de Bourgogne.',
    sitesConseilles: ['Massif du Jura', 'Val de Saône', 'Parc naturel régional du Morvan'],
  },
  normandie: {
    description: 'Un long littoral de falaises et d’estuaires, des marais arrière-littoraux et un bocage encore étendu.',
    sitesConseilles: ['Estuaire de la Seine', 'Marais du Cotentin et du Bessin', 'Baie du Mont-Saint-Michel', 'Baie des Veys'],
  },
  hdf: {
    description: 'Un littoral de baies et de caps sur le grand couloir de migration de la Manche, des marais et de grandes forêts.',
    sitesConseilles: ['Baie de Somme et parc du Marquenterre', 'Cap Gris-Nez', 'Marais audomarois', 'Forêts de Compiègne et de Saint-Gobain'],
  },
  'grand-est': {
    description: 'Grands lacs-réservoirs de Champagne, massif des Vosges, plaine d’Alsace et vallée du Rhin.',
    sitesConseilles: ['Lac du Der-Chantecoq (grues cendrées)', 'Massif des Vosges', 'Bande rhénane et ried alsacien', 'Lacs de la forêt d’Orient'],
  },
  pdl: {
    description: 'Estuaire de la Loire, grands marais de l’Ouest, lac de Grand-Lieu et côte vendéenne.',
    sitesConseilles: ['Lac de Grand-Lieu', 'Estuaire de la Loire', 'Marais breton et Marais poitevin', 'Baie de Bourgneuf'],
  },
  bretagne: {
    description: 'Côtes rocheuses et îles accueillant de grandes colonies d’oiseaux marins, golfes et baies riches en limicoles.',
    sitesConseilles: ['Réserve naturelle des Sept-Îles', 'Golfe du Morbihan', 'Baie de Saint-Brieuc', 'Cap Sizun'],
  },
  'nouvelle-aquitaine': {
    description: 'Du bassin d’Arcachon aux Pyrénées, des marais charentais au Limousin : une région très variée, traversée par d’importants flux migratoires.',
    sitesConseilles: ['Bassin d’Arcachon et parc ornithologique du Teich', 'Réserve de Moëze-Oléron', 'Cols basques (migration d’automne)', 'Marais poitevin'],
  },
  occitanie: {
    description: 'Étangs littoraux du Languedoc, causses et gorges des Cévennes, et chaîne des Pyrénées.',
    sitesConseilles: ['Étangs et salins du littoral languedocien', 'Gorges du Tarn et de la Jonte (vautours)', 'Pyrénées', 'Montagne Noire et Corbières'],
  },
  ara: {
    description: 'Des étangs de la Dombes aux massifs alpins, en passant par le Massif central et le val d’Allier.',
    sitesConseilles: ['Étangs de la Dombes', 'Parcs nationaux de la Vanoise et des Écrins', 'Val d’Allier', 'Monts d’Auvergne'],
  },
  paca: {
    description:
      'Camargue, plaine de la Crau, littoral et îles d’Hyères, gorges du Verdon et Alpes du Sud : une grande diversité d’espèces méditerranéennes et montagnardes.',
    sitesConseilles: ['Camargue', 'Plaine de la Crau', 'Salins d’Hyères', 'Gorges du Verdon', 'Parc national du Mercantour'],
  },
  corse: {
    description: 'Une île montagneuse aux espèces uniques en France, comme la Sittelle corse, avec des côtes sauvages et des étangs littoraux.',
    sitesConseilles: ['Réserve naturelle de Scandola', 'Étang de Biguglia', 'Forêts de pins laricio', 'Bouches de Bonifacio'],
  },
};

export const ZONES: Zone[] = gbif.regions
  .map((r) => ({
    id: r.id,
    nom: r.nom,
    code: r.code,
    departements: geo.departements.filter((d) => d.region === r.code).map((d) => d.code),
    ...(TEXTES[r.id] ?? { description: '', sitesConseilles: [] }),
  }))
  .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

export const zoneById = (id: string): Zone | undefined => ZONES.find((z) => z.id === id);

export function zoneOfDepartement(code: string): ZoneId | undefined {
  return ZONES.find((z) => z.departements.includes(code))?.id;
}

export const zoneOfRegionCode = (code: string): ZoneId | undefined => ZONES.find((z) => z.code === code)?.id;
