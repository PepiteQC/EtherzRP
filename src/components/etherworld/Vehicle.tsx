import { useRef, useEffect, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import VehicleModel from "./vehicle/VehicleModel";
import { useGarageStore } from "./garage";
import VehicleSkidMarks, { type VehicleSkidMarksApi } from "./vehicle/VehicleSkidMarks";
import VehicleInteractionTargets from "./vehicle/VehicleInteractionTargets";
import {
  VEHICLE_CAMERA,
  VEHICLE_TUNING,
  VEHICLE_ZONES,
  VehicleControls,
  nextCameraMode,
  vehicleHint,
  type VehicleCameraMode,
} from "./vehicle/vehicleConfig";
import {
  clampVehicleToWorld,
  resolveVehicleObstacleCollision,
} from "./vehicle/vehicleCollision";
import {
  computeCollisionDamage,
  computeFuelBurn,
  stepVehiclePhysics,
} from "./vehicle/vehiclePhysics";

interface VehicleProps {
  active: boolean;
  onSpeedChange: (speed: number) => void;
  onZoneChange: (zone: string) => void;
  onExitVehicle: (pos: THREE.Vector3) => void;
  worldPositionRef: MutableRefObject<THREE.Vector3>;
  initialPosition?: [number, number, number];
  initialRotationY?: number;
  saveRef?: MutableRefObject<{ pos: THREE.Vector3; rotY: number }>;
}

export default function Vehicle({
  active,
  onSpeedChange,
  onZoneChange,
  onExitVehicle,
  worldPositionRef,
  initialPosition = [0, 0.5, -700],
  initialRotationY = 0,
  saveRef,
}: VehicleProps) {
  const vehicleRef = useRef<THREE.Group>(null!);
  const wheelRefs = useRef<(THREE.Group | null)[]>([]);
  const frontSteerRefs = useRef<(THREE.Group | null)[]>([]);
  const brakeMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const reverseMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const headGlowRef = useRef<THREE.Group | null>(null);
  const skidRef = useRef<VehicleSkidMarksApi | null>(null);

  const speedRef = useRef(0); // unités monde / seconde
  const steeringRef = useRef(0);
  const fuelRef = useRef(useGarageStore.getState().vehicleFuel);
  const damageRef = useRef(useGarageStore.getState().vehicleDamage);
  const engineOnRef = useRef(useGarageStore.getState().engineOn);
  const appliedGarageRevisionRef = useRef(useGarageStore.getState().externalRevision);
  const telemetryTimerRef = useRef(0);
  const paintColor = useGarageStore(s => s.vehiclePaintColor);
  const cameraModeRef = useRef<VehicleCameraMode>("follow");
  const currentZone = useRef("");
  const skidTimerRef = useRef(0);
  const lastImpactNotificationRef = useRef(0);
  const warningsRef = useRef({ lowFuel: false, criticalDamage: false, noFuel: false });
  const keyLatch = useRef({ e: false, v: false, i: false, r: false });

  const [, getState] = useKeyboardControls<VehicleControls>();
  const { camera } = useThree();
  const cameraTarget = useRef(new THREE.Vector3());
  const forwardVector = useRef(new THREE.Vector3());
  const sideVector = useRef(new THREE.Vector3());
  const localPoint = useRef(new THREE.Vector3());

  useEffect(() => {
    if (vehicleRef.current) {
      vehicleRef.current.position.set(...initialPosition);
      vehicleRef.current.rotation.y = initialRotationY;
      cameraTarget.current.set(initialPosition[0], initialPosition[1] + 1, initialPosition[2]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "KeyE" && !keyLatch.current.e) {
        keyLatch.current.e = true;
        if (vehicleRef.current) onExitVehicle(vehicleRef.current.position.clone());
      }

      if (e.code === "KeyV" && !keyLatch.current.v) {
        keyLatch.current.v = true;
        cameraModeRef.current = nextCameraMode(cameraModeRef.current);
        vehicleHint(`Caméra véhicule: ${cameraModeRef.current.toUpperCase()}`);
      }

      if (e.code === "KeyI" && !keyLatch.current.i) {
        keyLatch.current.i = true;
        if (fuelRef.current <= 0) {
          vehicleHint("Réservoir vide — impossible de démarrer", 2600);
          engineOnRef.current = false;
          return;
        }
        if (damageRef.current >= 98) {
          vehicleHint("Moteur trop endommagé", 2600);
          engineOnRef.current = false;
          return;
        }
        engineOnRef.current = !engineOnRef.current;
        if (!engineOnRef.current) speedRef.current *= 0.35;
        vehicleHint(engineOnRef.current ? "Moteur démarré" : "Moteur coupé");
      }

      if (e.code === "KeyR" && !keyLatch.current.r) {
        keyLatch.current.r = true;
        if (vehicleRef.current) {
          vehicleRef.current.position.y = VEHICLE_TUNING.vehicleGroundY;
          vehicleRef.current.rotation.z = 0;
          vehicleRef.current.rotation.x = 0;
          speedRef.current = 0;
          vehicleHint("Véhicule stabilisé");
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyE") keyLatch.current.e = false;
      if (e.code === "KeyV") keyLatch.current.v = false;
      if (e.code === "KeyI") keyLatch.current.i = false;
      if (e.code === "KeyR") keyLatch.current.r = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [active, onExitVehicle]);

  useFrame((_, delta) => {
    if (!vehicleRef.current) return;

    const vehicle = vehicleRef.current;
    const pos = vehicle.position;
    const dt = Math.min(delta, 0.05);
    const controls = getState();

    const garageState = useGarageStore.getState();
    if (garageState.externalRevision !== appliedGarageRevisionRef.current) {
      appliedGarageRevisionRef.current = garageState.externalRevision;
      fuelRef.current = garageState.vehicleFuel;
      damageRef.current = garageState.vehicleDamage;
    }

    worldPositionRef.current.copy(pos);

    if (saveRef) {
      saveRef.current.pos.copy(pos);
      saveRef.current.rotY = vehicle.rotation.y;
    }

    if (!active) {
      speedRef.current = THREE.MathUtils.damp(speedRef.current, 0, 5, dt);
      onSpeedChange(Math.abs(speedRef.current) * VEHICLE_TUNING.hudSpeedScale);
      return;
    }

    const physics = stepVehiclePhysics(
      { speed: speedRef.current, steering: steeringRef.current },
      {
        forward: controls.forward,
        back: controls.back,
        left: controls.left,
        right: controls.right,
        brake: controls.brake,
        engineOn: engineOnRef.current,
        fuel: fuelRef.current,
        damage: damageRef.current,
      },
      dt
    );

    speedRef.current = physics.speed;
    steeringRef.current = physics.steering;

    if (physics.throttleLocked && fuelRef.current <= 0 && !warningsRef.current.noFuel) {
      warningsRef.current.noFuel = true;
      vehicleHint("Réservoir vide — trouve une station-service", 3500);
    }

    // Essence: local pour l'instant, prêt à être branché au HUD/store plus tard.
    fuelRef.current = Math.max(0, fuelRef.current - computeFuelBurn({
      dt,
      engineOn: engineOnRef.current,
      accelerating: physics.accelerating,
      reversing: physics.reversing,
      speedRatio: physics.speedRatio,
      damage: damageRef.current,
    }));

    if (fuelRef.current <= VEHICLE_TUNING.lowFuelThreshold && !warningsRef.current.lowFuel) {
      warningsRef.current.lowFuel = true;
      vehicleHint("Essence basse — pense à faire le plein", 3200);
    }
    if (fuelRef.current <= 0) {
      engineOnRef.current = false;
    }

    telemetryTimerRef.current += dt;
    if (telemetryTimerRef.current > 0.2) {
      telemetryTimerRef.current = 0;
      useGarageStore.getState().setVehicleTelemetry({
        vehicleFuel: fuelRef.current,
        vehicleDamage: damageRef.current,
        engineOn: engineOnRef.current,
      });
    }

    // Direction / déplacement.
    if (physics.speedAbs > 0.15) {
      const lowSpeedAssist = THREE.MathUtils.lerp(
        VEHICLE_TUNING.lowSpeedTurnAssist,
        1,
        physics.speedRatio
      );
      vehicle.rotation.y += steeringRef.current * VEHICLE_TUNING.turnRate * lowSpeedAssist * dt * physics.movingSign;
    }

    forwardVector.current.set(0, 0, -1).applyQuaternion(vehicle.quaternion);
    pos.addScaledVector(forwardVector.current, speedRef.current * dt);

    const driftAmount = physics.braking && Math.abs(steeringRef.current) > 0.18 && physics.speedRatio > 0.35
      ? steeringRef.current * physics.speedRatio * 2.8 * dt
      : 0;
    if (driftAmount) {
      sideVector.current.set(1, 0, 0).applyQuaternion(vehicle.quaternion);
      pos.addScaledVector(sideVector.current, driftAmount);
    }

    clampVehicleToWorld(pos);

    // Collision simple avec les bâtiments interactifs existants.
    const collision = resolveVehicleObstacleCollision(pos);
    if (collision.collided) {
      const impactSpeed = physics.speedAbs;
      const addedDamage = computeCollisionDamage(impactSpeed);
      damageRef.current = Math.min(100, damageRef.current + addedDamage);
      speedRef.current *= -VEHICLE_TUNING.collisionBounce;

      const now = performance.now();
      if (impactSpeed > 9 && now - lastImpactNotificationRef.current > 1200) {
        lastImpactNotificationRef.current = now;
        vehicleHint(
          `Impact: ${collision.obstacle?.name ?? "obstacle"} · dégâts ${Math.round(damageRef.current)}%`,
          2800
        );
      }

      if (damageRef.current >= VEHICLE_TUNING.criticalDamageThreshold && !warningsRef.current.criticalDamage) {
        warningsRef.current.criticalDamage = true;
        vehicleHint("Véhicule très endommagé — va au garage", 3600);
      }
    }

    // Visuel body/suspension.
    vehicle.rotation.z = THREE.MathUtils.damp(vehicle.rotation.z, -steeringRef.current * physics.speedRatio * 0.08, 8, dt);
    vehicle.rotation.x = THREE.MathUtils.damp(vehicle.rotation.x, physics.accelerating ? -0.018 : physics.braking ? 0.025 : 0, 7, dt);

    // Roues: rotation + angle des roues avant.
    wheelRefs.current.forEach((wheel) => {
      if (wheel) wheel.rotation.x += speedRef.current * dt * VEHICLE_TUNING.wheelSpin;
    });
    frontSteerRefs.current.forEach((pivot) => {
      if (pivot) pivot.rotation.y = THREE.MathUtils.damp(pivot.rotation.y, -steeringRef.current * 0.75, 12, dt);
    });

    // Traces de pneus quand ça freine ou drift.
    skidTimerRef.current += dt;
    const shouldSkid = (physics.braking || Math.abs(driftAmount) > 0.001) && physics.speedRatio > 0.22;
    if (shouldSkid && skidTimerRef.current > 0.075 && skidRef.current) {
      skidTimerRef.current = 0;
      const intensity = THREE.MathUtils.clamp(physics.speedRatio + Math.abs(steeringRef.current) * 0.7, 0.25, 1);
      localPoint.current.set(-0.72, 0.04, 1.55).applyMatrix4(vehicle.matrixWorld);
      skidRef.current.addMark(localPoint.current, vehicle.rotation.y, intensity);
      localPoint.current.set(0.72, 0.04, 1.55).applyMatrix4(vehicle.matrixWorld);
      skidRef.current.addMark(localPoint.current, vehicle.rotation.y, intensity);
    }

    // Lumières dynamiques.
    if (brakeMatRef.current) {
      brakeMatRef.current.color.set(physics.braking || speedRef.current < -0.5 ? "#ff2525" : "#7a0808");
      brakeMatRef.current.opacity = physics.braking ? 1 : 0.72;
    }
    if (reverseMatRef.current) {
      reverseMatRef.current.opacity = physics.reversing && speedRef.current <= 1 ? 1 : 0.18;
    }
    if (headGlowRef.current) {
      headGlowRef.current.visible = engineOnRef.current;
    }

    // Caméra: V alterne follow / close / hood.
    const mode = cameraModeRef.current;
    const cameraCfg = VEHICLE_CAMERA[mode];
    const desiredCamPos = new THREE.Vector3(...cameraCfg.localPosition).applyMatrix4(vehicle.matrixWorld);
    const desiredTarget = new THREE.Vector3(...cameraCfg.localTarget).applyMatrix4(vehicle.matrixWorld);
    camera.position.lerp(desiredCamPos, cameraCfg.posLerp);
    cameraTarget.current.lerp(desiredTarget, cameraCfg.targetLerp);
    camera.lookAt(cameraTarget.current);

    onSpeedChange(Math.abs(speedRef.current) * VEHICLE_TUNING.hudSpeedScale);

    const z = pos.z;
    for (const zone of VEHICLE_ZONES) {
      if (z >= zone.zMin && z <= zone.zMax) {
        if (currentZone.current !== zone.name) {
          currentZone.current = zone.name;
          onZoneChange(zone.name);
        }
        break;
      }
    }
  });

  return (
    <>
      <VehicleSkidMarks ref={skidRef} />
      <group ref={vehicleRef} name="EtherzRPVehicle">
        <VehicleModel
          wheelRefs={wheelRefs}
          frontSteerRefs={frontSteerRefs}
          brakeMatRef={brakeMatRef}
          reverseMatRef={reverseMatRef}
          headGlowRef={headGlowRef}
          bodyColor={paintColor}
        />
        <VehicleInteractionTargets />
      </group>
    </>
  );
}
