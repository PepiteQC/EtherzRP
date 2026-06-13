import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { startJob, canStartJob, getJobCooldownSec } from "../../store/gameState";
import type { BuildingDef } from "../../data/quebecBuildings";

// All interiors are placed far from the exterior world at Z=2000+
const BASE = new THREE.Vector3(0, 0, 2000);

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  brake = "brake",
}

interface InteriorConfig {
  roomW: number;
  roomH: number;
  roomD: number;
  floorColor: string;
  wallColor: string;
  accentColor: string;
  ceilingColor: string;
}

const INTERIOR_CONFIGS: Record<string, InteriorConfig> = {
  hotel: {
    roomW: 13, roomH: 5.5, roomD: 11,
    floorColor: "#c8bfa8", wallColor: "#2a3a5c", accentColor: "#3a6abd",
    ceilingColor: "#1a2840",
  },
  depanneur: {
    roomW: 10, roomH: 3.8, roomD: 8,
    floorColor: "#e0ddd8", wallColor: "#e8e2d5", accentColor: "#cc1a1a",
    ceilingColor: "#d0ccc8",
  },
  restaurant: {
    roomW: 9, roomH: 4.2, roomD: 9,
    floorColor: "#9a7a60", wallColor: "#c8b87a", accentColor: "#6a3010",
    ceilingColor: "#7a5838",
  },
  police: {
    roomW: 11, roomH: 4.5, roomD: 10,
    floorColor: "#8a9090", wallColor: "#3a4a68", accentColor: "#2255bb",
    ceilingColor: "#2a3848",
  },
};

// Relative positions inside the room (local coords)
const EXIT_Z_LOCAL = 4.5; // entrance side
const JOB_X_LOCAL = 2;
const JOB_Z_LOCAL = -3.5;

function HotelLobby({ cfg }: { cfg: InteriorConfig }) {
  const { roomW, roomH, roomD, wallColor, accentColor } = cfg;
  return (
    <>
      {/* Reception desk */}
      <mesh position={[0, 0.8, -roomD / 2 + 2]}>
        <boxGeometry args={[5, 1.6, 1.5]} />
        <meshLambertMaterial color="#1a2840" />
      </mesh>
      <mesh position={[0, 1.62, -roomD / 2 + 2]}>
        <boxGeometry args={[5.2, 0.12, 1.6]} />
        <meshLambertMaterial color="#c8a050" />
      </mesh>
      {/* Computer on desk */}
      <mesh position={[1.5, 1.75, -roomD / 2 + 1.7]}>
        <boxGeometry args={[0.6, 0.5, 0.08]} />
        <meshBasicMaterial color="#3a6abd" />
      </mesh>
      {/* Pillars */}
      {([-roomW / 2 + 1.5, roomW / 2 - 1.5] as number[]).map((x) =>
        ([-roomD / 2 + 2, roomD / 2 - 2] as number[]).map((z) => (
          <mesh key={`${x}-${z}`} position={[x, roomH / 2, z]}>
            <boxGeometry args={[0.7, roomH, 0.7]} />
            <meshLambertMaterial color={accentColor} />
          </mesh>
        ))
      )}
      {/* Elevator doors */}
      {([-2.5, 0, 2.5] as number[]).map((x) => (
        <group key={x} position={[x, 0, -roomD / 2 + 0.1]}>
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[1.8, 3, 0.1]} />
            <meshLambertMaterial color="#888888" />
          </mesh>
          <mesh position={[-0.45, 1.5, 0.06]}>
            <boxGeometry args={[0.88, 2.8, 0.06]} />
            <meshLambertMaterial color="#aaaaaa" />
          </mesh>
          <mesh position={[0.45, 1.5, 0.06]}>
            <boxGeometry args={[0.88, 2.8, 0.06]} />
            <meshLambertMaterial color="#aaaaaa" />
          </mesh>
          <mesh position={[0, 2.8, 0.12]}>
            <boxGeometry args={[0.25, 0.25, 0.05]} />
            <meshBasicMaterial color="#ffdd44" />
          </mesh>
        </group>
      ))}
      {/* Couches */}
      {([-3, 3] as number[]).map((x) => (
        <group key={x} position={[x, 0, 1]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[2, 0.8, 1]} />
            <meshLambertMaterial color="#2a3a6a" />
          </mesh>
          <mesh position={[0, 0.9, -0.4]}>
            <boxGeometry args={[2, 1, 0.2]} />
            <meshLambertMaterial color="#2a3a6a" />
          </mesh>
        </group>
      ))}
      {/* Chandelier */}
      <mesh position={[0, roomH - 0.2, 0]}>
        <boxGeometry args={[2, 0.1, 0.8]} />
        <meshLambertMaterial color={accentColor} />
      </mesh>
      {([-0.8, 0, 0.8] as number[]).map((x) => (
        <mesh key={x} position={[x, roomH - 0.5, 0]}>
          <sphereGeometry args={[0.12, 6, 6]} />
          <meshBasicMaterial color="#fffde0" />
        </mesh>
      ))}
      {/* Wall color stripe */}
      <mesh position={[0, 1, -roomD / 2 + 0.06]}>
        <boxGeometry args={[roomW, 2, 0.05]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>
      {/* Job board */}
      <mesh position={[JOB_X_LOCAL + 0.5, 2, JOB_Z_LOCAL + 0.1]}>
        <boxGeometry args={[1.5, 1.8, 0.12]} />
        <meshLambertMaterial color="#8a6a30" />
      </mesh>
      <mesh position={[JOB_X_LOCAL + 0.5, 2, JOB_Z_LOCAL + 0.18]}>
        <boxGeometry args={[1.2, 1.4, 0.05]} />
        <meshBasicMaterial color="#d0c080" />
      </mesh>
    </>
  );
}

