# 🧹 Rapport de ménage — EtherzRP

## ✅ Résultat
- Code actif : **29 Mo → 12 Mo** (−59 %)
- Code mort isolé dans `_attic/` (réversible) : **13 Mo**
- **Build vérifié OK** après chaque étape (`npm run build` passe)

## 1. Code mort ARCHIVÉ (déplacé dans `_attic/`, 0 import vérifié)
| Dossier | Taille | Raison |
|---|---|---|
| `build/` | 9.9 Mo | vieux build figé, régénérable via `npm run build` |
| `artifacts/` | 1.9 Mo | 3 mini-projets Replit obsolètes, jamais importés |
| `src/hotel3d/` | 252 Ko | hôtel dupliqué, 0 import |
| `EtherWorld-Agent/` (racine) | 224 Ko | doublon — le vrai est `src/admin/EtherWorld-Agent/` |
| `.archive/` | 384 Ko | anciennes sauvegardes |
| `src/game/hotel/` | 88 Ko | hôtel dupliqué, 0 import |
| `src/legacy/` | 24 Ko | ancien code racine |
| `etherworld/` (racine) | 20 Ko | 1 fichier (`DimensionViewer`) non importé |

> Pour annuler : `mv _attic/<date>/* .`
> Pour supprimer définitivement plus tard : `rm -rf _attic`
> ⚠️ Ajoute `_attic/` à ton `.gitignore`.

