# TROXT — EtherWorld Engine-Lab

Chemin :

C:\etherworldQC\engine-lab\client\src\tools\troxt

## Rôle

TROXT est l’agent local du laboratoire EtherWorld.

Il peut :

- recevoir des commandes dans son chat ;
- ouvrir Visual Forge ;
- lancer le pipeline Visual Forge ;
- recevoir les résultats de génération ;
- afficher les erreurs de Visual Forge ;
- enregistrer de nouveaux outils dans TroxtToolRegistry ;
- basculer entre TROXT et Visual Forge.

## Point d’entrée de test

```tsx
import TroxtWorkspace from './tools/troxt/TroxtWorkspace'

export default function App() {
  return <TroxtWorkspace />
}
````

Ne remplace pas le App.tsx actuel sans avoir vérifié son contenu.

## Commandes disponibles

* Ouvre Visual Forge
* Lance Visual Forge
* Liste les outils disponibles

## Ajouter un outil

Utiliser :

```ts
troxtTools.register({
  id: 'mon-outil',
  name: 'Mon outil',
  description: 'Description',
  keywords: ['commande'],
  execute() {
    return {
      ok: true,
      message: 'Commande exécutée.',
    }
  },
})
```