function DepanneurInterior({ cfg }: { cfg: InteriorConfig }) {
  const { roomW, roomH, roomD, accentColor } = cfg;
  return (
    <>
      {/* Counter */}
      <mesh position={[0, 0.8, -roomD / 2 + 1.5]}>
        <boxGeometry args={[4, 1.6, 1]} />
        <meshLambertMaterial color="#c0b8a8" />
      </mesh>
      <mesh position={[0, 1.62, -roomD / 2 + 1.5]}>
        <boxGeometry args={[4.2, 0.1, 1.1]} />
        <meshLambertMaterial color="#d0c8b8" />
      </mesh>
      {/* Cash register */}
      <mesh position={[JOB_X_LOCAL, 1.72, -roomD / 2 + 1.5]}>
        <boxGeometry args={[0.5, 0.35, 0.4]} />
        <meshLambertMaterial color="#444444" />
      </mesh>
      <mesh position={[JOB_X_LOCAL, 1.72, -roomD / 2 + 1.1]}>
        <boxGeometry args={[0.4, 0.05, 0.3]} />
        <meshBasicMaterial color="#222222" />
      </mesh>
      {/* Shelves — left wall */}
      {[0, 1.2, 2.4].map((z, si) => (
        <group key={si} position={[-roomW / 2 + 0.3, 0, -1 + z]}>
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[0.2, 3, 1.2]} />
            <meshLambertMaterial color="#c0b8a8" />
          </mesh>
          {[0.5, 1.2, 2].map((y, ri) => (
            <mesh key={ri} position={[0.05, y, 0]}>
              <boxGeometry args={[0.1, 0.08, 1.1]} />
              <meshLambertMaterial color="#aaa8a0" />
            </mesh>
          ))}
          {/* Boxes on shelves */}
          {[0.5, 1.2, 2].map((y, ri) =>
            [-0.3, 0, 0.3].map((zb, bi) => (
              <mesh key={`${ri}-${bi}`} position={[0.12, y + 0.15, zb]}>
                <boxGeometry args={[0.18, 0.25, 0.22]} />
                <meshLambertMaterial
                  color={["#cc3020", "#2050aa", "#30aa40", "#cc8010"][((si + ri + bi) % 4)]}
                />
              </mesh>
            ))
          )}
        </group>
      ))}
      {/* Fridge wall (back) */}
      <mesh position={[0, roomH / 2, -roomD / 2 + 0.15]}>
        <boxGeometry args={[roomW - 1, roomH, 0.3]} />
        <meshLambertMaterial color="#dde8ee" />
      </mesh>
      {/* Fridge glow */}
      {[-3, -1, 1, 3].map((x) => (
        <mesh key={x} position={[x, roomH / 2, -roomD / 2 + 0.32]}>
          <boxGeometry args={[1.6, roomH - 0.5, 0.04]} />
          <meshBasicMaterial color="#c8e8ff" transparent opacity={0.6} />
        </mesh>
      ))}
      {/* Sign strip */}
      <mesh position={[0, roomH - 0.3, roomD / 2 - 0.06]}>
        <boxGeometry args={[roomW, 0.8, 0.05]} />
        <meshLambertMaterial color={accentColor} />
      </mesh>
    </>
  );
}

