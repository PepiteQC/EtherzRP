// src/hotel3d/hotel/HotelLobby.tsx

import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { BUILDING, HOTEL, LOBBY, ELEVATOR } from '../constants/dimensions';
import { getMaterialSet } from '../constants/materials';
import { createLobbyRugTexture } from '../textures/ProceduralTextureFactory';

// ─── CHANDELIER ──────────────────────────────────────────────────────────────

const Chandelier: React.FC<{ y: number; z: number }> = React.memo(({ y, z }) => {
  const M = useMemo(() => getMaterialSet(), []);

  return (
    <group position={[0, y, z]}>
      <mesh position={[0, -0.5, 0]} material={M.gold}>
        <cylinderGeometry args={[0.04, 0.04, 1.4, 10]} />
      </mesh>
      <mesh position={[0, -1.3, 0]}>
        <sphereGeometry args={[0.42, 20, 20]} />
        <meshStandardMaterial color={0xffd580} emissive={new THREE.Color(0xffd060)} emissiveIntensity={0.8} metalness={0.7} roughness={0.1} />
      </mesh>
      <mesh position={[0, -1.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
        <torusGeometry args={[0.9, 0.04, 8, 32]} />
      </mesh>
      <mesh position={[0, -1.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
        <torusGeometry args={[1.6, 0.035, 8, 40]} />
      </mesh>

      {Array.from({ length: 12 }, (_, a) => {
        const angle = (a / 12) * Math.PI * 2;
        const ring = a < 6 ? 0.9 : 1.6;
        const cy = a < 6 ? -1.3 : -1.45;
        const extra = (a % 3) * 0.12;
        return (
          <group key={`cr-${a}`}>
            <mesh position={[Math.cos(angle) * ring, cy - 0.22 - extra / 2, Math.sin(angle) * ring]} material={M.gold}>
              <cylinderGeometry args={[0.018, 0.018, 0.45 + extra, 6]} />
            </mesh>
            <mesh position={[Math.cos(angle) * ring, cy - 0.58 - extra, Math.sin(angle) * ring]}>
              <coneGeometry args={[0.075, 0.28, 6]} />
              <meshStandardMaterial color={0xd8f0ff} transparent opacity={0.72} roughness={0} metalness={0.05} />
            </mesh>
          </group>
        );
      })}

      {Array.from({ length: 8 }, (_, a) => (
        <mesh key={`bulb-${a}`} position={[Math.cos((a / 8) * Math.PI * 2) * 1.6, -1.3, Math.sin((a / 8) * Math.PI * 2) * 1.6]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color={0xffd580} emissive={new THREE.Color(0xffd580)} emissiveIntensity={1.5} />
        </mesh>
      ))}

      <pointLight position={[0, -1.4, 0]} color={0xffd580} intensity={5.5} distance={22} />
      <pointLight position={[0, -1.8, 0]} color={0xfff0cc} intensity={2.0} distance={14} />
    </group>
  );
});
Chandelier.displayName = 'Chandelier';

// ─── RECEPTION DESK ──────────────────────────────────────────────────────────

const ReceptionDesk: React.FC<{ z: number }> = React.memo(({ z }) => {
  const M = useMemo(() => getMaterialSet(), []);

  return (
    <group position={[-2.5, 0, z]}>
      <mesh position={[0, 0.57, 0]} material={M.metalDark} castShadow receiveShadow>
        <boxGeometry args={[7, 1.15, 1.1, 6, 3, 3]} />
      </mesh>
      <mesh position={[0, 1.16, 0]} material={M.marble} castShadow>
        <boxGeometry args={[7.15, 0.09, 1.25]} />
      </mesh>
      <mesh position={[-3.0, 0.57, 1.2]} material={M.metalDark} castShadow>
        <boxGeometry args={[1.1, 1.15, 3.0]} />
      </mesh>
      <mesh position={[-3.0, 1.16, 1.2]} material={M.marble} castShadow>
        <boxGeometry args={[1.25, 0.09, 3.15]} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={`rib-${i}`} position={[-3.3 + i * 1.05, 0.58, 0.52]} material={M.gold}>
          <boxGeometry args={[0.06, 1.0, 0.12]} />
        </mesh>
      ))}
      <mesh position={[0, 2.1, -1.1]}>
        <boxGeometry args={[5.6, 0.65, 0.08]} />
        <meshStandardMaterial color={0x0a0f1a} roughness={0.3} metalness={0.6} />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={`logo-${i}`} position={[-2.6 + i * 0.4, 2.1, -1.04]}>
          <boxGeometry args={[0.26, 0.32, 0.04]} />
          <meshStandardMaterial color={0xc9a84c} emissive={new THREE.Color(0xc9a84c)} emissiveIntensity={0.6} metalness={0.8} />
        </mesh>
      ))}
      <pointLight position={[0, 2.3, -0.7]} color={0xfff0cc} intensity={1.2} distance={8} />
    </group>
  );
});
ReceptionDesk.displayName = 'ReceptionDesk';

