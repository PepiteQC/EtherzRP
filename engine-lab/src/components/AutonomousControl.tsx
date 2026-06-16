```tsx
import { useState } from 'react'
import {
  Card,
  Button,
  Badge,
  toast,
} from '@blinkdotnew/ui'

import {
  Folder,
  FolderOpen,
  Power,
  Activity,
  CheckCircle,
  Clock,
  Zap,
  Gamepad2,
  FileImage,
  Box,
} from 'lucide-react'

import {
  AutonomousEngine,
} from '../lib/autonomous-engine'

export function AutonomousControl() {
  const [
    isRunning,
    setIsRunning,
  ] = useState(false)

  const [
    watchFolder,
    setWatchFolder,
  ] = useState('')

  const [
    gameFolder,
    setGameFolder,
  ] = useState('')

  const [
    processedCount,
    setProcessedCount,
  ] = useState(0)

  const [
    queueSize,
  ] = useState(0)

  const [
    history,
    setHistory,
  ] = useState<any[]>([])

  const [
    engine,
    setEngine,
  ] =
    useState<AutonomousEngine | null>(
      null
    )

  const selectWatchFolder =
    async () => {
      try {
        const handle =
          await (
            window as any
          ).showDirectoryPicker({
            mode: 'read',
            startIn: 'pictures',
          })

        setWatchFolder(
          handle.name
        )

        await saveHandle(
          'watch',
          handle
        )

        toast.success(
          `📁 Surveillance: ${handle.name}`
        )
      } catch {
        toast.error(
          'Erreur de sélection'
        )
      }
    }

  const selectGameFolder =
    async () => {
      try {
        const handle =
          await (
            window as any
          ).showDirectoryPicker({
            mode: 'readwrite',
          })

        setGameFolder(
          handle.name
        )

        await saveHandle(
          'game',
          handle
        )

        toast.success(
          `🎮 Jeu: ${handle.name}`
        )
      } catch {
        toast.error(
          'Erreur de sélection'
        )
      }
    }

  const startSystem =
    async () => {
      if (
        !watchFolder ||
        !gameFolder
      ) {
        toast.error(
          "Configure les dossiers d'abord !"
        )

        return
      }

      const newEngine =
        new AutonomousEngine({
          watchFolder,

          gameAssetsFolder:
            gameFolder,

          backupFolder:
            'backup',

          rules: {
            autoProcess:
              true,

            autoExport:
              true,

            autoBackup:
              true,

            autoNotifyGame:
              true,

            namingPattern:
              'model_{date}_{type}',
          },

          gameIntegration: {
            type:
              'fileSystem',

            assetsManifest:
              'manifest.json',
          },
        })

      newEngine.on?.(
        'processed',
        (
          data: any
        ) => {
          setProcessedCount(
            (
              previous
            ) =>
              previous + 1
          )

          setHistory(
            (
              previous
            ) => [
              data,
              ...previous.slice(
                0,
                9
              ),
            ]
          )

          toast.success(
            `✅ ${data.filename} ajouté au jeu !`
          )
        }
      )

      await newEngine.start()

      setEngine(
        newEngine
      )

      setIsRunning(
        true
      )

      toast.success(
        '🤖 Système autonome ACTIVÉ'
      )
    }

  const stopSystem =
    () => {
      engine?.stop?.()

      setIsRunning(
        false
      )

      setEngine(
        null
      )

      toast.info(
        '⏸️ Système arrêté'
      )
    }

  return (
    <div className="space-y-6 p-6">
      <Card
        className={
          `p-6 ${
            isRunning
              ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30'
              : ''
          }`
        }
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={
                `w-16 h-16 rounded-full flex items-center justify-center ${
                  isRunning
                    ? 'bg-green-500/20 animate-pulse'
                    : 'bg-secondary'
                }`
              }
            >
              <Power
                className={
                  `w-8 h-8 ${
                    isRunning
                      ? 'text-green-500'
                      : 'text-muted-foreground'
                  }`
                }
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                {isRunning
                  ? '🟢 Système Actif'
                  : '⚫ Système Arrêté'}
              </h2>

              <p className="text-sm text-muted-foreground">
                {isRunning
                  ? 'Glisse une photo dans le dossier, tout est automatique !'
                  : 'Configure et démarre le système'}
              </p>
            </div>
          </div>

          <Button
            size="lg"
            variant={
              isRunning
                ? 'destructive'
                : 'default'
            }
            onClick={
              isRunning
                ? stopSystem
                : startSystem
            }
            disabled={
              !watchFolder ||
              !gameFolder
            }
          >
            {isRunning
              ? '⏸️ Arrêter'
              : '▶️ Démarrer'}
          </Button>
        </div>

        {isRunning && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {
                  processedCount
                }
              </p>

              <p className="text-xs text-muted-foreground">
                Modèles générés
              </p>
            </div>

            <div className="text-center p-3 bg-white/50 rounded-lg">
              <p className="text-2xl font-bold text-accent">
                {
                  queueSize
                }
              </p>

              <p className="text-xs text-muted-foreground">
                En attente
              </p>
            </div>

            <div className="text-center p-3 bg-white/50 rounded-lg">
              <p className="text-2xl font-bold text-green-500">
                ✓
              </p>

              <p className="text-xs text-muted-foreground">
                Auto-export ON
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FolderOpen className="w-6 h-6 text-primary" />

            <div>
              <h3 className="font-bold">
                📥 Dossier Source
              </h3>

              <p className="text-xs text-muted-foreground">
                Où tu mets tes photos
              </p>
            </div>
          </div>

          <div className="p-4 bg-secondary/30 rounded-lg mb-3 font-mono text-sm">
            {watchFolder ||
              '❌ Non configuré'}
          </div>

          <Button
            onClick={
              selectWatchFolder
            }
            variant="outline"
            className="w-full"
          >
            <Folder className="mr-2 w-4 h-4" />

            Choisir le dossier
          </Button>

          <p className="text-xs text-muted-foreground mt-3">
            💡 Ex:
            Pictures/3D_Input -
            Glisse tes photos ici
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Gamepad2 className="w-6 h-6 text-accent" />

            <div>
              <h3 className="font-bold">
                🎮 Dossier du Jeu
              </h3>

              <p className="text-xs text-muted-foreground">
                Où vont les modèles
                3D
              </p>
            </div>
          </div>

          <div className="p-4 bg-secondary/30 rounded-lg mb-3 font-mono text-sm">
            {gameFolder ||
              '❌ Non configuré'}
          </div>

          <Button
            onClick={
              selectGameFolder
            }
            variant="outline"
            className="w-full"
          >
            <Folder className="mr-2 w-4 h-4" />

            Choisir le dossier
          </Button>

          <p className="text-xs text-muted-foreground mt-3">
            💡 Ex:
            MonJeu/assets/models -
            Le jeu charge auto les
            fichiers GLB
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />

          Pipeline Automatique
        </h3>

        <div className="flex items-center justify-between gap-2">
          {[
            {
              icon:
                FileImage,

              label:
                'Détection',

              activeClass:
                'bg-blue-500/10 text-blue-500',
            },

            {
              icon:
                Zap,

              label:
                'Analyse IA',

              activeClass:
                'bg-purple-500/10 text-purple-500',
            },

            {
              icon:
                Box,

              label:
                'Génération 3D',

              activeClass:
                'bg-pink-500/10 text-pink-500',
            },

            {
              icon:
                FolderOpen,

              label:
                'Export',

              activeClass:
                'bg-orange-500/10 text-orange-500',
            },

            {
              icon:
                Gamepad2,

              label:
                'Dans le jeu',

              activeClass:
                'bg-green-500/10 text-green-500',
            },
          ].map(
            (
              step,
              index
            ) => (
              <div
                key={
                  step.label
                }
                className="flex items-center flex-1"
              >
                <div
                  className={
                    `flex-1 flex flex-col items-center gap-2 p-3 rounded-lg ${
                      isRunning
                        ? step.activeClass
                        : 'bg-secondary/30 text-muted-foreground'
                    }`
                  }
                >
                  <step.icon className="w-6 h-6" />

                  <span className="text-xs font-medium text-center">
                    {
                      step.label
                    }
                  </span>

                  {isRunning && (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>

                {index <
                  4 && (
                  <div className="text-muted-foreground mx-1">
                    →
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />

          Activité Récente
        </h3>

        {history.length ===
        0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucune activité -
            Démarre le système et
            ajoute une photo
          </p>
        ) : (
          <div className="space-y-2">
            {history.map(
              (
                item,
                index
              ) => (
                <div
                  key={
                    item.id ||
                    `${item.filename}-${index}`
                  }
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />

                    <div>
                      <p className="font-medium text-sm">
                        {
                          item.filename
                        }
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {item.type ||
                          'model'}
                        {' • '}

                        {item.polygons ||
                          0}{' '}
                        polys
                        {' • '}

                        {item.timestamp ||
                          ''}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="text-green-500 border-green-500/50"
                  >
                    Dans le jeu ✓
                  </Badge>
                </div>
              )
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

async function saveHandle(
  key: string,
  handle: FileSystemDirectoryHandle
) {
  const database =
    await openDB()

  await database.put(
    'handles',
    handle,
    key
  )
}

interface HandleDatabase {
  put: (
    storeName: string,
    value: unknown,
    key: string
  ) => Promise<void>
}

async function openDB():
Promise<HandleDatabase> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const request =
        indexedDB.open(
          'AutonomousSystem',
          1
        )

      request.onupgradeneeded =
        () => {
          const database =
            request.result

          if (
            !database
              .objectStoreNames
              .contains(
                'handles'
              )
          ) {
            database.createObjectStore(
              'handles'
            )
          }
        }

      request.onerror =
        () => {
          reject(
            request.error
          )
        }

      request.onsuccess =
        () => {
          const database =
            request.result

          resolve({
            put: (
              storeName,
              value,
              key
            ) =>
              new Promise(
                (
                  putResolve,
                  putReject
                ) => {
                  const transaction =
                    database.transaction(
                      storeName,
                      'readwrite'
                    )

                  const store =
                    transaction.objectStore(
                      storeName
                    )

                  const putRequest =
                    store.put(
                      value,
                      key
                    )

                  putRequest.onsuccess =
                    () =>
                      putResolve()

                  putRequest.onerror =
                    () =>
                      putReject(
                        putRequest.error
                      )
                }
              ),
          })
        }
    }
  )
}
```