function RestaurantInterior({ cfg }: { cfg: InteriorConfig }) {
  const { roomW, roomD, accentColor } = cfg;
  return (
    <>
      {/* Tables */}
      {([-2.5, 0, 2.5] as number[]).map((x) =>
        ([-1, 1.5] as number[]).map((z) => (
          <group key={`${x}-${z}`} position={[x, 0, z]}>
            <mesh position={[0, 0.85, 0]}>
              <cylinderGeometry args={[0.6, 0.5, 0.08, 8]} />
              <meshLambertMaterial color="#6a4028" />
            </mesh>
            <mesh position={[0, 0.42, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.85, 6]} />
              <meshLambertMaterial color="#4a2a18" />
            </mesh>
            {/* Chairs */}
            {([{ cx: 0.8, cz: 0 }, { cx: -0.8, cz: 0 }, { cx: 0, cz: 0.8 }, { cx: 0, cz: -0.8 }] as {cx:number,cz:number}[]).map(({ cx, cz }, ci) => (
              <group key={ci} position={[cx, 0, cz]}>
                <mesh position={[0, 0.4, 0]}>
                  <boxGeometry args={[0.4, 0.08, 0.4]} />
                  <meshLambertMaterial color="#5a3020" />
                </mesh>
                <mesh position={[0, 0.75, -0.16]}>
                  <boxGeometry args={[0.4, 0.7, 0.08]} />
                  <meshLambertMaterial color="#5a3020" />
                </mesh>
              </group>
            ))}
          </group>
        ))
      )}
      {/* Bar counter */}
      <mesh position={[0, 0.8, -roomD / 2 + 1.5]}>
        <boxGeometry args={[roomW - 2, 1.6, 1.2]} />
        <meshLambertMaterial color="#5a3010" />
      </mesh>
      <mesh position={[0, 1.62, -roomD / 2 + 1.5]}>
        <boxGeometry args={[roomW - 1.8, 0.1, 1.3]} />
        <meshLambertMaterial color="#8a5a28" />
      </mesh>
      {/* Kitchen window */}
      <mesh position={[0, 2.2, -roomD / 2 + 0.12]}>
        <boxGeometry args={[2, 0.9, 0.1]} />
        <meshBasicMaterial color="#fffde0" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 2.2, -roomD / 2 + 0.06]}>
        <boxGeometry args={[2.2, 1, 0.06]} />
        <meshLambertMaterial color="#5a3010" />
      </mesh>
      {/* Menu board */}
      <mesh position={[-roomW / 2 + 0.08, 2.5, 0]}>
        <boxGeometry args={[0.1, 1.5, 3]} />
        <meshLambertMaterial color={accentColor} />
      </mesh>
      {/* Serving spot marker */}
      <mesh position={[JOB_X_LOCAL, 0.1, JOB_Z_LOCAL]}>
        <circleGeometry args={[0.5, 8]} />
        <meshBasicMaterial color="#ffd700" side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function PoliceInterior({ cfg }: { cfg: InteriorConfig }) {
  const { roomW, roomD, accentColor } = cfg;
  return (
    <>
      {/* Desks */}
      {([-2, 2] as number[]).map((x) =>
        ([0, -2.5] as number[]).map((z) => (
          <group key={`${x}-${z}`} position={[x, 0, z]}>
            <mesh position={[0, 0.8, 0]}>
              <boxGeometry args={[1.8, 0.08, 0.9]} />
              <meshLambertMaterial color="#3a4a68" />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[1.6, 0.8, 0.8]} />
              <meshLambertMaterial color="#2a3848" />
            </mesh>
            <mesh position={[-0.4, 0.9, -0.1]}>
              <boxGeometry args={[0.5, 0.4, 0.06]} />
              <meshBasicMaterial color="#aaddff" />
            </mesh>
          </group>
        ))
      )}
      {/* Cell door bars */}
      <mesh position={[roomW / 2 - 0.3, 1.5, -2]}>
        <boxGeometry args={[0.1, 3, 2.5]} />
        <meshLambertMaterial color="#555555" />
      </mesh>
      {[-0.5, 0, 0.5, 1].map((z) => (
        <mesh key={z} position={[roomW / 2 - 0.2, 1.5, z]}>
          <boxGeometry args={[0.1, 2.8, 0.08]} />
          <meshLambertMaterial color="#777777" />
        </mesh>
      ))}
      {/* Dispatch console (job spot) */}
      <mesh position={[JOB_X_LOCAL, 0.8, JOB_Z_LOCAL]}>
        <boxGeometry args={[2.5, 1.6, 0.9]} />
        <meshLambertMaterial color="#2a3848" />
      </mesh>
      {[-0.6, 0, 0.6].map((x) => (
        <mesh key={x} position={[JOB_X_LOCAL + x, 1.72, JOB_Z_LOCAL - 0.2]}>
          <boxGeometry args={[0.55, 0.4, 0.06]} />
          <meshBasicMaterial color="#3355aa" />
        </mesh>
      ))}
      {/* Police badge on wall */}
      <mesh position={[0, 2.5, -roomD / 2 + 0.08]}>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 6]} />
        <meshLambertMaterial color={accentColor} />
      </mesh>
      {/* Flag stripe */}
      <mesh position={[0, roomH ?? 4, -roomD / 2 + 0.06]}>
        <boxGeometry args={[roomW, 0.4, 0.06]} />
        <meshLambertMaterial color={accentColor} />
      </mesh>
    </>
  );
}

