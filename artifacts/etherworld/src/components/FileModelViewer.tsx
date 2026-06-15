import { Suspense, useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Html, useProgress, Center } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
// ── types ─────────────────────────────────────────────────────────────────────

interface OrbitControlsLike {
  update(): void;
  target: THREE.Vector3;
}

export type ViewMode = "normal" | "wireframe" | "clay" | "normals" | "xray";
export type EnvPreset = "none" | "studio" | "city" | "dawn" | "forest" | "night" | "sunset" | "warehouse";
export type CameraPreset = "front" | "back" | "top" | "right" | "left" | "iso";

export interface CameraSettings {
  fov: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
  damping: boolean;
  env: EnvPreset;
}

export interface ViewerHandle {
  gotoPreset(p: CameraPreset): void;
}

// ── helpers ───────────────────────────────────────────────────────────────────

const PRESET_POSITIONS: Record<CameraPreset, THREE.Vector3> = {
  front:  new THREE.Vector3(0, 0, 5),
  back:   new THREE.Vector3(0, 0, -5),
  top:    new THREE.Vector3(0, 5, 0.01),
  right:  new THREE.Vector3(5, 0, 0),
  left:   new THREE.Vector3(-5, 0, 0),
  iso:    new THREE.Vector3(3.5, 3, 3.5),
};

function applyViewMode(obj: THREE.Object3D, mode: ViewMode, originals: Map<THREE.Mesh, THREE.Material | THREE.Material[]>) {
  obj.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    if (mode === "normal") {
      const orig = originals.get(child);
      if (orig) { child.material = orig; child.visible = true; }
      return;
    }

    // Store original on first override
    if (!originals.has(child)) originals.set(child, child.material);

    switch (mode) {
      case "wireframe":
        child.material = new THREE.MeshBasicMaterial({ color: "#00e5ff", wireframe: true, transparent: false });
        break;
      case "clay":
        child.material = new THREE.MeshStandardMaterial({ color: "#c8b4a0", roughness: 0.85, metalness: 0.0 });
        break;
      case "normals":
        child.material = new THREE.MeshNormalMaterial();
        break;
      case "xray":
        child.material = new THREE.MeshBasicMaterial({
          color: "#4499ff", wireframe: true, transparent: true, opacity: 0.25,
        });
        break;
    }
  });
}

function fitCameraToObject(camera: THREE.PerspectiveCamera, obj: THREE.Object3D, controls: OrbitControlsLike) {
  const box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  const size   = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov    = camera.fov * (Math.PI / 180);
  const dist   = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.5;

  controls.target.copy(center);
  camera.position.set(center.x, center.y + maxDim * 0.3, center.z + dist);
  camera.near = dist / 100;
  camera.far  = dist * 10;
  camera.updateProjectionMatrix();
  controls.update();
}

// ── loader spinner ────────────────────────────────────────────────────────────

function LoadingOverlay() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 pointer-events-none select-none">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs text-violet-400 tracking-[0.2em]">{Math.round(progress)}%</span>
      </div>
    </Html>
  );
}

// ── camera controller (smooth preset animation) ───────────────────────────────

interface CameraControllerProps {
  settings: CameraSettings;
  targetPos: THREE.Vector3 | null;
  controlsRef: React.RefObject<OrbitControlsLike | null>;
}

function CameraController({ settings, targetPos, controlsRef }: CameraControllerProps) {
  const { camera } = useThree();
  const lerpRef = useRef<{ from: THREE.Vector3; to: THREE.Vector3; t: number } | null>(null);

  useEffect(() => {
    if (targetPos) {
      lerpRef.current = { from: camera.position.clone(), to: targetPos.clone(), t: 0 };
    }
  }, [targetPos]);

  useFrame(() => {
    if (!lerpRef.current) return;
    lerpRef.current.t = Math.min(lerpRef.current.t + 0.06, 1);
    const ease = 1 - (1 - lerpRef.current.t) ** 3;
    camera.position.lerpVectors(lerpRef.current.from, lerpRef.current.to, ease);
    controlsRef.current?.update();
    if (lerpRef.current.t >= 1) lerpRef.current = null;
  });

  return null;
}

// ── GLTF model ────────────────────────────────────────────────────────────────

interface GLTFModelProps { url: string; viewMode: ViewMode; controlsRef: React.RefObject<OrbitControlsLike | null>; }

function GLTFModel({ url, viewMode, controlsRef }: GLTFModelProps) {
  const { scene } = useGLTF(url);
  const { camera } = useThree();
  const originals = useRef(new Map<THREE.Mesh, THREE.Material | THREE.Material[]>());
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    // Reset originals map when model changes
    originals.current = new Map();
  }, [cloned]);

  useEffect(() => {
    applyViewMode(cloned, viewMode, originals.current);
  }, [cloned, viewMode]);

  useEffect(() => {
    if (controlsRef.current) fitCameraToObject(camera as THREE.PerspectiveCamera, cloned, controlsRef.current);
  }, [cloned]);

  return (
    <Center>
      <primitive object={cloned} />
    </Center>
  );
}

// ── OBJ model ─────────────────────────────────────────────────────────────────

interface OBJModelProps { url: string; viewMode: ViewMode; controlsRef: React.RefObject<OrbitControlsLike | null>; }

