# Visual Forge — Engine-Lab

Chemin cible :

`C:\etherworldQC\engine-lab\client\src\tools\visual-forge`

Fonctions :

- import PNG, JPG et WEBP ;
- analyse de couleur, luminosité, contraste et contours ;
- génération d’un champ de hauteur ;
- lissage du relief ;
- aperçu Three.js / React Three Fiber ;
- export OBJ ;
- inspecteur et journal.

Point d’entrée :

```tsx
import VisualForgeTool from './tools/visual-forge/VisualForgeTool'

export function App() {
  return <VisualForgeTool />
}
```

Dépendances utilisées :

- react
- three
- @react-three/fiber
- @react-three/drei
- zustand
- lucide-react
