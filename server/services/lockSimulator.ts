// server/services/lockSimulator.ts

/**
 * Simulateur de serrure connectée.
 * Anti-casse #17: créer un simulateur avant de connecter une vraie serrure.
 * Anti-casse #16: ne jamais tester une nouvelle commande sur une porte occupée.
 */

export interface LockState {
  locked: boolean;
  deadboltEngaged: boolean;
  batteryLevel: number;
  lastCommand: string | null;
  lastCommandAt: Date | null;
  firmwareVersion: string;
}

export interface LockCommand {
  type: 'unlock' | 'lock' | 'deadbolt_engage' | 'deadbolt_disengage' | 'battery_check';
  roomId: string;
  requestedBy: string;
  method: 'keycard' | 'pin' | 'mechanical' | 'override';
}

export interface LockResponse {
  success: boolean;
  state: LockState;
  error?: string;
  responseTimeMs: number;
}

const lockStates = new Map<string, LockState>();

function getOrCreateLock(roomId: string): LockState {
  if (!lockStates.has(roomId)) {
    lockStates.set(roomId, {
      locked: true,
      deadboltEngaged: false,
      batteryLevel: 95 + Math.floor(Math.random() * 5),
      lastCommand: null,
      lastCommandAt: null,
      firmwareVersion: '2.1.4',
    });
  }
  return lockStates.get(roomId)!;
}

/**
 * Simule l'envoi d'une commande à une serrure physique.
 * En production, ceci serait remplacé par l'API du fabricant de serrures.
 */
export async function sendLockCommand(command: LockCommand): Promise<LockResponse> {
  const startTime = Date.now();

  // Simuler un délai réseau (50-200ms)
  const delay = 50 + Math.random() * 150;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const state = getOrCreateLock(command.roomId);

  // Simuler des échecs occasionnels (2% de chance)
  if (Math.random() < 0.02) {
    return {
      success: false,
      state,
      error: 'Communication timeout with lock hardware',
      responseTimeMs: Date.now() - startTime,
    };
  }

  // Simuler batterie faible
  if (state.batteryLevel < 10 && command.type !== 'battery_check') {
    return {
      success: false,
      state,
      error: 'Battery critically low. Replace batteries.',
      responseTimeMs: Date.now() - startTime,
    };
  }

  switch (command.type) {
    case 'unlock':
      if (state.deadboltEngaged && command.method !== 'override') {
        return {
          success: false,
          state,
          error: 'Deadbolt is engaged from inside',
          responseTimeMs: Date.now() - startTime,
        };
      }
      state.locked = false;
      state.batteryLevel = Math.max(0, state.batteryLevel - 0.1);
      break;

    case 'lock':
      state.locked = true;
      state.batteryLevel = Math.max(0, state.batteryLevel - 0.05);
      break;

    case 'deadbolt_engage':
      state.deadboltEngaged = true;
      state.batteryLevel = Math.max(0, state.batteryLevel - 0.1);
      break;

    case 'deadbolt_disengage':
      state.deadboltEngaged = false;
      state.batteryLevel = Math.max(0, state.batteryLevel - 0.1);
      break;

    case 'battery_check':
      // No state change
      break;
  }

  state.lastCommand = command.type;
  state.lastCommandAt = new Date();

  return {
    success: true,
    state: { ...state },
    responseTimeMs: Date.now() - startTime,
  };
}

/**
 * Vérifie le niveau de batterie de toutes les serrures.
 * À exécuter via un cron job.
 */
export function checkAllBatteries(): Array<{
  roomId: string;
  batteryLevel: number;
  needsReplacement: boolean;
}> {
  const results: Array<{
    roomId: string;
    batteryLevel: number;
    needsReplacement: boolean;
  }> = [];

  lockStates.forEach((state, roomId) => {
    results.push({
      roomId,
      batteryLevel: state.batteryLevel,
      needsReplacement: state.batteryLevel < 20,
    });
  });

  return results;
}

/**
 * Simule le remplacement des piles d'une serrure.
 */
export function replaceBattery(roomId: string): void {
  const state = getOrCreateLock(roomId);
  state.batteryLevel = 100;
}