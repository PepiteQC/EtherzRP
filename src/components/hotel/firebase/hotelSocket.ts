// src/components/hotel/firebase/hotelSocket.ts

import { io, type Socket } from 'socket.io-client';

/**
 * Événements Socket.IO pour l'hôtel.
 * Broadcast en temps réel des actions aux autres joueurs.
 */

export interface HotelSocketEvents {
  // Émis par le serveur
  'hotel:door:unlocked': { roomId: string; uid: string; method: string };
  'hotel:door:locked': { roomId: string; uid: string };
  'hotel:light:toggled': { roomId: string; lightOn: boolean };
  'hotel:elevator:moved': { floor: number };
  'hotel:elevator:doorOpen': { floor: number };
  'hotel:elevator:doorClose': { floor: number };
  'hotel:guest:checkin': { roomId: string; guestUid: string };
  'hotel:guest:checkout': { roomId: string };
  'hotel:intercom:ring': { roomId: string; callerUid: string };
  'hotel:alarm:fire': { floor: number };
  'hotel:alarm:intrusion': { roomId: string };

  // Émis par le client
  'hotel:intercom:call': { roomId: string };
  'hotel:elevator:request': { floor: number };
}

let hotelSocket: Socket | null = null;

export function connectHotelSocket(serverUrl: string): Socket {
  if (hotelSocket?.connected) return hotelSocket;

  hotelSocket = io(serverUrl, {
    path: '/hotel-ws',
    transports: ['websocket'],
    autoConnect: true,
  });

  hotelSocket.on('connect', () => {
    console.log('[Hotel Socket] Connected');
  });

  hotelSocket.on('disconnect', () => {
    console.log('[Hotel Socket] Disconnected');
  });

  return hotelSocket;
}

export function getHotelSocket(): Socket | null {
  return hotelSocket;
}

export function disconnectHotelSocket(): void {
  hotelSocket?.disconnect();
  hotelSocket = null;
}