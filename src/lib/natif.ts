import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { CapacitorUpdater, type BundleInfo } from '@capgo/capacitor-updater';
import { decider, type Annonce } from './miseAJour';

const ANNONCE = 'https://rhaven42.github.io/birdex/mise-a-jour.json';
export const PAGE_APK = 'https://github.com/Rhaven42/birdex/releases/latest';

/** Prévenu si un nouvel APK est nécessaire (changement de la partie Android). */
export const nouvelApk = { disponible: false, abonnes: new Set<() => void>() };

/** État visible de la mise à jour (bandeau en haut et page « Mon compte »). */
export type StatutMaj = 'inconnu' | 'recherche' | 'telechargement' | 'prete' | 'a-jour' | 'nouvel-apk' | 'erreur';
export const etatMaj: { statut: StatutMaj; message?: string; abonnes: Set<() => void> } = { statut: 'inconnu', abonnes: new Set() };
function changerEtat(statut: StatutMaj, message?: string) {
  etatMaj.statut = statut;
  etatMaj.message = message;
  etatMaj.abonnes.forEach((f) => f());
}

/** Réglages propres à l'application Android. */
export function initialiserAndroid(): void {
  // Indique que cette version s'est bien lancée (sinon retour automatique à la précédente)
  void CapacitorUpdater.notifyAppReady();

  // Bouton « retour » : revient à la page précédente, quitte l'application depuis l'accueil
  App.addListener('backButton', ({ canGoBack }) => {
    const accueil = location.hash === '' || location.hash === '#/';
    if (canGoBack && !accueil) history.back();
    else App.exitApp();
  });
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});

  void verifierMiseAJour();
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) void verifierMiseAJour();
    else void appliquerSiPrete();
  });
}

let prete: BundleInfo | null = null;
let enCours = false;

/**
 * Au lancement (ou sur demande) : télécharge la dernière version publiée si elle est différente.
 * Une fois prête, un bandeau propose « Mettre à jour » ; sinon elle s'installe quand on quitte l'application.
 */
export async function verifierMiseAJour(): Promise<void> {
  if (enCours || prete) return;
  if (!navigator.onLine) return changerEtat('erreur', 'Pas de connexion Internet.');
  enCours = true;
  changerEtat('recherche');
  try {
    const r = await fetch(`${ANNONCE}?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`serveur indisponible (${r.status})`);
    const annonce: Annonce = await r.json();
    const apk = Number((await App.getInfo()).build) || 0;
    const d = decider(__VERSION_WEB__, annonce, apk);
    if (d.action === 'nouvel-apk') {
      nouvelApk.disponible = true;
      nouvelApk.abonnes.forEach((f) => f());
      changerEtat('nouvel-apk');
    } else if (d.action === 'telecharger') {
      changerEtat('telechargement');
      prete = await CapacitorUpdater.download({ version: annonce.version, url: annonce.url });
      // Programmée pour le prochain lancement, au cas où on ne toucherait pas « Mettre à jour »
      await CapacitorUpdater.next({ id: prete.id });
      changerEtat('prete');
    } else {
      changerEtat('a-jour');
    }
  } catch (e) {
    changerEtat('erreur', (e as Error)?.message || String(e));
  } finally {
    enCours = false;
  }
}

/** Installe tout de suite la version téléchargée (l'application redémarre, les données restent). */
export async function installerMaintenant(): Promise<void> {
  if (prete) await CapacitorUpdater.set({ id: prete.id });
}

/** Quand on quitte l'application, la nouvelle version s'installe : au retour, elle est à jour. */
async function appliquerSiPrete(): Promise<void> {
  if (!prete) return;
  const b = prete;
  prete = null;
  try {
    await CapacitorUpdater.set({ id: b.id });
  } catch {
    // La version reste programmée pour le prochain démarrage (CapacitorUpdater.next)
  }
}