function Room({ cfg, interiorId }: { cfg: InteriorConfig; interiorId: string }) {
  const { roomW, roomH, roomD, floorColor, wallColor, ceilingColor, accentColor } = cfg;
  return (
    <group position={BASE.toArray()}>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roomW, roomD]} />
        <meshLambertMaterial color={floorColor} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, roomH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomW, roomD]} />
        <meshLambertMaterial color={ceilingColor} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, roomH / 2, -roomD / 2]} rotation={[0, 0, 0]}>
        <planeGeometry args={[roomW, roomH]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>
      {/* Front wall (entrance side) with door opening */}
      <mesh position={[-2.5, roomH / 2, roomD / 2]}>
        <planeGeometry args={[roomW - 5, roomH]} />
        <meshLambertMaterial color={wallColor} side={THREE.BackSide} />
      </mesh>
      <mesh position={[roomW / 2 - 1, roomH / 2, roomD / 2]}>
        <planeGeometry args={[2, roomH]} />
        <meshLambertMaterial color={wallColor} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, roomH - 0.5, roomD / 2]}>
        <planeGeometry args={[roomW, 1]} />
        <meshLambertMaterial color={wallColor} side={THREE.BackSide} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-roomW / 2, roomH / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[roomD, roomH]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>
      {/* Right wall */}
      <mesh position={[roomW / 2, roomH / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[roomD, roomH]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>
      {/* Floor baseboard */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[roomW - 0.1, 0.3, roomD - 0.1]} />
        <meshLambertMaterial color={accentColor} />
      </mesh>
      {/* Exit door frame */}
      <mesh position={[0, 1.1, roomD / 2 - 0.08]}>
        <boxGeometry args={[2, 2.2, 0.12]} />
        <meshLambertMaterial color="#3a2a18" />
      </mesh>
      <mesh position={[0, 1.1, roomD / 2 - 0.04]}>
        <boxGeometry args={[1.8, 2.0, 0.06]} />
        <meshBasicMaterial color="#2a3a5a" transparent opacity={0.6} />
      </mesh>
      {/* Ceiling lamp */}
      <mesh position={[0, roomH - 0.05, 0]}>
        <boxGeometry args={[1.5, 0.1, 0.5]} />
        <meshLambertMaterial color="#555555" />
      </mesh>
      <mesh position={[0, roomH - 0.16, 0]}>
        <boxGeometry args={[1.4, 0.06, 0.4]} />
        <meshBasicMaterial color="#fffde0" />
      </mesh>

      {/* Interior-specific furniture */}
      {interiorId === "hotel" && <HotelLobby cfg={cfg} />}
      {interiorId === "depanneur" && <DepanneurInterior cfg={cfg} />}
      {interiorId === "restaurant" && <RestaurantInterior cfg={cfg} />}
      {interiorId === "police" && <PoliceInterior cfg={cfg} />}
    </group>
  );
}

