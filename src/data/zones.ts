import type { Zone, ZoneId } from './types';

export const ZONES: Zone[] = [
  {
    id: 'idf',
    nom: 'Île-de-France',
    type: 'region',
    departements: ['75', '77', '78', '91', '92', '93', '94', '95'],
    region: 'Île-de-France',
    description:
      "Une région très urbanisée, mais riche en parcs, forêts domaniales (Fontainebleau, Rambouillet, Saint-Germain) et vallées humides (Seine, Marne, Oise). Les jardins et parcs parisiens accueillent déjà de nombreuses espèces.",
    sitesConseilles: [
      'Parcs et jardins publics (Buttes-Chaumont, bois de Vincennes et de Boulogne)',
      'Forêt de Fontainebleau',
      'Étangs et bases de loisirs (Saint-Quentin-en-Yvelines, Cergy)',
      'Bords de Seine et de Marne',
    ],
  },
  {
    id: 'var',
    nom: 'Var',
    type: 'departement',
    departements: ['83'],
    region: "Provence-Alpes-Côte d'Azur",
    description:
      "Un département méditerranéen contrasté : littoral et îles d'Hyères, salins, massif des Maures, garrigues et plaines viticoles. On y trouve des espèces typiquement méridionales absentes du nord de la France.",
    sitesConseilles: [
      "Salins d'Hyères (sentiers et observatoires aménagés)",
      'Étangs de Villepey (Fréjus)',
      'Plaine et massif des Maures',
      'Sentier du littoral et presqu’île de Giens',
    ],
  },
];

export const zoneById = (id: string): Zone | undefined => ZONES.find((z) => z.id === id);

export function zoneOfDepartement(code: string): ZoneId | undefined {
  return ZONES.find((z) => z.departements.includes(code))?.id;
}
