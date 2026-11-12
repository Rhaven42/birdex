// Modèle de données (cf. cahier des charges §5.2)

/** Identifiant de région (ex. 'idf', 'paca', 'bretagne') */
export type ZoneId = string;

/** Statut de présence dans une zone donnée */
export type StatutPresence = 'sedentaire' | 'estivant' | 'hivernant' | 'passage';
export type Abondance = 'commune' | 'peu-commune' | 'rare';

export type Milieu =
  | 'jardin'
  | 'ville'
  | 'foret'
  | 'campagne'
  | 'zone-humide'
  | 'littoral'
  | 'mer'
  | 'garrigue'
  | 'falaise';

export type CategorieUICN = 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'DD' | 'EX';
export type Difficulte = 'facile' | 'moyen' | 'difficile';

export interface Presence {
  zone: ZoneId;
  statut: StatutPresence;
  abondance: Abondance;
  /** Mois de présence (1 = janvier … 12 = décembre) */
  mois: number[];
  /** Indice de fréquence mensuel 0–100 (100 = mois où l'espèce est la plus notée) */
  indice: number[];
  /** Nombre d'observations GBIF dans la région (2015–2025) */
  observations: number;
  /** Nombre d'années (sur 11) où l'espèce a été notée dans la région */
  annees: number;
}

/** Contenu rédigé à la main (fiches enrichies). */
export interface Redaction {
  id: string;
  nom: string;
  nomScientifique: string;
  taille: string;
  envergure: string;
  description: string;
  signes: string[];
  confusions: string;
  milieux: Milieu[];
  habitat: string;
  alimentation: string;
  comportement: string;
  reproduction: string;
  statutMigratoire: string;
  protege: boolean;
  difficulte: Difficulte;
  sensible?: boolean;
  nocturne?: boolean;
  wiki: string;
}

export interface Espece extends Partial<Omit<Redaction, 'id' | 'nom' | 'nomScientifique' | 'milieux' | 'signes'>> {
  id: string;
  nom: string;
  nomScientifique: string;
  /** Famille (nom scientifique, référentiel GBIF) */
  famille: string;
  ordre: string;
  milieux: Milieu[];
  signes: string[];
  /** Statut mondial UICN (Wikidata) */
  uicn?: CategorieUICN;
  introduite?: boolean;
  /** Fiche enrichie rédigée à la main */
  redigee: boolean;
  /** Clé du taxon dans GBIF (lien vers la carte des observations) */
  gbif: number;
  qid?: string;
  presence: Presence[];
}

export interface Zone {
  id: ZoneId;
  nom: string;
  /** Code INSEE de la région */
  code: string;
  /** Codes INSEE des départements couverts */
  departements: string[];
  description: string;
  sitesConseilles: string[];
}

export interface Observation {
  id: string;
  especeId: string;
  date: string; // AAAA-MM-JJ
  zone: ZoneId | 'autre';
  lieu: string; // commune ou lieu-dit, volontairement approximatif
  note: string;
  photo?: string; // data URL réduite
  validation: 'manuelle' | 'ia';
  creeLe: string;
}
