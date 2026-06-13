export interface EtherworldCharacterProfile {
  id: string
  ownerId: string
  name: string
  origin: 'Portneuf' | 'Québec' | 'Trois-Rivières' | 'Côte-Nord' | 'Montréal' | 'Autre'
  style: 'civil' | 'travailleur' | 'police' | 'medic' | 'mecano'
  createdAt: number
  updatedAt: number
}

const CHARACTER_KEY_PREFIX = 'etherzrp-character:'

export function getCharacterStorageKey(ownerId = 'local-player') {
  return `${CHARACTER_KEY_PREFIX}${ownerId}`
}

export function loadCharacterProfile(ownerId = 'local-player'): EtherworldCharacterProfile | null {
  try {
    const raw = localStorage.getItem(getCharacterStorageKey(ownerId))
    return raw ? JSON.parse(raw) as EtherworldCharacterProfile : null
  } catch {
    return null
  }
}

export function saveCharacterProfile(ownerId: string, profile: Omit<EtherworldCharacterProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
  const existing = loadCharacterProfile(ownerId)
  const now = Date.now()
  const next: EtherworldCharacterProfile = {
    id: existing?.id ?? `char_${now}_${Math.random().toString(36).slice(2, 8)}`,
    ownerId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ...profile,
  }
  localStorage.setItem(getCharacterStorageKey(ownerId), JSON.stringify(next))
  return next
}

export function hasCharacterProfile(ownerId = 'local-player') {
  return Boolean(loadCharacterProfile(ownerId))
}
