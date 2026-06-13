import * as THREE from "three";
import BUILDINGS from "../../../data/quebecBuildings";
import { VEHICLE_TUNING } from "./vehicleConfig";

export interface VehicleObstacle {
  id: string;
  name: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface CollisionResolveResult {
  collided: boolean;
  obstacle?: VehicleObstacle;
  correction: THREE.Vector3;
  normal: THREE.Vector3;
}

export const VEHICLE_OBSTACLES: VehicleObstacle[] = BUILDINGS.map((b) => {
  const [x, , z] = b.pos;
  const [w, , d] = b.size;
  const padding = VEHICLE_TUNING.collisionPadding;

  return {
    id: b.id,
    name: b.name,
    minX: x - w / 2 - padding,
    maxX: x + w / 2 + padding,
    minZ: z - d / 2 - padding,
    maxZ: z + d / 2 + padding,
  };
});

function closestPointOnObstacle(pos: THREE.Vector3, obstacle: VehicleObstacle) {
  return new THREE.Vector3(
    THREE.MathUtils.clamp(pos.x, obstacle.minX, obstacle.maxX),
    pos.y,
    THREE.MathUtils.clamp(pos.z, obstacle.minZ, obstacle.maxZ)
  );
}

export function resolveVehicleObstacleCollision(
  pos: THREE.Vector3,
  radius = VEHICLE_TUNING.collisionRadius
): CollisionResolveResult {
  for (const obstacle of VEHICLE_OBSTACLES) {
    const closest = closestPointOnObstacle(pos, obstacle);
    const dx = pos.x - closest.x;
    const dz = pos.z - closest.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      const dist = Math.sqrt(Math.max(distSq, 0.000001));
      const normal = new THREE.Vector3(dx / dist, 0, dz / dist);

      // Si le centre est déjà dans la boîte, choisir l'axe de sortie le plus court.
      if (!Number.isFinite(normal.x) || !Number.isFinite(normal.z) || dist < 0.002) {
        const left = Math.abs(pos.x - obstacle.minX);
        const right = Math.abs(obstacle.maxX - pos.x);
        const back = Math.abs(pos.z - obstacle.minZ);
        const front = Math.abs(obstacle.maxZ - pos.z);
        const min = Math.min(left, right, back, front);

        if (min === left) normal.set(-1, 0, 0);
        else if (min === right) normal.set(1, 0, 0);
        else if (min === back) normal.set(0, 0, -1);
        else normal.set(0, 0, 1);
      }

      const penetration = radius - Math.sqrt(distSq);
      const correction = normal.clone().multiplyScalar(Math.max(penetration, radius * 0.65));
      pos.add(correction);

      return {
        collided: true,
        obstacle,
        correction,
        normal,
      };
    }
  }

  return {
    collided: false,
    correction: new THREE.Vector3(),
    normal: new THREE.Vector3(),
  };
}

export function clampVehicleToWorld(pos: THREE.Vector3) {
  pos.x = THREE.MathUtils.clamp(pos.x, -VEHICLE_TUNING.worldLimitX, VEHICLE_TUNING.worldLimitX);
  pos.z = THREE.MathUtils.clamp(pos.z, -VEHICLE_TUNING.worldLimitZ, VEHICLE_TUNING.worldLimitZ);
  pos.y = VEHICLE_TUNING.vehicleGroundY;
}
