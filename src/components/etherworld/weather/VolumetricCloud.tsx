import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js'

interface VolumetricCloudProps {
  position?: [number, number, number]
  scale?: [number, number, number]
  baseColor?: string | number
  threshold?: number
  opacity?: number
  range?: number
  steps?: number
  resolution?: number
  speed?: number
}

const vertexShader = /* glsl */`
  in vec3 position;

  uniform mat4 modelMatrix;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform vec3 cameraPos;

  out vec3 vOrigin;
  out vec3 vDirection;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vOrigin = vec3( inverse( modelMatrix ) * vec4( cameraPos, 1.0 ) ).xyz;
    vDirection = position - vOrigin;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */`
  precision highp float;
  precision highp sampler3D;

  in vec3 vOrigin;
  in vec3 vDirection;
  out vec4 color;

  uniform vec3 base;
  uniform sampler3D map;
  uniform float threshold;
  uniform float range;
  uniform float opacity;
  uniform float steps;
  uniform float frame;

  uint wang_hash(uint seed) {
    seed = (seed ^ 61u) ^ (seed >> 16u);
    seed *= 9u;
    seed = seed ^ (seed >> 4u);
    seed *= 0x27d4eb2du;
    seed = seed ^ (seed >> 15u);
    return seed;
  }

  float randomFloat(inout uint seed) {
    return float(wang_hash(seed)) / 4294967296.;
  }

  vec2 hitBox(vec3 orig, vec3 dir) {
    const vec3 box_min = vec3(-0.5);
    const vec3 box_max = vec3(0.5);
    vec3 inv_dir = 1.0 / dir;
    vec3 tmin_tmp = (box_min - orig) * inv_dir;
    vec3 tmax_tmp = (box_max - orig) * inv_dir;
    vec3 tmin = min(tmin_tmp, tmax_tmp);
    vec3 tmax = max(tmin_tmp, tmax_tmp);
    float t0 = max(tmin.x, max(tmin.y, tmin.z));
    float t1 = min(tmax.x, min(tmax.y, tmax.z));
    return vec2(t0, t1);
  }

  float sample1(vec3 p) {
    return texture(map, p).r;
  }

  float shading(vec3 coord) {
    float stepSize = 0.01;
    return sample1(coord + vec3(-stepSize)) - sample1(coord + vec3(stepSize));
  }

  vec4 linearToSRGB(in vec4 value) {
    return vec4(
      mix(
        pow(value.rgb, vec3(0.41666)) * 1.055 - vec3(0.055),
        value.rgb * 12.92,
        vec3(lessThanEqual(value.rgb, vec3(0.0031308)))
      ),
      value.a
    );
  }

  void main() {
    vec3 rayDir = normalize(vDirection);
    vec2 bounds = hitBox(vOrigin, rayDir);
    if (bounds.x > bounds.y) discard;
    bounds.x = max(bounds.x, 0.0);

    float stepSize = (bounds.y - bounds.x) / steps;

    uint seed = uint(gl_FragCoord.x) * uint(1973) + uint(gl_FragCoord.y) * uint(9277) + uint(frame) * uint(26699);
    vec3 size = vec3(textureSize(map, 0));
    float randNum = randomFloat(seed) * 2.0 - 1.0;

    vec3 p = vOrigin + bounds.x * rayDir;
    p += rayDir * randNum * (1.0 / size);

    vec4 ac = vec4(base, 0.0);

    for (float i = 0.0; i < 220.0; i += 1.0) {
      if (i >= steps) break;

      float d = sample1(p + 0.5);
      d = smoothstep(threshold - range, threshold + range, d) * opacity;

      float col = shading(p + 0.5) * 3.0 + ((p.x + p.y) * 0.25) + 0.32;
      ac.rgb += (1.0 - ac.a) * d * col;
      ac.a += (1.0 - ac.a) * d;

      if (ac.a >= 0.95) break;
      p += rayDir * stepSize;
    }

    color = linearToSRGB(ac);
    if (color.a <= 0.01) discard;
  }
`

function createCloudTexture(size: number) {
  const data = new Uint8Array(size * size * size)
  const perlin = new ImprovedNoise()
  const vector = new THREE.Vector3()
  const scale = 0.055
  let i = 0

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const d = 1.0 - vector
          .set(x, y, z)
          .subScalar(size / 2)
          .divideScalar(size)
          .length()

        const n1 = perlin.noise(x * scale / 1.45, y * scale, z * scale / 1.45)
        const n2 = perlin.noise(x * scale * 2.2, y * scale * 1.8, z * scale * 2.2) * 0.35
        data[i] = Math.max(0, Math.min(255, (128 + 128 * (n1 + n2)) * d * d))
        i++
      }
    }
  }

  const texture = new THREE.Data3DTexture(data, size, size, size)
  texture.format = THREE.RedFormat
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.unpackAlignment = 1
  texture.needsUpdate = true
  return texture
}

export default function VolumetricCloud({
  position = [0, 95, -420],
  scale = [260, 86, 170],
  baseColor = '#d8e1ec',
  threshold = 0.26,
  opacity = 0.2,
  range = 0.12,
  steps = 72,
  resolution = 64,
  speed = 0.045,
}: VolumetricCloudProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const { camera } = useThree()

  const material = useMemo(() => {
    const texture = createCloudTexture(resolution)
    return new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        base: { value: new THREE.Color(baseColor) },
        map: { value: texture },
        cameraPos: { value: new THREE.Vector3() },
        threshold: { value: threshold },
        opacity: { value: opacity },
        range: { value: range },
        steps: { value: steps },
        frame: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    })
  }, [baseColor, opacity, range, resolution, steps, threshold])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    material.uniforms.cameraPos.value.copy(camera.position)
    material.uniforms.frame.value += 1
    meshRef.current.rotation.y -= delta * speed
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale} material={material} renderOrder={-2}>
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  )
}
