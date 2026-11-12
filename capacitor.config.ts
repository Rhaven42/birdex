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
};

export default config;
