import { useMemo } from "react";
import * as THREE from "three";
import { PORTNEUF_ROADS, TOWNS } from "../../utils/roadNetwork";

export default function Road() {
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
            <meshLambertMaterial color="#5a5a52" />
          </mesh>
          
          {/* Asphalte */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[road.width, length]} />
            <meshLambertMaterial color={roadColor} />
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
              <mesh position={[0, 0.25, 0]}>
                <boxGeometry args={[0.8, 0.5, length]} />
                <meshLambertMaterial color="#888880" />
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
  }, []);

  return (
    <group>
      {roadMeshes}
      
      {/* Panneaux des villes */}
      {TOWNS.map((town) => (
        <group key={town.name} position={[town.x + 8, 0, town.z + 10]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 3, 6]} />
            <meshLambertMaterial color="#888888" />
          </mesh>
          <mesh position={[0, 3.2, 0]} castShadow>
            <boxGeometry args={[0.2, 0.8, 4]} />
            <meshLambertMaterial color="#1a5fa8" />
          </mesh>
        </group>
      ))}
    </group>
  );
}