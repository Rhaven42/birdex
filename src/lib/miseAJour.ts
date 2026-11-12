/** Fichier publié avec le site (GitHub Pages) qui annonce la dernière version du contenu. */
export interface Annonce {
  version: string;
  url: string;
  /** Numéro minimal de l'APK capable d'utiliser ce contenu (à augmenter si la partie Android change) */
  apkMin: number;
}

export type Decision = { action: 'rien' } | { action: 'telecharger' } | { action: 'nouvel-apk' };

/** Que faire au démarrage, selon la version en cours, l'annonce publiée et le numéro de l'APK installé ? */
export function decider(versionCourante: string, annonce: Annonce | null, apkInstalle: number): Decision {
  if (!annonce || !annonce.version || !annonce.url) return { action: 'rien' };
  if (annonce.version === versionCourante) return { action: 'rien' };
  if (apkInstalle < annonce.apkMin) return { action: 'nouvel-apk' };
  return { action: 'telecharger' };
}
