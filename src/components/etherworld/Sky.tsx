import { useMemo } from "react";
import * as THREE from "three";

export default function Sky() {
  // Pre-calculated cloud positions
  const clouds = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.sin(i * 2.1) * 180,
      y: 55 + Math.abs(Math.sin(i * 1.4)) * 25,
      z: -900 + i * 48,
      sx: 40 + Math.abs(Math.sin(i * 0.9)) * 30,
      sy: 8 + Math.abs(Math.cos(i * 1.1)) * 6,
      sz: 20 + Math.abs(Math.sin(i * 0.7)) * 15,
      opacity: 0.7 + Math.abs(Math.cos(i * 0.5)) * 0.25,
    }));
  }, []);

  // Pre-calculated mountain silhouettes (Laurentians)
  const mountains = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: -120 - Math.abs(Math.sin(i * 1.7)) * 80,
      z: -900 + i * 95,
      h: 30 + Math.abs(Math.sin(i * 2.2)) * 40,
      w: 60 + Math.abs(Math.cos(i * 1.5)) * 40,
    }));
  }, []);

  return (
    <group>
      {/* Sky dome */}
      <mesh>
        <sphereGeometry args={[800, 16, 8]} />
        <meshBasicMaterial color="#3a7abf" side={THREE.BackSide} />
      </mesh>

      {/* Horizon glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <circleGeometry args={[800, 32]} />
        <meshBasicMaterial color="#7ab8e0" />
      </mesh>

      {/* Cloud layer */}
      {clouds.map(c => (
        <mesh key={c.id} position={[c.x, c.y, c.z]}>
          <boxGeometry args={[c.sx, c.sy, c.sz]} />
          <meshBasicMaterial color="#f8f8ff" transparent opacity={c.opacity} />
        </mesh>
      ))}

      {/* Second cloud layer - smaller puffs */}
      {clouds.map(c => (
        <mesh key={`b${c.id}`} position={[c.x + 15, c.y + 5, c.z + 10]}>
          <boxGeometry args={[c.sx * 0.5, c.sy * 0.7, c.sz * 0.5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={c.opacity * 0.8} />
        </mesh>
      ))}

      {/* Laurentian silhouettes — distant mountain range */}
      {mountains.map(m => (
        <mesh key={m.id} position={[m.x, m.h / 2, m.z]}>
          <coneGeometry args={[m.w, m.h, 4]} />
          <meshBasicMaterial color="#2a4a3a" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Sun */}
      <mesh position={[120, 120, -600]}>
        <sphereGeometry args={[12, 8, 8]} />
        <meshBasicMaterial color="#fff8d0" />
      </mesh>

      {/* Sun glow */}
      <mesh position={[120, 120, -600]}>
        <sphereGeometry args={[20, 8, 8]} />
        <meshBasicMaterial color="#ffe880" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
