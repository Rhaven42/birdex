import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.rhaven42.birdex',
  appName: 'Birdex',
  webDir: 'dist',
  android: {
    backgroundColor: '#ffffff',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Mises à jour automatiques du contenu de l'application, publiées sur GitHub Pages (voir src/lib/natif.ts)
    CapacitorUpdater: {
      autoUpdate: false, // gestion manuelle, sans le service en ligne de Capgo
      statsUrl: '', // aucune statistique envoyée à Capgo
    },
  },
};

export default config;
