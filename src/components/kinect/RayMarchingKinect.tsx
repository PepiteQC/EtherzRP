'use client';

import React, { useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useControls, Leva } from 'leva';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';

/**
 * React Three Fiber Ray Marching — Kinect-style Depth Visualization
 * 
 * Replaces/augments traditional point cloud with volumetric ray marching.
 * Creates beautiful, organic, moving 3D forms from "depth" data (procedural + animated SDF).
 * 
 * Matches the described app:
 * - Full-screen canvas
 * - Real-time interactive controls (Leva)
 * - Near/far clipping, point size (adapted to volume density), z-offset, circle radius
 * - Seamless looping organic animation
 * - Clean minimal design
 * 
 * Controls:
 * - near / far : clipping planes (like Kinect depth range)
 * - pointSize / density : controls "cloudiness"
 * - zOffset : push/pull the volume
 * - radius : size of the main organic form
 * - steps : ray march quality (higher = slower but prettier)
 * - speed : animation speed of the organic movement
 * - color : base tint
 */

interface RayMarchProps {
  near?: number;
  far?: number;
  density?: number;
  radius?: number;
  zOffset?: number;
  steps?: number;
  speed?: number;
  color?: string;
}

function RayMarchShader({ 
  near = 0.1, 
  far = 8.0, 
  density = 0.6, 
  radius = 1.8, 
  zOffset = 0.0, 
  steps = 64, 
  speed = 0.8,
  color = '#a5f3fc'
}: RayMarchProps) {
  const { gl } = useThree();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uNear: { value: near },
    uFar: { value: far },
    uDensity: { value: density },
    uRadius: { value: radius },
    uZOffset: { value: zOffset },
    uSteps: { value: steps },
    uSpeed: { value: speed },
    uColor: { value: new THREE.Color(color) },
    uResolution: { value: new THREE.Vector2(1, 1) },
  }), []);

  // Update uniforms when controls change
  React.useEffect(() => {
    uniforms.uNear.value = near;
    uniforms.uFar.value = far;
    uniforms.uDensity.value = density;
    uniforms.uRadius.value = radius;
    uniforms.uZOffset.value = zOffset;
    uniforms.uSteps.value = steps;
    uniforms.uSpeed.value = speed;
    uniforms.uColor.value.set(color);
  }, [near, far, density, radius, zOffset, steps, speed, color, uniforms]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uNear;
        uniform float uFar;
        uniform float uDensity;
        uniform float uRadius;
        uniform float uZOffset;
        uniform int uSteps;
        uniform float uSpeed;
        uniform vec3 uColor;
        uniform vec2 uResolution;

        varying vec2 vUv;

        // Simple hash for organic noise
        float hash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(
              mix(hash(i), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x),
              f.y
            ),
            mix(
              mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x),
              f.y
            ),
            f.z
          );
        }

        // Organic SDF — multiple moving soft spheres + noise (Kinect "depth" feel)
        float organicSDF(vec3 p) {
          vec3 q = p;
          q.z += uZOffset;

          // Main central blob
          float d = length(q) - uRadius;

          // Secondary moving blobs for organic life
          vec3 p2 = q + vec3(
            sin(uTime * uSpeed * 0.7) * 0.9,
            cos(uTime * uSpeed * 0.9) * 0.7,
            sin(uTime * uSpeed * 1.1) * 0.6
          );
          float d2 = length(p2) - uRadius * 0.65;

          vec3 p3 = q + vec3(
            cos(uTime * uSpeed * 0.5 + 2.0) * 1.1,
            sin(uTime * uSpeed * 0.6) * 0.85,
            cos(uTime * uSpeed * 0.8) * 0.55
          );
          float d3 = length(p3) - uRadius * 0.55;

          // Combine with smooth min for soft organic union
          float k = 0.9;
          float h = max(k - abs(d - d2), 0.0);
          float d12 = min(d, d2) - h * h / (4.0 * k);

          h = max(k - abs(d12 - d3), 0.0);
          float d123 = min(d12, d3) - h * h / (4.0 * k);

          // Add some "depth noise" like Kinect grain / organic surface
          float n = noise(q * 2.3 + uTime * 0.4) * 0.35;
          float n2 = noise(q * 4.1 - uTime * 0.3) * 0.18;

          return d123 + n + n2 * 0.6;
        }

        // Ray marching
        float rayMarch(vec3 ro, vec3 rd, out float depth) {
          float t = uNear;
          float total = 0.0;
          depth = uFar;

          for (int i = 0; i < 128; i++) {
            if (i >= uSteps) break;

            vec3 p = ro + rd * t;
            float d = organicSDF(p);

            if (d < 0.001) {
              depth = t;
              return 1.0; // hit
            }

            // Accumulate for volume (soft "point cloud" density)
            total += max(0.0, -d) * uDensity * 0.08;

            t += max(0.02, d * 0.6); // adaptive step

            if (t > uFar) break;
          }

          depth = t;
          return total;
        }

        void main() {
          vec2 uv = (vUv - 0.5) * 2.0;
          uv.x *= uResolution.x / uResolution.y;

          // Camera / ray origin
          vec3 ro = vec3(0.0, 0.0, -4.5);
          vec3 rd = normalize(vec3(uv, 1.8));

          float depth;
          float alpha = rayMarch(ro, rd, depth);

          // Depth-based shading (like Kinect)
          float depthFactor = 1.0 - smoothstep(uNear, uFar, depth);
          vec3 col = uColor * (0.6 + depthFactor * 0.8);

          // Soft volumetric "fog" feel + organic edges
          float fog = exp(-depth * 0.12);
          col *= fog;

          // Add subtle "point cloud" speckle using noise
          float speckle = noise(rd * 28.0 + uTime * 0.2) * 0.15;
          col += speckle * uDensity * 0.4;

          // Final composite
          vec3 final = mix(vec3(0.02, 0.03, 0.05), col, clamp(alpha * 1.6, 0.0, 1.0));

          gl_FragColor = vec4(final, clamp(alpha * 1.15, 0.0, 1.0));
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
  }, []);

  // Keep resolution in sync
  useFrame((state) => {
    const { size } = state;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export default function RayMarchingKinect() {
  // Leva controls — exactly matching the original app's parameters + ray marching extras
  const controls = useControls('Kinect Ray Marching', {
    near: { value: 0.1, min: 0.01, max: 3, step: 0.01 },
    far: { value: 9.0, min: 2, max: 20, step: 0.1 },
    density: { value: 0.65, min: 0.1, max: 2.0, step: 0.01, label: 'pointSize / density' },
    radius: { value: 1.85, min: 0.5, max: 4.0, step: 0.05, label: 'circle radius' },
    zOffset: { value: 0.0, min: -3, max: 3, step: 0.05 },
    steps: { value: 64, min: 16, max: 128, step: 1, label: 'march quality' },
    speed: { value: 0.85, min: 0.1, max: 3.0, step: 0.05 },
    color: { value: '#67f6ff' },
  });

  return (
    <div className="relative w-full h-full bg-black">
      <Canvas
        camera={{ position: [0, 0, 0], fov: 70 }}
        style={{ background: '#05070a' }}
        gl={{ 
          alpha: true, 
          antialias: true, 
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0
        }}
      >
        <RayMarchShader 
          near={controls.near}
          far={controls.far}
          density={controls.density}
          radius={controls.radius}
          zOffset={controls.zOffset}
          steps={controls.steps}
          speed={controls.speed}
          color={controls.color}
        />
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          enableRotate={true}
          minDistance={1}
          maxDistance={12}
        />
      </Canvas>

      {/* Minimal overlay UI matching the described app */}
      <div className="absolute top-4 left-4 z-50 pointer-events-auto">
        <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded font-mono tracking-widest border border-white/20">
          KINECT DEPTH • RAY MARCHING
        </div>
        <a 
          href="https://github.com/kinect/kinect-examples" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block mt-1 text-[10px] text-cyan-400 hover:text-white underline"
        >
          original kinect example →
        </a>
      </div>

      <Leva 
        collapsed={{ collapsed: false, hidden: false }} 
        titleBar={{ title: 'Controls' }}
      />
    </div>
  );
}
