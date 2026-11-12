// Modèle de données (cf. cahier des charges §5.2)

export type ZoneId = 'idf' | 'var';

/** Statut de présence dans une zone donnée */
export type StatutPresence = 'sedentaire' | 'nicheur' | 'hivernant' | 'passage';
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

export type CategorieListeRouge = 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'NA';
export type Difficulte = 'facile' | 'moyen' | 'difficile';

export interface Presence {
  zone: ZoneId;
  statut: StatutPresence;
  abondance: Abondance;
  /** Mois de présence (1 = janvier … 12 = décembre) */
  mois: number[];
}

export interface Espece {
  id: string;
  nom: string;
  nomScientifique: string;
  famille: string;
  /** Longueur en cm */
  taille: string;
  /** Envergure en cm */
  envergure: string;
  description: string;
  signes: string[];
  confusions: string;
  milieux: Milieu[];
  habitat: string;
  alimentation: string;
  comportement: string;
  reproduction: string;
  /** Statut général en France : sédentaire, migrateur… */
  statutMigratoire: string;
  conservation: {
    /** Liste rouge des oiseaux nicheurs de France métropolitaine (2016) */
    listeRouge: CategorieListeRouge;
    protege: boolean;
  };
  difficulte: Difficulte;
  /** Espèce sensible : aucune localisation précise ne doit être affichée */
  sensible?: boolean;
  nocturne?: boolean;
  /** Titre de l'article Wikipédia (fr) utilisé pour récupérer la photo */
  wiki: string;
  presence: Presence[];
}

export interface Zone {
  id: ZoneId;
  nom: string;
  type: 'region' | 'departement';
  /** Codes INSEE des départements couverts */
  departements: string[];
  /** Région administrative parente (affichage) */
  region: string;
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
