import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { CapacitorUpdater, type BundleInfo } from '@capgo/capacitor-updater';
import { decider, type Annonce } from './miseAJour';

const ANNONCE = 'https://rhaven42.github.io/birdex/mise-a-jour.json';
export const PAGE_APK = 'https://github.com/Rhaven42/birdex/releases/latest';

/** Prévenu si un nouvel APK est nécessaire (changement de la partie Android). */
export const nouvelApk = { disponible: false, abonnes: new Set<() => void>() };

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

/** Au lancement : télécharge en arrière-plan la dernière version publiée, si elle est différente. */
async function verifierMiseAJour(): Promise<void> {
  if (enCours || prete || !navigator.onLine) return;
  enCours = true;
  try {
    const r = await fetch(`${ANNONCE}?t=${Date.now()}`, { cache: 'no-store' });
    const annonce: Annonce | null = r.ok ? await r.json() : null;
    const apk = Number((await App.getInfo()).build) || 0;
    const d = decider(__VERSION_WEB__, annonce, apk);
    if (d.action === 'nouvel-apk') {
      nouvelApk.disponible = true;
      nouvelApk.abonnes.forEach((f) => f());
    } else if (d.action === 'telecharger' && annonce) {
      prete = await CapacitorUpdater.download({ version: annonce.version, url: annonce.url });
      // Appliquée au prochain lancement (ou dès que l'application passe en arrière-plan)
      await CapacitorUpdater.next({ id: prete.id });
    }
  } catch {
    // Pas de réseau ou serveur indisponible : on réessaiera au prochain lancement
  } finally {
    enCours = false;
  }
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
