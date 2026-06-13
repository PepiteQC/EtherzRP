import type { MutableRefObject } from "react";
import * as THREE from "three";

interface VehicleModelProps {
  wheelRefs: MutableRefObject<(THREE.Group | null)[]>;
  frontSteerRefs: MutableRefObject<(THREE.Group | null)[]>;
  brakeMatRef: MutableRefObject<THREE.MeshBasicMaterial | null>;
  reverseMatRef: MutableRefObject<THREE.MeshBasicMaterial | null>;
  headGlowRef: MutableRefObject<THREE.Group | null>;
  bodyColor?: string;
}

const defaultBodyColor = "#164a98";
const bodyDark = "#0f2e60";
const glassColor = "#9ed5ef";
const wheelColor = "#171717";
const rimColor = "#cbd0d5";

const wheelData = [
  { x: -1.08, z: -1.42, front: true },
  { x: 1.08, z: -1.42, front: true },
  { x: -1.08, z: 1.42, front: false },
  { x: 1.08, z: 1.42, front: false },
];

export default function VehicleModel({
  wheelRefs,
  frontSteerRefs,
  brakeMatRef,
  reverseMatRef,
  headGlowRef,
  bodyColor = defaultBodyColor,
}: VehicleModelProps) {
  return (
    <>
      {/* Ombre basse */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.95, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* Châssis / bas de caisse */}
      <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.12, 0.42, 4.45]} />
        <meshStandardMaterial color={bodyDark} roughness={0.45} metalness={0.28} />
      </mesh>

      {/* Carrosserie principale */}
      <mesh position={[0, 0.78, -0.02]} castShadow receiveShadow>
        <boxGeometry args={[2.02, 0.72, 4.18]} />
        <meshStandardMaterial color={bodyColor} roughness={0.34} metalness={0.22} />
      </mesh>

      {/* Capot/coffre sculptés */}
      <mesh position={[0, 1.02, -1.25]} castShadow>
        <boxGeometry args={[1.86, 0.18, 1.28]} />
        <meshStandardMaterial color="#1e5aab" roughness={0.32} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.98, 1.45]} castShadow>
        <boxGeometry args={[1.84, 0.16, 1.0]} />
        <meshStandardMaterial color="#123e83" roughness={0.34} metalness={0.2} />
      </mesh>

      {/* Habitacle */}
      <mesh position={[0, 1.34, 0.12]} castShadow>
        <boxGeometry args={[1.62, 0.72, 2.0]} />
        <meshStandardMaterial color={bodyColor} roughness={0.34} metalness={0.22} />
      </mesh>
      <mesh position={[0, 1.36, -0.9]} rotation={[0.23, 0, 0]}>
        <boxGeometry args={[1.42, 0.48, 0.08]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.62} roughness={0.08} metalness={0.08} emissive="#163447" emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[0, 1.33, 1.16]} rotation={[-0.22, 0, 0]}>
        <boxGeometry args={[1.42, 0.46, 0.08]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.56} roughness={0.08} metalness={0.08} emissive="#163447" emissiveIntensity={0.06} />
      </mesh>
      {([-0.84, 0.84] as number[]).map((x) => (
        <mesh key={`side-window-${x}`} position={[x, 1.34, 0.12]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[1.52, 0.4, 0.06]} />
          <meshStandardMaterial color={glassColor} transparent opacity={0.5} roughness={0.1} metalness={0.08} />
        </mesh>
      ))}

      {/* Pare-chocs */}
      <mesh position={[0, 0.48, -2.23]} castShadow>
        <boxGeometry args={[2.12, 0.28, 0.22]} />
        <meshStandardMaterial color="#d8dde2" roughness={0.36} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0.48, 2.23]} castShadow>
        <boxGeometry args={[2.12, 0.28, 0.22]} />
        <meshStandardMaterial color="#d8dde2" roughness={0.36} metalness={0.45} />
      </mesh>

      {/* Phares + halos */}
      <group ref={headGlowRef}>
        {([-0.58, 0.58] as number[]).map((x) => (
          <group key={`head-${x}`}>
            <mesh position={[x, 0.72, -2.15]}>
              <boxGeometry args={[0.42, 0.2, 0.08]} />
              <meshBasicMaterial color="#fff4bd" />
            </mesh>
            <mesh position={[x, 0.72, -3.0]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.55, 1.85, 18, 1, true]} />
              <meshBasicMaterial color="#fff0a0" transparent opacity={0.12} depthWrite={false} />
            </mesh>
            <pointLight position={[x, 0.72, -2.55]} intensity={0.35} distance={13} color="#fff1b4" />
          </group>
        ))}
      </group>

      {/* Feux arrière / recul */}
      {([-0.62, 0.62] as number[]).map((x) => (
        <mesh key={`tail-${x}`} position={[x, 0.74, 2.14]}>
          <boxGeometry args={[0.38, 0.2, 0.08]} />
          <meshBasicMaterial ref={x < 0 ? brakeMatRef : undefined} color="#7a0808" transparent opacity={0.72} />
        </mesh>
      ))}
      {([-0.22, 0.22] as number[]).map((x) => (
        <mesh key={`reverse-${x}`} position={[x, 0.47, 2.16]}>
          <boxGeometry args={[0.24, 0.12, 0.08]} />
          <meshBasicMaterial ref={x < 0 ? reverseMatRef : undefined} color="#eaf7ff" transparent opacity={0.18} />
        </mesh>
      ))}

      {/* Plaque Québec fictive */}
      <mesh position={[0, 0.5, 2.36]}>
        <boxGeometry args={[0.78, 0.22, 0.035]} />
        <meshBasicMaterial color="#f3f0dc" />
      </mesh>
      <mesh position={[0, 0.52, -2.36]}>
        <boxGeometry args={[0.72, 0.18, 0.035]} />
        <meshBasicMaterial color="#f3f0dc" />
      </mesh>

      {/* Rétroviseurs */}
      {([-1, 1] as number[]).map((side) => (
        <group key={`mirror-${side}`} position={[side * 1.08, 1.22, -0.75]}>
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.08, 0.42]} />
            <meshStandardMaterial color="#101820" roughness={0.35} metalness={0.3} />
          </mesh>
          <mesh position={[side * 0.08, 0, -0.2]} castShadow>
            <boxGeometry args={[0.22, 0.2, 0.08]} />
            <meshStandardMaterial color="#101820" roughness={0.35} metalness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Roues avec direction avant */}
      {wheelData.map(({ x, z, front }, i) => {
        const wheel = (
          <group
            ref={(el) => { wheelRefs.current[i] = el; }}
            rotation={[0, 0, Math.PI / 2]}
          >
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.36, 0.36, 0.26, 18]} />
              <meshStandardMaterial color={wheelColor} roughness={0.78} metalness={0.08} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.22, 0.22, 0.285, 12]} />
              <meshStandardMaterial color={rimColor} roughness={0.32} metalness={0.45} />
            </mesh>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <mesh key={n} rotation={[0, 0, (Math.PI / 3) * n]}>
                <boxGeometry args={[0.04, 0.02, 0.4]} />
                <meshStandardMaterial color="#6f7880" roughness={0.35} metalness={0.38} />
              </mesh>
            ))}
          </group>
        );

        return front ? (
          <group key={i} position={[x, 0.36, z]} ref={(el) => { frontSteerRefs.current[i] = el; }}>
            {wheel}
          </group>
        ) : (
          <group key={i} position={[x, 0.36, z]}>
            {wheel}
          </group>
        );
      })}

      {/* Petit badge RP */}
      <mesh position={[0, 1.62, 0.1]}>
        <boxGeometry args={[1.35, 0.05, 1.5]} />
        <meshStandardMaterial color="#20252a" roughness={0.45} metalness={0.18} />
      </mesh>
      <mesh position={[0, 1.69, -0.65]}>
        <boxGeometry args={[0.32, 0.04, 0.18]} />
        <meshBasicMaterial color="#54a8ff" transparent opacity={0.65} />
      </mesh>
    </>
  );
}
