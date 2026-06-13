import { useMemo } from "react";
import { Html } from "@react-three/drei";
import BUILDINGS, { type BuildingDef } from "../../data/quebecBuildings";
import { Interactive3D } from "./interactions";

const ASPHALT = "#343635";
const ASPHALT_2 = "#454742";
const CONCRETE = "#b9b6ad";
const CURB = "#d7d3c7";
const GLASS_DAY = "#8fc7df";
const GLASS_NIGHT = "#ffd98a";
const METAL = "#555b61";
const ORANGE_CONE = "#f36b21";

function faceInfo(b: BuildingDef) {
  const [w, h, d] = b.size;
  const eps = 0.055;

  switch (b.doorSide) {
    case "back":
      return {
        doorPos: [0, 1.15, -d / 2 - eps] as [number, number, number],
        doorSize: [2.1, 2.3, 0.08] as [number, number, number],
        signPos: [0, Math.max(3.2, h - 1), -d / 2 - eps * 2] as [number, number, number],
        signSize: [Math.min(w * 0.82, 10), 1.0, 0.12] as [number, number, number],
        canopyPos: [0, 2.65, -d / 2 - 1.0] as [number, number, number],
        canopySize: [3.8, 0.22, 2.0] as [number, number, number],
        stepPos: [0, 0.08, -d / 2 - 1.25] as [number, number, number],
        stepSize: [3.0, 0.16, 1.8] as [number, number, number],
        htmlPos: [0, Math.max(3.25, h - 0.95), -d / 2 - 0.16] as [number, number, number],
        htmlRot: [0, Math.PI, 0] as [number, number, number],
        roadOffset: [0, -d / 2 - 6] as [number, number],
      };
    case "left":
      return {
        doorPos: [-w / 2 - eps, 1.15, 0] as [number, number, number],
        doorSize: [0.08, 2.3, 2.1] as [number, number, number],
        signPos: [-w / 2 - eps * 2, Math.max(3.2, h - 1), 0] as [number, number, number],
        signSize: [0.12, 1.0, Math.min(d * 0.82, 10)] as [number, number, number],
        canopyPos: [-w / 2 - 1.0, 2.65, 0] as [number, number, number],
        canopySize: [2.0, 0.22, 3.8] as [number, number, number],
        stepPos: [-w / 2 - 1.25, 0.08, 0] as [number, number, number],
        stepSize: [1.8, 0.16, 3.0] as [number, number, number],
        htmlPos: [-w / 2 - 0.16, Math.max(3.25, h - 0.95), 0] as [number, number, number],
        htmlRot: [0, -Math.PI / 2, 0] as [number, number, number],
        roadOffset: [-w / 2 - 6, 0] as [number, number],
      };
    case "right":
      return {
        doorPos: [w / 2 + eps, 1.15, 0] as [number, number, number],
        doorSize: [0.08, 2.3, 2.1] as [number, number, number],
        signPos: [w / 2 + eps * 2, Math.max(3.2, h - 1), 0] as [number, number, number],
        signSize: [0.12, 1.0, Math.min(d * 0.82, 10)] as [number, number, number],
        canopyPos: [w / 2 + 1.0, 2.65, 0] as [number, number, number],
        canopySize: [2.0, 0.22, 3.8] as [number, number, number],
        stepPos: [w / 2 + 1.25, 0.08, 0] as [number, number, number],
        stepSize: [1.8, 0.16, 3.0] as [number, number, number],
        htmlPos: [w / 2 + 0.16, Math.max(3.25, h - 0.95), 0] as [number, number, number],
        htmlRot: [0, Math.PI / 2, 0] as [number, number, number],
        roadOffset: [w / 2 + 6, 0] as [number, number],
      };
    case "front":
    default:
      return {
        doorPos: [0, 1.15, d / 2 + eps] as [number, number, number],
        doorSize: [2.1, 2.3, 0.08] as [number, number, number],
        signPos: [0, Math.max(3.2, h - 1), d / 2 + eps * 2] as [number, number, number],
        signSize: [Math.min(w * 0.82, 10), 1.0, 0.12] as [number, number, number],
        canopyPos: [0, 2.65, d / 2 + 1.0] as [number, number, number],
        canopySize: [3.8, 0.22, 2.0] as [number, number, number],
        stepPos: [0, 0.08, d / 2 + 1.25] as [number, number, number],
        stepSize: [3.0, 0.16, 1.8] as [number, number, number],
        htmlPos: [0, Math.max(3.25, h - 0.95), d / 2 + 0.16] as [number, number, number],
        htmlRot: [0, 0, 0] as [number, number, number],
        roadOffset: [0, d / 2 + 6] as [number, number],
      };
  }
}

