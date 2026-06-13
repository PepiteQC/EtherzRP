import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import type { DoorZone } from "../../data/quebecBuildings";
import { useGarageStore } from "./garage";
import { hasVehicleKey, notifyKeyRequired } from "./vehicle/VehicleKeys";
import type { CharacterState } from "../../systems/character/CharacterStateMachine";
import {
  DEFAULT_BODY_CONDITION,
  gaitController,
  type GaitConfig,
} from "../../systems/character/GaitController";
import type { BodyCondition } from "../../systems/character/InjuryController";

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  brake = "brake",
}

const ZONES: { zMin: number; zMax: number; name: string }[] = [
  { zMin: -950, zMax: -600, name: "Québec — Route 138 Ouest" },
  { zMin: -600, zMax: -350, name: "Donnacona · Neuville" },
  { zMin: -350, zMax: -150, name: "Cap-Santé · Grondines" },
  { zMin: -150, zMax: 150,  name: "Portneuf — Village" },
  { zMin: 150,  zMax: 400,  name: "Saint-Casimir · Batiscan" },
  { zMin: 400,  zMax: 600,  name: "Champlain — Bord du Fleuve" },
  { zMin: 600,  zMax: 950,  name: "Trois-Rivières — Approche" },
];

interface WalkerProps {
  startPosition: THREE.Vector3;
  onSpeedChange: (speed: number) => void;
  onZoneChange: (zone: string, pos?: THREE.Vector3) => void;
  onEnterVehicle: () => void;
  vehiclePosition: React.MutableRefObject<THREE.Vector3>;
  saveRef?: React.MutableRefObject<THREE.Vector3>;
  buildingZones?: DoorZone[];
  onNearBuilding?: (zone: DoorZone | null) => void;
  onInteractBuilding?: (zone: DoorZone) => void;
}

function cloneDefaultCondition(): BodyCondition {
  return {
    ...DEFAULT_BODY_CONDITION,
    injuries: [...DEFAULT_BODY_CONDITION.injuries],
  };
}

function notify(message: string) {
  window.dispatchEvent(new CustomEvent("hud-notification", {
    detail: { message, duration: 2200 },
  }));
}

