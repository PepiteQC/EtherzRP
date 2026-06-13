/**
 * hotel-ultra/index.ts — Barrel export complet
 */

// ── Existants ──
export { default as HotelComplete3D } from './HotelComplete3D'
export { default as HotelCorridor3D } from './HotelCorridor3D'
export { default as HotelElevator3D } from './HotelElevator3D'
export { default as HotelLobby3D }    from './HotelLobby3D'
export { default as HotelStore }      from './HotelStore'

// ── Nouveaux ──
export { HotelRoom3D }         from './HotelRoom3D'
export { HotelRestaurant3D }   from './HotelRestaurant3D'
export { HotelPool3D }         from './HotelPool3D'

// ── NPCs ──
export {
  HotelReceptionist,
  HotelGuest,
  HotelConcierge,
  HotelBellhop,
} from './HotelNPC3D'

// ── Jobs ──
export {
  useHotelJobs,
  HotelJobsUI,
} from './HotelJobs3D'
export type {
  HotelJobId,
  JobStatus,
  JobTask,
  HotelJob,
} from './HotelJobs3D'

// ── UI ──
export {
  HotelHUD,
  useHotelNotifications,
} from './HotelUI'

// ── Ambient ──
export { HotelAmbient } from './HotelAmbient'