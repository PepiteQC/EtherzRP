import React, {
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import { useEtherServer } from '../hooks/useEtherServer'

type EtherServerOptions = Parameters<typeof useEtherServer>[0]
type EtherServerValue = ReturnType<typeof useEtherServer>

const EtherServerContext = createContext<EtherServerValue | null>(null)

export function EtherServerProvider({
  children,
  options,
}: {
  children: ReactNode
  options?: EtherServerOptions
}) {
  const server = useEtherServer({
    enabled: true,
    autoConnectSocket: true,
    autoLoadWorld: true,
    autoJoinWorld: true,
    autoLoadPlayer: false,
    autoSaveIntervalMs: 15000,
    playerName: 'Citoyen',
    zone: 'Quebec',
    initialPosition: { x: 0, y: 1, z: 0 },
    ...(options || {}),
  })

  return (
    <EtherServerContext.Provider value={server}>
      {children}
    </EtherServerContext.Provider>
  )
}

export function useEtherServerContext() {
  const ctx = useContext(EtherServerContext)

  if (!ctx) {
    throw new Error(
      'useEtherServerContext doit etre utilise dans <EtherServerProvider>.'
    )
  }

  return ctx
}
