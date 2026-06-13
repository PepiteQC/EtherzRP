# Plan graphique — EtherzRP Québec RP

Objectif: améliorer le visuel du monde sans copier la ville de `mauriciopoppe/Three.js-City`.
On reprend seulement les idées utiles: ville procédurale, routes lisibles, bâtiments variés, lampadaires, météo, ambiance, props.

## État actuel repéré

- Le repo est en React + Vite + Three.js + React Three Fiber.
- La scène principale active semble être `src/components/etherworld/Game.tsx`.
- Le bloc Québec actuel est dans `src/components/etherworld/QuebecCity.tsx`.
- Le monde contient déjà: terrain, route, arbres, bâtiments, ville Québec, véhicule, marcheur, HUD, intérieurs.
- `QuebecCity.tsx` est fonctionnel mais encore très simple visuellement: cubes, trottoirs, parkings, lampadaires, pompes.

## Priorité 1 — Beauté rapide sans casser le gameplay

1. Ajouter un kit graphique Québec:
   - matériaux asphalte, béton, brique, vitre, métal, enseignes;
   - variations de couleurs réalistes;
   - fenêtres avec lueur subtile;
   - toits, corniches, contours, entrées.

2. Remplacer/compléter `QuebecCity.tsx` avec des sous-composants propres:
   - `QuebecVisualKit.tsx`
   - `QuebecRoadDetails.tsx`
   - `QuebecBuildingsEnhanced.tsx`
   - `QuebecProps.tsx`
   - `QuebecLighting.tsx`

3. Ajouter des détails RP Québec:
   - panneaux Route 138 / arrêt / priorité;
   - dépanneur, motel, garage, poste police, hôtel;
   - bancs, poubelles, boîtes postales, cônes orange;
   - stationnement avec lignes et voitures décoratives simples.

## Priorité 2 — Ambiance

- Jour/nuit plus beau.
- Lampadaires avec halo.
- Brouillard de fleuve.
- Pluie/neige optionnelle.
- Couleurs Québec: route sombre, forêt dense, ciel froid, fleuve au loin.

## Priorité 3 — Monde plus vivant

- Quartiers procéduraux le long de la route.
- Villages inspirés Portneuf / Neuville / Donnacona / Trois-Rivières.
- Zones: bord du fleuve, village, centre-ville, forêt, industrie légère.
- Props instanciés pour garder les FPS.

## Première tâche proposée

Créer une version `QuebecCityEnhanced.tsx`, l'ajouter dans `Game.tsx`, puis garder l'ancien `QuebecCity.tsx` comme backup.

Le premier patch devrait ajouter:
- meilleur asphalte avec lignes;
- trottoirs découpés;
- bâtiments avec façades et fenêtres améliorées;
- enseignes fictives québécoises;
- lampadaires avec halo;
- props Québec simples.