function cleanLabel(name: string) {
  return name
    .replace(/\s*\([^)]*\)/g, "")
    .replace("CHÂTEAU FRONTENAC", "HÔTEL FRONTENAC")
    .slice(0, 28);
}

function WindowGrid({ b }: { b: BuildingDef }) {
  const [w, h, d] = b.size;
  const floors = Math.max(1, Math.min(7, Math.floor((h - 1.8) / 2.15)));
  const frontCols = Math.max(2, Math.min(6, Math.floor(w / 2.6)));
  const sideCols = Math.max(1, Math.min(4, Math.floor(d / 2.8)));
  const lit = b.id === "hotel" || b.hasInterior;

  const frontWindows = [];
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < frontCols; c++) {
      const x = (c - (frontCols - 1) / 2) * (w / (frontCols + 0.45));
      const y = 2.0 + f * 2.05;
      frontWindows.push(
        <mesh key={`fw-${f}-${c}`} position={[x, y, d / 2 + 0.07]}>
          <boxGeometry args={[0.95, 0.82, 0.05]} />
          <meshStandardMaterial color={lit && (f + c) % 3 === 0 ? GLASS_NIGHT : GLASS_DAY} emissive={lit && (f + c) % 3 === 0 ? "#664400" : "#102b3a"} emissiveIntensity={lit && (f + c) % 3 === 0 ? 0.45 : 0.08} roughness={0.24} metalness={0.1} />
        </mesh>
      );
    }
  }

  const backWindows = frontWindows.map((_, i) => {
    const f = Math.floor(i / frontCols);
    const c = i % frontCols;
    const x = (c - (frontCols - 1) / 2) * (w / (frontCols + 0.45));
    const y = 2.0 + f * 2.05;
    return (
      <mesh key={`bw-${f}-${c}`} position={[x, y, -d / 2 - 0.07]}>
        <boxGeometry args={[0.95, 0.82, 0.05]} />
        <meshStandardMaterial color={GLASS_DAY} emissive="#102b3a" emissiveIntensity={0.06} roughness={0.25} metalness={0.08} />
      </mesh>
    );
  });

  const sideWindows = [];
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < sideCols; c++) {
      const z = (c - (sideCols - 1) / 2) * (d / (sideCols + 0.45));
      const y = 2.0 + f * 2.05;
      sideWindows.push(
        <mesh key={`swl-${f}-${c}`} position={[-w / 2 - 0.07, y, z]}>
          <boxGeometry args={[0.05, 0.78, 0.92]} />
          <meshStandardMaterial color={GLASS_DAY} emissive="#102b3a" emissiveIntensity={0.06} roughness={0.25} metalness={0.08} />
        </mesh>,
        <mesh key={`swr-${f}-${c}`} position={[w / 2 + 0.07, y, z]}>
          <boxGeometry args={[0.05, 0.78, 0.92]} />
          <meshStandardMaterial color={GLASS_DAY} emissive="#102b3a" emissiveIntensity={0.06} roughness={0.25} metalness={0.08} />
        </mesh>
      );
    }
  }

  return <>{frontWindows}{backWindows}{sideWindows}</>;
}

function BuildingStyleExtras({ b }: { b: BuildingDef }) {
  const [w, h, d] = b.size;

  if (b.id === "hotel") {
    return (
      <>
        {[0.22, 0.42, 0.62, 0.82].map((t) => (
          <mesh key={t} position={[0, h * t, d / 2 + 0.095]}>
            <boxGeometry args={[w + 0.35, 0.16, 0.12]} />
            <meshStandardMaterial color="#d0b786" roughness={0.75} />
          </mesh>
        ))}
        <mesh position={[0, h + 1.4, 0]} castShadow>
          <coneGeometry args={[Math.max(w, d) * 0.42, 2.4, 4]} />
          <meshStandardMaterial color="#15202d" roughness={0.7} metalness={0.15} />
        </mesh>
      </>
    );
  }

  if (b.id === "garage") {
    return (
      <>
        <mesh position={[-w * 0.22, 1.55, d / 2 + 0.09]}>
          <boxGeometry args={[3.8, 2.7, 0.09]} />
          <meshStandardMaterial color="#2f3336" roughness={0.55} metalness={0.25} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[-w * 0.22, 0.55 + i * 0.58, d / 2 + 0.145]}>
            <boxGeometry args={[3.55, 0.08, 0.05]} />
            <meshBasicMaterial color="#89939c" />
          </mesh>
        ))}
      </>
    );
  }

  if (b.id === "ferme") {
    return (
      <>
        <mesh position={[0, h + 1.15, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[w * 0.75, w * 0.75, d + 0.7]} />
          <meshStandardMaterial color={b.roofColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, h * 0.52, d / 2 + 0.1]}>
          <boxGeometry args={[w * 0.72, 0.12, 0.08]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </>
    );
  }

  return null;
}

