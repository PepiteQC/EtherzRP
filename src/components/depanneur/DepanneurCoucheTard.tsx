import { useRef, useState, useCallback, useMemo, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const STORE_WALL_HEIGHT = 6;
const STORE_WALL_Y = 3;
const WALL_THICKNESS = 0.15;
const CORRECT_CODE = "1234" as const;
const DOOR_OPEN_DURATION_MS = 5000;
const DOOR_CLOSE_DELAY_MS = 2000;
const DOOR_OPEN_THRESHOLD = 0.15;
const DOOR_SLIDE_DISTANCE = 1.1;
const DOOR_DAMPING = 12;

// Dimensions du bâtiment
const STORE_WIDTH = 16;
const STORE_DEPTH = 14;
const STORE_HEIGHT = 5.8;
const FACADE_Z = 6.92;

// Reusable color instances to avoid per-frame allocations
const COLOR_GREEN = new THREE.Color("#00ff60");
const COLOR_GREEN_EMISSIVE = new THREE.Color("#00cc50");
const COLOR_RED = new THREE.Color("#ff3333");
const COLOR_RED_EMISSIVE = new THREE.Color("#ff0000");

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type Vec3 = [number, number, number];

// ═══════════════════════════════════════════════════════════
// TEXTURES PROCÉDURALES
// ═══════════════════════════════════════════════════════════

function createCanvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number]
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  if (repeat) tex.repeat.set(repeat[0], repeat[1]);
  tex.needsUpdate = true;
  return tex;
}

// Sol carrelé de dépanneur
function useStoreTileTexture() {
  return useMemo(
    () =>
      createCanvasTexture(
        512,
        512,
        (ctx, w, h) => {
          ctx.fillStyle = "#e2ddd4";
          ctx.fillRect(0, 0, w, h);
          const cols = 8;
          const rows = 8;
          const tw = w / cols;
          const th = h / rows;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const x = c * tw;
              const y = r * th;
              const base = 210 + Math.random() * 20;
              const tint = (r + c) % 2 === 0 ? 5 : -5;
              ctx.fillStyle = `rgb(${base + tint},${base + tint - 3},${base + tint - 8})`;
              ctx.fillRect(x + 1, y + 1, tw - 2, th - 2);
              // Jointures
              ctx.fillStyle = "rgba(0,0,0,0.08)";
              ctx.fillRect(x, y, tw, 1);
              ctx.fillRect(x, y, 1, th);
            }
          }
          // Traces de pas subtiles
          ctx.fillStyle = "rgba(0,0,0,0.02)";
          for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.ellipse(
              Math.random() * w,
              Math.random() * h,
              8 + Math.random() * 6,
              12 + Math.random() * 8,
              Math.random() * Math.PI,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        },
        [4, 4]
      ),
    []
  );
}

