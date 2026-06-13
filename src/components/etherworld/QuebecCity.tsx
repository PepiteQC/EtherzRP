import { useMemo } from "react";
import { Html } from "@react-three/drei";
import BUILDINGS, { type BuildingDef } from "../../data/quebecBuildings";

function BuildingMesh({ b }: { b: BuildingDef }) {
  const [w, h, d] = b.size;
  const [bx, , bz] = b.pos;
  const isHotel = b.id === "hotel";
  const isPolice = b.id === "police";

  // Door face: right-side buildings face left (-x), left-side buildings face right (+x)
  const doorFaceX = b.doorSide === "right" ? -w / 2 : w / 2;
  const signX = b.doorSide === "right" ? w / 2 + 0.2 : -w / 2 - 0.2;

  return (
    <group position={[bx, 0, bz]}>
      {/* Main walls */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshLambertMaterial color={b.wallColor} />
      </mesh>

      {/* Secondary wall strip (decorative) */}
      {b.wallColor2 && (
        <mesh position={[doorFaceX * 0.01, h * 0.25, 0]}>
          <boxGeometry args={[w + 0.1, h * 0.5, d + 0.1]} />
          <meshLambertMaterial color={b.wallColor2} />
        </mesh>
      )}

      {/* Roof */}
      <mesh position={[0, h + 0.4, 0]} castShadow>
        <boxGeometry args={[w + 0.5, 0.8, d + 0.5]} />
        <meshLambertMaterial color={b.roofColor} />
      </mesh>

      {/* Roof parapet edge */}
      {isHotel && (
        <mesh position={[0, h + 0.85, 0]}>
          <boxGeometry args={[w + 0.6, 0.3, d + 0.6]} />
          <meshLambertMaterial color={b.roofColor} />
        </mesh>
      )}

      {/* Hotel floor separators */}
      {isHotel &&
        [2, 4, 6, 8, 10, 12].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[w + 0.2, 0.2, d + 0.2]} />
            <meshLambertMaterial color="#1a2840" />
          </mesh>
        ))}

      {/* Police stripe */}
      {isPolice && (
        <mesh position={[doorFaceX * 0.5, h * 0.5, 0]}>
          <boxGeometry args={[0.8, h, d + 0.1]} />
          <meshLambertMaterial color="#2255cc" />
        </mesh>
      )}

      {/* Windows — front face */}
      {Array.from({ length: Math.min(Math.floor(d / 3), 4) }).map((_, i) => {
        const zOff = (i - Math.floor(d / 3 / 2)) * 3;
        const floorCount = isHotel ? 6 : 1;
        return Array.from({ length: floorCount }).map((__, fi) => (
          <mesh
            key={`${i}-${fi}`}
            position={[doorFaceX + (b.doorSide === "right" ? -0.05 : 0.05), 1.5 + fi * 2, zOff]}
          >
            <boxGeometry args={[0.06, 0.9, 1.2]} />
            <meshBasicMaterial color="#aad4ee" />
          </mesh>
        ));
      })}

      {/* Side windows */}
      {[-d / 3, 0, d / 3].map((zOff, i) => {
        const floorCount = isHotel ? 5 : 1;
        return Array.from({ length: floorCount }).map((_, fi) => (
          <mesh
            key={`side-${i}-${fi}`}
            position={[b.doorSide === "right" ? w / 2 + 0.05 : -w / 2 - 0.05, 1.5 + fi * 2, zOff]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <boxGeometry args={[0.06, 0.9, 1.1]} />
            <meshBasicMaterial color="#aad4ee" />
          </mesh>
        ));
      })}

      {/* Door frame */}
      <mesh position={[doorFaceX, 1.1, 0]}>
        <boxGeometry args={[0.08, 2.2, 1.8]} />
        <meshLambertMaterial color="#3a2a1a" />
      </mesh>
      {/* Door inset */}
      <mesh position={[doorFaceX + (b.doorSide === "right" ? 0.1 : -0.1), 1.1, 0]}>
        <boxGeometry args={[0.06, 2.0, 1.6]} />
        <meshBasicMaterial color="#2a3a5a" transparent opacity={0.7} />
      </mesh>

      {/* Canopy over door */}
      <mesh position={[doorFaceX + (b.doorSide === "right" ? -1.5 : 1.5), 2.6, 0]}>
        <boxGeometry args={[3, 0.15, 2.5]} />
        <meshLambertMaterial color={b.signColor} />
      </mesh>

      {/* Sign panel on wall */}
      <mesh position={[doorFaceX + (b.doorSide === "right" ? -0.1 : 0.1), h - 1, 0]}>
        <boxGeometry args={[0.1, 1.2, Math.min(w * 0.8, 8)]} />
        <meshLambertMaterial color={b.signColor} />
      </mesh>

      {/* HTML sign label */}
      <Html
        position={[signX, h - 0.5, 0]}
        rotation={[0, b.doorSide === "right" ? Math.PI / 2 : -Math.PI / 2, 0]}
        center
        distanceFactor={18}
      >
        <div
          style={{
            background: b.signColor,
            color: b.signTextColor ?? "#ffffff",
            padding: "2px 8px",
            fontSize: 13,
            fontFamily: "monospace",
            fontWeight: 700,
            letterSpacing: 2,
            whiteSpace: "nowrap",
            textTransform: "uppercase",
            border: "1px solid rgba(255,255,255,0.25)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {b.name}
        </div>
      </Html>
    </group>
  );
}

function GasPumps() {
  const pumps = useMemo(
    () => [
      { x: 21, z: -752 },
      { x: 21, z: -747 },
    ],
    []
  );
  return (
    <group>
      {/* Pump canopy */}
      <mesh position={[21, 4, -750]} castShadow>
        <boxGeometry args={[5, 0.25, 12]} />
        <meshLambertMaterial color="#0a2a8a" />
      </mesh>
      <mesh position={[21, 0.2, -750]}>
        <boxGeometry args={[5, 0.4, 12]} />
        <meshLambertMaterial color="#888888" />
      </mesh>
      {/* Canopy support pillars */}
      {pumps.map(({ x, z }, i) => (
        <mesh key={i} position={[x, 2, z]}>
          <boxGeometry args={[0.25, 4, 0.25]} />
          <meshLambertMaterial color="#555555" />
        </mesh>
      ))}
      {/* Pumps */}
      {pumps.map(({ x, z }, i) => (
        <group key={i} position={[x - 1, 0, z]}>
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[0.6, 1.8, 0.4]} />
            <meshLambertMaterial color="#f0f0e0" />
          </mesh>
          <mesh position={[0, 1.5, 0.22]}>
            <boxGeometry args={[0.35, 0.5, 0.05]} />
            <meshBasicMaterial color="#0a2a8a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Sidewalks() {
  return (
    <group>
      {/* Right-side sidewalk */}
      <mesh position={[11, 0.08, -772]} receiveShadow>
        <boxGeometry args={[3, 0.16, 160]} />
        <meshLambertMaterial color="#c0bcb4" />
      </mesh>
      {/* Left-side sidewalk */}
      <mesh position={[-11, 0.08, -775]} receiveShadow>
        <boxGeometry args={[3, 0.16, 165]} />
        <meshLambertMaterial color="#c0bcb4" />
      </mesh>
    </group>
  );
}

function StreetLamps() {
  const lamps = useMemo(
    () => [
      { x: 11, z: -720 },
      { x: 11, z: -760 },
      { x: 11, z: -800 },
      { x: 11, z: -840 },
      { x: -11, z: -730 },
      { x: -11, z: -770 },
      { x: -11, z: -810 },
      { x: -11, z: -850 },
    ],
    []
  );
  return (
    <group>
      {lamps.map(({ x, z }, i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Pole */}
          <mesh position={[0, 4, 0]}>
            <boxGeometry args={[0.12, 8, 0.12]} />
            <meshLambertMaterial color="#555555" />
          </mesh>
          {/* Arm */}
          <mesh position={[x > 0 ? -1 : 1, 7.8, 0]}>
            <boxGeometry args={[2, 0.1, 0.1]} />
            <meshLambertMaterial color="#555555" />
          </mesh>
          {/* Light head */}
          <mesh position={[x > 0 ? -2 : 2, 7.7, 0]}>
            <boxGeometry args={[0.6, 0.3, 0.4]} />
            <meshLambertMaterial color="#555555" />
          </mesh>
          {/* Light glow */}
          <mesh position={[x > 0 ? -2 : 2, 7.55, 0]}>
            <boxGeometry args={[0.5, 0.06, 0.35]} />
            <meshBasicMaterial color="#fffde0" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ParkingLot() {
  return (
    <group>
      {/* Right-side parking lot */}
      <mesh position={[30, 0.05, -772]} receiveShadow>
        <boxGeometry args={[16, 0.1, 160]} />
        <meshLambertMaterial color="#4a4a48" />
      </mesh>
      {/* Parking stripes */}
      {[-5, -2, 1, 4, 7].map((i) => (
        <mesh key={i} position={[26 + i * 2, 0.11, -772]}>
          <boxGeometry args={[0.08, 0.02, 5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* Left-side parking */}
      <mesh position={[-34, 0.05, -775]} receiveShadow>
        <boxGeometry args={[18, 0.1, 165]} />
        <meshLambertMaterial color="#4a4a48" />
      </mesh>
      {[-6, -3, 0, 3].map((i) => (
        <mesh key={i} position={[-31 + i * 2, 0.11, -775]}>
          <boxGeometry args={[0.08, 0.02, 5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}

function DoorMarkers() {
  // Visible door markers / step
  return (
    <group>
      {BUILDINGS.map((b) => {
        const [bx, , bz] = b.pos;
        const [w] = b.size;
        const doorX =
          b.doorSide === "right"
            ? bx - w / 2 - 0.5
            : bx + w / 2 + 0.5;
        return (
          <mesh key={b.id} position={[doorX, 0.06, bz]}>
            <boxGeometry args={[1.5, 0.12, 2.2]} />
            <meshLambertMaterial color="#a0a090" />
          </mesh>
        );
      })}
    </group>
  );
}

export default function QuebecCity() {
  return (
    <group>
      <Sidewalks />
      <ParkingLot />
      {BUILDINGS.map((b) => (
        <BuildingMesh key={b.id} b={b} />
      ))}
      <GasPumps />
      <StreetLamps />
      <DoorMarkers />
    </group>
  );
}