function EnhancedBuilding({ b }: { b: BuildingDef }) {
  const [bx, by, bz] = b.pos;
  const [w, h, d] = b.size;
  const info = faceInfo(b);
  const secondary = b.wallColor2 ?? (b.id === "police" ? "#d7dde8" : "#ffffff");

  return (
    <Interactive3D
      target={{
        id: `building:${b.id}`,
        kind: b.id === "garage" ? "garage" : b.id === "police" ? "police" : b.id === "hotel" ? "hotel" : "building",
        verb: b.hasInterior ? "enter" : b.job ? "startJob" : "inspect",
        label: b.name,
        prompt: b.hasInterior ? `Entrer dans ${b.name}` : b.job ? `${b.job.title} · +${b.job.reward}$` : `Inspecter ${b.name}`,
        position: [bx, by, bz],
        radius: Math.max(w, d) * 0.75,
        tags: ["building", b.id, b.hasInterior ? "interior" : "exterior", b.job ? "job" : "no-job"],
        data: { buildingId: b.id, interiorId: b.interiorId, job: b.job },
      }}
      position={[bx, by, bz]}
      promptOffset={[0, h + 2, 0]}
    >
      {/* Fondation / lot asphalté autour du bâtiment: décoratif seulement, n'altère pas la logique d'interaction. */}
      <mesh position={[info.roadOffset[0] * 0.35, 0.025, info.roadOffset[1] * 0.35]} receiveShadow>
        <boxGeometry args={[w + 12, 0.05, d + 12]} />
        <meshStandardMaterial color={ASPHALT_2} roughness={0.92} />
      </mesh>

      {/* Corps principal */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={b.wallColor} roughness={0.78} metalness={0.02} />
      </mesh>

      {/* Bande basse / façade commerciale */}
      <mesh position={[0, Math.min(1.45, h * 0.25), d / 2 + 0.045]}>
        <boxGeometry args={[w + 0.06, Math.min(1.5, h * 0.32), 0.08]} />
        <meshStandardMaterial color={secondary} roughness={0.65} />
      </mesh>

      {/* Toit + rebord */}
      <mesh position={[0, h + 0.3, 0]} castShadow>
        <boxGeometry args={[w + 0.65, 0.6, d + 0.65]} />
        <meshStandardMaterial color={b.roofColor} roughness={0.82} metalness={0.06} />
      </mesh>
      <mesh position={[0, h + 0.68, 0]} castShadow>
        <boxGeometry args={[w + 0.95, 0.18, d + 0.95]} />
        <meshStandardMaterial color="#1b2026" roughness={0.8} />
      </mesh>

      <WindowGrid b={b} />
      <BuildingStyleExtras b={b} />

      {/* Porte selon doorSide existant dans quebecBuildings.ts */}
      <mesh position={info.doorPos} castShadow>
        <boxGeometry args={info.doorSize} />
        <meshStandardMaterial color="#172538" roughness={0.35} metalness={0.12} emissive="#071221" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={info.stepPos} receiveShadow>
        <boxGeometry args={info.stepSize} />
        <meshStandardMaterial color={CONCRETE} roughness={0.88} />
      </mesh>
      <mesh position={info.canopyPos} castShadow>
        <boxGeometry args={info.canopySize} />
        <meshStandardMaterial color={b.signColor} roughness={0.55} metalness={0.05} />
      </mesh>

      {/* Enseigne physique + label DOM */}
      <mesh position={info.signPos} castShadow>
        <boxGeometry args={info.signSize} />
        <meshStandardMaterial color={b.signColor} roughness={0.45} emissive={b.signColor} emissiveIntensity={0.12} />
      </mesh>
      <Html position={info.htmlPos} rotation={info.htmlRot} center distanceFactor={20} occlude={false}>
        <div style={{
          minWidth: 120,
          padding: "4px 10px",
          borderRadius: 4,
          background: b.signColor,
          color: b.signTextColor ?? "#fff",
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: "0 0 18px rgba(0,0,0,0.35)",
          fontFamily: "Arial Black, Impact, sans-serif",
          fontSize: 12,
          letterSpacing: 1.4,
          textAlign: "center",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
        }}>
          {cleanLabel(b.name)}
        </div>
      </Html>

      {/* Indicateur subtil pour bâtiments utilisables/jobs, proche de la porte mais non bloquant. */}
      {(b.hasInterior || b.job) && (
        <mesh position={[info.stepPos[0], 0.18, info.stepPos[2]]}>
          <boxGeometry args={[Math.min(info.stepSize[0], 2.4), 0.035, Math.min(info.stepSize[2], 2.4)]} />
          <meshBasicMaterial color={b.hasInterior ? "#42d6ff" : "#ffd24a"} transparent opacity={0.42} />
        </mesh>
      )}
    </Interactive3D>
  );
}

function StreetLamp({ x, z, flip = 1 }: { x: number; z: number; flip?: 1 | -1 }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 3.5, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 7, 8]} />
        <meshStandardMaterial color={METAL} roughness={0.55} metalness={0.35} />
      </mesh>
      <mesh position={[flip * 0.75, 6.85, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 1.6, 8]} />
        <meshStandardMaterial color={METAL} roughness={0.55} metalness={0.35} />
      </mesh>
      <mesh position={[flip * 1.55, 6.75, 0]} castShadow>
        <boxGeometry args={[0.68, 0.24, 0.42]} />
        <meshStandardMaterial color="#3d4248" roughness={0.5} metalness={0.25} />
      </mesh>
      <mesh position={[flip * 1.55, 6.55, 0]}>
        <sphereGeometry args={[0.42, 16, 8]} />
        <meshBasicMaterial color="#ffe9a6" transparent opacity={0.28} />
      </mesh>
      <pointLight position={[flip * 1.55, 6.4, 0]} intensity={0.55} distance={24} color="#ffe6a0" />
    </group>
  );
}