function InteriorPlayer({ cfg }: { cfg: InteriorConfig }) {
  const bob = useRef(0);
  // Rendered relative to BASE
  const [, getState] = useKeyboardControls<Controls>();
  const playerRef = useRef<THREE.Group>(null!);
  const { camera } = useThree();
  const facingAngle = useRef(Math.PI); // facing toward inside
  const camTarget = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!playerRef.current) return;
    const controls = getState();
    const dt = Math.min(delta, 0.05);
    const walkSpeed = 0.1;
    const turnSpeed = 2.5;
    const cfg_bound_x = cfg.roomW / 2 - 0.8;
    const cfg_bound_z = cfg.roomD / 2 - 0.8;
    let moving = false;

    if (controls.forward) {
      facingAngle.current = Math.atan2(
        camera.position.x - (BASE.x + playerRef.current.position.x),
        camera.position.z - (BASE.z + playerRef.current.position.z)
      );
      playerRef.current.rotation.y = facingAngle.current;
      const dir = new THREE.Vector3(Math.sin(facingAngle.current), 0, Math.cos(facingAngle.current));
      playerRef.current.position.addScaledVector(dir, walkSpeed);
      moving = true;
    }
    if (controls.back) {
      const dir = new THREE.Vector3(Math.sin(facingAngle.current), 0, Math.cos(facingAngle.current));
      playerRef.current.position.addScaledVector(dir, -walkSpeed * 0.7);
      moving = true;
    }
    if (controls.left) { facingAngle.current += turnSpeed * dt; playerRef.current.rotation.y = facingAngle.current; }
    if (controls.right) { facingAngle.current -= turnSpeed * dt; playerRef.current.rotation.y = facingAngle.current; }

    // Clamp to room bounds
    playerRef.current.position.x = Math.max(-cfg_bound_x, Math.min(cfg_bound_x, playerRef.current.position.x));
    playerRef.current.position.z = Math.max(-cfg_bound_z, Math.min(cfg_bound_z, playerRef.current.position.z));
    playerRef.current.position.y = 0;

    if (moving) bob.current += dt * 10;

    // Camera
    const worldPos = new THREE.Vector3(
      BASE.x + playerRef.current.position.x,
      BASE.y + playerRef.current.position.y,
      BASE.z + playerRef.current.position.z
    );
    const camAngle = facingAngle.current;
    const desiredCam = worldPos.clone().add(new THREE.Vector3(Math.sin(camAngle) * 6, 4, Math.cos(camAngle) * 6));
    camera.position.lerp(desiredCam, 0.1);
    camTarget.current.lerp(new THREE.Vector3(worldPos.x, worldPos.y + 1, worldPos.z), 0.12);
    camera.lookAt(camTarget.current);
  });

  const hb = Math.sin(bob.current) * 0.04;
  return (
    <group ref={playerRef} position={[0, 0, cfg.roomD / 2 - 1.5]}>
      <mesh position={[0, 0.4 + hb, 0]} castShadow>
        <boxGeometry args={[0.45, 0.8, 0.25]} />
        <meshLambertMaterial color="#1a3a6a" />
      </mesh>
      <mesh position={[0, 1.0 + hb, 0]} castShadow>
        <boxGeometry args={[0.32, 0.32, 0.32]} />
        <meshLambertMaterial color="#e8c9a0" />
      </mesh>
      <mesh position={[0, 1.22 + hb, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.22, 8]} />
        <meshLambertMaterial color="#c82020" />
      </mesh>
      <mesh position={[0, 1.34 + hb, 0]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.3, 0.5 + hb * 0.5, 0]}>
        <boxGeometry args={[0.18, 0.65, 0.18]} />
        <meshLambertMaterial color="#1a3a6a" />
      </mesh>
      <mesh position={[0.3, 0.5 - hb * 0.5, 0]}>
        <boxGeometry args={[0.18, 0.65, 0.18]} />
        <meshLambertMaterial color="#1a3a6a" />
      </mesh>
      <mesh position={[-0.12, -0.25 + hb * 0.3, 0]}>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshLambertMaterial color="#2a2a4a" />
      </mesh>
      <mesh position={[0.12, -0.25 - hb * 0.3, 0]}>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshLambertMaterial color="#2a2a4a" />
      </mesh>
    </group>
  );
}

