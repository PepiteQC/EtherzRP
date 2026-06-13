// ════════════════════════════════════════════════════════════════
// SAVE SYSTEM — EtherWorld QC RP
// ════════════════════════════════════════════════════════════════

const SAVE_KEY = 'etherworld-qcrp-save'

export interface SaveData {
  version: number
  mode: 'driving' | 'walking'
  vehiclePos: [number, number, number]
  vehicleRotY: number
  walkerPos?: [number, number, number]
  zone: string
  money: number
  savedAt: number
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SaveData
    if (!data.version || !data.mode) return null
    return data
  } catch {
    return null
  }
}

export function writeSave(data: Omit<SaveData, 'savedAt'>): void {
  try {
    const full: SaveData = { ...data, savedAt: Date.now() }
    localStorage.setItem(SAVE_KEY, JSON.stringify(full))
  } catch {
    console.warn('Impossible de sauvegarder')
  }
}

export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    console.warn('Impossible de supprimer la sauvegarde')
  }
}