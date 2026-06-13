import { useMemo } from "react";

interface BuildingData {
  id: number;
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  roofH: number;
  wallColor: string;
  roofColor: string;
  rotY: number;
}

const WALL_COLORS = ["#d4c8b0", "#c8bea8", "#e8dfd0", "#bab2a0", "#d8ccc0", "#c0b8a8", "#e0d8cc"];
const ROOF_COLORS = ["#8a3a2a", "#6a2a1a", "#4a3828", "#7a4030", "#5a3020", "#3a2818"];

export default function Buildings() {
  const buildings = useMemo<BuildingData[]>(() => {
    const list: BuildingData[] = [];
    let id = 0;

    // Village clusters along Route 138
    const villages = [
      { name: "Neuville", z: -300, xOff: 18, count: 12 },
      { name: "Portneuf", z: 0, xOff: 16, count: 18 },
      { name: "Donnacona", z: -180, xOff: 20, count: 10 },
      { name: "Batiscan", z: 350, xOff: 17, count: 14 },
      { name: "Champlain", z: 520, xOff: 15, count: 10 },
      { name: "Cap-de-la-Madeleine", z: 680, xOff: 18, count: 16 },
    ];

    for (const village of villages) {
      for (let i = 0; i < village.count; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const row = Math.floor(i / 4);
        const col = i % 4;
        const zSpread = col * 30 - 45;
        const xDist = village.xOff + row * 20 + Math.abs(Math.sin(i * 1.7)) * 12;
        const z = village.z + zSpread + Math.sin(i * 2.1) * 8;
        const x = side * xDist;
        const wallIdx = Math.floor(Math.abs(Math.sin(i * 3.7 + village.z * 0.01)) * WALL_COLORS.length);
        const roofIdx = Math.floor(Math.abs(Math.sin(i * 2.3 + village.z * 0.02)) * ROOF_COLORS.length);
        const isChurch = i === Math.floor(village.count / 2);

        list.push({
          id: id++,
          x,
          z,
          w: isChurch ? 6 : 4 + Math.abs(Math.sin(i * 1.1)) * 5,
          h: isChurch ? 8 : 3 + Math.abs(Math.sin(i * 2.2)) * 4,
          d: isChurch ? 12 : 5 + Math.abs(Math.cos(i * 1.4)) * 6,
          roofH: isChurch ? 6 : 2 + Math.abs(Math.cos(i * 0.8)) * 3,
          wallColor: isChurch ? "#f0ece4" : WALL_COLORS[wallIdx],
          roofColor: isChurch ? "#2a3050" : ROOF_COLORS[roofIdx],
          rotY: Math.sin(i * 4.2) * 0.3,
        });
      }
    }

    // Gas station / dépanneur at Portneuf
    list.push({
      id: id++, x: 20, z: 10,
      w: 10, h: 3.5, d: 8, roofH: 0.5,
      wallColor: "#f8f0e0", roofColor: "#ff3020", rotY: 0,
    });

    return list;
  }, []);

  // Church steeple at Portneuf
  const churches = useMemo(() => {
    return [
      { x: -30, z: 5, h: 18 },
      { x: 28, z: 355, h: 15 },
      { x: -25, z: 525, h: 16 },
    ];
  }, []);

  return (
    <group>
      {buildings.map((b) => (
        <group key={b.id} position={[b.x, 0, b.z]} rotation={[0, b.rotY, 0]}>
          {/* Building walls */}
          <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshLambertMaterial color={b.wallColor} />
          </mesh>
          {/* Gabled roof */}
          <mesh position={[0, b.h + b.roofH / 2, 0]} castShadow>
            <boxGeometry args={[b.w + 0.4, b.roofH, b.d + 0.4]} />
            <meshLambertMaterial color={b.roofColor} />
          </mesh>
          {/* Roof peak */}
          <mesh position={[0, b.h + b.roofH + b.roofH * 0.6, 0]}>
            <coneGeometry args={[b.w * 0.72, b.roofH * 1.2, 4]} />
            <meshLambertMaterial color={b.roofColor} />
          </mesh>
          {/* Windows */}
          {[-1, 1].map(side => (
            <mesh key={side} position={[side * (b.w / 2 + 0.01), b.h * 0.55, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[b.d * 0.25, b.h * 0.3]} />
              <meshBasicMaterial color="#aad4ee" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Church steeples */}
      {churches.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]}>
          <mesh position={[0, c.h / 2, 0]} castShadow>
            <boxGeometry args={[3, c.h, 3]} />
            <meshLambertMaterial color="#f0ece4" />
          </mesh>
          <mesh position={[0, c.h + 3, 0]} castShadow>
            <coneGeometry args={[1.5, 6, 4]} />
            <meshLambertMaterial color="#1a2040" />
          </mesh>
          {/* Cross */}
          <mesh position={[0, c.h + 6.5, 0]}>
            <boxGeometry args={[0.15, 1.5, 0.15]} />
            <meshLambertMaterial color="#c8c8c8" />
          </mesh>
          <mesh position={[0, c.h + 7, 0]}>
            <boxGeometry args={[0.8, 0.15, 0.15]} />
            <meshLambertMaterial color="#c8c8c8" />
          </mesh>
        </group>
      ))}

      {/* Pont de Portneuf bridge over small river */}
      <group position={[0, 0, 85]}>
        {/* Bridge deck */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[30, 0.5, 20]} />
          <meshLambertMaterial color="#7a7a70" />
        </mesh>
        {/* Bridge supports */}
        {[-10, 10].map(x => (
          <mesh key={x} position={[x, -1.5, 0]}>
            <boxGeometry args={[2, 3, 18]} />
            <meshLambertMaterial color="#5a5a52" />
          </mesh>
        ))}
      </group>

      {/* Fleuve Saint-Laurent (far right) */}
      <mesh position={[200, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 2000]} />
        <meshLambertMaterial color="#1a4a7a" />
      </mesh>

      {/* Hydro-Québec pylons */}
      {[-800, -400, 0, 400, 800].map((z, i) => (
        <group key={i} position={[-35, 0, z]}>
          <mesh position={[0, 10, 0]}>
            <boxGeometry args={[0.3, 20, 0.3]} />
            <meshLambertMaterial color="#aaaaaa" />
          </mesh>
          <mesh position={[0, 18, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.2, 12, 0.2]} />
            <meshLambertMaterial color="#aaaaaa" />
          </mesh>
          {/* Insulator */}
          {[-5, 0, 5].map(xi => (
            <mesh key={xi} position={[xi, 19, 0]}>
              <sphereGeometry args={[0.25, 4, 4]} />
              <meshLambertMaterial color="#888888" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
