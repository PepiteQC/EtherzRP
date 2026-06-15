// server/hotelSocketHandler.ts

import { Server as SocketIOServer } from 'socket.io';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Handler Socket.IO pour les événements hôtel.
 * Relaye les événements Firebase vers tous les clients connectés.
 */
export function setupHotelSocket(io: SocketIOServer): void {
  const hotelNamespace = io.of('/hotel-ws');
  const adminDb = getFirestore();

  hotelNamespace.on('connection', (socket) => {
    console.log(`[Hotel Socket] Client connected: ${socket.id}`);

    // Intercom
    socket.on('hotel:intercom:call', (data: { roomId: string }) => {
      hotelNamespace.emit('hotel:intercom:ring', {
        roomId: data.roomId,
        callerUid: socket.data.uid ?? 'unknown',
      });
    });

    // Elevator request
    socket.on('hotel:elevator:request', (data: { floor: number }) => {
      hotelNamespace.emit('hotel:elevator:moved', { floor: data.floor });
    });

    socket.on('disconnect', () => {
      console.log(`[Hotel Socket] Client disconnected: ${socket.id}`);
    });
  });

  // Listen to Firestore changes and broadcast
  adminDb.collection('hotel_rooms').onSnapshot((snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === 'modified') {
        const data = change.doc.data();
        const oldData = change.doc.data(); // Note: in production, compare with previous

        hotelNamespace.emit('hotel:light:toggled', {
          roomId: data.roomId,
          lightOn: data.lightOn,
        });
      }
    });
  });

  adminDb.collection('hotel_locks').onSnapshot((snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === 'modified') {
        const data = change.doc.data();
        if (!data.locked) {
          hotelNamespace.emit('hotel:door:unlocked', {
            roomId: data.roomId,
            uid: data.lastAccessUid,
            method: data.lastAccessMethod,
          });
        } else {
          hotelNamespace.emit('hotel:door:locked', {
            roomId: data.roomId,
            uid: data.lastAccessUid,
          });
        }
      }
    });
  });
}