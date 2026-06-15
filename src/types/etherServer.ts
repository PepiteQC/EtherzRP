export type Vec3 = {
  x: number
  y: number
  z: number
}

export type EtherWeather = 'clear' | 'rain' | 'snow' | 'storm' | 'fog'

export type EtherRole =
  | 'banned'
  | 'guest'
  | 'citizen'
  | 'resident'
  | 'staff'
  | 'police'
  | 'security'
  | 'vip'
  | 'admin'
  | 'owner'

export type EtherPlayer = {
  uid: string
  email?: string | null
  name: string

  position: Vec3
  rotation?: Vec3

  health: number
  armor: number
  stamina: number
  hunger: number
  thirst: number

  cash: number
  bank: number

  job: string
  rank: string
  role: EtherRole | string
  zone: string

  updatedAt?: string
  createdAt?: string
}

export type EtherWorldState = {
  weather: EtherWeather | string
  time: string
  zone: string
  region?: string
  onlinePlayers?: number
  serverMessage?: string
  updatedAt?: string
}

export type ServerHealth = {
  ok: boolean
  service: string
  port: number
  firebaseAdmin: boolean
  firebaseError: string | null
  live: boolean
  time: string
}

export type DoorAccessRequest = {
  doorId: string
  zone?: string
  requiredRole?: EtherRole | string
}

export type DoorAccessResponse = {
  ok: boolean
  granted: boolean
  doorId: string
  zone: string
  playerRole: string
  requiredRole: string
  message: string
}

export type DoorEventPayload = {
  doorId: string
  zone?: string
  action: 'open' | 'close' | 'lock' | 'unlock' | 'force' | string
  locked?: boolean
  open?: boolean
}

export type RPAlertPayload = {
  type?: 'info' | 'warning' | 'danger' | 'police' | 'medical' | 'admin' | string
  message: string
  zone?: string
}

export type OnlineSocketPlayer = {
  socketId: string
  uid: string
  name: string
  zone: string
  position: Vec3
  rotation?: Vec3
  vehicleId?: string | null
  joinedAt?: string
  updatedAt?: string
}