// ─── SOFA ────────────────────────────────────────────────────────────────────

const Sofa: React.FC<{ position: [number, number, number]; rotationY?: number }> = React.memo(
  ({ position, rotationY = 0 }) => {
    const M = useMemo(() => getMaterialSet(), []);
    return (
      <group position={position} rotation={[0, rotationY, 0]}>
        <mesh position={[0, 0.25, 0]} material={M.leather} castShadow>
          <boxGeometry args={[3.0, 0.5, 1.1, 6, 2, 3]} />
        </mesh>
        {[-0.88, 0.88].map((x) => (
          <mesh key={`c-${x}`} position={[x, 0.6, 0.05]} material={M.fabric} castShadow>
            <boxGeometry args={[1.2, 0.2, 0.9]} />
          </mesh>
        ))}
        <mesh position={[0, 0.7, -0.42]} material={M.leatherDark} castShadow>
          <boxGeometry args={[3.0, 0.7, 0.26]} />
        </mesh>
        {[-0.88, 0.88].map((x) => (
          <mesh key={`b-${x}`} position={[x, 0.72, -0.29]} material={M.fabric} castShadow>
            <boxGeometry args={[1.1, 0.55, 0.1]} />
          </mesh>
        ))}
        {[-1.37, 1.37].map((x) => (
          <group key={`arm-${x}`}>
            <mesh position={[x, 0.3, 0]} material={M.leatherDark} castShadow>
              <boxGeometry args={[0.26, 0.6, 1.1]} />
            </mesh>
            <mesh position={[x, 0.65, 0]} material={M.leatherDark} castShadow>
              <boxGeometry args={[0.28, 0.1, 1.15]} />
            </mesh>
          </group>
        ))}
        {[[-1.2, -0.4], [1.2, -0.4], [-1.2, 0.4], [1.2, 0.4]].map(([x, z], i) => (
          <mesh key={`leg-${i}`} position={[x, 0.12, z]} material={M.gold}>
            <cylinderGeometry args={[0.04, 0.04, 0.24, 8]} />
          </mesh>
        ))}
      </group>
    );
  }
);
Sofa.displayName = 'Sofa';

// ─── ARMCHAIR ────────────────────────────────────────────────────────────────

const Armchair: React.FC<{ position: [number, number, number]; rotationY?: number }> = React.memo(
  ({ position, rotationY = 0 }) => {
    const M = useMemo(() => getMaterialSet(), []);
    return (
      <group position={position} rotation={[0, rotationY, 0]}>
        <mesh position={[0, 0.22, 0]} material={M.leather} castShadow>
          <boxGeometry args={[0.9, 0.44, 0.9]} />
        </mesh>
        <mesh position={[0, 0.53, 0.04]} material={M.fabric} castShadow>
          <boxGeometry args={[0.9, 0.18, 0.8]} />
        </mesh>
        <mesh position={[0, 0.66, -0.34]} material={M.leatherDark} castShadow>
          <boxGeometry args={[0.9, 0.62, 0.22]} />
        </mesh>
        {[-0.38, 0.38].map((x) => (
          <mesh key={`s-${x}`} position={[x, 0.28, 0]} material={M.leatherDark} castShadow>
            <boxGeometry args={[0.14, 0.56, 0.9]} />
          </mesh>
        ))}
        {[[-0.33, -0.35], [0.33, -0.35], [-0.33, 0.35], [0.33, 0.35]].map(([x, z], i) => (
          <mesh key={`l-${i}`} position={[x, 0.11, z]} material={M.gold}>
            <cylinderGeometry args={[0.03, 0.03, 0.22, 8]} />
          </mesh>
        ))}
      </group>
    );
  }
);
Armchair.displayName = 'Armchair';