## 2. Hôtels — NON touchés (vivants, reliés au code)
Sur les 6 arbres « hotel », 2 étaient morts (archivés ci-dessus). Les 3 restants
sont **utilisés** — ne pas fusionner sans réécrire les imports :
| Dossier | Utilisé par |
|---|---|
| `src/buildings/hotel` | `city-scene.tsx`, `InteractionSystem.ts` (= l'hôtel en jeu) |
| `src/components/hotel` | `AdminPanel.tsx` |
| `src/components/hotel-ultra` | `components/hotel/HotelStore.ts` (transitif) |

## 3. Dossiers à 1 seul fichier (72) — À examiner au cas par cas
Non aplatis automatiquement (risque de casser les imports `@/...`).
Liste ci-dessous : `dossier  →  fichier  (N imports externes)`

- `src/api` → `etherApi.ts`  (10 imports)
- `src/buildings/firebase` → `collections.ts`  (1 imports)
- `src/buildings/hotel/core` → `HotelRegistry.ts`  (1 imports)
- `src/buildings/hotel/modules/floor` → `HotelFloorModule.tsx`  (1 imports)
- `src/buildings/hotel/scenes` → `HotelScene.tsx`  (1 imports)
- `src/buildings/hotel/services` → `HotelAccessService.ts`  (1 imports)
- `src/components/core` → `GameWorld.tsx`  (0 imports)
- `src/components/effects` → `AdminEffects.tsx`  (0 imports)
- `src/components/etherworld/builders` → `ObjectModelRenderer.tsx`  (0 imports)
- `src/components/etherworld/stores` → `useSeasonStore.ts`  (0 imports)
- `src/components/hotel/constants` → `ids.ts`  (0 imports)
- `src/components/hotel/jobs` → `HousekeepingJob.tsx`  (0 imports)
- `src/components/hotel/modules` → `RoomAccessible.tsx`  (0 imports)
- `src/components/player` → `PlayerRagdollRig.tsx`  (0 imports)
- `src/components/roads` → `QuebecRoad.tsx`  (0 imports)
- `src/components/styles` → `globals.css`  (0 imports)
- `src/components/types` → `index.ts`  (0 imports)
- `src/components/world/city` → `CityRuntime.tsx`  (0 imports)
- `src/data/city/buildings` → `cityBuildings.ts`  (1 imports)
- `src/data/city/jobs` → `cityJobs.ts`  (1 imports)
- `src/data/city/security` → `cityDoors.ts`  (1 imports)
- `src/data/city/shops` → `cityStorages.ts`  (1 imports)
- `src/game/city/config` → `cityConfig.ts`  (0 imports)
- `src/game/city/core` → `CityManager.ts`  (0 imports)
- `src/game/city/registry` → `cityRegistry.ts`  (1 imports)
- `src/game/city/systems/doors` → `doorSystem.ts`  (0 imports)
- `src/game/city/systems/interactions` → `interactionSystem.ts`  (0 imports)
- `src/game/city/systems/jobs` → `jobSystem.ts`  (0 imports)
- `src/game/city/systems/save` → `citySave.ts`  (0 imports)
- `src/game/city/systems/security` → `securitySystem.ts`  (0 imports)
- `src/game/city/systems/storage` → `storageSystem.ts`  (0 imports)
- `src/game/city/types` → `city.types.ts`  (7 imports)
- `src/game/combat` → `CombatSystem.ts`  (0 imports)
- `src/game/economy` → `EconomySystem.ts`  (0 imports)
- `src/game/physics` → `AdvancedPhysics.ts`  (0 imports)
- `src/hooks/city` → `useCityBoot.ts`  (1 imports)
- `src/lib/three/models` → `room-architecture.tsx`  (0 imports)
- `src/lib/three/postprocessing` → `CustomEffects.tsx`  (1 imports)
- `src/pages` → `not-found.tsx`  (0 imports)
- `src/plugins/arcane/commands` → `ArcaneTreeCommands.ts`  (0 imports)
- `src/plugins/arcane/effects` → `ArcaneShaderTree.tsx`  (0 imports)
- `src/plugins/arcane/events` → `ArcaneTreeEvents.ts`  (0 imports)
- `src/plugins/arcane/loaders` → `BakedRoomPreview.tsx`  (0 imports)
- `src/server/middleware` → `verifyFirebaseToken.cjs`  (0 imports)
- `src/server/socket` → `socketServer.cjs`  (0 imports)
- `src/store/city` → `useCityStore.ts`  (2 imports)
- `src/systems/access-control/core` → `AccessControlTypes.ts`  (1 imports)
- `src/systems/access-control/simulator` → `LockSimulator.ts`  (2 imports)
- `src/systems/admin/dashboard` → `AuditDashboard.tsx`  (0 imports)
- `src/systems/admin/i18n` → `i18n.ts`  (0 imports)
- `src/systems/admin/permissions` → `PermissionSystem.ts`  (0 imports)
- `src/systems/admin/punishments` → `PunishmentSystem.ts`  (0 imports)
- `src/systems/admin/scheduler` → `CommandScheduler.ts`  (0 imports)
- `src/systems/combat` → `StaminaSystem.ts`  (1 imports)
- `src/systems/communication/phone` → `PhoneSystem.ts`  (1 imports)
- `src/systems/communication/radio` → `RadioSystem.ts`  (0 imports)
- `src/systems/communication/voice` → `ProximityVoice.ts`  (0 imports)
- `src/systems/interactions` → `InteractionSystem.ts`  (0 imports)
- `src/systems/jobs/factions` → `FactionSystem.ts`  (1 imports)
- `src/systems/security/moderation` → `ReportSystem.ts`  (0 imports)
- `src/types` → `etherServer.ts`  (5 imports)
- `src/ui/services` → `PolicePanel.tsx`  (0 imports)
- `src/weapons/components` → `WeaponHUD.tsx`  (0 imports)
- `src/weapons/hooks` → `useWeaponInput.ts`  (0 imports)
- `src/weapons/integration` → `WeaponPlayerAttachment.tsx`  (0 imports)
- `src/weapons/types` → `weapon.ts`  (0 imports)
- `src/world/buildings/components` → `BuildingsRenderer.tsx`  (0 imports)
- `src/world/economy` → `MunicipalBankAndMarket.tsx`  (0 imports)
- `src/world/scenes` → `GameScene.tsx`  (1 imports)
- `src/world/schema` → `WorldTypes.ts`  (0 imports)
- `src/world/shopping` → `AccessibleShopsMaster.tsx`  (0 imports)
- `src/world/weather` → `WeatherSystem.tsx`  (0 imports)
