// src/systems/security/anticheat/PositionValidator.ts

import { Violation, ViolationType } from "../types";
import { v4 as uuid } from "uuid";

export class PositionValidator {
  // Seuils
  private static readonly MAX_TELEPORT_DISTANCE = 50;   // unités Three.js
  private static readonly MIN_TIME_BETWEEN_CHECKS = 100; // ms

  static check(
    lastPos: { x: number; y: number; z: number },
    newPos: { x: number; y: number; z: number },
    lastTime: number,
    uid: string
  ): Violation | null {
    const dt = Date.now() - lastTime;
    if (dt < this.MIN_TIME_BETWEEN_CHECKS) return null;

    const dx = newPos.x - lastPos.x;
    const dy = newPos.y - lastPos.y;
    const dz = newPos.z - lastPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Vérifier la téléportation
    if (distance > this.MAX_TELEPORT_DISTANCE) {
      return {
        id: uuid(),
        type: "teleport_hack",
        severity: "high",
        playerUid: uid,
        playerName: "",
        description: `Téléportation suspecte: ${distance.toFixed(1)} unités en ${dt}ms`,
        evidence: {
          from: lastPos,
          to: newPos,
          distance,
          deltaTime: dt,
        },
        timestamp: Date.now(),
        autoAction: "none",
      };
    }

    // Vérifier fly hack (Y trop haut sans véhicule)
    if (newPos.y > 100 && dy > 20) {
      return {
        id: uuid(),
        type: "fly_hack",
        severity: "high",
        playerUid: uid,
        playerName: "",
        description: `Fly hack détecté: Y=${newPos.y.toFixed(1)}`,
        evidence: { position: newPos, deltaY: dy },
        timestamp: Date.now(),
        autoAction: "none",
      };
    }

    return null;
  }
}