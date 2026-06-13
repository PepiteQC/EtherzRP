import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  brake = "brake",
}

interface VehicleProps {
  active: boolean;
  onSpeedChange: (speed: number) => void;
  onZoneChange: (zone: string) => void;
  onExitVehicle: (pos: THREE.Vector3) => void;
  worldPositionRef: React.MutableRefObject<THREE.Vector3>;
  initialPosition?: [number, number, number];
  initialRotationY?: number;
  saveRef?: React.MutableRefObject<{ pos: THREE.Vector3; rotY: number }>;
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
  const velocityRef = useRef(0);
  const wheelRotRef = useRef(0);
  const currentZone = useRef("");
  const ePressed = useRef(false);

  const [, getState] = useKeyboardControls<Controls>();
  const { camera } = useThree();
  const cameraTarget = useRef(new THREE.Vector3());

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
      if (e.code === "KeyE" && !ePressed.current) {
        ePressed.current = true;
        if (vehicleRef.current) {
          onExitVehicle(vehicleRef.current.position.clone());
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyE") ePressed.current = false;
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

    worldPositionRef.current.copy(vehicleRef.current.position);

    if (saveRef) {
      saveRef.current.pos.copy(vehicleRef.current.position);
      saveRef.current.rotY = vehicleRef.current.rotation.y;
    }

    if (!active) {
      velocityRef.current *= 0.9;
      return;
    }

    const controls = getState();
    const dt = Math.min(delta, 0.05);
    const maxSpeed = 0.8;
    const acceleration = 1.2;
    const friction = 0.94;
    const turnSpeed = 1.8;

    if (controls.forward) {
      velocityRef.current = Math.min(velocityRef.current + acceleration * dt, maxSpeed);
    } else if (controls.back) {
      velocityRef.current = Math.max(velocityRef.current - acceleration * dt, -maxSpeed * 0.5);
    } else {
      velocityRef.current *= friction;
    }

    if (controls.brake) velocityRef.current *= 0.88;

    const speedFactor = Math.abs(velocityRef.current) / maxSpeed;
    let turn = 0;
    if (controls.left) turn = turnSpeed * speedFactor * dt;
    else if (controls.right) turn = -turnSpeed * speedFactor * dt;

    vehicleRef.current.rotation.y += turn * (velocityRef.current > 0 ? 1 : -1);

    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(vehicleRef.current.quaternion);
    vehicleRef.current.position.addScaledVector(direction, velocityRef.current);

    const pos = vehicleRef.current.position;
    pos.y = 0.5;
    pos.z = Math.max(-940, Math.min(940, pos.z));

    wheelRotRef.current += velocityRef.current * 3;

    // ══ CAMÉRA RAPPROCHÉE ══
    const camDir = new THREE.Vector3(0, 0, 1).applyQuaternion(vehicleRef.current.quaternion);
    const desiredCamPos = pos.clone().addScaledVector(camDir, 6).add(new THREE.Vector3(0, 2.5, 0));
    camera.position.lerp(desiredCamPos, 0.10);
    cameraTarget.current.lerp(new THREE.Vector3(pos.x, pos.y + 0.8, pos.z), 0.12);
    camera.lookAt(cameraTarget.current);

    onSpeedChange(velocityRef.current);

    const z = pos.z;
    for (const zone of ZONES) {
      if (z >= zone.zMin && z <= zone.zMax) {
        if (currentZone.current !== zone.name) {
          currentZone.current = zone.name;
          onZoneChange(zone.name);
        }
        break;
      }
    }
  });

  const bodyColor = "#1a4a9a";
  const glassColor = "#aad4ee";
  const wheelColor = "#222222";
  const rimColor = "#cccccc";
  const lightColor = "#ffffd0";
  const taillightColor = "#ff2020";

  return (
    <group ref={vehicleRef}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.7, 4.2]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0, 1.2, 0.2]} castShadow>
        <boxGeometry args={[1.7, 0.65, 2.2]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0, 1.22, -0.9]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[1.5, 0.5, 0.1]} />
        <meshLambertMaterial color={glassColor} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 1.22, 1.35]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[1.5, 0.5, 0.1]} />
        <meshLambertMaterial color={glassColor} transparent opacity={0.7} />
      </mesh>
      {([-0.86, 0.86] as number[]).map((x) => (
        <mesh key={x} position={[x, 1.22, 0.2]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[1.8, 0.4, 0.05]} />
          <meshLambertMaterial color={glassColor} transparent opacity={0.7} />
        </mesh>
      ))}
      {([-0.65, 0.65] as number[]).map((x) => (
        <mesh key={x} position={[x, 0.6, -2.12]}>
          <boxGeometry args={[0.35, 0.2, 0.1]} />
          <meshBasicMaterial color={lightColor} />
        </mesh>
      ))}
      {([-0.65, 0.65] as number[]).map((x) => (
        <mesh key={x} position={[x, 0.6, 2.12]}>
          <boxGeometry args={[0.35, 0.18, 0.1]} />
          <meshBasicMaterial color={taillightColor} />
        </mesh>
      ))}
      <mesh position={[0, 0.35, -2.2]}>
        <boxGeometry args={[2.0, 0.25, 0.2]} />
        <meshLambertMaterial color="#e0e0e0" />
      </mesh>
      <mesh position={[0, 0.35, 2.2]}>
        <boxGeometry args={[2.0, 0.25, 0.2]} />
        <meshLambertMaterial color="#e0e0e0" />
      </mesh>
      {(
        [
          { x: -1.05, z: -1.4 },
          { x: 1.05, z: -1.4 },
          { x: -1.05, z: 1.4 },
          { x: 1.05, z: 1.4 },
        ] as { x: number; z: number }[]
      ).map(({ x, z }, i) => (
        <group key={i} position={[x, 0.3, z]} rotation={[wheelRotRef.current, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.22, 10]} />
            <meshLambertMaterial color={wheelColor} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.2, 0.2, 0.24, 6]} />
            <meshLambertMaterial color={rimColor} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.57, 0.2]}>
        <boxGeometry args={[1.6, 0.05, 1.8]} />
        <meshLambertMaterial color="#333333" />
      </mesh>
      <mesh position={[0, 0.92, -1.8]}>
        <boxGeometry args={[0.25, 0.02, 0.25]} />
        <meshBasicMaterial color="#3a6ad0" />
      </mesh>
    </group>
  );
}