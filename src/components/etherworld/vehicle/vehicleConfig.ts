import type { Vector3 } from "three";

export enum VehicleControls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  brake = "brake",
}

export type VehicleCameraMode = "follow" | "close" | "hood";

export interface VehicleZone {
  zMin: number;
  zMax: number;
  name: string;
}

export interface VehicleSavePayload {
  pos: Vector3;
  rotY: number;
}

export interface VehicleRuntimeStats {
  fuel: number;
  damage: number;
  engineOn: boolean;
  cameraMode: VehicleCameraMode;
}

export const VEHICLE_ZONES: VehicleZone[] = [
  { zMin: -950, zMax: -600, name: "Québec — Route 138 Ouest" },
  { zMin: -600, zMax: -350, name: "Donnacona · Neuville" },
  { zMin: -350, zMax: -150, name: "Cap-Santé · Grondines" },
  { zMin: -150, zMax: 150,  name: "Portneuf — Village" },
  { zMin: 150,  zMax: 400,  name: "Saint-Casimir · Batiscan" },
  { zMin: 400,  zMax: 600,  name: "Champlain — Bord du Fleuve" },
  { zMin: 600,  zMax: 950,  name: "Trois-Rivières — Approche" },
];

// Tuning arcade RP: assez simple pour rester fun, mais plus riche que le prototype initial.
export const VEHICLE_TUNING = {
  maxForwardSpeed: 42, // unités monde/seconde ≈ 145 km/h via le HUD actuel
  maxReverseSpeed: 13,
  acceleration: 24,
  reverseAcceleration: 16,
  brakeForce: 42,
  engineBrake: 7.5,
  drag: 0.42,
  maxSteer: 0.58,
  steerResponse: 7.5,
  turnRate: 2.25,
  lowSpeedTurnAssist: 0.42,
  wheelSpin: 3.2,
  hudSpeedScale: 0.8 / 42, // respecte l'ancien HUD: speed * 180
  worldLimitX: 1375,
  worldLimitZ: 940,
  vehicleGroundY: 0.5,
  collisionRadius: 1.35,
  collisionBounce: 0.18,
  collisionPadding: 1.15,
  fuelBurnIdle: 0.0012,
  fuelBurnThrottle: 0.010,
  fuelBurnSpeed: 0.0025,
  lowFuelThreshold: 12,
  damageWarningThreshold: 55,
  criticalDamageThreshold: 88,
} as const;

export const VEHICLE_CAMERA = {
  follow: {
    localPosition: [0, 3.9, 9.2] as [number, number, number],
    localTarget: [0, 1.05, -2.2] as [number, number, number],
    posLerp: 0.09,
    targetLerp: 0.12,
  },
  close: {
    localPosition: [0, 2.25, 5.2] as [number, number, number],
    localTarget: [0, 1.05, -2.2] as [number, number, number],
    posLerp: 0.13,
    targetLerp: 0.12,
  },
  hood: {
    localPosition: [0, 1.45, -2.25] as [number, number, number],
    localTarget: [0, 1.05, -18] as [number, number, number],
    posLerp: 0.22,
    targetLerp: 0.25,
  },
} as const;

export function nextCameraMode(mode: VehicleCameraMode): VehicleCameraMode {
  if (mode === "follow") return "close";
  if (mode === "close") return "hood";
  return "follow";
}

export function vehicleHint(message: string, duration = 2200) {
  window.dispatchEvent(new CustomEvent("hud-notification", {
    detail: { message, duration },
  }));
}
