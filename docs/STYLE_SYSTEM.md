# 🎨 Design System "Low-Poly Cartoon" — EtherWorld QC

Un style **artistique maîtrisé** (une seule direction, déclinée partout) et
**ultra-optimisé** (qualité adaptative auto, matériaux en cache, ombres douces
légères). Aucune nouvelle dépendance : tout repose sur `three`, `three-stdlib`,
`@react-three/fiber` et `@react-three/drei` déjà présents.

## 🧩 Ce que contient le système
```
src/lib/three/cartoon/
├── index.ts              ← point d'entrée unique
├── cartoonTokens.ts      ← LA palette + réglages rendu (source de vérité)
├── cartoonMaterials.ts   ← matériaux flat-shaded en cache (cartoonMat / glowMat)
├── CartoonStage.tsx      ← lumière + ciel + ombres + fog clé-en-main
├── CartoonPostFX.tsx     ← Bloom + SMAA + QUALITÉ ADAPTATIVE
└── CartoonShowcase.tsx   ← scène vitrine de démonstration
src/ui/theme/cartoon-ui.css  ← couche UI (boutons, cartes, titres cartoon)
```

## 🚀 Utilisation type
```tsx
import { Canvas } from '@react-three/fiber'
import { CartoonStage, CartoonPostFX, cartoonMat, glowMat } from '@/lib/three/cartoon'

<Canvas shadows dpr={[1, 1.75]} camera={{ position: [10, 7, 14], fov: 48 }}>
  <CartoonStage night={false}>
    <mesh material={cartoonMat('grass')} ... />
    <mesh material={glowMat('primary')} ... />   {/* brille avec le Bloom */}
  </CartoonStage>
  <CartoonPostFX quality="auto" />               {/* s'auto-régule selon le FPS */}
</Canvas>
```

## ⚡ Les 3 leviers d'optimisation
1. **Matériaux en cache** (`cartoonMat`) : un même matériau réutilisé = moins de
   GPU uploads. Flat-shading = pas de normales lissées à calculer.
2. **Qualité adaptative** (`CartoonPostFX quality="auto"`) : surveille le FPS sur
   90 frames ; si < 45 fps il allège le Bloom et coupe le SMAA, si > 58 fps il les
   réactive. + `AdaptiveDpr` baisse la résolution en cas de surcharge.
3. **Ombres douces calibrées** (`SoftShadows` + map 1024 + caméra d'ombre serrée) :
   beau rendu sans exploser le budget.

### Réglages selon la machine
| Public | Prop |
|---|---|
| PC modestes | `<CartoonPostFX quality="low" />` + `<CartoonStage softShadows={false} />` |
| Recommandé | `<CartoonPostFX quality="auto" />` (par défaut) |
| PC gamer / trailer | `<CartoonPostFX quality="high" bloomStrength={0.9} />` |

## 🎨 La palette (extrait)
| Token | Hex | Rôle |
|---|---|---|
| `primary` | `#ff8c42` | orange carotte 🥕 (signature) |
| `secondary` | `#ffd166` | jaune doux |
| `accent` | `#06b6d4` | cyan ponctuel |
| `grass` | `#7cb342` | gazon |
| `roof` | `#3d5a80` | toits |
| `ink` | `#26233a` | texte (noir chaud) |

> ⚠️ Cohérence : ton ancien `cityTokens.ts` visait un style *institutionnel*
> (bleu/blanc) qui contredit le néon de l'intro. Ce nouveau système tranche :
> **tout est low-poly cartoon chaud**. Migre progressivement les écrans vers
> `cartoonTokens` / `cartoon-ui.css` pour l'unité visuelle.

## 👀 Voir le rendu
- `_delivery/style-system/preview-cartoon-style.png` (aperçu généré)
- Monte `CartoonShowcase` en plein écran dans App pour une démo 3D interactive.

## ✅ Vérifié
- Typecheck OK, **`npm run build` passe** avec le système + la vitrine.
- 0 nouvelle dépendance.
