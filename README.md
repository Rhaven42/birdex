# Birdex – L’encyclopédie des oiseaux

Application web progressive (PWA, installable sur mobile) pour découvrir, observer et collectionner les oiseaux de France, région par région.

## Démarrer

```bash
npm install
npm run dev        # serveur de développement
npm test           # tests unitaires (recherche, carnet, cohérence des données)
npm run build      # build de production dans dist/ (hébergeable sur n’importe quel hébergeur statique)
```

## Contenu

- **355 espèces** observées régulièrement en France métropolitaine, **une seule fiche par espèce**, réparties dans les **13 régions** (96 départements cliquables).
- **Carte de répartition** sur chaque fiche : régions colorées selon l'abondance, curseur mois par mois, statut par région (toute l'année, printemps–été, hiver, migration).
- **Fiches** verrouillées puis déverrouillées par une observation. 52 fiches sont entièrement rédigées (description, confusions, mœurs) ; les autres affichent l'introduction Wikipédia (CC BY-SA), chargée dans le navigateur.
- **Carnet d'observations** local (export JSON, effacement RGPD), **recherche** tolérante aux fautes, **badges et défis** saisonniers, **charte du bon observateur**.

## Données : comment elles sont construites

`npm run birds` (script `scripts/build-birds.mjs`) produit `src/data/gbif.json` à partir de sources vérifiables :

| Donnée | Source |
| --- | --- |
| Liste des espèces, régions, mois, abondance | [GBIF](https://www.gbif.org) : observations d'oiseaux en France 2015–2025 (Faune-France, iNaturalist, eBird…), agrégées par région GADM et par mois |
| Nom français, taille, envergure, statut UICN mondial, article Wikipédia | [Wikidata](https://www.wikidata.org) (identifiant GBIF P846) ; à défaut, noms vernaculaires GBIF |
| Famille | Référentiel taxonomique GBIF (nom scientifique) |
| Photos (auteur, licence) | Image de référence Wikidata (P18) sur Wikimedia Commons, via `npm run photos` |

Critères pour qu'une espèce compte dans une région : ≥ 40 observations, ≥ 0,005 % des observations d'oiseaux de la région, présente au moins 3 mois, et notée au moins 5 années sur 11 (écarte les oiseaux égarés très « twitchés »). Les synonymes taxonomiques sont fusionnés (ex. *Sylvia/Curruca melanocephala*) ; les oiseaux échappés de captivité sont exclus ; les espèces introduites installées sont signalées.

Limites connues : l'abondance reflète la fréquence des signalements (biais d'observation) ; la Liste rouge France et les statuts de protection de l'INPN n'ont pas pu être interrogés automatiquement (protection anti-robots) et ne sont affichés que sur les 52 fiches rédigées.

## Sons (xeno-canto)

Chaque fiche propose des chants et cris issus de [xeno-canto](https://xeno-canto.org) (lecture, ralenti ×0,75/×0,5, boucle, sonogramme, comparaison avec une autre espèce), avec l'auteur et la licence de chaque enregistrement. Les fichiers sont lus directement depuis xeno-canto.

La sélection (`src/data/sons.json`) est générée par `scripts/build-sons.mjs` avec une clé API xeno-canto, jamais stockée dans le dépôt :

1. Dépôt GitHub → **Settings → Secrets and variables → Actions → New repository secret** : nom `XC_KEY`, valeur = votre clé (page « Account » de xeno-canto).
2. Onglet **Actions → Sons xeno-canto → Run workflow**. Le fichier `sons.json` est mis à jour automatiquement.

En local : `XC_KEY=… npm run sons`.

## Architecture

```
scripts/build-geo.mjs   GeoJSON (france-geojson) → tracés SVG + rattachement département → région
scripts/build-birds.mjs GBIF + Wikidata → src/data/gbif.json (espèces, présence par région et par mois)
src/data/               types.ts, gbif.json, redactions.ts (52 fiches rédigées), species.ts (fusion), zones.ts
src/lib/                search.ts, storage.ts (localStorage), media.ts (API Wikipédia/Commons), hooks.ts
src/components/         FranceMap, Calendrier, FormulaireObservation, BarreRecherche, ui
src/pages/              Accueil, Zone, Fiche, Recherche, Collection, Carnet, Charte
```

Stack : React 19, TypeScript, Vite, React Router (HashRouter), vite-plugin-pwa (cache hors ligne), Vitest.

## Mettre à jour les données

```bash
NODE_USE_ENV_PROXY=1 npm run birds   # interroge GBIF et Wikidata (réponses mises en cache dans data-src/cache)
npm test                             # vérifie : une fiche par espèce, 13 régions, présences cohérentes…
```

Pour enrichir une fiche, ajoutez son texte dans `src/data/redactions.ts` (clé : nom scientifique).

## À faire valider

Les textes des fiches ont été rédigés à partir de sources naturalistes reconnues, mais doivent être **relus par un ornithologue** avant publication, en particulier les statuts de présence et d’abondance par zone, et la vérification d’une éventuelle mise à jour de la Liste rouge depuis 2016.

## Feuille de route

- Fait : extension aux 13 régions, cartes de répartition, badges et défis.
- À venir : lecteur audio intégré (xeno-canto, avec licences), « Autour de moi », rédaction de nouvelles fiches.
- Phase 3 : identification par photo (IA, présentée comme une suggestion), téléchargement hors ligne par région, mode enfant.
