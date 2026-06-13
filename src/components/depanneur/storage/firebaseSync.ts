import { useEffect, useState } from 'react'
import type { Product, StoreState, Transaction, SyncStatus } from './types'

export async function uploadInventory(_inventory: Product[]): Promise<void> {}
export async function downloadInventory(): Promise<Product[]> { return [] }
export async function uploadStoreState(_state: Partial<StoreState>): Promise<void> {}
export async function uploadPendingTransactions(_transactions: Transaction[]): Promise<void> {}

export function subscribeInventory(callback: (products: Product[]) => void): () => void {
  callback([])
  return () => undefined
}

const synced = (): SyncStatus => ({ lastSync: Date.now(), pending: false, error: null })

export function useDepanneurSync() {
  const [status, setStatus] = useState<SyncStatus>(synced())

  useEffect(() => {
    setStatus(synced())
  }, [])

  return {
    status,
    syncNow: async () => {
      setStatus({ lastSync: status.lastSync, pending: true, error: null })
      setStatus(synced())
    },
  }
}