// ─── PLANT ───────────────────────────────────────────────────────────────────

const Plant: React.FC<{ position: [number, number, number] }> = React.memo(({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.27, 0]} castShadow>
      <cylinderGeometry args={[0.28, 0.2, 0.55, 14, 2]} />
      <meshStandardMaterial color={0x1a1612} roughness={0.5} metalness={0.4} />
    </mesh>
    <mesh position={[0, 0.56, 0]}>
      <sphereGeometry args={[0.25, 10, 10]} />
      <meshStandardMaterial color={0x2a1e0e} roughness={1} />
    </mesh>
    {Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2;
      const h = 0.8 + (i % 3) * 0.25 + 0.25;
      return (
        <mesh key={`leaf-${i}`}
          position={[Math.cos(a) * 0.12, 0.56 + h / 2, Math.sin(a) * 0.12]}
          rotation={[(i % 2 ? 1 : -1) * 0.18, 0, (i % 3 - 1) * 0.24]}
          castShadow
        >
          <boxGeometry args={[0.06, h, 0.06]} />
          <meshStandardMaterial color={0x163518} roughness={0.85} />
        </mesh>
      );
    })}
  </group>
));
Plant.displayName = 'Plant';

// ─── WALL SCONCE ─────────────────────────────────────────────────────────────

const WallSconce: React.FC<{ x: number; y: number; z: number }> = React.memo(({ x, y, z }) => (
  <group position={[x, y, z]}>
    <mesh>
      <boxGeometry args={[0.1, 0.45, 0.4]} />
      <meshStandardMaterial color={0xc9a84c} metalness={0.9} roughness={0.1} />
    </mesh>
    <mesh position={[0, 0, -0.22]}>
      <sphereGeometry args={[0.11, 10, 10]} />
      <meshStandardMaterial color={0xfff0a0} emissive={new THREE.Color(0xfff0a0)} emissiveIntensity={1.5} />
    </mesh>
    <pointLight position={[0, 0, -0.28]} color={0xffd580} intensity={0.65} distance={7} />
    <mesh position={[0, 0, 0.1]}>
      <boxGeometry args={[0.6, 0.9, 0.06]} />
      <meshStandardMaterial color={0x8ab0cc} transparent opacity={0.5} roughness={0.02} metalness={0.3} />
    </mesh>
  </group>
));
WallSconce.displayName = 'WallSconce';

// ─── LOBBY MAIN ──────────────────────────────────────────────────────────────

