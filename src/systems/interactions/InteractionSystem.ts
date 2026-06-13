export type InteractionType = 'acheter'|'parler'|'checkin' | 'hotel_room_door' | 'depanneur_door';
export interface Target { id:string; type:InteractionType; label:string; position:[number,number,number]; data?:any; }

export function checkInteractions(p:[number,number,number], t:Target[]) { 
  return t.find(x => Math.hypot(x.position[0]-p[0], x.position[2]-p[2]) < 3.2) || null; 
}

export function handleInteraction(t:Target) { 
  console.log('[J5]', t.type, t.id); 
  return t.type==='checkin' ? 'Check-in OK — chambre 204' : 'Action: ' + t.label; 
}

export function getDepanneurAndHotelTargets() { 
  return [ 
    {id:'reception', type:'checkin', label:'Réception', position:[0,1.6,18]} 
  ]; 
}

// ═══════════════════════════════════════════════════════════════
// NON-INTRUSIVE BRIDGE — new modular buildings (feature-flagged)
// These targets will be populated by BuildingsScene when ENABLE_HOTEL / ENABLE_DEPANNEUR = true
// For now they are empty so existing J5 logic is untouched.
// ═══════════════════════════════════════════════════════════════
export function getModularHotelRoomTargets(): Target[] {
  // In future: dynamically generated from HotelRegistry + Firestore status
  // Example shape (stable IDs):
  // { id: 'hotel_main_f00_r101_d01', type: 'hotel_room_door', label: 'Chambre 101', position: [...] }
  return [];
}

export function getModularDepanneurTargets(): Target[] {
  return [];
}

// ═══════════════════════════════════════════════════════════════
// NEW: Modular hotel access (uses LockSimulator only — anti-casse)
// Called from handleInteraction when a modular hotel_room_door target is hit.
// Exact path: /home/user/etherworld/src/systems/access-control/simulator/LockSimulator.ts
// ═══════════════════════════════════════════════════════════════
import { attemptRoomEntry } from '../../buildings/hotel/services/HotelAccessService';

export async function handleModularHotelRoomDoor(target: Target): Promise<string> {
  if (target.type !== 'hotel_room_door') return 'Not a hotel room door';
  
  const roomId = (target.data?.roomId || target.id.split('_d')[0]) as any;
  
  console.log('%c[Modular Access] Attempting entry via simulator for', 'color:#22c55e', roomId);
  
  const res = await attemptRoomEntry(roomId as any, 'player');
  
  const msg = res.granted 
    ? `Accès accordé (simulateur) — ${target.label}` 
    : `Accès refusé (simulateur) — ${res.message}`;
  
  console.log('%c[Modular Access]', 'color:#22c55e', msg, res);
  return msg;
}