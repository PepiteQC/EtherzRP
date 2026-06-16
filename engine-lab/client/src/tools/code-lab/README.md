# EtherWorld Code Lab

Chemin :

C:\etherworldQC\engine-lab\client\src\tools\code-lab

## Fonctions

- éditeur JavaScript ;
- support TypeScript léger ;
- exécution isolée dans un Web Worker ;
- limite de cinq secondes ;
- capture console.log, info, warn et error ;
- terminal intégré ;
- visualisation WebGL des exécutions ;
- fallback 2D ;
- snippets sauvegardés en localStorage ;
- statistiques locales ;
- historique des exécutions ;
- commandes TROXT.

## Point d’entrée

```tsx
import CodeLabTool from './tools/code-lab/CodeLabTool'

<CodeLabTool />
````

## Commandes TROXT

* Ouvre Code Lab
* Exécute le code
* Ouvre les snippets
* Ouvre les statistiques

Le module n’écrase aucun fichier existant.
