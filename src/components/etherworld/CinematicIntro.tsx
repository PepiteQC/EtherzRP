import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface CinematicIntroProps {
  onComplete: () => void;
}

const DURATION = 6.5;

// Keyframe camera positions for cinematic sweep
const CAM_KEYFRAMES = [
  { t: 0,   pos: new THREE.Vector3(35, 14, -860), look: new THREE.Vector3(-3, 1, -890) },
  { t: 2.5, pos: new THREE.Vector3(22, 10, -790), look: new THREE.Vector3(0, 1, -820) },
  { t: 4.5, pos: new THREE.Vector3(14, 7,  -730), look: new THREE.Vector3(0, 1, -750) },
  { t: 6.5, pos: new THREE.Vector3(10, 5,  -715), look: new THREE.Vector3(0, 1, -705) },
];

function lerp3(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  return a.clone().lerp(b, t);
}

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const { camera } = useThree();
  const timeRef = useRef(0);
  const completedRef = useRef(false);
  const carRef = useRef<THREE.Group>(null!);
  const cameraLookAt = useRef(new THREE.Vector3(0, 1, -800));

  // Set initial camera position
  useEffect(() => {
    camera.position.copy(CAM_KEYFRAMES[0].pos);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    if (completedRef.current) return;
    timeRef.current += delta;
    const t = Math.min(timeRef.current / DURATION, 1);

    // Animate car along Route 138 (z goes from -920 to -700)
    if (carRef.current) {
      const carZ = THREE.MathUtils.lerp(-920, -700, t);
      carRef.current.position.set(0, 0.5, carZ);
    }

    // Find camera keyframe segment
    let k0 = CAM_KEYFRAMES[0];
    let k1 = CAM_KEYFRAMES[1];
    for (let i = 0; i < CAM_KEYFRAMES.length - 1; i++) {
      if (
        timeRef.current >= CAM_KEYFRAMES[i].t &&
        timeRef.current < CAM_KEYFRAMES[i + 1].t
      ) {
        k0 = CAM_KEYFRAMES[i];
        k1 = CAM_KEYFRAMES[i + 1];
        break;
      }
    }
    const segDuration = k1.t - k0.t;
    const segT = Math.max(0, (timeRef.current - k0.t) / segDuration);
    const smoothT = segT * segT * (3 - 2 * segT); // smoothstep

    const targetPos = lerp3(k0.pos, k1.pos, smoothT);
    const targetLook = lerp3(k0.look, k1.look, smoothT);

    camera.position.lerp(targetPos, 0.04);
    cameraLookAt.current.lerp(targetLook, 0.05);
    camera.lookAt(cameraLookAt.current);

    if (timeRef.current >= DURATION && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  });

  // Ghost arrival car — same low-poly shape as the player vehicle
  const bodyColor = "#1a4a9a";
  const glassColor = "#aad4ee";
  const wheelColor = "#222222";
  const rimColor = "#cccccc";
  const lightColor = "#ffffd0";
  const tailColor = "#ff2020";

  return (
    <group ref={carRef} position={[0, 0.5, -920]} rotation={[0, Math.PI, 0]}>
      {/* Main body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2.0, 0.7, 4.2]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 1.2, 0.2]} castShadow>
        <boxGeometry args={[1.7, 0.65, 2.2]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>
      {/* Windshields */}
      <mesh position={[0, 1.22, -0.9]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[1.5, 0.5, 0.1]} />
        <meshLambertMaterial color={glassColor} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 1.22, 1.35]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[1.5, 0.5, 0.1]} />
        <meshLambertMaterial color={glassColor} transparent opacity={0.7} />
      </mesh>
      {/* Headlights */}
      {([-0.65, 0.65] as number[]).map((x) => (
        <mesh key={x} position={[x, 0.6, -2.12]}>
          <boxGeometry args={[0.35, 0.2, 0.1]} />
          <meshBasicMaterial color={lightColor} />
        </mesh>
      ))}
      {/* Taillights */}
      {([-0.65, 0.65] as number[]).map((x) => (
        <mesh key={x} position={[x, 0.6, 2.12]}>
          <boxGeometry args={[0.35, 0.18, 0.1]} />
          <meshBasicMaterial color={tailColor} />
        </mesh>
      ))}
      {/* Bumpers */}
      <mesh position={[0, 0.35, -2.2]}>
        <boxGeometry args={[2.0, 0.25, 0.2]} />
        <meshLambertMaterial color="#e0e0e0" />
      </mesh>
      <mesh position={[0, 0.35, 2.2]}>
        <boxGeometry args={[2.0, 0.25, 0.2]} />
        <meshLambertMaterial color="#e0e0e0" />
      </mesh>
      {/* Wheels */}
      {(
        [
          { x: -1.05, z: -1.4 },
          { x: 1.05, z: -1.4 },
          { x: -1.05, z: 1.4 },
          { x: 1.05, z: 1.4 },
        ] as { x: number; z: number }[]
      ).map(({ x, z }, i) => (
        <group key={i} position={[x, 0.3, z]} rotation={[0, 0, Math.PI / 2]}>
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
      {/* QC plate */}
      <mesh position={[0, 0.92, -1.8]}>
        <boxGeometry args={[0.25, 0.02, 0.25]} />
        <meshBasicMaterial color="#3a6ad0" />
      </mesh>
    </group>
  );
}
