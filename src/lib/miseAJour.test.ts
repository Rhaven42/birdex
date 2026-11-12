import { describe, expect, it } from 'vitest';
import { decider } from './miseAJour';

const annonce = { version: 'abc', url: 'https://exemple/birdex-web.zip', apkMin: 4 };

describe('mise à jour au démarrage', () => {
  it('ne fait rien si l’application est déjà à jour', () => {
    expect(decider('abc', annonce, 5)).toEqual({ action: 'rien' });
  });
  it('télécharge une nouvelle version compatible', () => {
    expect(decider('ancienne', annonce, 4)).toEqual({ action: 'telecharger' });
  });
  it('demande un nouvel APK si la partie Android est trop ancienne', () => {
    expect(decider('ancienne', annonce, 3)).toEqual({ action: 'nouvel-apk' });
  });
  it('ne fait rien sans annonce valide (hors connexion…)', () => {
    expect(decider('ancienne', null, 9)).toEqual({ action: 'rien' });
    expect(decider('ancienne', { version: '', url: '', apkMin: 1 }, 9)).toEqual({ action: 'rien' });
  });
});