function Cone({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <coneGeometry args={[0.26, 0.65, 12]} />
        <meshStandardMaterial color={ORANGE_CONE} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.32, 0.06, 0.32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#2f2f2f" roughness={0.7} />
      </mesh>
    </group>
  );
}

function StopSign({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 2.7, 8]} />
        <meshStandardMaterial color={METAL} metalness={0.25} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.75, 0]} rotation={[Math.PI / 2, 0, Math.PI / 8]} castShadow>
        <cylinderGeometry args={[0.48, 0.48, 0.06, 8]} />
        <meshStandardMaterial color="#c51f1a" roughness={0.38} />
      </mesh>
      <Html position={[0, 2.75, 0.06]} center distanceFactor={13}>
        <div style={{ color: "white", fontWeight: 900, fontSize: 10, fontFamily: "Arial", pointerEvents: "none" }}>ARRÊT</div>
      </Html>
    </group>
  );
}

function QuebecRoadSign({ x, z, label }: { x: number; z: number; label: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.7, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 3.4, 8]} />
        <meshStandardMaterial color={METAL} metalness={0.25} roughness={0.55} />
      </mesh>
      <mesh position={[0, 3.25, 0]} castShadow>
        <boxGeometry args={[3.7, 1.0, 0.08]} />
        <meshStandardMaterial color="#1d6f3a" roughness={0.35} />
      </mesh>
      <Html position={[0, 3.25, 0.08]} center distanceFactor={18}>
        <div style={{
          width: 130,
          color: "white",
          fontWeight: 800,
          fontSize: 11,
          lineHeight: "12px",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
          pointerEvents: "none",
          textShadow: "0 1px 2px #000",
        }}>{label}</div>
      </Html>
    </group>
  );
}

function ParkingLines({ centerX, centerZ, width, depth }: { centerX: number; centerZ: number; width: number; depth: number }) {
  const lines = useMemo(() => {
    const count = Math.max(3, Math.floor(width / 3));
    return Array.from({ length: count }, (_, i) => centerX - width / 2 + 1.5 + i * 3);
  }, [centerX, width]);

  return (
    <group>
      {lines.map((x) => (
        <mesh key={x} position={[x, 0.075, centerZ]}>
          <boxGeometry args={[0.08, 0.025, Math.min(depth * 0.62, 5.4)]} />
          <meshBasicMaterial color="#e7e7dc" />
        </mesh>
      ))}
    </group>
  );
}

