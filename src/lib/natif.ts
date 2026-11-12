import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

/** Réglages propres à l'application Android. */
export function initialiserAndroid(): void {
  // Bouton « retour » : revient à la page précédente, quitte l'application depuis l'accueil
  App.addListener('backButton', ({ canGoBack }) => {
    const accueil = location.hash === '' || location.hash === '#/';
    if (canGoBack && !accueil) history.back();
    else App.exitApp();
  });
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});
}
