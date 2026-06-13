import { useMemo, useSyncExternalStore } from 'react'
import { hotelRealtimeSecurity } from './HotelRealtimeSecurity'

export function useHotelSecurity() {
  const states = useSyncExternalStore(
    hotelRealtimeSecurity.subscribe,
    hotelRealtimeSecurity.getSnapshot,
    hotelRealtimeSecurity.getSnapshot
  )

  return useMemo(() => ({
    states,
    getDoorState: hotelRealtimeSecurity.getDoorState.bind(hotelRealtimeSecurity),
    getRoomDoorState: hotelRealtimeSecurity.getRoomDoorState.bind(hotelRealtimeSecurity),
    requestAccess: hotelRealtimeSecurity.requestAccess.bind(hotelRealtimeSecurity),
    toggleOpen: hotelRealtimeSecurity.toggleOpen.bind(hotelRealtimeSecurity),
    forceLock: hotelRealtimeSecurity.forceLock.bind(hotelRealtimeSecurity),
    forceUnlock: hotelRealtimeSecurity.forceUnlock.bind(hotelRealtimeSecurity),
    registerCredential: hotelRealtimeSecurity.registerCredential.bind(hotelRealtimeSecurity),
  }), [states])
}
