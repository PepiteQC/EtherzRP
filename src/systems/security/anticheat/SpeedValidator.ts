// src/systems/security/anticheat/SpeedValidator.ts

import { Violation } from "../types";
import { v4 as uuid } from "uuid";

export class SpeedValidator {
  // Vitesses max (unités/seconde)
  private static readonly MAX_RUN_SPEED = 12;          // à pied
  private static readonly MAX_VEHICLE_SPEED = 80;      // en voiture
  private static readonly MAX_HELI_SPEED = 120;        // en hélicoptère
  private static readonly TOLERANCE = 1.3;             // marge 30%

  static check(
    lastPos: { x: number; y: number; z: number },
    newPos: { x: number; y: number; z: number },
    deltaTimeMs: number,
    uid: string,
    isInVehicle: boolean = false,
    vehicleType: string = "car"
  ): Violation | null {
    if (deltaTimeMs <= 0) return null;

    const dx = newPos.x - lastPos.x;
    const dz = newPos.z - lastPos.z;
    const horizontalDist = Math.sqrt(dx * dx + dz * dz);
    const dtSec = deltaTimeMs / 1000;
    const speed = horizontalDist / dtSec;

    // Déterminer la vitesse max autorisée
    let maxSpeed = this.MAX_RUN_SPEED;
    if (isInVehicle) {
      maxSpeed =
        vehicleType === "heli"
          ? this.MAX_HELI_SPEED
          : this.MAX_VEHICLE_SPEED;
    }

    const limit = maxSpeed * this.TOLERANCE;

    if (speed > limit) {
      return {
        id: uuid(),
        type: "speed_hack",
        severity: speed > limit * 2 ? "critical" : "medium",
        playerUid: uid,
        playerName: "",
        description: `Speed hack: ${speed.toFixed(1)} u/s (max: ${maxSpeed})`,
        evidence: {
          speed,
          maxAllowed: maxSpeed,
          distance: horizontalDist,
          deltaTime: deltaTimeMs,
          from: lastPos,
          to: newPos,
        },
        timestamp: Date.now(),
        autoAction: "none",
      };
    }

    return null;
  }
}