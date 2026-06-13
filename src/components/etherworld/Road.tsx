import { useMemo } from "react";
import * as THREE from "three";
import { PORTNEUF_ROADS, TOWNS } from "../../utils/roadNetwork";

function useAsphaltTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#343634";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 6500; i++) {
      const v = 42 + Math.random() * 34;
      const a = 0.10 + Math.random() * 0.18;
      ctx.fillStyle = `rgba(${v},${v},${v},${a})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
    }
    for (let y = 0; y < size; y += 18) {
      ctx.strokeStyle = "rgba(255,255,255,0.018)";
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(y) * 2);
      ctx.lineTo(size, y + Math.cos(y) * 2);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 18);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, []);
}

export default function Road() {
  const asphaltTexture = useAsphaltTexture();
  const roadMeshes = useMemo(() => {
    return PORTNEUF_ROADS.map((road) => {
      const dx = road.end[0] - road.start[0];
      const dz = road.end[1] - road.start[1];
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);
      
      const midX = (road.start[0] + road.end[0]) / 2;
      const midZ = (road.start[1] + road.end[1]) / 2;

      let roadColor = "#3a3a38";
      if (road.type === 'highway') roadColor = "#2e2e2c";
      if (road.type === 'rural') roadColor = "#4a4a42";

      return (
        <group key={road.id} position={[midX, 0.01, midZ]} rotation={[0, angle, 0]}>
          {/* Épaule de la route */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
            <planeGeometry args={[road.width + 4, length + 4]} />
            <meshStandardMaterial color="#5f6158" roughness={0.92} metalness={0.02} />
          </mesh>
          
          {/* Asphalte HD cartoon: texture fine + clearcoat léger pour reflets contrôlés */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[road.width, length]} />
            <meshPhysicalMaterial
              color={roadColor}
              map={asphaltTexture}
              roughness={0.62}
              metalness={0.0}
              clearcoat={0.32}
              clearcoatRoughness={0.18}
              envMapIntensity={0.35}
            />
          </mesh>

          {/* Ligne jaune pour les rangs et routes */}
          {road.type !== 'highway' && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
              <planeGeometry args={[0.3, length]} />
              <meshBasicMaterial color="#f0e040" />
            </mesh>
          )}

          {/* Autoroute 40 avec voies et muret */}
          {road.type === 'highway' && (
            <>
              <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.8, 0.5, length]} />
                <meshStandardMaterial color="#8b8d84" roughness={0.72} metalness={0.04} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-road.width/4, 0.01, 0]}>
                <planeGeometry args={[0.2, length]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[road.width/4, 0.01, 0]}>
                <planeGeometry args={[0.2, length]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </>
          )}
        </group>
      );
    });
  }, [asphaltTexture]);

  return (
    <group>
      {roadMeshes}
      
      {/* Panneaux des villes */}
      {TOWNS.map((town) => (
        <group key={town.name} position={[town.x + 8, 0, town.z + 10]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 3, 6]} />
            <meshStandardMaterial color="#888888" metalness={0.35} roughness={0.45} />
          </mesh>
          <mesh position={[0, 3.2, 0]} castShadow>
            <boxGeometry args={[0.2, 0.8, 4]} />
            <meshStandardMaterial color="#1a5fa8" roughness={0.36} metalness={0.08} emissive="#082040" emissiveIntensity={0.08} />
          </mesh>
        </group>
      ))}
    </group>
  );
}