// Asphalte du parking
function useAsphaltTexture() {
  return useMemo(
    () =>
      createCanvasTexture(
        512,
        512,
        (ctx, w, h) => {
          ctx.fillStyle = "#2a2a2e";
          ctx.fillRect(0, 0, w, h);
          // Granularité
          for (let i = 0; i < 3000; i++) {
            const shade = 30 + Math.random() * 25;
            ctx.fillStyle = `rgb(${shade},${shade},${shade + 2})`;
            ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
          }
          // Fissures
          ctx.strokeStyle = "rgba(0,0,0,0.15)";
          ctx.lineWidth = 1;
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            let x = Math.random() * w;
            let y = Math.random() * h;
            ctx.moveTo(x, y);
            for (let j = 0; j < 8; j++) {
              x += (Math.random() - 0.5) * 60;
              y += (Math.random() - 0.5) * 60;
              ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
          // Taches d'huile
          for (let i = 0; i < 3; i++) {
            const grad = ctx.createRadialGradient(
              Math.random() * w,
              Math.random() * h,
              0,
              Math.random() * w,
              Math.random() * h,
              20 + Math.random() * 15
            );
            grad.addColorStop(0, "rgba(20,18,15,0.2)");
            grad.addColorStop(1, "rgba(20,18,15,0)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
          }
        },
        [3, 3]
      ),
    []
  );
}

// Mur extérieur — brique / stucco
function useExteriorWallTexture() {
  return useMemo(
    () =>
      createCanvasTexture(
        512,
        256,
        (ctx, w, h) => {
          ctx.fillStyle = "#e8e2d8";
          ctx.fillRect(0, 0, w, h);
          // Texture stucco
          for (let i = 0; i < 2000; i++) {
            const shade = 220 + Math.random() * 20;
            ctx.fillStyle = `rgb(${shade},${shade - 4},${shade - 10})`;
            ctx.fillRect(
              Math.random() * w,
              Math.random() * h,
              1 + Math.random() * 3,
              1 + Math.random() * 3
            );
          }
          // Lignes horizontales subtiles
          for (let y = 0; y < h; y += 32) {
            ctx.fillStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.02})`;
            ctx.fillRect(0, y, w, 1);
          }
        },
        [2, 2]
      ),
    []
  );
}

// Texture de comptoir — bois stratifié
function useCounterTexture() {
  return useMemo(
    () =>
      createCanvasTexture(256, 256, (ctx, w, h) => {
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, "#b8944a");
        grad.addColorStop(0.3, "#c4a050");
        grad.addColorStop(0.6, "#b08838");
        grad.addColorStop(1, "#c0a048");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        // Grain du bois
        for (let y = 0; y < h; y += 3) {
          ctx.fillStyle = `rgba(${80 + Math.random() * 30},${60 + Math.random() * 20},${20 + Math.random() * 15},${0.05 + Math.random() * 0.08})`;
          ctx.fillRect(0, y, w, 2);
        }
        // Nœuds de bois
        for (let i = 0; i < 2; i++) {
          ctx.fillStyle = "rgba(100,70,30,0.12)";
          ctx.beginPath();
          ctx.ellipse(
            Math.random() * w,
            Math.random() * h,
            10 + Math.random() * 8,
            6 + Math.random() * 4,
            Math.random(),
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }),
    []
  );
}

// ═══════════════════════════════════════════════════════════
// STORE COLLIDERS
// ═══════════════════════════════════════════════════════════

export const StoreColliders = memo(function StoreColliders() {
  return (
    <RigidBody type="fixed" colliders={false} name="store-colliders">
      {/* Floor */}
      <CuboidCollider args={[6, 0.15, 5]} position={[0, -0.15, 0]} />

      {/* Back wall (z = -5) */}
      <CuboidCollider
        args={[6, STORE_WALL_HEIGHT / 2, WALL_THICKNESS]}
        position={[0, STORE_WALL_Y, -5]}
      />

      {/* Left wall (x = -6) */}
      <CuboidCollider
        args={[WALL_THICKNESS, STORE_WALL_HEIGHT / 2, 5]}
        position={[-6, STORE_WALL_Y, 0]}
      />

      {/* Right wall (x = +6) */}
      <CuboidCollider
        args={[WALL_THICKNESS, STORE_WALL_HEIGHT / 2, 5]}
        position={[6, STORE_WALL_Y, 0]}
      />

      {/* Front facade — two segments with central door opening */}
      <CuboidCollider
        args={[2.5, STORE_WALL_HEIGHT / 2, WALL_THICKNESS]}
        position={[-3.75, STORE_WALL_Y, 5]}
      />
      <CuboidCollider
        args={[2.5, STORE_WALL_HEIGHT / 2, WALL_THICKNESS]}
        position={[3.75, STORE_WALL_Y, 5]}
      />

      {/* Lintel above door */}
      <CuboidCollider
        args={[2.0, 0.7, WALL_THICKNESS]}
        position={[0, 5.3, 5]}
      />

      {/* Counter */}
      <CuboidCollider args={[3, 0.6, 0.6]} position={[0, 0.6, 2.5]} />

      {/* Shelving units */}
      <CuboidCollider args={[0.4, 1.2, 3]} position={[-3, 1.2, 0]} />
      <CuboidCollider args={[0.4, 1.2, 3]} position={[3, 1.2, 0]} />

      {/* Back fridges */}
      <CuboidCollider args={[2.5, 1.2, 0.5]} position={[-3, 1.2, -4.5]} />
      <CuboidCollider args={[2.5, 1.2, 0.5]} position={[3, 1.2, -4.5]} />

      {/* Coffee station */}
      <CuboidCollider args={[1.2, 0.5, 0.4]} position={[-5.5, 0.5, 3]} />

      {/* ATM */}
      <CuboidCollider args={[0.4, 0.8, 0.35]} position={[5.8, 0.8, 4]} />

      {/* Slurpee machine */}
      <CuboidCollider args={[0.6, 0.8, 0.4]} position={[-5.5, 0.8, -2]} />

      {/* Magazine rack */}
      <CuboidCollider args={[0.3, 0.8, 1.0]} position={[5.5, 0.8, 0]} />

      {/* Hot dog roller */}
      <CuboidCollider args={[0.5, 0.3, 0.3]} position={[1.5, 1.4, 4.5]} />
    </RigidBody>
  );
});

// ═══════════════════════════════════════════════════════════
// KEYPAD BUTTON
// ═══════════════════════════════════════════════════════════

interface KeypadButtonProps {
  keyLabel: string;
  position: Vec3;
  onPress: (key: string) => void;
}

const KeypadButton = memo(function KeypadButton({
  keyLabel,
  position,
  onPress,
}: KeypadButtonProps) {
  const [pressed, setPressed] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  const handleClick = useCallback(() => {
    onPress(keyLabel);
    setPressed(true);
    setTimeout(() => setPressed(false), 100);
  }, [onPress, keyLabel]);

  const color =
    keyLabel === "E" ? "#00aa00" : keyLabel === "C" ? "#ff4444" : "#3a3a4a";
  const pressedColor =
    keyLabel === "E" ? "#00cc00" : keyLabel === "C" ? "#ff6666" : "#5a5a6a";

  return (
    <mesh
      ref={meshRef}
      position={[position[0], position[1], position[2] + (pressed ? -0.005 : 0)]}
      onClick={handleClick}
      castShadow
    >
      <boxGeometry args={[0.06, 0.06, pressed ? 0.015 : 0.02]} />
      <meshStandardMaterial
        color={pressed ? pressedColor : color}
        metalness={0.5}
        roughness={0.4}
        emissive={pressed ? pressedColor : "#000000"}
        emissiveIntensity={pressed ? 0.3 : 0}
      />
    </mesh>
  );
});

// ═══════════════════════════════════════════════════════════
// KEYPAD PAD
// ═══════════════════════════════════════════════════════════

const KEYPAD_LAYOUT = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["C", "0", "E"],
] as const;

interface KeypadPadProps {
  position: Vec3;
  onCodeAccepted: () => void;
}

const KeypadPad = memo(function KeypadPad({
  position,
  onCodeAccepted,
}: KeypadPadProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearErrorTimer = useCallback(() => {
    if (errorTimerRef.current !== null) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  }, []);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === "C") {
        setCode("");
        setError(false);
        setSuccess(false);
        clearErrorTimer();
        return;
      }

      if (key === "E") {
        if (code === CORRECT_CODE) {
          setSuccess(true);
          onCodeAccepted();
          setCode("");
          setError(false);
          if (successTimerRef.current) clearTimeout(successTimerRef.current);
          successTimerRef.current = setTimeout(() => setSuccess(false), 1500);
        } else {
          setError(true);
          clearErrorTimer();
          errorTimerRef.current = setTimeout(() => {
            setError(false);
            setCode("");
            errorTimerRef.current = null;
          }, 800);
        }
        return;
      }

      setCode((prev) => (prev.length < 4 ? prev + key : prev));
    },
    [code, onCodeAccepted, clearErrorTimer]
  );

  const buttons = useMemo(
    () =>
      KEYPAD_LAYOUT.flatMap((row, rowIndex) =>
        row.map((key, colIndex) => ({
          key,
          id: `${rowIndex}-${colIndex}`,
          position: [
            -0.08 + colIndex * 0.08,
            1.15 - rowIndex * 0.08,
            0.08,
          ] as Vec3,
        }))
      ),
    []
  );

  const displayColor = error ? "#ff3333" : success ? "#00ff88" : "#00ff00";

  return (
    <group position={position}>
      {/* Keypad housing */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.4, 0.55, 0.16]} />
        <meshStandardMaterial color="#222233" metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Housing bevel */}
      <mesh position={[0, 1.2, 0.082]}>
        <boxGeometry args={[0.38, 0.53, 0.005]} />
        <meshStandardMaterial color="#2a2a3a" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Display screen */}
      <mesh position={[0, 1.38, 0.085]}>
        <boxGeometry args={[0.3, 0.08, 0.015]} />
        <meshStandardMaterial
          color={displayColor}
          emissive={displayColor}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Display frame */}
      <mesh position={[0, 1.38, 0.083]}>
        <boxGeometry args={[0.32, 0.1, 0.01]} />
        <meshStandardMaterial color="#1a1a2a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Code dots indicator */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh
          key={`dot-${i}`}
          position={[-0.06 + i * 0.04, 1.34, 0.09]}
        >
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshStandardMaterial
            color={i < code.length ? "#00ff00" : "#333344"}
            emissive={i < code.length ? "#00ff00" : "#000000"}
            emissiveIntensity={i < code.length ? 0.8 : 0}
          />
        </mesh>
      ))}

      {/* Brand label */}
      <mesh position={[0, 1.44, 0.085]}>
        <boxGeometry args={[0.15, 0.02, 0.005]} />
        <meshStandardMaterial color="#444455" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Buttons */}
      {buttons.map(({ key, id, position: btnPos }) => (
        <KeypadButton
          key={id}
          keyLabel={key}
          position={btnPos}
          onPress={handleKeyPress}
        />
      ))}

      {/* Keypad light */}
      <pointLight
        position={[0, 1.35, 0.2]}
        intensity={0.15}
        color={displayColor}
        distance={1}
        decay={2}
      />
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// SLIDING DOOR — ENRICHIE
// ═══════════════════════════════════════════════════════════

interface SlidingDoorProps {
  position: Vec3;
  onOpen?: () => void;
}

export const SlidingDoor = memo(function SlidingDoor({
  position,
  onOpen,
}: SlidingDoorProps) {
  const leftPanelRef = useRef<THREE.Mesh>(null);
  const rightPanelRef = useRef<THREE.Mesh>(null);
  const ledRef = useRef<THREE.Mesh>(null);
  const blockerRef = useRef<RapierRigidBody>(null);

  const nearRef = useRef(false);
  const unlockedRef = useRef(false);
  const open01 = useRef(0);

  const [isUnlocked, setIsUnlocked] = useState(false);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (lockTimerRef.current !== null) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, []);

  useFrame((_, delta) => {
    const shouldOpen = nearRef.current && unlockedRef.current;
    const target = shouldOpen ? 1 : 0;

    open01.current = THREE.MathUtils.damp(
      open01.current,
      target,
      DOOR_DAMPING,
      delta
    );

    const slide = open01.current * DOOR_SLIDE_DISTANCE;

    if (leftPanelRef.current) {
      leftPanelRef.current.position.x = -0.75 - slide;
    }
    if (rightPanelRef.current) {
      rightPanelRef.current.position.x = 0.75 + slide;
    }

    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial;
      if (unlockedRef.current) {
        mat.color.copy(COLOR_GREEN);
        mat.emissive.copy(COLOR_GREEN_EMISSIVE);
        mat.emissiveIntensity = 1.8;
      } else {
        mat.color.copy(COLOR_RED);
        mat.emissive.copy(COLOR_RED_EMISSIVE);
        mat.emissiveIntensity = 1.2;
      }
    }

    if (blockerRef.current) {
      const shouldBlock = open01.current < DOOR_OPEN_THRESHOLD;
      const isEnabled = blockerRef.current.isEnabled();
      if (shouldBlock !== isEnabled) {
        blockerRef.current.setEnabled(shouldBlock);
      }
    }
  });

  const handleCodeAccepted = useCallback(() => {
    clearTimers();
    unlockedRef.current = true;
    nearRef.current = true;
    setIsUnlocked(true);
    onOpen?.();

    closeTimerRef.current = setTimeout(() => {
      nearRef.current = false;
      lockTimerRef.current = setTimeout(() => {
        unlockedRef.current = false;
        setIsUnlocked(false);
      }, DOOR_CLOSE_DELAY_MS);
    }, DOOR_OPEN_DURATION_MS);
  }, [onOpen, clearTimers]);

  const handleSensorEnter = useCallback(() => {
    nearRef.current = true;
  }, []);

  const handleSensorExit = useCallback(() => {
    nearRef.current = false;
  }, []);

  const glassMaterialProps = useMemo(
    () => ({
      color: "#a8d8ff" as const,
      transmission: 0.88,
      thickness: 0.03,
      roughness: 0.05,
      metalness: 0,
      ior: 1.5,
      transparent: true,
      opacity: 0.92,
    }),
    []
  );

  return (
    <group position={position}>
      {/* Proximity sensor zone */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          sensor
          args={[2.5, 2.0, 2.5]}
          position={[0, 0, 2.0]}
          onIntersectionEnter={handleSensorEnter}
          onIntersectionExit={handleSensorExit}
        />
      </RigidBody>

      {/* Blocker collider */}
      <RigidBody type="fixed" colliders={false} ref={blockerRef}>
        <CuboidCollider args={[1.6, 1.6, 0.15]} position={[0, 0, 0.1]} />
      </RigidBody>

      {/* Top frame */}
      <mesh castShadow position={[0, 1.75, 0.08]}>
        <boxGeometry args={[3.5, 0.3, 0.25]} />
        <meshStandardMaterial color="#555566" metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Frame side rails */}
      <mesh position={[-1.75, 0, 0.08]} castShadow>
        <boxGeometry args={[0.06, 3.5, 0.22]} />
        <meshStandardMaterial color="#555566" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[1.75, 0, 0.08]} castShadow>
        <boxGeometry args={[0.06, 3.5, 0.22]} />
        <meshStandardMaterial color="#555566" metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Bottom rail / track */}
      <mesh position={[0, -1.58, 0.08]}>
        <boxGeometry args={[3.5, 0.04, 0.18]} />
        <meshStandardMaterial color="#444455" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Top rail / track */}
      <mesh position={[0, 1.58, 0.08]}>
        <boxGeometry args={[3.5, 0.04, 0.18]} />
        <meshStandardMaterial color="#444455" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Left glass panel */}
      <mesh ref={leftPanelRef} position={[-0.75, 0, 0.12]} castShadow>
        <boxGeometry args={[1.5, 3.2, 0.06]} />
        <meshPhysicalMaterial {...glassMaterialProps} />
      </mesh>

      {/* Right glass panel */}
      <mesh ref={rightPanelRef} position={[0.75, 0, 0.12]} castShadow>
        <boxGeometry args={[1.5, 3.2, 0.06]} />
        <meshPhysicalMaterial {...glassMaterialProps} />
      </mesh>

      {/* Door handle strips */}
      <mesh position={[-0.15, 0, 0.16]}>
        <boxGeometry args={[0.04, 0.6, 0.02]} />
        <meshStandardMaterial color="#888899" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0.15, 0, 0.16]}>
        <boxGeometry args={[0.04, 0.6, 0.02]} />
        <meshStandardMaterial color="#888899" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* "PUSH" sticker on glass */}
      <mesh position={[0.5, 0.2, 0.16]}>
        <boxGeometry args={[0.25, 0.06, 0.002]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.1} />
      </mesh>

      {/* Automatic door sensor (top) */}
      <mesh position={[0, 1.85, 0.2]}>
        <boxGeometry args={[0.3, 0.06, 0.08]} />
        <meshStandardMaterial color="#222233" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Sensor LED */}
      <mesh position={[0, 1.82, 0.25]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* LED status indicator */}
      <mesh ref={ledRef} position={[1.85, 1.1, 0.15]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial
          color={isUnlocked ? "#00ff60" : "#ff3333"}
          emissive={isUnlocked ? "#00cc50" : "#ff0000"}
          emissiveIntensity={1}
        />
      </mesh>

      {/* LED glow */}
      <pointLight
        position={[1.85, 1.1, 0.3]}
        intensity={0.3}
        color={isUnlocked ? "#00ff60" : "#ff3333"}
        distance={2}
        decay={2}
      />

      {/* Welcome mat */}
      <mesh position={[0, -1.59, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.0, 1.2]} />
        <meshStandardMaterial color="#2a2518" roughness={0.95} />
      </mesh>

      {/* Numeric keypad */}
      <KeypadPad position={[2.2, 0, 0.15]} onCodeAccepted={handleCodeAccepted} />
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// GROUND COLLIDERS
// ═══════════════════════════════════════════════════════════

export const GroundColliders = memo(function GroundColliders() {
  return (
    <>
      {/* Parking lot surface */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[10, 0.25, 6]} position={[0, -0.25, 8]} />
      </RigidBody>

      {/* Sidewalk */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[12, 0.15, 1.5]} position={[0, 0, 6.5]} />
      </RigidBody>

      {/* World ground plane */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[60, 0.3, 60]} position={[0, -0.3, 0]} />
      </RigidBody>
    </>
  );
});

// ═══════════════════════════════════════════════════════════
// SHELF UNIT — ENRICHI
// ═══════════════════════════════════════════════════════════

const SHELF_LEVELS = [0, 0.5, 1.0, 1.5, 2.0] as const;
const PRODUCT_COUNT = 8;

// Couleurs de produits réalistes (emballages)
const PRODUCT_COLORS = [
  "#cc2222", "#2255cc", "#22aa44", "#dd8800",
  "#8822cc", "#cc2288", "#228888", "#ddcc22",
  "#ff5544", "#4488ff", "#44cc66", "#ffaa22",
];

interface ShelfUnitProps {
  x: number;
}

const ShelfUnit = memo(function ShelfUnit({ x }: ShelfUnitProps) {
  const products = useMemo(
    () =>
      SHELF_LEVELS.flatMap((y, si) =>
        Array.from({ length: PRODUCT_COUNT }, (_, j) => {
          const seed = si * PRODUCT_COUNT + j + Math.abs(x) * 100;
          const colorIdx = Math.floor(
            ((Math.sin(seed * 9301 + 49297) * 233280) % 1 + 1) % 1 * PRODUCT_COLORS.length
          );
          const height = 0.2 + (seed % 5) * 0.04;
          const width = 0.15 + (seed % 3) * 0.03;
          const isBottle = seed % 7 === 0;
          return {
            id: `${si}-${j}`,
            y: y + 0.04 + height / 2,
            z: -1.5 + j * 0.4,
            color: PRODUCT_COLORS[colorIdx % PRODUCT_COLORS.length],
            height,
            width,
            isBottle,
          };
        })
      ),
    [x]
  );

  return (
    <group position={[x, 0, 0]}>
      {/* Shelf back panel */}
      <mesh position={[x > 0 ? -0.22 : 0.22, 1.1, 0]} castShadow>
        <boxGeometry args={[0.04, 2.3, 3.6]} />
        <meshStandardMaterial color="#6b6050" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Shelf side panels */}
      <mesh position={[0, 1.1, -1.78]} castShadow>
        <boxGeometry args={[0.45, 2.3, 0.04]} />
        <meshStandardMaterial color="#7a6a58" roughness={0.65} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.1, 1.78]} castShadow>
        <boxGeometry args={[0.45, 2.3, 0.04]} />
        <meshStandardMaterial color="#7a6a58" roughness={0.65} metalness={0.1} />
      </mesh>

      {/* Shelves */}
      {SHELF_LEVELS.map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[0.42, 0.06, 3.55]} />
          <meshStandardMaterial color="#8a7a6a" roughness={0.6} metalness={0.05} />
        </mesh>
      ))}

      {/* Price tag strips on shelf edges */}
      {SHELF_LEVELS.map((y) => (
        <mesh
          key={`tag-${y}`}
          position={[x > 0 ? 0.22 : -0.22, y + 0.04, 0]}
        >
          <boxGeometry args={[0.005, 0.03, 3.5]} />
          <meshStandardMaterial color="#ffcc00" roughness={0.8} />
        </mesh>
      ))}

      {/* Products */}
      {products.map(({ id, y, z, color, height, width, isBottle }) => (
        <group key={id} position={[0, y, z]}>
          {isBottle ? (
            // Bottle shape
            <>
              <mesh castShadow>
                <cylinderGeometry args={[width * 0.35, width * 0.4, height, 8]} />
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
              </mesh>
              {/* Bottle neck */}
              <mesh position={[0, height * 0.45, 0]}>
                <cylinderGeometry args={[width * 0.15, width * 0.2, height * 0.3, 6]} />
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
              </mesh>
              {/* Cap */}
              <mesh position={[0, height * 0.62, 0]}>
                <cylinderGeometry args={[width * 0.18, width * 0.18, 0.03, 6]} />
                <meshStandardMaterial color="#dddddd" metalness={0.6} roughness={0.3} />
              </mesh>
            </>
          ) : (
            // Box/can shape
            <>
              <mesh castShadow>
                <boxGeometry args={[width, height, width * 0.7]} />
                <meshStandardMaterial color={color} roughness={0.5} metalness={0.05} />
              </mesh>
              {/* Label strip */}
              <mesh position={[width * 0.51, 0, 0]}>
                <boxGeometry args={[0.002, height * 0.6, width * 0.5]} />
                <meshStandardMaterial
                  color="#ffffff"
                  roughness={0.8}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// FRIDGE UNIT — ENRICHI
// ═══════════════════════════════════════════════════════════

const FRIDGE_SHELF_HEIGHTS = [0.4, 0.9, 1.4] as const;
const DRINK_COLORS = [
  "#cc0000", "#0044cc", "#00aa00", "#ff8800",
  "#880088", "#cc4400", "#006688", "#884400",
];

const FridgeUnit = memo(function FridgeUnit({ x }: { x: number }) {
  const drinks = useMemo(() => {
    const items: Array<{
      id: string;
      pos: Vec3;
      color: string;
      isCan: boolean;
    }> = [];
    FRIDGE_SHELF_HEIGHTS.forEach((y, si) => {
      for (let j = 0; j < 6; j++) {
        const seed = si * 6 + j + Math.abs(x) * 50;
        items.push({
          id: `drink-${si}-${j}`,
          pos: [-0.8 + j * 0.32, y + 0.15, 0],
          color: DRINK_COLORS[seed % DRINK_COLORS.length],
          isCan: seed % 3 === 0,
        });
      }
    });
    return items;
  }, [x]);

  return (
    <group position={[x, 0, 0]}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[2.2, 2.2, 0.8]} />
        <meshStandardMaterial color="#d8e0e8" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Interior — dark */}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[2.05, 2.05, 0.55]} />
        <meshStandardMaterial color="#1a2030" roughness={0.9} />
      </mesh>

      {/* Glass door */}
      <mesh position={[0, 0, 0.41]}>
        <boxGeometry args={[2.1, 2.1, 0.02]} />
        <meshPhysicalMaterial
          color="#a8d8ff"
          transmission={0.75}
          thickness={0.02}
          roughness={0.05}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Door handle */}
      <mesh position={[1.0, 0, 0.45]}>
        <boxGeometry args={[0.04, 0.8, 0.03]} />
        <meshStandardMaterial color="#888899" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Door frame */}
      <mesh position={[0, 0, 0.43]}>
        <boxGeometry args={[2.15, 2.15, 0.01]} />
        <meshStandardMaterial color="#778899" metalness={0.7} roughness={0.2} transparent opacity={0.3} />
      </mesh>

      {/* Internal shelves */}
      {FRIDGE_SHELF_HEIGHTS.map((y) => (
        <mesh key={y} position={[0, y, 0.1]}>
          <boxGeometry args={[2.0, 0.03, 0.65]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Interior light */}
      <pointLight
        position={[0, 1.0, 0.2]}
        intensity={0.4}
        color="#ccddff"
        distance={2}
        decay={2}
      />

      {/* Temperature display */}
      <mesh position={[0, 1.65, 0.42]}>
        <boxGeometry args={[0.3, 0.06, 0.005]} />
        <meshStandardMaterial
          color="#00ccff"
          emissive="#00ccff"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Drinks */}
      {drinks.map(({ id, pos, color, isCan }) => (
        <group key={id} position={pos}>
          {isCan ? (
            <mesh castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.15, 8]} />
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
            </mesh>
          ) : (
            <mesh castShadow>
              <cylinderGeometry args={[0.035, 0.035, 0.22, 8]} />
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
            </mesh>
          )}
        </group>
      ))}

      {/* Brand sticker on glass */}
      <mesh position={[0, -0.6, 0.43]}>
        <boxGeometry args={[1.2, 0.2, 0.003]} />
        <meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// CEILING LIGHT — ENRICHI
// ═══════════════════════════════════════════════════════════

const CeilingLight = memo(function CeilingLight({ x, z = 0 }: { x: number; z?: number }) {
  const flickerRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (flickerRef.current && Math.abs(x) > 2) {
      // Léger scintillement pour réalisme
      flickerRef.current.intensity =
        1.4 + Math.sin(state.clock.elapsedTime * 8 + x * 3) * 0.08;
    }
  });

  return (
    <group position={[x, 5.6, z]}>
      {/* Fixture housing */}
      <mesh>
        <boxGeometry args={[0.9, 0.1, 0.35]} />
        <meshStandardMaterial color="#dddddd" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Light panel */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[0.8, 0.03, 0.3]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#fff8e0"
          emissiveIntensity={0.9}
        />
      </mesh>
      {/* Diffuser grid */}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} position={[-0.25 + i * 0.25, -0.055, 0]}>
          <boxGeometry args={[0.01, 0.005, 0.28]} />
          <meshStandardMaterial color="#cccccc" />
        </mesh>
      ))}
      <pointLight
        ref={flickerRef}
        position={[0, -0.2, 0]}
        color="#fff8e0"
        intensity={1.5}
        distance={8}
        decay={2}
        castShadow
        shadow-mapSize={[512, 512]}
      />
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// COFFEE STATION — NOUVEAU
// ═══════════════════════════════════════════════════════════

const CoffeeStation = memo(function CoffeeStation({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      {/* Counter */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2.4, 1.0, 0.8]} />
        <meshStandardMaterial color="#3a3028" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Counter top */}
      <mesh position={[0, 1.02, 0]} castShadow>
        <boxGeometry args={[2.5, 0.04, 0.85]} />
        <meshStandardMaterial color="#888078" roughness={0.3} metalness={0.3} />
      </mesh>

      {/* Coffee machines */}
      {[-0.7, 0, 0.7].map((xOff, i) => (
        <group key={`coffee-${i}`} position={[xOff, 1.05, 0]}>
          {/* Machine body */}
          <mesh castShadow>
            <boxGeometry args={[0.45, 0.55, 0.4]} />
            <meshStandardMaterial
              color={["#222222", "#1a1a2a", "#2a1a1a"][i]}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
          {/* Dispenser nozzle */}
          <mesh position={[0, -0.2, 0.22]}>
            <cylinderGeometry args={[0.03, 0.04, 0.08, 8]} />
            <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Display */}
          <mesh position={[0, 0.15, 0.21]}>
            <boxGeometry args={[0.2, 0.06, 0.005]} />
            <meshStandardMaterial
              color="#00cc00"
              emissive="#00cc00"
              emissiveIntensity={0.4}
            />
          </mesh>
          {/* Brand label */}
          <mesh position={[0, 0.05, 0.21]}>
            <boxGeometry args={[0.3, 0.08, 0.003]} />
            <meshStandardMaterial color="#cc8800" emissive="#cc8800" emissiveIntensity={0.1} />
          </mesh>
        </group>
      ))}

      {/* Cup dispenser */}
      <mesh position={[1.4, 1.35, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.35, 8]} />
        <meshStandardMaterial color="#dddddd" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Cups inside */}
      <mesh position={[1.4, 1.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 8]} />
        <meshStandardMaterial color="#f5f0e5" roughness={0.8} />
      </mesh>

      {/* Lid dispenser */}
      <mesh position={[-1.3, 1.2, 0]}>
        <boxGeometry args={[0.2, 0.15, 0.2]} />
        <meshStandardMaterial color="#dddddd" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Stirrers */}
      <mesh position={[-1.3, 1.08, 0.15]}>
        <boxGeometry args={[0.08, 0.08, 0.06]} />
        <meshStandardMaterial color="#8b7355" roughness={0.9} />
      </mesh>

      {/* Sugar/cream station */}
      {[-0.4, -0.2, 0, 0.2].map((xOff, i) => (
        <mesh key={`condiment-${i}`} position={[xOff, 1.08, -0.3]}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 6]} />
          <meshStandardMaterial
            color={["#ffffff", "#f5e6c8", "#6b4423", "#dddddd"][i]}
            roughness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// SLURPEE / SLOCHE MACHINE — NOUVEAU
// ═══════════════════════════════════════════════════════════

const SlurpeeMachine = memo(function SlurpeeMachine({ position }: { position: Vec3 }) {
  const bowlRef1 = useRef<THREE.Mesh>(null);
  const bowlRef2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    // Rotation des bols de slurpee
    if (bowlRef1.current) bowlRef1.current.rotation.y = state.clock.elapsedTime * 0.5;
    if (bowlRef2.current) bowlRef2.current.rotation.y = -state.clock.elapsedTime * 0.5;
  });

  return (
    <group position={position}>
      {/* Machine body */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 1.6, 0.8]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Brand panel */}
      <mesh position={[0, 0.4, 0.41]}>
        <boxGeometry args={[1.1, 0.5, 0.02]} />
        <meshStandardMaterial color="#0066cc" emissive="#0066cc" emissiveIntensity={0.2} />
      </mesh>

      {/* Slurpee bowls (transparent) */}
      <group position={[-0.3, 0.5, 0]}>
        <mesh ref={bowlRef1}>
          <cylinderGeometry args={[0.18, 0.15, 0.5, 12]} />
          <meshPhysicalMaterial
            color="#ff4444"
            transmission={0.5}
            thickness={0.05}
            roughness={0.1}
            transparent
            opacity={0.7}
          />
        </mesh>
        {/* Slurpee content */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.16, 0.13, 0.35, 12]} />
          <meshStandardMaterial color="#ff2222" roughness={0.6} transparent opacity={0.8} />
        </mesh>
      </group>

      <group position={[0.3, 0.5, 0]}>
        <mesh ref={bowlRef2}>
          <cylinderGeometry args={[0.18, 0.15, 0.5, 12]} />
          <meshPhysicalMaterial
            color="#4444ff"
            transmission={0.5}
            thickness={0.05}
            roughness={0.1}
            transparent
            opacity={0.7}
          />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.16, 0.13, 0.35, 12]} />
          <meshStandardMaterial color="#2222ff" roughness={0.6} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Dispensing nozzles */}
      {[-0.3, 0.3].map((xOff, i) => (
        <mesh key={`nozzle-${i}`} position={[xOff, -0.15, 0.35]}>
          <cylinderGeometry args={[0.025, 0.03, 0.12, 6]} />
          <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Drip tray */}
      <mesh position={[0, -0.6, 0.3]}>
        <boxGeometry args={[0.8, 0.04, 0.2]} />
        <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// ATM — NOUVEAU
// ═══════════════════════════════════════════════════════════

const ATMMachine = memo(function ATMMachine({ position }: { position: Vec3 }) {
  const screenRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Main body */}
      <mesh castShadow>
        <boxGeometry args={[0.7, 1.6, 0.6]} />
        <meshStandardMaterial color="#cccccc" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Front panel */}
      <mesh position={[0, 0.1, 0.31]}>
        <boxGeometry args={[0.65, 1.4, 0.02]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Screen */}
      <mesh ref={screenRef} position={[0, 0.35, 0.33]}>
        <boxGeometry args={[0.4, 0.3, 0.01]} />
        <meshStandardMaterial
          color="#0044aa"
          emissive="#0066cc"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Screen bezel */}
      <mesh position={[0, 0.35, 0.325]}>
        <boxGeometry args={[0.44, 0.34, 0.01]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Keypad */}
      <mesh position={[0, -0.15, 0.33]}>
        <boxGeometry args={[0.25, 0.2, 0.02]} />
        <meshStandardMaterial color="#444455" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Keypad buttons */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={`atm-btn-${i}`}
          position={[
            -0.06 + (i % 3) * 0.06,
            -0.08 + Math.floor(i / 3) * -0.04,
            0.345,
          ]}
        >
          <boxGeometry args={[0.04, 0.025, 0.008]} />
          <meshStandardMaterial color="#555566" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {/* Card slot */}
      <mesh position={[0, -0.4, 0.33]}>
        <boxGeometry args={[0.12, 0.005, 0.02]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      {/* Card slot indicator */}
      <mesh position={[0.08, -0.4, 0.34]}>
        <sphereGeometry args={[0.006, 6, 6]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
      </mesh>

      {/* Cash dispenser */}
      <mesh position={[0, -0.55, 0.33]}>
        <boxGeometry args={[0.2, 0.04, 0.04]} />
        <meshStandardMaterial color="#222222" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Receipt printer */}
      <mesh position={[0.2, -0.3, 0.33]}>
        <boxGeometry args={[0.06, 0.04, 0.02]} />
        <meshStandardMaterial color="#222222" roughness={0.7} />
      </mesh>

      {/* Bank logo */}
      <mesh position={[0, 0.6, 0.33]}>
        <boxGeometry args={[0.3, 0.08, 0.005]} />
        <meshStandardMaterial color="#006600" emissive="#008800" emissiveIntensity={0.2} />
      </mesh>

      {/* Screen glow */}
      <pointLight
        position={[0, 0.35, 0.5]}
        intensity={0.2}
        color="#0066cc"
        distance={1.5}
        decay={2}
      />
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// HOT DOG ROLLER — NOUVEAU
// ═══════════════════════════════════════════════════════════

const HotDogRoller = memo(function HotDogRoller({ position }: { position: Vec3 }) {
  const rollersRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (rollersRef.current) {
      rollersRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.z = state.clock.elapsedTime * 1.5 + i * 0.2;
        }
      });
    }
  });

  return (
    <group position={position}>
      {/* Housing */}
      <mesh castShadow>
        <boxGeometry args={[0.9, 0.35, 0.55]} />
        <meshStandardMaterial color="#cccccc" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Glass shield */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.88, 0.2, 0.53]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.8}
          thickness={0.02}
          roughness={0.05}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Rollers */}
      <group ref={rollersRef}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh
            key={`roller-${i}`}
            position={[-0.3 + i * 0.1, 0.05, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.45, 8]} />
            <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* Hot dogs */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={`hotdog-${i}`}
          position={[-0.25 + i * 0.12, 0.1, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.018, 0.018, 0.35, 6]} />
          <meshStandardMaterial color="#c47030" roughness={0.7} />
        </mesh>
      ))}

      {/* Heat glow */}
      <pointLight
        position={[0, 0.15, 0]}
        intensity={0.3}
        color="#ff8844"
        distance={1.5}
        decay={2}
      />

      {/* Temperature display */}
      <mesh position={[0.35, 0.12, 0.28]}>
        <boxGeometry args={[0.12, 0.04, 0.005]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff4400" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// MAGAZINE RACK — NOUVEAU
// ═══════════════════════════════════════════════════════════

const MagazineRack = memo(function MagazineRack({ position }: { position: Vec3 }) {
  const MAGAZINE_COLORS = [
    "#cc2222", "#2244aa", "#cc8800", "#228844",
    "#882288", "#cc4466", "#446688", "#888822",
  ];

  return (
    <group position={position}>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[0.55, 1.6, 0.15]} />
        <meshStandardMaterial color="#5a5040" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Shelves */}
      {[0, 0.35, 0.7, 1.05].map((y, i) => (
        <group key={`mag-shelf-${i}`}>
          <mesh position={[0, y - 0.4, 0.08]}>
            <boxGeometry args={[0.52, 0.03, 0.06]} />
            <meshStandardMaterial color="#6a5a48" roughness={0.6} />
          </mesh>
          {/* Magazines */}
          {Array.from({ length: 3 }).map((_, j) => (
            <mesh
              key={`mag-${i}-${j}`}
              position={[-0.15 + j * 0.15, y - 0.25, 0.1]}
              rotation={[0.15, 0, (Math.random() - 0.5) * 0.05]}
            >
              <boxGeometry args={[0.12, 0.16, 0.008]} />
              <meshStandardMaterial
                color={MAGAZINE_COLORS[(i * 3 + j) % MAGAZINE_COLORS.length]}
                roughness={0.5}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Newspaper stand at bottom */}
      <mesh position={[0, -0.7, 0.15]}>
        <boxGeometry args={[0.5, 0.15, 0.2]} />
        <meshStandardMaterial color="#f5f0e5" roughness={0.8} />
      </mesh>
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// LOTTERY TICKET DISPLAY — NOUVEAU
// ═══════════════════════════════════════════════════════════

const LotteryDisplay = memo(function LotteryDisplay({ position }: { position: Vec3 }) {
  const ledRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Display case */}
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.6, 0.12]} />
        <meshStandardMaterial color="#222233" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Glass front */}
      <mesh position={[0, 0, 0.065]}>
        <boxGeometry args={[0.75, 0.55, 0.01]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.85}
          thickness={0.01}
          roughness={0.05}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Lottery tickets */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={`ticket-${i}`}
          position={[-0.28 + (i % 4) * 0.18, 0.12 - Math.floor(i / 4) * 0.22, 0.03]}
        >
          <boxGeometry args={[0.15, 0.08, 0.005]} />
          <meshStandardMaterial
            color={
              ["#ff4444", "#44ff44", "#ffaa00", "#4444ff",
               "#ff44ff", "#44ffff", "#ffff44", "#ff8844"][i]
            }
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* "LOTO-QUÉBEC" header */}
      <mesh ref={ledRef} position={[0, 0.35, 0.07]}>
        <boxGeometry args={[0.6, 0.06, 0.005]} />
        <meshStandardMaterial
          color="#0066ff"
          emissive="#0088ff"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// CIGARETTE DISPLAY (behind counter) — NOUVEAU
// ═══════════════════════════════════════════════════════════

const CigaretteDisplay = memo(function CigaretteDisplay({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      {/* Cabinet */}
      <mesh castShadow>
        <boxGeometry args={[2.5, 1.8, 0.25]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Sliding doors (closed) */}
      <mesh position={[0, 0, 0.13]}>
        <boxGeometry args={[2.45, 1.75, 0.02]} />
        <meshStandardMaterial color="#333344" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Compartments visible through gaps */}
      {Array.from({ length: 5 }).map((_, col) =>
        Array.from({ length: 4 }).map((_, row) => (
          <mesh
            key={`cig-${col}-${row}`}
            position={[-0.9 + col * 0.45, 0.55 - row * 0.4, 0.05]}
          >
            <boxGeometry args={[0.38, 0.3, 0.12]} />
            <meshStandardMaterial
              color={`hsl(${(col * 50 + row * 30) % 360}, 20%, ${25 + row * 5}%)`}
              roughness={0.7}
            />
          </mesh>
        ))
      )}

      {/* "TABAC" warning signs */}
      <mesh position={[0, 0.95, 0.15]}>
        <boxGeometry args={[1.5, 0.06, 0.005]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// CASH REGISTER — ENRICHI
// ═══════════════════════════════════════════════════════════

const CashRegister = memo(function CashRegister({ position }: { position: Vec3 }) {
  const screenRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Main body */}
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.12, 0.35]} />
        <meshStandardMaterial color="#222233" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Screen stand */}
      <mesh position={[0, 0.2, -0.1]}>
        <boxGeometry args={[0.05, 0.28, 0.05]} />
        <meshStandardMaterial color="#333344" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Screen */}
      <mesh ref={screenRef} position={[0, 0.38, -0.08]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.35, 0.25, 0.02]} />
        <meshStandardMaterial
          color="#003366"
          emissive="#0055aa"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Screen bezel */}
      <mesh position={[0, 0.38, -0.09]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.38, 0.28, 0.015]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Keyboard area */}
      <mesh position={[0, 0.07, 0.08]}>
        <boxGeometry args={[0.3, 0.02, 0.15]} />
        <meshStandardMaterial color="#444455" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Scanner */}
      <mesh position={[0.25, 0.1, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.15]} />
        <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Scanner window */}
      <mesh position={[0.25, 0.06, 0.08]}>
        <boxGeometry args={[0.05, 0.005, 0.1]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
      </mesh>

      {/* Cash drawer */}
      <mesh position={[0, -0.08, 0.05]}>
        <boxGeometry args={[0.38, 0.06, 0.32]} />
        <meshStandardMaterial color="#333344" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// TRASH CAN — NOUVEAU
// ═══════════════════════════════════════════════════════════

const TrashCan = memo(function TrashCan({ position, color = "#333333" }: { position: Vec3; color?: string }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.5, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Rim */}
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.17, 0.16, 0.04, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Swing lid */}
      <mesh position={[0, 0.28, 0]} rotation={[0.1, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.02, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// OUTDOOR TRASH / RECYCLING — NOUVEAU
// ═══════════════════════════════════════════════════════════

const OutdoorBin = memo(function OutdoorBin({
  position,
  color,
  label,
}: {
  position: Vec3;
  color: string;
  label: string;
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.8, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Lid */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.52, 0.04, 0.42]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Opening */}
      <mesh position={[0, 0.42, 0.15]}>
        <boxGeometry args={[0.2, 0.005, 0.08]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      {/* Symbol panel */}
      <mesh position={[0, 0.15, 0.21]}>
        <boxGeometry args={[0.2, 0.15, 0.005]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// SECURITY CAMERA — NOUVEAU
// ═══════════════════════════════════════════════════════════

const SecurityCameraStore = memo(function SecurityCameraStore({
  position,
  rotation = [0, 0, 0],
}: {
  position: Vec3;
  rotation?: Vec3;
}) {
  const headRef = useRef<THREE.Group>(null);
  const ledRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.4;
    }
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Mount */}
      <mesh>
        <boxGeometry args={[0.08, 0.06, 0.08]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Arm */}
      <mesh position={[0, -0.08, 0.06]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.03, 0.12, 0.03]} />
        <meshStandardMaterial color="#dddddd" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Camera head */}
      <group ref={headRef} position={[0, -0.15, 0.1]}>
        <mesh rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.06, 0.04, 0.1]} />
          <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Lens */}
        <mesh position={[0, 0, 0.055]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.018, 0.03, 8]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* LED */}
        <mesh ref={ledRef} position={[0.025, 0.015, 0.045]}>
          <sphereGeometry args={[0.005, 6, 6]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// SIDEWALK — NOUVEAU
// ═══════════════════════════════════════════════════════════

const Sidewalk = memo(function Sidewalk() {
  return (
    <group>
      {/* Trottoir principal devant le magasin */}
      <mesh position={[0, 0.08, 7.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 2.5]} />
        <meshStandardMaterial color="#b0a898" roughness={0.85} />
      </mesh>

      {/* Bordure de trottoir */}
      <mesh position={[0, 0.1, 8.75]} castShadow>
        <boxGeometry args={[18, 0.2, 0.15]} />
        <meshStandardMaterial color="#999088" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Lignes de trottoir / joints */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={`sidewalk-line-${i}`}
          position={[-7 + i * 2.2, 0.085, 7.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.02, 2.5]} />
          <meshStandardMaterial color="#9a9080" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// ICE / PROPANE CAGE — NOUVEAU (typique Couche-Tard)
// ═══════════════════════════════════════════════════════════

const IceCage = memo(function IceCage({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.05, 0.8]} />
        <meshStandardMaterial color="#cccccc" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Walls — wire mesh effect */}
      {/* Back */}
      <mesh position={[0, 0.5, -0.38]}>
        <boxGeometry args={[1.18, 1.0, 0.04]} />
        <meshStandardMaterial color="#aaaaaa" roughness={0.4} metalness={0.7} transparent opacity={0.5} />
      </mesh>
      {/* Left */}
      <mesh position={[-0.58, 0.5, 0]}>
        <boxGeometry args={[0.04, 1.0, 0.76]} />
        <meshStandardMaterial color="#aaaaaa" roughness={0.4} metalness={0.7} transparent opacity={0.5} />
      </mesh>
      {/* Right */}
      <mesh position={[0.58, 0.5, 0]}>
        <boxGeometry args={[0.04, 1.0, 0.76]} />
        <meshStandardMaterial color="#aaaaaa" roughness={0.4} metalness={0.7} transparent opacity={0.5} />
      </mesh>
      {/* Top */}
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[1.2, 0.04, 0.8]} />
        <meshStandardMaterial color="#bbbbbb" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Door (front) */}
      <mesh position={[0, 0.5, 0.38]}>
        <boxGeometry args={[1.18, 1.0, 0.03]} />
        <meshStandardMaterial color="#999999" roughness={0.4} metalness={0.7} transparent opacity={0.4} />
      </mesh>
      {/* Lock */}
      <mesh position={[0.5, 0.4, 0.4]}>
        <boxGeometry args={[0.06, 0.04, 0.04]} />
        <meshStandardMaterial color="#ffcc00" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Ice bags inside */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`ice-${i}`} position={[-0.3 + i * 0.22, 0.25, 0]}>
          <boxGeometry args={[0.18, 0.35, 0.25]} />
          <meshStandardMaterial color="#ddeeff" roughness={0.6} transparent opacity={0.7} />
        </mesh>
      ))}

      {/* "GLACE / ICE" sign */}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.02]} />
        <meshStandardMaterial color="#0066cc" emissive="#0066cc" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// STORE BUILDING — ENRICHI
// ═══════════════════════════════════════════════════════════

const SHELF_POSITIONS = [-4, 4] as const;
const FRIDGE_X_POSITIONS = [-3, 0, 3] as const;

export const StoreBuilding = memo(function StoreBuilding() {
  const storeTileTex = useStoreTileTexture();
  const exteriorTex = useExteriorWallTexture();
  const counterTex = useCounterTexture();

  return (
    <group>
      {/* ══ FLOOR ══ */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[STORE_WIDTH, STORE_DEPTH]} />
        <meshStandardMaterial
          map={storeTileTex}
          color="#e8e4dc"
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>

      {/* Anti-slip mat at entrance */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 5.5]}>
        <planeGeometry args={[3, 1.5]} />
        <meshStandardMaterial color="#333328" roughness={0.95} />
      </mesh>

      {/* ══ CEILING ══ */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, STORE_HEIGHT, 0]}
      >
        <planeGeometry args={[STORE_WIDTH, STORE_DEPTH]} />
        <meshStandardMaterial color="#d0ccc4" roughness={0.9} />
      </mesh>

      {/* Ceiling grid / suspended tiles */}
      {Array.from({ length: 5 }).map((_, i) =>
        Array.from({ length: 4 }).map((_, j) => (
          <mesh
            key={`ceil-tile-${i}-${j}`}
            position={[-6 + i * 3.2, STORE_HEIGHT - 0.01, -5 + j * 3.5]}
          >
            <boxGeometry args={[3.0, 0.02, 3.3]} />
            <meshStandardMaterial
              color={`rgb(${200 + Math.random() * 10},${196 + Math.random() * 10},${188 + Math.random() * 10})`}
              roughness={0.9}
            />
          </mesh>
        ))
      )}

      {/* Ceiling grid rails */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`ceil-rail-x-${i}`} position={[-7.5 + i * 3.2, STORE_HEIGHT - 0.02, 0]}>
          <boxGeometry args={[0.03, 0.04, STORE_DEPTH]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`ceil-rail-z-${i}`} position={[0, STORE_HEIGHT - 0.02, -6.5 + i * 3.5]}>
          <boxGeometry args={[STORE_WIDTH, 0.04, 0.03]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {/* ══ WALLS ══ */}
      {/* Back wall */}
      <mesh position={[0, 2.9, -6.9]} castShadow>
        <boxGeometry args={[STORE_WIDTH, STORE_HEIGHT, 0.15]} />
        <meshStandardMaterial map={exteriorTex} color="#f0ede6" roughness={0.85} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-7.9, 2.9, 0]} castShadow>
        <boxGeometry args={[0.15, STORE_HEIGHT, STORE_DEPTH]} />
        <meshStandardMaterial map={exteriorTex} color="#eae7e0" roughness={0.85} />
      </mesh>

      {/* Right wall */}
      <mesh position={[7.9, 2.9, 0]} castShadow>
        <boxGeometry args={[0.15, STORE_HEIGHT, STORE_DEPTH]} />
        <meshStandardMaterial map={exteriorTex} color="#eae7e0" roughness={0.85} />
      </mesh>

      {/* Front facade — left panel */}
      <mesh position={[-4.75, 2.9, FACADE_Z]} castShadow>
        <boxGeometry args={[5.5, STORE_HEIGHT, 0.12]} />
        <meshStandardMaterial map={exteriorTex} color="#f5f2eb" roughness={0.8} />
      </mesh>

      {/* Front facade — right panel */}
      <mesh position={[4.75, 2.9, FACADE_Z]} castShadow>
        <boxGeometry args={[5.5, STORE_HEIGHT, 0.12]} />
        <meshStandardMaterial map={exteriorTex} color="#f5f2eb" roughness={0.8} />
      </mesh>

      {/* Lintel above door */}
      <mesh position={[0, 5.1, FACADE_Z]} castShadow>
        <boxGeometry args={[3, 1.4, 0.12]} />
        <meshStandardMaterial map={exteriorTex} color="#f5f2eb" roughness={0.8} />
      </mesh>

      {/* ══ STORE WINDOWS (on facade sides) ══ */}
      {[-5.5, 5.5].map((xPos, i) => (
        <mesh key={`window-${i}`} position={[xPos, 2.5, FACADE_Z + 0.07]}>
          <boxGeometry args={[2.5, 2.8, 0.02]} />
          <meshPhysicalMaterial
            color="#a8d8ff"
            transmission={0.7}
            thickness={0.02}
            roughness={0.05}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}

      {/* Window frames */}
      {[-5.5, 5.5].map((xPos, i) => (
        <group key={`winframe-${i}`}>
          <mesh position={[xPos, 2.5, FACADE_Z + 0.08]}>
            <boxGeometry args={[2.6, 0.06, 0.03]} />
            <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[xPos, 3.95, FACADE_Z + 0.08]}>
            <boxGeometry args={[2.6, 0.06, 0.03]} />
            <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[xPos, 1.05, FACADE_Z + 0.08]}>
            <boxGeometry args={[2.6, 0.06, 0.03]} />
            <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ══ COUNTER — ENRICHI ══ */}
      <group position={[0, 0, 4.5]}>
        {/* Counter body */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[4, 1.1, 0.7]} />
          <meshStandardMaterial
            map={counterTex}
            color="#c0a060"
            roughness={0.5}
            metalness={0.1}
          />
        </mesh>
        {/* Counter top */}
        <mesh position={[0, 1.13, 0]}>
          <boxGeometry args={[4.1, 0.06, 0.75]} />
          <meshStandardMaterial color="#e0d8c8" roughness={0.25} metalness={0.15} />
        </mesh>
        {/* Counter front panel */}
        <mesh position={[0, 0.55, 0.36]}>
          <boxGeometry args={[4.0, 1.08, 0.02]} />
          <meshStandardMaterial color="#a8903a" roughness={0.6} metalness={0.1} />
        </mesh>

        {/* Cash register */}
        <CashRegister position={[1.2, 1.16, 0]} />

        {/* Second cash register */}
        <CashRegister position={[-1.2, 1.16, 0]} />

        {/* Lottery display on counter */}
        <LotteryDisplay position={[0, 1.5, 0.2]} />

        {/* Candy / gum display at counter */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh
            key={`candy-${i}`}
            position={[-1.5 + i * 0.3, 1.18, 0.25]}
            castShadow
          >
            <boxGeometry args={[0.2, 0.08, 0.12]} />
            <meshStandardMaterial
              color={["#ff4444", "#ffaa00", "#44aa44", "#4444ff", "#ff44ff", "#884400"][i]}
              roughness={0.5}
            />
          </mesh>
        ))}

        {/* Plastic bag holder */}
        <mesh position={[1.8, 0.8, -0.2]}>
          <boxGeometry args={[0.3, 0.4, 0.15]} />
          <meshStandardMaterial color="#dddddd" roughness={0.7} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* ══ CIGARETTE DISPLAY (behind counter, on back wall) ══ */}
      <CigaretteDisplay position={[0, 3.5, 3.5]} />

      {/* ══ HOT DOG ROLLER ══ */}
      <HotDogRoller position={[2.5, 1.16, 4.5]} />

      {/* ══ SHELVING UNITS ══ */}
      {SHELF_POSITIONS.map((x) => (
        <ShelfUnit key={`shelf-${x}`} x={x} />
      ))}

      {/* ══ CENTER AISLE — LOW DISPLAY ══ */}
      <group position={[0, 0, 0]}>
        {/* Low center display */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[1.5, 0.7, 3]} />
          <meshStandardMaterial color="#7a6a58" roughness={0.65} metalness={0.1} />
        </mesh>
        {/* Display products */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh
            key={`center-prod-${i}`}
            position={[-0.4 + (i % 4) * 0.28, 0.75, -1 + Math.floor(i / 4) * 0.8]}
            castShadow
          >
            <boxGeometry args={[0.2, 0.15, 0.2]} />
            <meshStandardMaterial
              color={PRODUCT_COLORS[i % PRODUCT_COLORS.length]}
              roughness={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* ══ BACK FRIDGES ══ */}
      <group position={[0, 0, -6.5]}>
        {FRIDGE_X_POSITIONS.map((x) => (
          <FridgeUnit key={`fridge-${x}`} x={x} />
        ))}
      </group>

      {/* ══ COFFEE STATION ══ */}
      <CoffeeStation position={[-5.5, 0, 3]} />

      {/* ══ SLURPEE MACHINE ══ */}
      <SlurpeeMachine position={[-5.5, 0.8, -2]} />

      {/* ══ ATM ══ */}
      <ATMMachine position={[5.8, 0, 4]} />

      {/* ══ MAGAZINE RACK ══ */}
      <MagazineRack position={[5.5, 0.8, 0]} />

      {/* ══ INDOOR TRASH CANS ══ */}
      <TrashCan position={[-6.5, 0.25, 5]} color="#444444" />
      <TrashCan position={[6.5, 0.25, 5]} color="#444444" />
      <TrashCan position={[2.5, 0.25, 4.8]} color="#555555" />

      {/* ══ SECURITY CAMERAS ══ */}
      <SecurityCameraStore position={[-6, 5.5, 5]} rotation={[0, Math.PI / 4, 0]} />
      <SecurityCameraStore position={[6, 5.5, 5]} rotation={[0, -Math.PI / 4, 0]} />
      <SecurityCameraStore position={[0, 5.5, -6]} rotation={[0, Math.PI, 0]} />

      {/* ══ AISLE SIGNS (hanging from ceiling) ══ */}
      {[
        { x: -4, label: "CHIPS • SNACKS" },
        { x: 4, label: "BOISSONS • DRINKS" },
        { x: 0, label: "CONFISERIE • CANDY" },
      ].map((sign, i) => (
        <group key={`aisle-sign-${i}`} position={[sign.x, 4.8, 0]}>
          {/* Hanging wires */}
          <mesh position={[-0.4, 0.4, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.8, 4]} />
            <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0.4, 0.4, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.8, 4]} />
            <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Sign */}
          <mesh>
            <boxGeometry args={[1.2, 0.25, 0.03]} />
            <meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.15} />
          </mesh>
          {/* Sign text area */}
          <mesh position={[0, 0, 0.018]}>
            <boxGeometry args={[1.1, 0.18, 0.005]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.08} />
          </mesh>
        </group>
      ))}

      {/* ══ CEILING LIGHTS — ENRICHI ══ */}
      {[-5, -2, 1, 4].map((x) =>
        [-4, 0, 4].map((z) => (
          <CeilingLight key={`light-${x}-${z}`} x={x} z={z} />
        ))
      )}

      {/* ══ FLOOR STANDING SIGNS ══ */}
      {/* "Plancher mouillé / Wet floor" */}
      <group position={[2, 0, 2]}>
        <mesh position={[0, 0.35, 0]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.02, 0.6, 0.35]} />
          <meshStandardMaterial color="#ffcc00" roughness={0.6} />
        </mesh>
        <mesh position={[0.01, 0.35, 0]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.02, 0.6, 0.35]} />
          <meshStandardMaterial color="#ffcc00" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// COUCHE-TARD SIGN — ENRICHI
// ═══════════════════════════════════════════════════════════

interface SignProps {
  position: Vec3;
}

const CoucheTardSign = memo(function CoucheTardSign({ position }: SignProps) {
  const signGlowRef = useRef<THREE.Mesh>(null);
  const owlEyeLeftRef = useRef<THREE.Mesh>(null);
  const owlEyeRightRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (signGlowRef.current) {
      const mat = signGlowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.35 + Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
    }
    // Owl eyes blinking
    if (owlEyeLeftRef.current && owlEyeRightRef.current) {
      const blink = Math.sin(state.clock.elapsedTime * 0.8);
      const scale = blink > 0.95 ? 0.1 : 1;
      owlEyeLeftRef.current.scale.y = scale;
      owlEyeRightRef.current.scale.y = scale;
    }
  });

  return (
    <group position={position}>
      {/* Main pole */}
      <mesh castShadow>
        <boxGeometry args={[0.2, 4, 0.2]} />
        <meshStandardMaterial color="#444455" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Pole base */}
      <mesh position={[0, -1.8, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#555566" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Sign body */}
      <group position={[0, 2, 0.5]}>
        {/* Main sign panel */}
        <mesh castShadow>
          <boxGeometry args={[3.5, 1.8, 0.22]} />
          <meshStandardMaterial
            color="#cc0000"
            emissive="#cc0000"
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* White border */}
        <mesh position={[0, 0, 0.115]}>
          <boxGeometry args={[3.4, 1.7, 0.005]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.1}
          />
        </mesh>

        {/* Sign face — brand area */}
        <mesh ref={signGlowRef} position={[0, 0, 0.12]}>
          <boxGeometry args={[3.2, 1.5, 0.01]} />
          <meshStandardMaterial
            color="#cc0000"
            emissive="#ff0000"
            emissiveIntensity={0.35}
          />
        </mesh>

        {/* Owl logo area */}
        <group position={[-1.0, 0.2, 0.14]}>
          {/* Owl body */}
          <mesh>
            <boxGeometry args={[0.5, 0.6, 0.02]} />
            <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.2} />
          </mesh>
          {/* Owl eyes */}
          <mesh ref={owlEyeLeftRef} position={[-0.1, 0.15, 0.015]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.4}
            />
          </mesh>
          <mesh ref={owlEyeRightRef} position={[0.1, 0.15, 0.015]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.4}
            />
          </mesh>
          {/* Owl pupils */}
          <mesh position={[-0.1, 0.15, 0.035]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          <mesh position={[0.1, 0.15, 0.035]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
        </group>

        {/* Text area — "Couche-Tard" */}
        <mesh position={[0.5, 0.2, 0.13]}>
          <boxGeometry args={[1.8, 0.35, 0.005]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* "DÉPANNEUR" subtitle */}
        <mesh position={[0.5, -0.15, 0.13]}>
          <boxGeometry args={[1.2, 0.15, 0.005]} />
          <meshStandardMaterial
            color="#ffcc00"
            emissive="#ffcc00"
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* "OUVERT 24H" */}
        <mesh position={[0, -0.55, 0.13]}>
          <boxGeometry args={[1.5, 0.12, 0.005]} />
          <meshStandardMaterial
            color="#00ff00"
            emissive="#00ff00"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* Sign illumination */}
      <pointLight
        position={[0, 2, 1.5]}
        color="#ff3333"
        intensity={2.5}
        distance={12}
        decay={2}
      />
      <pointLight
        position={[0, 2, -0.5]}
        color="#ff3333"
        intensity={1.0}
        distance={8}
        decay={2}
      />

      {/* Top light */}
      <spotLight
        position={[0, 4, 0.5]}
        angle={Math.PI / 4}
        penumbra={0.5}
        intensity={1.5}
        color="#ffeecc"
        castShadow
        shadow-mapSize={[512, 512]}
      />
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// PARKING LOT — ENRICHI
// ═══════════════════════════════════════════════════════════

const PARKING_LINE_X = [-4, -2, 0, 2, 4] as const;
const PARKING_LIGHT_X = [-4, 0, 4] as const;

const ParkingLot = memo(function ParkingLot() {
  const asphaltTex = useAsphaltTexture();

  return (
    <group position={[0, 0, 10]}>
      {/* Asphalt */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial
          map={asphaltTex}
          color="#2a2a2e"
          roughness={0.88}
          metalness={0.02}
        />
      </mesh>

      {/* Parking lines */}
      {PARKING_LINE_X.map((x) => (
        <mesh
          key={`line-${x}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.02, 0]}
        >
          <planeGeometry args={[0.1, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Handicap spot markings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, 0.02, 0]}>
        <planeGeometry args={[0.1, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Handicap symbol area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5.5, 0.02, 0]}>
        <planeGeometry args={[1.8, 3]} />
        <meshStandardMaterial color="#2244aa" roughness={0.8} transparent opacity={0.3} />
      </mesh>

      {/* Parking bumpers */}
      {PARKING_LINE_X.map((x, i) => (
        <mesh
          key={`bumper-${i}`}
          position={[x + 1, 0.08, -2.5]}
          castShadow
        >
          <boxGeometry args={[1.5, 0.12, 0.15]} />
          <meshStandardMaterial color="#ffcc00" roughness={0.7} />
        </mesh>
      ))}

      {/* Lamp posts — enrichi */}
      {PARKING_LIGHT_X.map((x) => (
        <group key={`lamp-${x}`} position={[x, 0, 4]}>
          {/* Pole */}
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.1, 6, 8]} />
            <meshStandardMaterial color="#444455" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Pole base plate */}
          <mesh position={[0, -2.9, 0]}>
            <boxGeometry args={[0.4, 0.1, 0.4]} />
            <meshStandardMaterial color="#555566" metalness={0.6} roughness={0.35} />
          </mesh>
          {/* Light arm */}
          <mesh position={[0.3, 3.1, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.8, 0.06, 0.06]} />
            <meshStandardMaterial color="#555566" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Light fixture */}
          <mesh position={[0.6, 3.0, 0]}>
            <boxGeometry args={[0.5, 0.06, 0.25]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#fff8e0"
              emissiveIntensity={0.9}
            />
          </mesh>
          {/* Light diffuser */}
          <mesh position={[0.6, 2.96, 0]}>
            <boxGeometry args={[0.45, 0.02, 0.2]} />
            <meshStandardMaterial
              color="#ffffee"
              emissive="#fff8e0"
              emissiveIntensity={1.2}
              transparent
              opacity={0.9}
            />
          </mesh>
          <pointLight
            position={[0.6, 2.5, 0]}
            color="#fff8e0"
            intensity={1.5}
            distance={14}
            decay={2}
            castShadow
            shadow-mapSize={[512, 512]}
          />
        </group>
      ))}

      {/* ══ OUTDOOR BINS ══ */}
      <OutdoorBin position={[-6, 0.4, -3]} color="#333333" label="ORDURES" />
      <OutdoorBin position={[-6, 0.4, -2]} color="#0066cc" label="RECYCLAGE" />

      {/* ══ ICE CAGE ══ */}
      <IceCage position={[6, 0, -3]} />

      {/* ══ BENCH ══ */}
      <group position={[-6, 0, 2]}>
        {/* Seat */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.2, 0.06, 0.4]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} />
        </mesh>
        {/* Back rest */}
        <mesh position={[0, 0.8, -0.18]} castShadow>
          <boxGeometry args={[1.2, 0.5, 0.04]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} />
        </mesh>
        {/* Legs */}
        {[-0.5, 0.5].map((xOff) => (
          <mesh key={`bench-leg-${xOff}`} position={[xOff, 0.22, 0]}>
            <boxGeometry args={[0.06, 0.44, 0.35]} />
            <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ══ BOLLARDS (parking protection) ══ */}
      {[-6.5, -5.5, 5.5, 6.5].map((x, i) => (
        <group key={`bollard-${i}`} position={[x, 0, -4.5]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.8, 8]} />
            <meshStandardMaterial color="#ffcc00" roughness={0.5} metalness={0.3} />
          </mesh>
          {/* Reflective strip */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.1, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.1}
              metalness={0.8}
              roughness={0.1}
            />
          </mesh>
        </group>
      ))}

      {/* ══ DRAIN GRATE ══ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 3]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// FACADE AWNING — NOUVEAU (auvent Couche-Tard)
// ═══════════════════════════════════════════════════════════

const FacadeAwning = memo(function FacadeAwning() {
  return (
    <group position={[0, 4.8, FACADE_Z + 1.5]}>
      {/* Awning structure */}
      <mesh castShadow>
        <boxGeometry args={[STORE_WIDTH + 1, 0.08, 3]} />
        <meshStandardMaterial color="#cc0000" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Awning underside */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[STORE_WIDTH + 0.8, 0.02, 2.8]} />
        <meshStandardMaterial color="#aa0000" roughness={0.6} />
      </mesh>

      {/* Support brackets */}
      {[-6, -2, 2, 6].map((x, i) => (
        <mesh
          key={`bracket-${i}`}
          position={[x, -0.5, -1.3]}
          rotation={[0.4, 0, 0]}
        >
          <boxGeometry args={[0.08, 1.0, 0.08]} />
          <meshStandardMaterial color="#555566" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Fascia band — brand color */}
      <mesh position={[0, -0.06, 1.45]}>
        <boxGeometry args={[STORE_WIDTH + 1, 0.5, 0.05]} />
        <meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.2} />
      </mesh>

      {/* White accent stripe */}
      <mesh position={[0, -0.2, 1.47]}>
        <boxGeometry args={[STORE_WIDTH + 0.5, 0.08, 0.02]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Under-awning lights */}
      {[-5, -2.5, 0, 2.5, 5].map((x, i) => (
        <group key={`awning-light-${i}`} position={[x, -0.1, 0]}>
          <mesh>
            <boxGeometry args={[0.4, 0.03, 0.15]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#fff8e0"
              emissiveIntensity={0.6}
            />
          </mesh>
          <pointLight
            position={[0, -0.1, 0]}
            intensity={0.6}
            color="#fff8e0"
            distance={4}
            decay={2}
          />
        </group>
      ))}
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// OPEN SIGN — NOUVEAU
// ═══════════════════════════════════════════════════════════

const OpenSign = memo(function OpenSign({ position }: { position: Vec3 }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      // Pulsation douce
      mat.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Sign body */}
      <mesh>
        <boxGeometry args={[0.6, 0.25, 0.03]} />
        <meshStandardMaterial color="#111111" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* "OUVERT" text — neon */}
      <mesh ref={meshRef} position={[0, 0, 0.018]}>
        <boxGeometry args={[0.5, 0.15, 0.005]} />
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* Glow */}
      <pointLight
        position={[0, 0, 0.1]}
        intensity={0.3}
        color="#00ff00"
        distance={2}
        decay={2}
      />
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// DÉPANNEUR COMPLET — Root component
// ═══════════════════════════════════════════════════════════

interface DepanneurCoucheTardProps {
  position?: Vec3;
}

export function DepanneurCoucheTard({
  position = [0, 0, 0],
}: DepanneurCoucheTardProps) {
  return (
    <group position={position}>
      <StoreBuilding />
      <StoreColliders />
      <CoucheTardSign position={[0, 7.2, -4]} />
      <SlidingDoor position={[0, 1.6, 6.95]} />
      <ParkingLot />
      <Sidewalk />
      <FacadeAwning />
      <GroundColliders />

      {/* OPEN sign in window */}
      <OpenSign position={[-5.5, 2.8, FACADE_Z + 0.12]} />

      {/* Promotional posters in windows */}
      {[5.5].map((xPos, i) => (
        <mesh key={`poster-${i}`} position={[xPos, 2.0, FACADE_Z + 0.1]}>
          <boxGeometry args={[1.2, 1.5, 0.005]} />
          <meshStandardMaterial
            color="#ff6600"
            emissive="#ff6600"
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}

      {/* Global ambient lighting for store area */}
      <ambientLight intensity={0.15} color="#ffffff" />

      {/* Entrance spotlight */}
      <spotLight
        position={[0, 5, 8]}
        angle={Math.PI / 5}
        penumbra={0.7}
        intensity={2}
        color="#fff8e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
    </group>
  );
}