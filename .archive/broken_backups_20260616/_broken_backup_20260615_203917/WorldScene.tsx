import { useFrame, useThree } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { EngineStats, PlatformObject } from "../types";

type Props = {
  platforms: PlatformObject[];
  selectedId: string | null;
  onSelectPlatform: (id: string | null) => void;
  onStats: (stats: EngineStats) => void;
};

export function WorldScene({ platforms, selectedId, onSelectPlatform, onStats }: Props) {
  const { gl, scene } = useThree();
  const lastStatsAt = useRef(0);
  const frames = useRef(0);

  useFrame((state) => {
    frames.current++;

    if (state.clock.elapsedTime - lastStatsAt.current >= 0.5) {
      const fps = Math.round(frames.current / (state.clock.elapsedTime - lastStatsAt.current));

      onStats({
        fps,
        objects: scene.children.length + platforms.length,
        triangles: gl.info.render.triangles,
        calls: gl.info.render.calls
      });

      frames.current = 0;
      lastStatsAt.current = state.clock.elapsedTime;
    }
  });

  const fogColor = useMemo(() => new THREE.Color("#08111f"), []);

  return (
    <>
      <color attach="background" args={["#08111f"]} />
      <fog attach="fog" args={[fogColor, 35, 120]} />

      <ambientLight intensity={0.45} />

      <directionalLight
        castShadow
        position={[14, 24, 10]}
        intensity={3}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <hemisphereLight intensity={0.65} groundColor="#151922" color="#bdefff" />

      <gridHelper args={[120, 120, "#1f6f8c", "#122838"]} />

      <RigidBody type="fixed" colliders={false}>
        <mesh receiveShadow position={[0, -0.1, 0]}>
          <boxGeometry args={[120, 0.2, 120]} />
          <meshStandardMaterial color="#111827" roughness={0.95} />
        </mesh>
        <CuboidCollider args={[60, 0.1, 60]} position={[0, -0.1, 0]} />
      </RigidBody>

      {platforms.map((platform) => (
        <PlatformMesh
          key={platform.id}
          platform={platform}
          selected={platform.id === selectedId}
          onSelect={() => onSelectPlatform(platform.id)}
        />
      ))}
    </>
  );
}

function PlatformMesh({
  platform,
  selected,
  onSelect
}: {
  platform: PlatformObject;
  selected: boolean;
  onSelect: () => void;
}) {
  const materialProps = {
    color: platform.color,
    roughness: platform.material === "metal" ? 0.38 : 0.82,
    metalness: platform.material === "metal" ? 0.75 : 0.03,
    emissive: selected ? "#123a4a" : "#000000",
    emissiveIntensity: selected ? 0.45 : 0
  };

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={platform.position}
      rotation={platform.rotation}
    >
      <mesh
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <boxGeometry args={platform.size} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      <CuboidCollider
        args={[
          platform.size[0] / 2,
          platform.size[1] / 2,
          platform.size[2] / 2
        ]}
      />

      {selected && (
        <mesh scale={[1.025, 1.04, 1.025]}>
          <boxGeometry args={platform.size} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.45} />
        </mesh>
      )}
    </RigidBody>
  );
}
