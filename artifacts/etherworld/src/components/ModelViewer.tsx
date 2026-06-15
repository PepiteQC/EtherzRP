import { Suspense, useRef, useState, useEffect, Component, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import { parsePrompt, type QualityLevel } from "@/lib/promptParser";
// re-export so callers can import from here
export type { QualityLevel };
import { ProceduralScene } from "@/components/ProceduralScene";

// ── WebGL check ───────────────────────────────────────────────────────────────

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// ── Error boundary ────────────────────────────────────────────────────────────

interface EBState { hasError: boolean }
class CanvasErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, EBState> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ── Idle orb (no prompt) ─────────────────────────────────────────────────────

function IdleOrb() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.4;
    ref.current.rotation.x = clock.getElapsedTime() * 0.15;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.3, 1]} />
      <meshStandardMaterial
        color="#7c3aed"
        emissive="#4c1d95"
        emissiveIntensity={0.5}
        wireframe
        transparent
        opacity={0.35}
      />
    </mesh>
  );
}

// ── No-WebGL fallback ─────────────────────────────────────────────────────────

function WebGLFallback({ prompt }: { prompt?: string | null }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#060010] gap-4">
      <div className="w-24 h-24 border border-violet-500/30 rounded-full flex items-center justify-center">
        <div className="w-16 h-16 border border-violet-500/50 rounded-full animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-violet-400/60 text-xs uppercase tracking-[0.2em]">3D Preview Unavailable</p>
        {prompt && (
          <p className="text-white/20 text-[10px] mt-2 max-w-xs truncate">{prompt}</p>
        )}
        <p className="text-white/10 text-[10px] mt-1">WebGL non supporté dans cet environnement</p>
      </div>
    </div>
  );
}

// ── Floor grid ────────────────────────────────────────────────────────────────

function FloorGrid() {
  return (
    <Grid
      position={[0, -2.5, 0]}
      args={[30, 30]}
      cellSize={0.6}
      cellThickness={0.5}
      cellColor="#1e1040"
      sectionSize={3}
      sectionThickness={1}
      sectionColor="#2d1b6b"
      fadeDistance={22}
      fadeStrength={2}
      infiniteGrid
    />
  );
}

// ── Main viewer ───────────────────────────────────────────────────────────────

export function ModelViewer({ prompt, quality = "balanced" }: { prompt?: string | null; quality?: QualityLevel }) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglOk(isWebGLAvailable());
  }, []);

  const config = prompt ? parsePrompt(prompt, quality) : null;

  if (webglOk === null) {
    return <div className="w-full h-full bg-[#060010]" />;
  }

  if (!webglOk) {
    return <WebGLFallback prompt={prompt} />;
  }

  return (
    <CanvasErrorBoundary fallback={<WebGLFallback prompt={prompt} />}>
      <div className="w-full h-full" data-testid="model-viewer">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 2, 7], fov: 50 }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          style={{ background: config?.background ?? "#060010" }}
          onCreated={({ gl }) => {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          }}
        >
          <fog attach="fog" args={[config?.background ?? "#060010", 14, 30]} />

          <Suspense fallback={null}>
            {config ? (
              <ProceduralScene config={config} />
            ) : (
              <>
                <color attach="background" args={["#060010"]} />
                <ambientLight color="#0d001a" intensity={1.5} />
                <pointLight color="#9955ff" intensity={20} position={[5, 5, 5]} />
                <IdleOrb />
              </>
            )}

            <FloorGrid />
          </Suspense>

          <OrbitControls
            makeDefault
            enablePan
            enableZoom
            enableRotate
            enableDamping
            dampingFactor={0.08}
            autoRotate
            autoRotateSpeed={0.6}
            minDistance={2}
            maxDistance={22}
          />
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}
