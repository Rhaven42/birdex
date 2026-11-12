import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@fontsource-variable/nunito';
import './styles.css';
import App from './App';
import { Capacitor } from '@capacitor/core';
import { initialiserAndroid } from './lib/natif';
import { demarrerSynchroAuto } from './lib/sync';

demarrerSynchroAuto();

if (Capacitor.isNativePlatform()) {
  initialiserAndroid();
} else {
  // Site web : cache hors connexion (PWA)
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