function OBJModel({ url, viewMode, controlsRef }: OBJModelProps) {
  const obj = useLoader(OBJLoader, url);
  const { camera } = useThree();
  const originals = useRef(new Map<THREE.Mesh, THREE.Material | THREE.Material[]>());
  const cloned = useMemo(() => obj.clone(true), [obj]);

  useEffect(() => { originals.current = new Map(); }, [cloned]);

  useEffect(() => {
    applyViewMode(cloned, viewMode, originals.current);
  }, [cloned, viewMode]);

  useEffect(() => {
    if (controlsRef.current) fitCameraToObject(camera as THREE.PerspectiveCamera, cloned, controlsRef.current);
  }, [cloned]);

  return (
    <Center>
      <primitive object={cloned} />
    </Center>
  );
}

// ── STL model ─────────────────────────────────────────────────────────────────

interface STLModelProps { url: string; viewMode: ViewMode; controlsRef: React.RefObject<OrbitControlsLike | null>; }

function STLModel({ url, viewMode, controlsRef }: STLModelProps) {
  const geometry = useLoader(STLLoader, url);
  const { camera } = useThree();
  const mat = useMemo(() => {
    if (viewMode === "wireframe") return new THREE.MeshBasicMaterial({ color: "#00e5ff", wireframe: true });
    if (viewMode === "clay")      return new THREE.MeshStandardMaterial({ color: "#c8b4a0", roughness: 0.85, metalness: 0 });
    if (viewMode === "normals")   return new THREE.MeshNormalMaterial();
    if (viewMode === "xray")      return new THREE.MeshBasicMaterial({ color: "#4499ff", wireframe: true, transparent: true, opacity: 0.25 });
    return new THREE.MeshStandardMaterial({ color: "#a0a0a0", roughness: 0.5, metalness: 0.2 });
  }, [viewMode]);

  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!meshRef.current || !controlsRef.current) return;
    geometry.computeVertexNormals();
    fitCameraToObject(camera as THREE.PerspectiveCamera, meshRef.current, controlsRef.current);
  }, [geometry]);

  return (
    <Center>
      <mesh ref={meshRef} geometry={geometry} material={mat} />
    </Center>
  );
}

// ── canvas scene ──────────────────────────────────────────────────────────────

export type FileFormat = "glb" | "gltf" | "obj" | "stl";

interface SceneProps {
  fileUrl: string | null;
  format: FileFormat | null;
  viewMode: ViewMode;
  settings: CameraSettings;
  targetPos: THREE.Vector3 | null;
  controlsRef: React.RefObject<OrbitControlsLike | null>;
}

function Scene({ fileUrl, format, viewMode, settings, targetPos, controlsRef }: SceneProps) {
  return (
    <>
      <color attach="background" args={["#070010"]} />
      <ambientLight intensity={1.2} color="#c0c0d0" />
      <directionalLight position={[5, 8, 5]} intensity={2} color="#ffffff" />
      <pointLight position={[-5, 3, -5]} intensity={1.5} color="#8888ff" />
      <pointLight position={[0, -4, 0]} intensity={0.8} color="#ff8844" />

      {settings.env !== "none" && <Environment preset={settings.env} />}

      {fileUrl && format && (
        <Suspense fallback={<LoadingOverlay />}>
          {(format === "glb" || format === "gltf") && <GLTFModel url={fileUrl} viewMode={viewMode} controlsRef={controlsRef} />}
          {format === "obj" && <OBJModel url={fileUrl} viewMode={viewMode} controlsRef={controlsRef} />}
          {format === "stl" && <STLModel url={fileUrl} viewMode={viewMode} controlsRef={controlsRef} />}
        </Suspense>
      )}

      {!fileUrl && (
        <Html center>
          <div className="text-center pointer-events-none select-none">
            <div className="text-violet-500/20 font-mono text-[10px] uppercase tracking-[0.35em]">Importer un fichier</div>
          </div>
        </Html>
      )}

      <CameraController settings={settings} targetPos={targetPos} controlsRef={controlsRef} />

      <OrbitControls
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={controlsRef as any}
        enablePan
        enableZoom
        enableRotate
        autoRotate={settings.autoRotate}
        autoRotateSpeed={settings.autoRotateSpeed}
        enableDamping={settings.damping}
        dampingFactor={0.08}
        makeDefault
      />
    </>
  );
}

// ── WebGL check ───────────────────────────────────────────────────────────────

function isWebGLAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch { return false; }
}

// ── main export ───────────────────────────────────────────────────────────────

interface Props {
  fileUrl: string | null;
  format: FileFormat | null;
  viewMode: ViewMode;
  settings: CameraSettings;
  targetPos: THREE.Vector3 | null;
  controlsRef: React.RefObject<OrbitControlsLike | null>;
}

export function FileModelViewer({ fileUrl, format, viewMode, settings, targetPos, controlsRef }: Props) {
  const [webgl] = useState(() => isWebGLAvailable());

  if (!webgl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#070010]">
        <p className="text-violet-400/50 font-mono text-xs tracking-[0.2em] uppercase">WebGL non supporté</p>
      </div>
    );
  }

  return (
    <Canvas
      camera={{ fov: settings.fov, position: [0, 1.5, 5] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))}
    >
      <Scene
        fileUrl={fileUrl}
        format={format}
        viewMode={viewMode}
        settings={settings}
        targetPos={targetPos}
        controlsRef={controlsRef}
      />
    </Canvas>
  );
}
