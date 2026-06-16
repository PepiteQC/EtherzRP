import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Vec3 } from "../types";

type Props = {
  onPosition: (position: Vec3) => void;
};

export function PlayerController({ onPosition }: Props) {
  const bodyRef = useRef<RapierRigidBody | null>(null);
  const keys = useRef(new Set<string>());
  const grounded = useRef(false);
  const { camera } = useThree();

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current.add(event.code);
    };

    const up = (event: KeyboardEvent) => {
      keys.current.delete(event.code);
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame(() => {
    const body = bodyRef.current;
    if (!body) return;

    const translation = body.translation();
    const currentVel = body.linvel();

    const input = new THREE.Vector3();

    if (keys.current.has("KeyW") || keys.current.has("ArrowUp")) input.z -= 1;
    if (keys.current.has("KeyS") || keys.current.has("ArrowDown")) input.z += 1;
    if (keys.current.has("KeyA") || keys.current.has("ArrowLeft")) input.x -= 1;
    if (keys.current.has("KeyD") || keys.current.has("ArrowRight")) input.x += 1;

    const moveSpeed = keys.current.has("ShiftLeft") ? 9.2 : 6.2;
    const velocity = new THREE.Vector3(0, 0, 0);

    if (input.lengthSq() > 0) {
      input.normalize();

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      velocity.addScaledVector(forward, -input.z * moveSpeed);
      velocity.addScaledVector(right, input.x * moveSpeed);
    }

    if (keys.current.has("Space") && grounded.current) {
      body.setLinvel(
        {
          x: currentVel.x,
          y: 9.2,
          z: currentVel.z
        },
        true
      );

      grounded.current = false;
    } else {
      body.setLinvel(
        {
          x: velocity.x,
          y: currentVel.y,
          z: velocity.z
        },
        true
      );
    }

    camera.position.lerp(
      new THREE.Vector3(translation.x + 8, translation.y + 5.5, translation.z + 9),
      0.08
    );

    camera.lookAt(translation.x, translation.y + 1.0, translation.z);

    onPosition([
      Number(translation.x.toFixed(2)),
      Number(translation.y.toFixed(2)),
      Number(translation.z.toFixed(2))
    ]);
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[0, 3, 8]}
      colliders={false}
      mass={80}
      enabledRotations={[false, false, false]}
      friction={0.8}
      restitution={0}
      linearDamping={0.2}
      canSleep={false}
      onCollisionEnter={() => {
        grounded.current = true;
      }}
    >
      <CapsuleCollider args={[0.65, 0.35]} />

      <mesh castShadow>
        <capsuleGeometry args={[0.35, 1.3, 8, 16]} />
        <meshStandardMaterial
          color="#e9fbff"
          roughness={0.45}
          metalness={0.05}
          emissive="#0b3140"
          emissiveIntensity={0.35}
        />
      </mesh>
    </RigidBody>
  );
}
