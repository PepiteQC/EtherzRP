import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface VehicleSkidMarksApi {
  addMark: (position: THREE.Vector3, rotationY: number, intensity?: number) => void;
  clear: () => void;
}

interface MarkState {
  age: number;
  intensity: number;
}

const MAX_MARKS = 96;
const MARK_LIFETIME = 34;

const VehicleSkidMarks = forwardRef<VehicleSkidMarksApi>(function VehicleSkidMarks(_, ref) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const cursorRef = useRef(0);
  const markStates = useRef<MarkState[]>(
    Array.from({ length: MAX_MARKS }, () => ({ age: MARK_LIFETIME + 1, intensity: 0 }))
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useImperativeHandle(ref, () => ({
    addMark(position, rotationY, intensity = 1) {
      if (!meshRef.current) return;

      const idx = cursorRef.current;
      cursorRef.current = (cursorRef.current + 1) % MAX_MARKS;

      markStates.current[idx].age = 0;
      markStates.current[idx].intensity = THREE.MathUtils.clamp(intensity, 0.25, 1);

      dummy.position.set(position.x, 0.032, position.z);
      dummy.rotation.set(-Math.PI / 2, 0, rotationY);
      dummy.scale.set(0.18 + intensity * 0.08, 0.95 + intensity * 0.85, 1);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(idx, dummy.matrix);
      color.setScalar(0.02 + intensity * 0.035);
      meshRef.current.setColorAt(idx, color);
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    },
    clear() {
      if (!meshRef.current) return;
      for (let i = 0; i < MAX_MARKS; i++) {
        markStates.current[i].age = MARK_LIFETIME + 1;
        dummy.position.set(0, -1000, 0);
        dummy.scale.set(0.001, 0.001, 0.001);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    },
  }), [color, dummy]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    let changed = false;
    for (let i = 0; i < MAX_MARKS; i++) {
      const mark = markStates.current[i];
      if (mark.age <= MARK_LIFETIME) {
        mark.age += delta;
        const fade = Math.max(0, 1 - mark.age / MARK_LIFETIME);
        color.setScalar(0.015 + mark.intensity * 0.035 * fade);
        meshRef.current.setColorAt(i, color);
        changed = true;
      }
    }

    if (changed && meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_MARKS]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#050505" transparent opacity={0.55} depthWrite={false} />
    </instancedMesh>
  );
});

export default VehicleSkidMarks;
