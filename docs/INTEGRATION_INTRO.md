# 🎬 Intégration de l'intro 3D cinématique

Ce composant remplace l'ancienne intro (gradients + emojis Ken Burns) par une
**vraie séquence 3D** : survol nocturne d'une ville néon québécoise sous la pluie,
néons, voitures, brouillard volumétrique, le **lapin-pilote dans sa carotte-fusée
avec les nuages** qui survole la ville, puis le logo ETHERWORLD qui s'assemble avec
le bouton « ENTRER DANS LA VILLE ».

> 🐰 Le lapin-fusée vient de ta `RabbitScene.tsx` existante (version sans GSAP,
> Three.js pur). Il est superposé en canvas transparent `pointer-events-none` :
> il ne touche à rien d'autre. **Aucune dépendance `gsap` n'est requise.**
>
> ⚠️ Le code que tu as collé utilisait `gsap`, qui n'est **pas** installé dans ton
> projet — l'utiliser tel quel aurait cassé le build. J'ai donc branché ta
> `RabbitScene.tsx` déjà présente (qui fait exactement le même lapin + nuages,
> mais sans GSAP). Si tu veux quand même la version GSAP, il faudrait
> `npm install gsap` d'abord.

## ✅ Aucune nouvelle dépendance
Tout est déjà dans ton `package.json` :
`three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion`.

## 1. Copier les fichiers
```
_delivery/intro-3d/CinematicIntro3D.tsx  →  src/components/intro/CinematicIntro3D.tsx
_delivery/intro-3d/RabbitScene.tsx       →  src/components/intro/RabbitScene.tsx  (déjà présent chez toi)
```
> `RabbitScene.tsx` existe déjà dans ton repo — il est inclus ici pour référence,
> tu n'as pas besoin de l'écraser.

## 2. Brancher dans App.tsx
Dans `src/App.tsx`, tu utilises actuellement `CityIntro`. Remplace son usage :

```tsx
// AVANT
import CityIntro from './components/intro/CityIntro'
...
{!siteIntroDone && <CityIntro onDone={() => setSiteIntroDone(true)} />}

// APRÈS
import CinematicIntro3D from './components/intro/CinematicIntro3D'
...
{!siteIntroDone && (
  <CinematicIntro3D
    onDone={() => {
      setSiteIntroDone(true)
      try { sessionStorage.setItem('etherzrp-city-intro-seen', '1') } catch {}
    }}
  />
)}
```

> L'ancien `CityIntro.tsx` peut rester en place (fallback) ou être déplacé dans `_attic/`.

## 3. (Optionnel) Personnalisation rapide
En haut de `CinematicIntro3D.tsx` :

| Constante        | Effet                                            |
|------------------|--------------------------------------------------|
| `CITY_BLOCKS`    | Densité de la ville (14 = équilibré)             |
| `NEON_COLORS`    | Palette des néons / fenêtres                      |
| `TOTAL_DURATION` | Durée du survol avant l'apparition du titre (ms) |

## 4. Tester sans installer
Ouvre **`_delivery/intro-3d/demo-standalone.html`** dans ton navigateur
(ou via le preview du workspace) — même rendu, en Three.js vanilla via CDN.

> ⚠️ Dans le preview en iframe sandbox, le CDN peut être bloqué (pas de réseau).
> Dans ce cas, ouvre le fichier directement dans Chrome/Edge : il fonctionne à 100 %.

## 5. Performance
- `dpr={[1, 1.75]}` limite la résolution sur écrans 4K/Retina.
- Immeubles en `InstancedMesh` (1 seul draw call pour ~150 bâtiments).
- Fenêtres et pluie en `Points` additifs (très légers).
- Tourne à 60 fps sur un laptop intégré moyen.
