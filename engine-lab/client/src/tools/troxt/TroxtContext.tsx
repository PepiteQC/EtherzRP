/**
 * C:\etherworldQC\engine-lab\client\src\tools\troxt\TroxtContext.tsx
 *
 * Provider React global de TROXT.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  PropsWithChildren,
} from 'react'

import {
  installTroxtAgent,
} from './TroxtAgent'

import {
  TROXT_EVENTS,
} from './events'

import type {
  TroxtStatus,
} from './types'

interface TroxtContextValue {
  status: TroxtStatus
  statusLabel: string
  isReady: boolean
  isBusy: boolean
}

const TroxtContext =
  createContext<TroxtContextValue | null>(
    null
  )

export function TroxtProvider({
  children,
}: PropsWithChildren) {
  const [status, setStatus] =
    useState<TroxtStatus>('ready')

  const [
    statusLabel,
    setStatusLabel,
  ] = useState('TROXT prêt')

  useEffect(() => {
    const uninstallAgent =
      installTroxtAgent()

    const handleStatus = (
      event: Event
    ): void => {
      const customEvent =
        event as CustomEvent<{
          status: TroxtStatus
          label?: string
        }>

      const detail =
        customEvent.detail

      if (!detail) {
        return
      }

      setStatus(detail.status)

      setStatusLabel(
        detail.label ??
          detail.status
      )
    }

    window.addEventListener(
      TROXT_EVENTS.status,
      handleStatus
    )

    return () => {
      window.removeEventListener(
        TROXT_EVENTS.status,
        handleStatus
      )

      uninstallAgent()
    }
  }, [])

  const value =
    useMemo<TroxtContextValue>(
      () => ({
        status,
        statusLabel,

        isReady:
          status === 'ready',

        isBusy:
          status === 'thinking' ||
          status === 'working',
      }),
      [
        status,
        statusLabel,
      ]
    )

  return (
    <TroxtContext.Provider
      value={value}
    >
      {children}
    </TroxtContext.Provider>
  )
}

export function useTroxt(): TroxtContextValue {
  const context =
    useContext(TroxtContext)

  if (!context) {
    throw new Error(
      'useTroxt doit être utilisé dans TroxtProvider.'
    )
  }

  return context
}
