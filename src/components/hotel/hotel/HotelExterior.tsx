// src/components/hotel/hotel/HotelExterior.tsx

import React, { useMemo } from 'react';
import { HOTEL, BUILDING, LOBBY, PARKING, STAIRWELL } from '../constants/dimensions';
import { getMaterialSet } from '../constants/materials';

/**
 * Extérieur complet de l'hôtel :
 * - Stationnement avec places PMR
 * - Zone de livraison arrière
 * - Enclos à déchets
 * - Rampe d'accès PMR
 * - Trottoirs et connexion piétonne vers le dépanneur
 * - Transformateur électrique
 * - Caméras de sécurité
 * - Escalier de secours extérieur
 * - Gouttières et descentes pluviales
 * - Signalétique extérieure
 */
export const HotelExterior: React.FC = React.memo(() => {
  const M = useMemo(() => getMaterialSet(), []);

  const wingLength = BUILDING.chamberWingLength;
  const bW = BUILDING.width;
  const bH = HOTEL.totalHeight;
  const lobbyZ = LOBBY.offsetZ;
  const lobbyDepth = LOBBY.depth;

  return (
    <group>
      {/* ════════════════════════════════════════
          STATIONNEMENT HÔTEL (devant, côté lobby)
         ════════════════════════════════════════ */}

      {/* Asphalte parking */}
      <mesh
        position={[0, 0.01, lobbyZ + lobbyDepth / 2 + 3 + PARKING.spotDepth / 2 + PARKING.aisleWidth / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        material={M.asphalt}
      >
        <planeGeometry args={[wingLength + 10, PARKING.spotDepth * 2 + PARKING.aisleWidth + 4]} />
      </mesh>

      {/* Places de stationnement — rangée 1 (proche bâtiment) */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = -wingLength / 2 + 3 + i * (PARKING.spotWidth + 0.3);
        const z = lobbyZ + lobbyDepth / 2 + 3 + PARKING.spotDepth / 2;
        const isAccessible = i === 0 || i === 1;
        const spotW = isAccessible ? PARKING.accessibleSpotWidth : PARKING.spotWidth;

        return (
          <group key={`spot-1-${i}`}>
            {/* Spot surface */}
            <mesh position={[x, 0.015, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[spotW, PARKING.spotDepth]} />
              <meshStandardMaterial
                color={isAccessible ? 0x223388 : 0x1a1b20}
                roughness={0.95}
              />
            </mesh>
            {/* Lines */}
            {[-spotW / 2, spotW / 2].map((lx, li) => (
              <mesh key={`line-${li}`} position={[x + lx, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.1, PARKING.spotDepth]} />
                <meshStandardMaterial color={isAccessible ? 0x4488ff : 0xffffff} />
              </mesh>
            ))}
            {/* Accessible symbol */}
            {isAccessible && (
              <mesh position={[x, 0.025, z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.0, 1.0]} />
                <meshStandardMaterial
                  color={0x4488ff}
                  emissive={0x2244aa}
                  emissiveIntensity={0.15}
                />
              </mesh>
            )}
            {/* Bollard */}
            <mesh position={[x, 0.35, z - PARKING.spotDepth / 2 - 0.2]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
              <meshStandardMaterial color={0xdddd00} roughness={0.4} metalness={0.5} />
            </mesh>
          </group>
        );
      })}

      {/* Places — rangée 2 (éloignée) */}
      {Array.from({ length: 10 }, (_, i) => {
        const x = -wingLength / 2 + 2 + i * (PARKING.spotWidth + 0.3);
        const z = lobbyZ + lobbyDepth / 2 + 3 + PARKING.spotDepth + PARKING.aisleWidth + PARKING.spotDepth / 2;

        return (
          <group key={`spot-2-${i}`}>
            <mesh position={[x, 0.015, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[PARKING.spotWidth, PARKING.spotDepth]} />
              <meshStandardMaterial color={0x1a1b20} roughness={0.95} />
            </mesh>
            {[-PARKING.spotWidth / 2, PARKING.spotWidth / 2].map((lx, li) => (
              <mesh key={`line2-${li}`} position={[x + lx, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.1, PARKING.spotDepth]} />
                <meshStandardMaterial color={0xffffff} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Parking signage */}
      <group position={[-wingLength / 2 + 1, 0, lobbyZ + lobbyDepth / 2 + 2]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 3, 8]} />
          <meshStandardMaterial color={0x888888} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 2.8, 0.05]}>
          <boxGeometry args={[0.6, 0.4, 0.04]} />
          <meshStandardMaterial color={0x2244aa} roughness={0.4} />
        </mesh>
        {/* P symbol */}
        <mesh position={[0, 2.8, 0.08]}>
          <boxGeometry args={[0.3, 0.25, 0.01]} />
          <meshStandardMaterial
            color={0xffffff}
            emissive={0xffffff}
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* ════════════════════════════════════════
          RAMPE D'ACCÈS PMR
         ════════════════════════════════════════ */}

      {/* Rampe principale (pente 1:12) */}
      <group position={[-5, 0, lobbyZ + lobbyDepth / 2 + 0.5]}>
        {/* Ramp surface */}
        <mesh position={[0, 0.15, 0]} rotation={[-0.08, 0, 0]} receiveShadow>
          <boxGeometry args={[1.5, 0.1, 4]} />
          <meshStandardMaterial color={0xa0a098} roughness={0.85} />
        </mesh>
        {/* Non-slip strips */}
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={`grip-${i}`} position={[0, 0.21 - i * 0.012, -1.5 + i * 0.6]} rotation={[-0.08, 0, 0]}>
            <boxGeometry args={[1.4, 0.01, 0.05]} />
            <meshStandardMaterial color={0xdddd00} roughness={0.95} />
          </mesh>
        ))}
        {/* Handrails (both sides, double height) */}
        {[-0.8, 0.8].map((rx, ri) => (
          <group key={`ramp-rail-${ri}`}>
            {/* Upper rail */}
            <mesh position={[rx, 0.65, 0]}>
              <boxGeometry args={[0.04, 0.04, 4.2]} />
              <meshStandardMaterial color={0xdddddd} metalness={0.85} roughness={0.15} />
            </mesh>
            {/* Lower rail */}
            <mesh position={[rx, 0.45, 0]}>
              <boxGeometry args={[0.04, 0.04, 4.2]} />
              <meshStandardMaterial color={0xdddddd} metalness={0.85} roughness={0.15} />
            </mesh>
            {/* Vertical supports */}
            {Array.from({ length: 5 }, (_, si) => (
              <mesh key={`ramp-support-${si}`} position={[rx, 0.4, -1.8 + si * 0.9]}>
                <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
                <meshStandardMaterial color={0xdddddd} metalness={0.85} roughness={0.15} />
              </mesh>
            ))}
          </group>
        ))}
        {/* Landing pad at top */}
        <mesh position={[0, 0.28, -2.2]} receiveShadow>
          <boxGeometry args={[1.6, 0.1, 1.5]} />
          <meshStandardMaterial color={0xa0a098} roughness={0.85} />
        </mesh>
        {/* Tactile warning surface at bottom */}
        <mesh position={[0, 0.02, 2.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.5, 0.6]} />
          <meshStandardMaterial color={0xdddd00} roughness={0.95} />
        </mesh>
      </group>

      {/* ════════════════════════════════════════
          ZONE DE LIVRAISON (arrière du bâtiment)
         ════════════════════════════════════════ */}

      {/* Loading dock surface */}
      <mesh
        position={[wingLength / 4, 0.01, -bW / 2 - 5]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        material={M.asphalt}
      >
        <planeGeometry args={[12, 8]} />
      </mesh>

      {/* Dock bumpers */}
      {[-1, 1].map((side) => (
        <mesh key={`bumper-${side}`} position={[wingLength / 4 + side * 2, 0.6, -bW / 2 - 1.2]} castShadow>
          <boxGeometry args={[0.3, 1.2, 0.4]} />
          <meshStandardMaterial color={0x222222} roughness={0.8} />
        </mesh>
      ))}

      {/* Dock raised platform */}
      <mesh position={[wingLength / 4, 0.45, -bW / 2 - 1]} material={M.slab} castShadow>
        <boxGeometry args={[6, 0.9, 1.5]} />
      </mesh>

      {/* Roll-up door */}
      <mesh position={[wingLength / 4, 1.5, -bW / 2 - 0.15]}>
        <boxGeometry args={[3.5, 3.0, 0.08]} />
        <meshStandardMaterial color={0x888888} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Delivery sign */}
      <mesh position={[wingLength / 4, 3.2, -bW / 2 - 0.2]}>
        <boxGeometry args={[2.0, 0.3, 0.04]} />
        <meshStandardMaterial color={0xffd060} emissive={0xffd060} emissiveIntensity={0.3} />
      </mesh>

      {/* ════════════════════════════════════════
          ENCLOS À DÉCHETS
         ════════════════════════════════════════ */}

      <group position={[-wingLength / 3, 0, -bW / 2 - 4]}>
        {/* Enclosure walls */}
        {[
          [0, 0.9, -1.2, 3.0, 1.8, 0.15],
          [0, 0.9, 1.2, 3.0, 1.8, 0.15],
          [-1.5, 0.9, 0, 0.15, 1.8, 2.4],
        ].map(([x, y, z, w, h, d], i) => (
          <mesh key={`waste-wall-${i}`} position={[x, y, z]} material={M.concreteDark} castShadow>
            <boxGeometry args={[w, h, d]} />
          </mesh>
        ))}
        {/* Gate */}
        <mesh position={[1.5, 0.9, 0]}>
          <boxGeometry args={[0.08, 1.8, 2.2]} />
          <meshStandardMaterial color={0x444444} metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Concrete pad */}
        <mesh position={[0, 0.05, 0]} material={M.slab} receiveShadow>
          <boxGeometry args={[3.2, 0.1, 2.6]} />
        </mesh>
        {/* Bins */}
        {[-0.6, 0.6].map((bx, i) => (
          <mesh key={`bin-${i}`} position={[bx, 0.6, 0]} castShadow>
            <boxGeometry args={[0.8, 1.0, 0.8]} />
            <meshStandardMaterial
              color={i === 0 ? 0x2266aa : 0x228822}
              roughness={0.6}
              metalness={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* ════════════════════════════════════════
          TRANSFORMATEUR ÉLECTRIQUE
         ════════════════════════════════════════ */}

      <group position={[-wingLength / 2 - STAIRWELL.width - 3, 0, -bW / 4]}>
        {/* Pad */}
        <mesh position={[0, 0.08, 0]} material={M.slab} receiveShadow>
          <boxGeometry args={[2.5, 0.15, 2.0]} />
        </mesh>
        {/* Transformer box */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[1.8, 1.4, 1.2]} />
          <meshStandardMaterial color={0x556655} roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Vents */}
        {[-0.5, 0.5].map((vx, i) => (
          <mesh key={`vent-${i}`} position={[vx, 0.85, 0.62]}>
            <boxGeometry args={[0.4, 0.6, 0.02]} />
            <meshStandardMaterial color={0x444444} roughness={0.3} metalness={0.6} />
          </mesh>
        ))}
        {/* Warning sign */}
        <mesh position={[0, 1.2, 0.63]}>
          <boxGeometry args={[0.25, 0.25, 0.01]} />
          <meshStandardMaterial color={0xffdd00} roughness={0.4} />
        </mesh>
        {/* Fence */}
        {[
          [-1.4, 0.6, 0, 0.04, 1.2, 2.2],
          [1.4, 0.6, 0, 0.04, 1.2, 2.2],
          [0, 0.6, -1.1, 2.8, 1.2, 0.04],
          [0, 0.6, 1.1, 2.8, 1.2, 0.04],
        ].map(([x, y, z, w, h, d], i) => (
          <mesh key={`fence-${i}`} position={[x, y, z]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={0x888888} metalness={0.7} roughness={0.3} transparent opacity={0.4} />
          </mesh>
        ))}
      </group>

      {/* ════════════════════════════════════════
          CAMÉRAS DE SÉCURITÉ
         ════════════════════════════════════════ */}

      {[
        // Entrée lobby
        [0, LOBBY.height - 0.3, lobbyZ + lobbyDepth / 2 + 0.3, 0],
        // Parking
        [-wingLength / 3, 4, lobbyZ + lobbyDepth / 2 + 10, Math.PI],
        [wingLength / 3, 4, lobbyZ + lobbyDepth / 2 + 10, Math.PI],
        // Arrière
        [wingLength / 4, 3.5, -bW / 2 - 0.3, Math.PI],
        // Côtés
        [-wingLength / 2 - STAIRWELL.width - 0.3, 3, 0, -Math.PI / 2],
        [wingLength / 2 + STAIRWELL.width + 0.3, 3, 0, Math.PI / 2],
      ].map(([x, y, z, ry], i) => (
        <group key={`camera-${i}`} position={[x, y, z]} rotation={[0, ry, 0]}>
          {/* Mount bracket */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.08, 0.15]} />
            <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Camera body */}
          <mesh position={[0, -0.06, 0.12]} castShadow>
            <boxGeometry args={[0.06, 0.06, 0.1]} />
            <meshStandardMaterial color={0x222222} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Lens */}
          <mesh position={[0, -0.06, 0.18]}>
            <cylinderGeometry args={[0.02, 0.015, 0.03, 10]} />
            <meshStandardMaterial color={0x111122} metalness={0.9} roughness={0.05} />
          </mesh>
          {/* IR LED ring */}
          <mesh position={[0, -0.06, 0.195]}>
            <torusGeometry args={[0.025, 0.004, 6, 12]} />
            <meshStandardMaterial color={0x440000} emissive={0x330000} emissiveIntensity={0.5} />
          </mesh>
          {/* Status LED */}
          <mesh position={[0.03, -0.04, 0.1]}>
            <sphereGeometry args={[0.005, 6, 6]} />
            <meshStandardMaterial color={0xff0000} emissive={0xff0000} emissiveIntensity={1.5} />
          </mesh>
        </group>
      ))}

      {/* ════════════════════════════════════════
          ESCALIER DE SECOURS EXTÉRIEUR
         ════════════════════════════════════════ */}

      <group position={[wingLength / 2 + STAIRWELL.width + 1.5, 0, bW / 4]}>
        {/* Structure */}
        {Array.from({ length: HOTEL.totalLevels }, (_, level) => {
          const ly = level * HOTEL.levelHeight;
          return (
            <group key={`fire-escape-${level}`}>
              {/* Platform */}
              <mesh position={[0, ly + HOTEL.levelHeight - 0.1, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.0, 0.1, 1.5]} />
                <meshStandardMaterial color={0x444444} metalness={0.7} roughness={0.3} />
              </mesh>
              {/* Grating texture */}
              <mesh position={[0, ly + HOTEL.levelHeight - 0.04, 0]}>
                <boxGeometry args={[1.9, 0.01, 1.4]} />
                <meshStandardMaterial color={0x555555} metalness={0.6} roughness={0.4} transparent opacity={0.5} />
              </mesh>
              {/* Stairs down */}
              {level > 0 && Array.from({ length: 8 }, (_, step) => (
                <mesh
                  key={`step-${step}`}
                  position={[
                    0,
                    ly + HOTEL.levelHeight - 0.15 - step * (HOTEL.levelHeight / 8),
                    -1.0 + step * 0.18,
                  ]}
                  castShadow
                >
                  <boxGeometry args={[1.0, 0.04, 0.18]} />
                  <meshStandardMaterial color={0x444444} metalness={0.7} roughness={0.3} />
                </mesh>
              ))}
              {/* Railing */}
              <mesh position={[-1.0, ly + HOTEL.levelHeight + 0.45, 0]}>
                <boxGeometry args={[0.04, 1.0, 1.6]} />
                <meshStandardMaterial color={0x888888} metalness={0.7} roughness={0.3} />
              </mesh>
              <mesh position={[1.0, ly + HOTEL.levelHeight + 0.45, 0]}>
                <boxGeometry args={[0.04, 1.0, 1.6]} />
                <meshStandardMaterial color={0x888888} metalness={0.7} roughness={0.3} />
              </mesh>
            </group>
          );
        })}
        {/* Vertical structure columns */}
        {[-0.95, 0.95].map((cx, i) => (
          <mesh key={`escape-col-${i}`} position={[cx, bH / 2, -0.7]} castShadow>
            <boxGeometry args={[0.1, bH, 0.1]} />
            <meshStandardMaterial color={0x555555} metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        {[-0.95, 0.95].map((cx, i) => (
          <mesh key={`escape-col2-${i}`} position={[cx, bH / 2, 0.7]} castShadow>
            <boxGeometry args={[0.1, bH, 0.1]} />
            <meshStandardMaterial color={0x555555} metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        {/* Drop ladder (ground to first platform) */}
        <mesh position={[0, HOTEL.levelHeight / 2, 0.8]}>
          <boxGeometry args={[0.5, HOTEL.levelHeight, 0.04]} />
          <meshStandardMaterial color={0x888888} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* ════════════════════════════════════════
          GOUTTIÈRES ET DESCENTES PLUVIALES
         ════════════════════════════════════════ */}

      {/* Gouttière avant */}
      <mesh position={[0, bH + 0.35, bW / 2 + 0.6]}>
        <boxGeometry args={[wingLength + 6, 0.12, 0.15]} />
        <meshStandardMaterial color={0x555555} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Gouttière arrière */}
      <mesh position={[0, bH + 0.35, -bW / 2 - 0.6]}>
        <boxGeometry args={[wingLength + 6, 0.12, 0.15]} />
        <meshStandardMaterial color={0x555555} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Descentes pluviales */}
      {[
        [-wingLength / 2 - 2, bW / 2 + 0.55],
        [0, bW / 2 + 0.55],
        [wingLength / 2 + 2, bW / 2 + 0.55],
        [-wingLength / 2 - 2, -bW / 2 - 0.55],
        [wingLength / 2 + 2, -bW / 2 - 0.55],
      ].map(([dx, dz], i) => (
        <mesh key={`downspout-${i}`} position={[dx, bH / 2, dz]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, bH, 8]} />
          <meshStandardMaterial color={0x555555} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* ════════════════════════════════════════
          TROTTOIRS ET CONNEXION PIÉTONNE
         ════════════════════════════════════════ */}

      {/* Trottoir principal (devant le lobby) */}
      <mesh
        position={[0, 0.06, lobbyZ + lobbyDepth / 2 + 1.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[wingLength + 12, 3]} />
        <meshStandardMaterial color={0xb0ada8} roughness={0.88} />
      </mesh>
      {/* Curb */}
      <mesh position={[0, 0.08, lobbyZ + lobbyDepth / 2 + 3]}>
        <boxGeometry args={[wingLength + 12, 0.16, 0.15]} />
        <meshStandardMaterial color={0x999999} roughness={0.85} />
      </mesh>
      {/* Curb cut for wheelchair (aligned with ramp) */}
      <mesh position={[-5, 0.02, lobbyZ + lobbyDepth / 2 + 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.0, 0.3]} />
        <meshStandardMaterial color={0xdddd00} roughness={0.95} />
      </mesh>

      {/* Trottoir latéral (vers le dépanneur) */}
      <mesh
        position={[wingLength / 2 + 5, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[8, 2]} />
        <meshStandardMaterial color={0xa8a5a0} roughness={0.88} />
      </mesh>

      {/* Lampadaires chemin piéton */}
      {[wingLength / 2 + 2, wingLength / 2 + 6, wingLength / 2 + 10].map((lx, i) => (
        <group key={`path-lamp-${i}`}>
          <mesh position={[lx, 1.5, 1.2]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 3, 8]} />
            <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[lx, 3.1, 1.2]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshStandardMaterial
              color={0xffd580}
              emissive={0xffd580}
              emissiveIntensity={0.8}
            />
          </mesh>
          <pointLight position={[lx, 3.0, 1.2]} color={0xffd580} intensity={0.8} distance={10} />
        </group>
      ))}

      {/* Signalétique directionnelle vers le dépanneur */}
      <group position={[wingLength / 2 + 4, 0, 1.5]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 2.4, 8]} />
          <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Arrow sign */}
        <mesh position={[0.3, 2.2, 0]}>
          <boxGeometry args={[0.6, 0.15, 0.03]} />
          <meshStandardMaterial color={0x2244aa} roughness={0.4} />
        </mesh>
        <mesh position={[0.3, 2.0, 0]}>
          <boxGeometry args={[0.6, 0.15, 0.03]} />
          <meshStandardMaterial color={0xc9a84c} roughness={0.4} />
        </mesh>
      </group>

      {/* ════════════════════════════════════════
          SALLE MÉCANIQUE RDC (visible de l'extérieur)
         ════════════════════════════════════════ */}

      {/* Grille de ventilation au niveau du sol */}
      <mesh position={[-wingLength / 3, 0.3, -bW / 2 - 0.15]}>
        <boxGeometry args={[1.5, 0.6, 0.06]} />
        <meshStandardMaterial color={0x555555} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Prise d'air frais */}
      <mesh position={[-wingLength / 3 + 3, 1.5, -bW / 2 - 0.15]}>
        <boxGeometry args={[0.8, 0.8, 0.06]} />
        <meshStandardMaterial color={0x444444} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* ════════════════════════════════════════
          SIGNALÉTIQUE EXTÉRIEURE
         ════════════════════════════════════════ */}

      {/* Hotel name sign (illuminated) */}
      <group position={[0, LOBBY.height + 0.5, lobbyZ + lobbyDepth / 2 + 0.3]}>
        <mesh>
          <boxGeometry args={[8, 0.8, 0.12]} />
          <meshStandardMaterial color={0x0a0f1a} roughness={0.2} metalness={0.7} />
        </mesh>
        {/* Letters (simplified as a glowing bar) */}
        <mesh position={[0, 0, 0.07]}>
          <boxGeometry args={[6, 0.4, 0.02]} />
          <meshStandardMaterial
            color={0xc9a84c}
            emissive={0xc9a84c}
            emissiveIntensity={0.8}
            metalness={0.8}
            roughness={0.15}
          />
        </mesh>
        <pointLight position={[0, -0.2, 0.5]} color={0xffd580} intensity={1.0} distance={8} />
      </group>

      {/* Address numbers */}
      <mesh position={[6, LOBBY.height * 0.6, lobbyZ + lobbyDepth / 2 + 0.25]}>
        <boxGeometry args={[0.8, 0.4, 0.04]} />
        <meshStandardMaterial
          color={0xc9a84c}
          emissive={0xc9a84c}
          emissiveIntensity={0.4}
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>

      {/* Star rating */}
      {Array.from({ length: 3 }, (_, i) => (
        <mesh key={`star-${i}`} position={[-2 + i * 0.5, LOBBY.height + 1.1, lobbyZ + lobbyDepth / 2 + 0.32]}>
          <boxGeometry args={[0.2, 0.2, 0.02]} />
          <meshStandardMaterial
            color={0xc9a84c}
            emissive={0xc9a84c}
            emissiveIntensity={0.6}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
});

HotelExterior.displayName = 'HotelExterior';