export const HotelLobby: React.FC = React.memo(() => {
  const M = useMemo(() => getMaterialSet(), []);

  const rugTexture = useMemo(() => createLobbyRugTexture(), []);
  useEffect(() => () => rugTexture.dispose(), [rugTexture]);

  const LW = LOBBY.width;
  const LD = LOBBY.depth;
  const LH = LOBBY.height;
  const baseZ = LOBBY.offsetZ;
  const openingW = 5.5;
  const sideW = (LW - openingW) / 2;

  return (
    <group position={[0, 0, baseZ]}>
      {/* FLOOR */}
      <mesh position={[0, 0.11, 0]} material={M.marbleFloor} receiveShadow>
        <boxGeometry args={[LW, 0.22, LD, 8, 1, 6]} />
      </mesh>

      {/* CEILING */}
      <mesh position={[0, LH - 0.12, 0]} material={M.ceiling} receiveShadow>
        <boxGeometry args={[LW, 0.24, LD]} />
      </mesh>

      {/* REAR WALL with opening */}
      <mesh position={[-(openingW / 2 + sideW / 2), LH / 2, -LD / 2]} material={M.marble} castShadow>
        <boxGeometry args={[sideW, LH, 0.22]} />
      </mesh>
      <mesh position={[(openingW / 2 + sideW / 2), LH / 2, -LD / 2]} material={M.marble} castShadow>
        <boxGeometry args={[sideW, LH, 0.22]} />
      </mesh>
      <mesh position={[0, LH - 0.45, -LD / 2]} material={M.marble} castShadow>
        <boxGeometry args={[openingW, 0.9, 0.22]} />
      </mesh>

      {/* Opening archway gold trim */}
      <mesh position={[0, LH - 0.02, -LD / 2 + 0.15]} material={M.gold}>
        <boxGeometry args={[openingW + 0.3, 0.08, 0.06]} />
      </mesh>
      {[-openingW / 2 - 0.03, openingW / 2 + 0.03].map((x, i) => (
        <mesh key={`arch-v-${i}`} position={[x, LH / 2, -LD / 2 + 0.15]} material={M.gold}>
          <boxGeometry args={[0.06, LH, 0.06]} />
        </mesh>
      ))}

      {/* Side walls */}
      <mesh position={[-LW / 2, LH / 2, 0]} material={M.marble} castShadow>
        <boxGeometry args={[0.22, LH, LD]} />
      </mesh>
      <mesh position={[LW / 2, LH / 2, 0]} material={M.marble} castShadow>
        <boxGeometry args={[0.22, LH, LD]} />
      </mesh>

      {/* Front glazed facade */}
      <mesh position={[0, LH / 2, LD / 2]}>
        <boxGeometry args={[LW, LH, 0.22]} />
        <meshStandardMaterial color={0x0e1520} roughness={0.4} />
      </mesh>
      {[-7, 0, 7].map((gx) => (
        <group key={`gl-${gx}`}>
          <mesh position={[gx, LH * 0.43, LD / 2 + 0.02]} material={M.glass}>
            <boxGeometry args={[4.2, LH * 0.76, 0.08]} />
          </mesh>
          <mesh position={[gx, LH * 0.82, LD / 2]} material={M.frame}>
            <boxGeometry args={[4.4, 0.1, 0.2]} />
          </mesh>
          {[-2.15, 2.15].map((fx) => (
            <mesh key={`fr-${gx}-${fx}`} position={[gx + fx, LH * 0.43, LD / 2]} material={M.frame}>
              <boxGeometry args={[0.1, LH * 0.76, 0.2]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Automatic doors */}
      <mesh position={[0, LH * 0.42, LD / 2 + 0.02]} material={M.frame}>
        <boxGeometry args={[8.5, LH * 0.84, 0.25]} />
      </mesh>
      {[-1.8, 1.8].map((dx) => (
        <group key={`door-${dx}`}>
          <mesh position={[dx, LH * 0.42, LD / 2 + 0.04]} material={M.glass}>
            <boxGeometry args={[3.0, LH * 0.76, 0.08]} />
          </mesh>
          <mesh position={[dx + (dx > 0 ? -0.5 : 0.5), LH * 0.42, LD / 2 + 0.1]} material={M.gold}
            rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.7, 10]} />
          </mesh>
        </group>
      ))}

      {/* Crown moulding */}
      {[-LD / 2 + 0.3, LD / 2 - 0.3].map((mz, i) => (
        <mesh key={`mz-${i}`} position={[0, LH - 0.13, mz]} material={M.gold}>
          <boxGeometry args={[LW - 0.5, 0.16, 0.18]} />
        </mesh>
      ))}
      {[-LW / 2 + 0.3, LW / 2 - 0.3].map((mx, i) => (
        <mesh key={`mx-${i}`} position={[mx, LH - 0.13, 0]} material={M.gold}>
          <boxGeometry args={[0.18, 0.16, LD - 0.5]} />
        </mesh>
      ))}
      {/* Baseboard gold */}
      {[-LD / 2 + 0.3, LD / 2 - 0.3].map((mz, i) => (
        <mesh key={`base-z-${i}`} position={[0, 0.27, mz]} material={M.gold}>
          <boxGeometry args={[LW - 0.5, 0.12, 0.14]} />
        </mesh>
      ))}

      {/* Columns */}
      {[[-7, -1.5], [7, -1.5], [-7, 1.5], [7, 1.5], [-7, 3.8], [7, 3.8]].map(([cx, cz], i) => (
        <group key={`col-${i}`} position={[cx, 0, cz]}>
          <mesh position={[0, (LH - 0.38) / 2, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.34, LH - 0.38, 24, 4]} />
            <meshStandardMaterial color={0xb8a060} metalness={0.78} roughness={0.22} />
          </mesh>
          <mesh position={[0, LH - 0.3, 0]} material={M.gold}>
            <cylinderGeometry args={[0.42, 0.42, 0.22, 24]} />
          </mesh>
          <mesh position={[0, 0.11, 0]} material={M.gold}>
            <cylinderGeometry args={[0.42, 0.42, 0.22, 24]} />
          </mesh>
          {/* Decorative rings */}
          {[1, 2, 3, 4].map((r) => (
            <mesh key={`ring-${r}`} position={[0, (LH - 0.38) * (r / 5), 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
              <torusGeometry args={[0.31, 0.025, 6, 24]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Chandelier */}
      <Chandelier y={LH - 0.55} z={0.8} />

      {/* Reception */}
      <ReceptionDesk z={-2.8} />

      {/* Lounge area */}
      <Sofa position={[2.0, 0, 0.3]} />
      <Sofa position={[2.0, 0, 3.4]} rotationY={Math.PI} />
      <Sofa position={[-1.2, 0, 1.85]} rotationY={Math.PI / 2} />
      <Armchair position={[4.8, 0, 0.5]} rotationY={-Math.PI * 0.35} />
      <Armchair position={[4.8, 0, 3.2]} rotationY={Math.PI * 0.35} />
      <Armchair position={[-4.0, 0, 1.85]} rotationY={Math.PI / 2} />

      {/* Coffee table */}
      <mesh position={[2.0, 0.54, 1.85]} material={M.marble} castShadow>
        <boxGeometry args={[1.55, 0.07, 1.05]} />
      </mesh>
      {[[-0.6, -0.38], [0.6, -0.38], [-0.6, 0.38], [0.6, 0.38]].map(([x, z], i) => (
        <mesh key={`tl-${i}`} position={[2.0 + x, 0.27, 1.85 + z]} material={M.gold}>
          <cylinderGeometry args={[0.035, 0.035, 0.54, 8]} />
        </mesh>
      ))}

      {/* Rug */}
      <mesh position={[1.5, 0.03, 1.85]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6.5, 5.5]} />
        <meshStandardMaterial map={rugTexture} roughness={0.95} />
      </mesh>

      {/* Plants */}
      {[[-9, -1.5], [9, -1.5], [-9, 4.0], [9, 4.0]].map(([px, pz], i) => (
        <Plant key={`plant-${i}`} position={[px, 0, pz]} />
      ))}

      {/* Wall sconces */}
      {[-8.5, -4.5, 4.5, 8.5].map((x) => (
        <WallSconce key={`sc-${x}`} x={x} y={LH * 0.68} z={LD / 2 - 0.3} />
      ))}

      {/* Front canopy */}
      <mesh position={[0, LH * 0.88, LD / 2 + 2.5]} castShadow receiveShadow>
        <boxGeometry args={[10, 0.22, 5]} />
        <meshStandardMaterial color={0x1c2535} roughness={0.55} metalness={0.2} />
      </mesh>
      {[-4, 4].map((sx) => (
        <mesh key={`canopy-${sx}`} position={[sx, LH * 0.44, LD / 2 + 4.8]} castShadow>
          <cylinderGeometry args={[0.1, 0.14, LH * 0.88, 12]} />
          <meshStandardMaterial color={0x1c2535} metalness={0.75} roughness={0.2} />
        </mesh>
      ))}

      {/* Ambient lighting */}
      {[[-5, -1], [5, -1], [0, 3.5]].map(([x, z], i) => (
        <pointLight key={`amb-${i}`} position={[x, LH * 0.7, z]} color={0xffeedd} intensity={1.0} distance={14} />
      ))}
    </group>
  );
});

HotelLobby.displayName = 'HotelLobby';