function DecorativeLots() {
  return (
    <group>
      {BUILDINGS.map((b) => {
        const [x, , z] = b.pos;
        const [w, , d] = b.size;
        return (
          <group key={`lot-${b.id}`}>
            <ParkingLines centerX={x} centerZ={z + d / 2 + 7.2} width={Math.min(w + 10, 24)} depth={8} />
            <StreetLamp x={x - w / 2 - 4} z={z + d / 2 + 5} flip={1} />
            <StreetLamp x={x + w / 2 + 4} z={z + d / 2 + 5} flip={-1} />
          </group>
        );
      })}
    </group>
  );
}

function QuebecProps() {
  return (
    <group>
      <QuebecRoadSign x={8} z={-710} label="ROUTE 138 OUEST · PORTNEUF" />
      <QuebecRoadSign x={612} z={-6} label="DONNACONA · POSTE SQ" />
      <QuebecRoadSign x={-992} z={31} label="BATISCAN · DÉPANNEUR" />
      <StopSign x={8.5} z={33} rot={Math.PI} />
      <StopSign x={-988} z={25} rot={Math.PI} />
      {[
        [-5, 29], [-2, 29], [2, 29], [5, 29],
        [592, -8], [596, -8], [604, -8],
        [-1008, 27], [-1004, 27], [-996, 27],
        [392, -766], [396, -766],
      ].map(([x, z], i) => <Cone key={i} x={x} z={z} />)}

      {/* Quelques bancs / poubelles simples près des zones de village */}
      {[[18, -690], [-16, -690], [610, 2], [-990, 4]].map(([x, z], i) => (
        <group key={`bench-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[2.1, 0.22, 0.42]} />
            <meshStandardMaterial color="#6b4525" roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.95, -0.22]} castShadow>
            <boxGeometry args={[2.1, 0.62, 0.16]} />
            <meshStandardMaterial color="#6b4525" roughness={0.65} />
          </mesh>
          <mesh position={[1.45, 0.42, 0.55]} castShadow>
            <cylinderGeometry args={[0.22, 0.18, 0.8, 10]} />
            <meshStandardMaterial color="#1d2426" roughness={0.55} metalness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Road138VillageStrip() {
  return (
    <group>
      {/* Ces éléments complètent la route existante sans la remplacer. */}
      <mesh position={[0, 0.018, -760]} receiveShadow>
        <boxGeometry args={[2.2, 0.035, 250]} />
        <meshBasicMaterial color="#e6cb3f" />
      </mesh>
      <mesh position={[-6.2, 0.02, -760]} receiveShadow>
        <boxGeometry args={[0.18, 0.035, 250]} />
        <meshBasicMaterial color="#e8e8e0" />
      </mesh>
      <mesh position={[6.2, 0.02, -760]} receiveShadow>
        <boxGeometry args={[0.18, 0.035, 250]} />
        <meshBasicMaterial color="#e8e8e0" />
      </mesh>
      <mesh position={[-10.2, 0.07, -760]} receiveShadow>
        <boxGeometry args={[2.4, 0.14, 250]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.85} />
      </mesh>
      <mesh position={[10.2, 0.07, -760]} receiveShadow>
        <boxGeometry args={[2.4, 0.14, 250]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.85} />
      </mesh>
      <mesh position={[-8.7, 0.16, -760]} receiveShadow>
        <boxGeometry args={[0.25, 0.22, 250]} />
        <meshStandardMaterial color={CURB} roughness={0.82} />
      </mesh>
      <mesh position={[8.7, 0.16, -760]} receiveShadow>
        <boxGeometry args={[0.25, 0.22, 250]} />
        <meshStandardMaterial color={CURB} roughness={0.82} />
      </mesh>
      {[-860, -830, -800, -770, -740, -710, -680].map((z, i) => (
        <StreetLamp key={z} x={i % 2 === 0 ? -12 : 12} z={z} flip={i % 2 === 0 ? 1 : -1} />
      ))}
    </group>
  );
}

export default function QuebecCityEnhanced() {
  return (
    <group name="QuebecCityEnhanced">
      <Road138VillageStrip />
      <DecorativeLots />
      {BUILDINGS.map((b) => (
        <EnhancedBuilding key={b.id} b={b} />
      ))}
      <QuebecProps />
    </group>
  );
}