interface InteriorSceneProps {
  interiorId: string;
  buildingJob?: BuildingDef["job"];
  onExit: () => void;
  onNearInteraction: (type: "exit" | "job" | null, label: string | null) => void;
}

export default function InteriorScene({
  interiorId,
  buildingJob,
  onExit,
  onNearInteraction,
}: InteriorSceneProps) {
  const { camera } = useThree();
  const cfg = INTERIOR_CONFIGS[interiorId] ?? INTERIOR_CONFIGS.hotel;
  const playerRef = useRef<THREE.Group>(null!);
  const ePressed = useRef(false);
  const nearRef = useRef<"exit" | "job" | null>(null);
  const [, getState] = useKeyboardControls<Controls>();
  const facingAngle = useRef(Math.PI);
  const camTarget = useRef(new THREE.Vector3(BASE.x, BASE.y + 2, BASE.z));
  const bob = useRef(0);

  // Teleport camera to interior on mount
  useEffect(() => {
    camera.position.set(BASE.x, BASE.y + 6, BASE.z + cfg.roomD / 2 + 4);
    camTarget.current.set(BASE.x, BASE.y + 1, BASE.z);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // E key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyE" && !ePressed.current) {
        ePressed.current = true;
        if (nearRef.current === "exit") {
          onExit();
        } else if (nearRef.current === "job" && buildingJob) {
          startJob(buildingJob);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyE") ePressed.current = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [onExit, buildingJob]);

  useFrame((_, delta) => {
    if (!playerRef.current) return;
    const controls = getState();
    const dt = Math.min(delta, 0.05);
    const walkSpeed = 0.1;
    const turnSpeed = 2.5;
    const bx = cfg.roomW / 2 - 0.8;
    const bz = cfg.roomD / 2 - 0.8;
    let moving = false;

    if (controls.forward) {
      facingAngle.current = Math.atan2(
        camera.position.x - (BASE.x + playerRef.current.position.x),
        camera.position.z - (BASE.z + playerRef.current.position.z)
      );
      playerRef.current.rotation.y = facingAngle.current;
      const dir = new THREE.Vector3(Math.sin(facingAngle.current), 0, Math.cos(facingAngle.current));
      playerRef.current.position.addScaledVector(dir, walkSpeed);
      moving = true;
    }
    if (controls.back) {
      const dir = new THREE.Vector3(Math.sin(facingAngle.current), 0, Math.cos(facingAngle.current));
      playerRef.current.position.addScaledVector(dir, -walkSpeed * 0.7);
      moving = true;
    }
    if (controls.left) { facingAngle.current += turnSpeed * dt; playerRef.current.rotation.y = facingAngle.current; }
    if (controls.right) { facingAngle.current -= turnSpeed * dt; playerRef.current.rotation.y = facingAngle.current; }

    playerRef.current.position.x = Math.max(-bx, Math.min(bx, playerRef.current.position.x));
    playerRef.current.position.z = Math.max(-bz, Math.min(bz, playerRef.current.position.z));
    playerRef.current.position.y = 0;

    if (moving) bob.current += dt * 10;

    // Camera follow
    const worldPos = new THREE.Vector3(
      BASE.x + playerRef.current.position.x,
      BASE.y + playerRef.current.position.y,
      BASE.z + playerRef.current.position.z
    );
    const camAngle = facingAngle.current;
    const desiredCam = worldPos.clone().add(new THREE.Vector3(Math.sin(camAngle) * 6, 4, Math.cos(camAngle) * 6));
    camera.position.lerp(desiredCam, 0.1);
    camTarget.current.lerp(new THREE.Vector3(worldPos.x, worldPos.y + 1, worldPos.z), 0.12);
    camera.lookAt(camTarget.current);

    // Interaction proximity
    const pz = playerRef.current.position.z;
    const px = playerRef.current.position.x;
    const exitZ = cfg.roomD / 2 - 1.5;
    const distToExit = Math.sqrt(px * px + (pz - exitZ) * (pz - exitZ));
    const distToJob = Math.sqrt((px - JOB_X_LOCAL) * (px - JOB_X_LOCAL) + (pz - JOB_Z_LOCAL) * (pz - JOB_Z_LOCAL));

    let newNear: "exit" | "job" | null = null;
    let newLabel: string | null = null;

    if (distToExit < 2.5) {
      newNear = "exit";
      newLabel = "E — Sortir du bâtiment";
    } else if (distToJob < 2.5 && buildingJob) {
      const cd = getJobCooldownSec(buildingJob.id);
      if (!canStartJob(buildingJob.id) && cd > 0) {
        newLabel = `⏳ Disponible dans ${cd}s`;
      } else if (canStartJob(buildingJob.id)) {
        newNear = "job";
        newLabel = `E — ${buildingJob.title} (+${buildingJob.reward}$) ${buildingJob.emoji}`;
      }
    }

    if (newNear !== nearRef.current) {
      nearRef.current = newNear;
      onNearInteraction(newNear, newLabel);
    }
  });

  const hb = Math.sin(bob.current) * 0.04;

  return (
    <>
      <ambientLight intensity={0.7} color="#d0dce8" />
      <pointLight position={[BASE.x, BASE.y + cfg.roomH - 0.5, BASE.z]} intensity={1.5} color="#fffde0" distance={20} />
      <pointLight position={[BASE.x - 3, BASE.y + cfg.roomH - 0.5, BASE.z + 2]} intensity={0.8} color="#fffde0" distance={12} />

      <Room cfg={cfg} interiorId={interiorId} />

      {/* Interior player */}
      <group ref={playerRef} position={[0, 0, cfg.roomD / 2 - 1.5]}>
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.4 + hb, 0]} castShadow>
            <boxGeometry args={[0.45, 0.8, 0.25]} />
            <meshLambertMaterial color="#1a3a6a" />
          </mesh>
          <mesh position={[0, 1.0 + hb, 0]} castShadow>
            <boxGeometry args={[0.32, 0.32, 0.32]} />
            <meshLambertMaterial color="#e8c9a0" />
          </mesh>
          <mesh position={[0, 1.22 + hb, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.22, 8]} />
            <meshLambertMaterial color="#c82020" />
          </mesh>
          <mesh position={[0, 1.34 + hb, 0]}>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshLambertMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.3, 0.5 + hb * 0.5, 0]}>
            <boxGeometry args={[0.18, 0.65, 0.18]} />
            <meshLambertMaterial color="#1a3a6a" />
          </mesh>
          <mesh position={[0.3, 0.5 - hb * 0.5, 0]}>
            <boxGeometry args={[0.18, 0.65, 0.18]} />
            <meshLambertMaterial color="#1a3a6a" />
          </mesh>
          <mesh position={[-0.12, -0.25 + hb * 0.3, 0]}>
            <boxGeometry args={[0.2, 0.5, 0.2]} />
            <meshLambertMaterial color="#2a2a4a" />
          </mesh>
          <mesh position={[0.12, -0.25 - hb * 0.3, 0]}>
            <boxGeometry args={[0.2, 0.5, 0.2]} />
            <meshLambertMaterial color="#2a2a4a" />
          </mesh>
        </group>
      </group>
    </>
  );
}