export default function Walker({
  startPosition,
  onSpeedChange,
  onZoneChange,
  onEnterVehicle,
  vehiclePosition,
  saveRef,
  buildingZones,
  onNearBuilding,
  onInteractBuilding,
}: WalkerProps) {
  const walkerRef = useRef<THREE.Group>(null!);
  const visualRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Mesh>(null!);
  const rightArmRef = useRef<THREE.Mesh>(null!);
  const leftLegRef = useRef<THREE.Mesh>(null!);
  const rightLegRef = useRef<THREE.Mesh>(null!);

  const facingAngle = useRef(0);
  const bobRef = useRef(0);
  const currentSpeedRef = useRef(0);
  const currentZone = useRef("");
  const ePressed = useRef(false);
  const nearBuildingRef = useRef<DoorZone | null>(null);

  // Runtime RP local. Plus tard: brancher sur le store/CharacterStateMachine global.
  const charStateRef = useRef<CharacterState>("NORMAL");
  const bodyConditionRef = useRef<BodyCondition>(cloneDefaultCondition());
  const gaitRef = useRef<GaitConfig>(gaitController.getProfile("idle"));
  const extraKeys = useRef({ sprint: false, sneak: false, weapon: false, handsUp: false });

  const [, getState] = useKeyboardControls<Controls>();
  const { camera } = useThree();
  const cameraTarget = useRef(new THREE.Vector3());
  const moveDir = useRef(new THREE.Vector3());
  const cameraForward = useRef(new THREE.Vector3());
  const cameraRight = useRef(new THREE.Vector3());

  useEffect(() => {
    if (walkerRef.current) {
      walkerRef.current.position.copy(startPosition);
      walkerRef.current.position.x += 3;
      walkerRef.current.position.y = 1.0;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "ShiftLeft" || e.code === "ShiftRight") extraKeys.current.sprint = true;
      if (e.code === "ControlLeft" || e.code === "ControlRight") extraKeys.current.sneak = true;

      // Outils RP locaux, utiles avant le branchement complet admin/store.
      if (e.code === "KeyH" && !extraKeys.current.handsUp) {
        extraKeys.current.handsUp = true;
        charStateRef.current = charStateRef.current === "HANDS_UP" ? "NORMAL" : "HANDS_UP";
        notify(charStateRef.current === "HANDS_UP" ? "Mains en l'air" : "Posture normale");
      }
      if (e.code === "Digit1") {
        extraKeys.current.weapon = !extraKeys.current.weapon;
        notify(extraKeys.current.weapon ? "Posture combat" : "Arme rangée");
      }

      if (e.code === "KeyE" && !ePressed.current) {
        ePressed.current = true;
        const gait = gaitRef.current;

        // Building interaction takes priority.
        if (nearBuildingRef.current && onInteractBuilding && gait.canInteract) {
          onInteractBuilding(nearBuildingRef.current);
          return;
        }

        // Check vehicle proximity.
        if (walkerRef.current && vehiclePosition.current && gait.canEnterVehicle) {
          const dist = walkerRef.current.position.distanceTo(vehiclePosition.current);
          if (dist < 6) {
            const garageState = useGarageStore.getState();
            if (!hasVehicleKey(garageState.vehiclePlate)) {
              notifyKeyRequired();
              return;
            }
            if (garageState.vehicleLocked) {
              notify("Véhicule verrouillé");
              return;
            }
            onEnterVehicle();
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyE") ePressed.current = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") extraKeys.current.sprint = false;
      if (e.code === "ControlLeft" || e.code === "ControlRight") extraKeys.current.sneak = false;
      if (e.code === "KeyH") extraKeys.current.handsUp = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [onEnterVehicle, vehiclePosition, onInteractBuilding]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    if (!walkerRef.current) return;

    const controls = getState();
    const dt = Math.min(delta, 0.05);
    const pos = walkerRef.current.position;

    const rawMoving = controls.forward || controls.back || controls.left || controls.right;
    const gait = gaitController.resolve({
      charState: charStateRef.current,
      bodyCondition: bodyConditionRef.current,
      isMoving: rawMoving,
      isSprinting: extraKeys.current.sprint || controls.brake,
      hasWeapon: extraKeys.current.weapon,
      isSneaking: extraKeys.current.sneak,
      stamina01: 1,
      surface: pos.z < -650 ? "asphalt" : "grass",
    });
    gaitRef.current = gait;

    // Direction relative caméra.
    cameraForward.current
      .set(camera.position.x - pos.x, 0, camera.position.z - pos.z)
      .normalize()
      .multiplyScalar(-1);
    if (!Number.isFinite(cameraForward.current.x)) cameraForward.current.set(0, 0, -1);
    cameraRight.current.set(cameraForward.current.z, 0, -cameraForward.current.x).normalize();

    moveDir.current.set(0, 0, 0);
    if (controls.forward) moveDir.current.add(cameraForward.current);
    if (controls.back) moveDir.current.addScaledVector(cameraForward.current, -0.72);

    if (gait.canStrafe) {
      if (controls.left) moveDir.current.addScaledVector(cameraRight.current, -0.82);
      if (controls.right) moveDir.current.addScaledVector(cameraRight.current, 0.82);
    } else {
      if (controls.left) facingAngle.current += gait.turnMult * 2.2 * dt;
      if (controls.right) facingAngle.current -= gait.turnMult * 2.2 * dt;
    }

    let worldSpeed = 0;
    if (moveDir.current.lengthSq() > 0.0001 && gait.speedMult > 0) {
      moveDir.current.normalize();
      const targetAngle = Math.atan2(moveDir.current.x, moveDir.current.z);
      facingAngle.current = THREE.MathUtils.lerp(facingAngle.current, targetAngle, 0.22 * gait.turnMult);
      walkerRef.current.rotation.y = facingAngle.current;

      const baseMetersPerSecond = 5.4;
      worldSpeed = baseMetersPerSecond * gait.speedMult;
      pos.addScaledVector(moveDir.current, worldSpeed * dt);
      bobRef.current += dt * (8.5 + worldSpeed * 0.65);
    } else {
      walkerRef.current.rotation.y = THREE.MathUtils.lerp(walkerRef.current.rotation.y, facingAngle.current, 0.12);
      bobRef.current = THREE.MathUtils.damp(bobRef.current, Math.round(bobRef.current / Math.PI) * Math.PI, 4, dt);
    }

    currentSpeedRef.current = THREE.MathUtils.damp(currentSpeedRef.current, worldSpeed, 8 * gait.accelMult, dt);

    pos.y = 1.0;
    pos.x = THREE.MathUtils.clamp(pos.x, -1375, 1375);
    pos.z = THREE.MathUtils.clamp(pos.z, -940, 940);

    if (saveRef) saveRef.current.copy(pos);

    // Visual gait: head bob, lean, bras/jambes procéduraux.
    const bob = Math.sin(bobRef.current) * 0.055 * gait.headBobAmp;
    const stride = Math.sin(bobRef.current);
    if (visualRef.current) {
      visualRef.current.position.y = bob;
      visualRef.current.rotation.z = THREE.MathUtils.damp(visualRef.current.rotation.z, gait.bodyLean * 0.16, 8, dt);
      visualRef.current.rotation.x = THREE.MathUtils.damp(visualRef.current.rotation.x, gait.posture === "crouched" ? -0.22 : 0, 8, dt);
    }
    if (leftArmRef.current) leftArmRef.current.rotation.x = stride * 0.55 * gait.armSwing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -stride * 0.55 * gait.armSwing;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -stride * 0.48 * Math.min(1, gait.speedMult);
    if (rightLegRef.current) rightLegRef.current.rotation.x = stride * 0.48 * Math.min(1, gait.speedMult);

    // Building proximity detection.
    if (buildingZones && buildingZones.length > 0) {
      let nearest: DoorZone | null = null;
      let nearestDist = 7;
      for (const zone of buildingZones) {
        const zp = new THREE.Vector3(...zone.pos);
        const dist = pos.distanceTo(zp);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = zone;
        }
      }
      if (nearest?.id !== nearBuildingRef.current?.id) {
        nearBuildingRef.current = nearest;
        onNearBuilding?.(nearest);
      }
    }

    // Camera marche.
    const camAngle = facingAngle.current;
    const desiredCam = new THREE.Vector3(
      pos.x + Math.sin(camAngle) * 8,
      pos.y + 4,
      pos.z + Math.cos(camAngle) * 8
    );
    camera.position.lerp(desiredCam, 0.08);
    cameraTarget.current.lerp(new THREE.Vector3(pos.x, pos.y + 1, pos.z), 0.1);
    camera.lookAt(cameraTarget.current);

    onSpeedChange(currentSpeedRef.current * 0.045);

    const z = pos.z;
    for (const zone of ZONES) {
      if (z >= zone.zMin && z <= zone.zMax) {
        if (currentZone.current !== zone.name) {
          currentZone.current = zone.name;
          onZoneChange("🚶 " + zone.name, pos.clone());
        }
        break;
      }
    }
  });

  return (
    <group ref={walkerRef} name="EtherzRPWalker">
      <group ref={visualRef}>
        {/* Torse */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.45, 0.8, 0.25]} />
          <meshStandardMaterial color="#1a3a6a" roughness={0.62} metalness={0.04} />
        </mesh>

        {/* Tête */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[0.32, 0.32, 0.32]} />
          <meshStandardMaterial color="#e8c9a0" roughness={0.52} />
        </mesh>

        {/* Tuque Québec */}
        <mesh position={[0, 0.86, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.22, 8]} />
          <meshStandardMaterial color="#c82020" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.98, 0]}>
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>

        {/* Bras */}
        <mesh ref={leftArmRef} position={[-0.34, 0.08, 0]} castShadow>
          <boxGeometry args={[0.18, 0.65, 0.18]} />
          <meshStandardMaterial color="#1a3a6a" roughness={0.62} />
        </mesh>
        <mesh ref={rightArmRef} position={[0.34, 0.08, 0]} castShadow>
          <boxGeometry args={[0.18, 0.65, 0.18]} />
          <meshStandardMaterial color="#1a3a6a" roughness={0.62} />
        </mesh>

        {/* Jambes */}
        <mesh ref={leftLegRef} position={[-0.12, -0.6, 0]} castShadow>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshStandardMaterial color="#2a2a4a" roughness={0.7} />
        </mesh>
        <mesh ref={rightLegRef} position={[0.12, -0.6, 0]} castShadow>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshStandardMaterial color="#2a2a4a" roughness={0.7} />
        </mesh>

        {/* Bottes */}
        <mesh position={[-0.12, -0.92, 0.04]} castShadow>
          <boxGeometry args={[0.22, 0.15, 0.28]} />
          <meshStandardMaterial color="#1a1008" roughness={0.82} />
        </mesh>
        <mesh position={[0.12, -0.92, 0.04]} castShadow>
          <boxGeometry args={[0.22, 0.15, 0.28]} />
          <meshStandardMaterial color="#1a1008" roughness={0.82} />
        </mesh>
      </group>
    </group>
  );
}
