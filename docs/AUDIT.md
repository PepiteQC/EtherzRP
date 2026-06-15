# 🔍 AUDIT — EtherzRP (PepiteQC)
*Analyse réalisée sur le clone du dépôt `github.com/PepiteQC/EtherzRP` (branche master).*

## 1. Ce qu'est VRAIMENT le projet
| | Réalité du code | Ce que disait ton doc d'archi |
|---|---|---|
| Framework | **Vite + React 19** | Next.js |
| 3D | Three.js + React Three Fiber + Drei + Rapier | idem ✅ |
| Temps réel | **socket.io** | Colyseus |
| Backend | Express 5 | Node/Express ✅ |
| Auth/DB | Firebase + Firebase Admin + Firestore | idem ✅ |

➡️ **Incohérence d'architecture** : ton doc papier parle de Next.js/Colyseus, mais
ton code tourne sous Vite/socket.io. Ce n'est pas un problème en soi (Vite est même
plus simple pour un jeu 3D), mais il faut **mettre à jour la doc** pour ne pas
t'embrouiller plus tard.

## 2. Taille réelle
- **630 fichiers** TypeScript/TSX dans `src/`
- **~136 000 lignes** de code applicatif
- Gros systèmes déjà écrits : `CombatSystem.ts` (1097 l), `EconomySystem.ts` (1533 l),
  météo, voix de proximité, console admin, armes, etc.

➡️ **Le projet n'est PAS vide.** Les dossiers « maigres » contiennent souvent UN
fichier… mais un gros fichier complet. **Les faire « grandir » empirerait le désordre.**

## 3. Les 3 vrais problèmes qui nuisent au projet

### 🔴 A. Le build était CASSÉ (corrigé ✅)
`App.tsx` importait `./components/dashboard/EtherworldDashboard` — **fichier inexistant**
(seul `EtherworldDashboardScene.tsx` était présent). Conséquence : `npm run build`
**échouait totalement**. → Corrigé en créant le wrapper manquant `EtherworldDashboard.tsx`.
Le build passe maintenant (bundle 4.5 MB généré).

### 🟠 B. Code mort jamais importé (à archiver)
Aucune référence depuis `src/` vers :
| Dossier | Taille | Statut |
|---|---|---|
| `build/` | 9.9 Mo | build figé, à régénérer |
| `artifacts/` | 1.9 Mo | 3 mini-projets Replit obsolètes |
| `.archive/` | 384 Ko | sauvegardes |
| `EtherWorld-Agent/` | 224 Ko | non importé |
| `etherworld/` (racine) | 20 Ko | doublon vide |
| `src/legacy/` | 24 Ko | ancien code |
| `src/game/hotel/` | 88 Ko | **0 import** |
| `src/hotel3d/` | 252 Ko | **0 import** |

➡️ ~13 Mo de poids inutile qui ralentit l'IDE, le clone et embrouille la recherche.

### 🟡 C. Fragmentation : ~80 dossiers à 1 seul fichier + arbres dupliqués
L'**hôtel existe 6 fois** : `components/hotel`, `components/hotel-ultra`,
`components/hotel/hotel`, `buildings/hotel`, `game/hotel`, `hotel3d`.
Le **dépanneur 3 fois**. Vivants réellement : `components/hotel` + `buildings/hotel`.

## 4. Plan appliqué
1. ✅ **Fix build** — création de `EtherworldDashboard.tsx` (le projet compile).
2. ✅ **Intro 3D "WOW"** — nouvelle séquence cinématique (voir `INTEGRATION_INTRO.md`).
3. ✅ **Script de ménage sûr & réversible** — `cleanup.sh` (déplace le code mort dans
   `_attic/`, ne supprime rien, liste les dossiers à plat).

## 5. Recommandations suite (non bloquantes)
- Mettre à jour le doc d'archi (Vite, pas Next ; socket.io, pas Colyseus).
- Choisir 1 hôtel canonique et déplacer les 5 autres dans `_attic/`.
- Activer `npm run build:strict` (typecheck) en CI pour ne plus jamais committer un build cassé.
- Code-splitter les grosses scènes 3D (`import()` dynamique) pour réduire le bundle.
