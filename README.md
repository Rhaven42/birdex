# Birdex – L’encyclopédie des oiseaux

Application web progressive (PWA, installable sur mobile) pour découvrir, observer et collectionner les oiseaux de France, région par région.

## Démarrer

```bash
npm install
npm run dev        # serveur de développement
npm test           # tests unitaires (recherche, carnet, cohérence des données)
npm run build      # build de production dans dist/ (hébergeable sur n’importe quel hébergeur statique)
```

## MVP (phase 1) – contenu

- **Carte interactive** des 96 départements (SVG, sans serveur de tuiles) ; zones test colorées selon la progression ; cadrage France / Île-de-France / Var.
- **52 espèces** : 45 en Île-de-France, 51 dans le Var, avec présence mois par mois, statut (sédentaire, nicheur, hivernant) et abondance.
- **Fiches verrouillées** (silhouette + indices + où/quand) puis **déverrouillées** après une observation : photo Wikimedia Commons créditée (auteur + licence), description, confusions, habitat, alimentation, comportement, reproduction, Liste rouge, protection, sources et date de mise à jour.
- **Carnet d’observations** (date, zone, lieu approximatif, note, photo), stocké sur l’appareil ; export JSON et effacement total (RGPD).
- **Recherche** tolérante aux fautes, par nom commun ou scientifique, avec suggestions et indication des lieux et périodes d’observation.
- Filtres par milieu, par statut de découverte et pour les espèces présentes ce mois-ci ; suggestions « À chercher ce mois-ci ».
- **Charte du bon observateur** ; espèces sensibles signalées, sans aucune localisation précise.

## Architecture

```
scripts/build-geo.mjs   GeoJSON (france-geojson) → tracés SVG compacts (src/data/geo.json)
src/data/               types.ts (modèle), species.ts (fiches), zones.ts
src/lib/                search.ts, storage.ts (localStorage), media.ts (API Wikipédia/Commons), hooks.ts
src/components/         FranceMap, Calendrier, FormulaireObservation, BarreRecherche, ui
src/pages/              Accueil, Zone, Fiche, Recherche, Collection, Carnet, Charte
```

Stack : React 19, TypeScript, Vite, React Router (HashRouter), vite-plugin-pwa (cache hors ligne), Vitest.

## Ajouter une espèce ou une zone

1. `src/data/zones.ts` : ajouter la zone (id, codes INSEE des départements).
2. `src/data/species.ts` : ajouter l’espèce ou une entrée `presence` pour la nouvelle zone.
3. `npm test` vérifie la cohérence (identifiants uniques, mois valides, zones existantes).

## À faire valider

Les textes des fiches ont été rédigés à partir de sources naturalistes reconnues, mais doivent être **relus par un ornithologue** avant publication, en particulier les statuts de présence et d’abondance par zone, et la vérification d’une éventuelle mise à jour de la Liste rouge depuis 2016.

## Feuille de route

- Phase 2 : lecteur audio intégré (xeno-canto, avec licences), extension à toute la métropole, badges et défis, « Autour de moi ».
- Phase 3 : identification par photo (IA, présentée comme une suggestion), téléchargement hors ligne par région, mode enfant.
