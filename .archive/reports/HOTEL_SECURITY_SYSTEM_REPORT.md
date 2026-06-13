# EtherWorld-Official-PC — Hôtel security / rooms / interactions

Date: 2026-06-11

## Objectif
Créer/renforcer le système hôtel :

- building interaction
- chambres
- room architecture 3D
- door system
- sécurité
- temps réel
- carte magnétique
- numpad
- Firebase-ready / Node.js-ready

## Fichiers créés

```txt
src/buildings/hotel/security/HotelSecurityTypes.ts
src/buildings/hotel/security/HotelRealtimeSecurity.ts
src/buildings/hotel/security/useHotelSecurity.ts
src/buildings/hotel/security/HotelSecurityDoor.tsx
src/buildings/hotel/security/index.ts
src/buildings/hotel/modules/room/HotelRoomArchitecture.tsx
```

## Fichiers réécrits/enrichis

```txt
src/buildings/hotel/core/HotelRegistry.ts
src/buildings/hotel/modules/room/HotelRoomModule.tsx
src/buildings/hotel/services/HotelAccessService.ts
src/buildings/index.ts
```

## Registry hôtel

`HotelRegistry.ts` est maintenant stable et compatible avec les types partagés :

- `hotel_main`
- 3 étages
- 10 chambres par étage
- 30 chambres total
- 30 portes
- 30 locks
- `HOTEL_ARCH`
- `HOTEL_RECEPTION`
- `HOTEL_ELEVATOR_SHAFT`
- `HOTEL_SECURITY_DEFAULTS`

Chaque porte a un ID stable :

```txt
hotel_main_f0_r101_dmain
```

Chaque lock a un ID stable :

```txt
hotel_main_f0_r101_dmain_lmain
```

## Système temps réel

`HotelRealtimeSecurity.ts` ajoute un store temps réel :

- `BroadcastChannel` pour synchroniser plusieurs onglets
- `localStorage` pour persistance locale dev
- state par porte : locked/unlocked/open/alarm/lockout
- auto-relock après ouverture
- lockout temporaire après trop d'essais
- seed Firebase-ready

## Méthodes d'accès

Supportées :

```ts
magnetic_card
numpad
connected_app
staff_override
```

Helpers :

```ts
attemptRoomEntry(roomId)
attemptRoomWithMagneticCard(roomId, cardUid)
attemptRoomWithNumpad(roomId, code)
createHotelSecurityFirebaseSeed()
```

## Porte 3D sécurisée

`HotelSecurityDoor.tsx` ajoute une vraie porte 3D interactive :

- panneau de porte animé
- cadre lumineux
- status color : locked/unlocked/open/lockout
- lecteur carte magnétique clickable
- numpad 0-9 + C + E
- affichage live du message
- ouverture/fermeture en temps réel
- `userData` Three.js pour raycast/interactions/Firebase

## Room architecture

`HotelRoomArchitecture.tsx` ajoute dans chaque chambre :

- lit queen
- bureau + terminal room OS
- mini cuisine
- salle de bain compacte
- safe avec numpad visuel
- luminaires dynamiques
- plaque de chambre

## Firebase-ready

Paths exposés :

```ts
HOTEL_FIREBASE_SECURITY_PATHS
```

Collections visées :

```txt
hotel_rooms
hotel_doors
hotel_locks
hotel_access_grants
hotel_access_credentials
hotel_lock_events
```

Politique :

- pas de secret lisible côté client en production
- carte/NIP à hasher/server-only plus tard
- commande serrure réelle uniquement via Cloud Functions / Firebase Admin

## Vérifications

```bash
npm run build
```

Résultat :

```txt
✓ built
```

Vérifications ciblées :

```bash
npx esbuild src/buildings/hotel/scenes/HotelScene.tsx --bundle ...
npx esbuild src/buildings/hotel/security/HotelSecurityDoor.tsx --bundle ...
npx esbuild src/buildings/hotel/services/HotelAccessService.ts --bundle ...
```

Résultat : OK.
