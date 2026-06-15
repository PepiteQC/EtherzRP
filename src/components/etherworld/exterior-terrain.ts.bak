'use client'

/**
 * exterior-terrain.tsx — Terrain extérieur visible par les fenêtres
 *
 * Fichier reconstruit (il était importé par EtherWorldRoom.tsx mais absent du repo).
 *
 * Exports:
 *  - TerrainGround     : sol avec texture procédurale herbe/terre
 *  - TerrainSky        : dôme de ciel nocturne avec étoiles
 *  - Clouds            : nuages volumétriques low-poly animés
 *  - SunMoon           : lune avec halo lumineux
 *  - Mountains         : chaîne de montagnes Laurentides
 *  - Vegetation        : sapins et arbustes instanciés
 *  - Water             : ✨ EAU FLUIDE ANIMÉE — shader procédural avec vagues,
 *                        reflets spéculaires, transparence et fresnel
 *  - Rocks             : rochers dispersés
 *  - Pathway           : sentier de pierre
 *  - ExteriorLighting  : éclairage lunaire extérieur
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ════════════════════════════════════════════════════════════════════════════
// TEXTURES PROCÉDURALES (canvas — aucun fichier image requis)
// ════════════════════════════════════════════════════════════════════════════

function makeCanvasTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, s: number) => void,
  repeat: [number, number] = [1, 1]
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  draw(ctx, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat[0], repeat[1])
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function useGrassTexture() {
  return useMemo(
    () =>
      makeCanvasTexture(
        256,
        (ctx, s) => {
          // Base vert sombre nocturne
          ctx.fillStyle = '#1a2e1a'
          ctx.fillRect(0, 0, s, s)
          // Variations de brins d'herbe
          for (let i = 0; i < 4000; i++) {
            const x = Math.random() * s
            const y = Math.random() * s
            const shade = 20 + Math.random() * 40
            ctx.fillStyle = `rgb(${shade * 0.5}, ${shade + 10}, ${shade * 0.45})`
            ctx.fillRect(x, y, 1.5, 1 + Math.random() * 3)
          }
          // Taches de terre
          for (let i = 0; i < 25; i++) {
            const x = Math.random() * s
            const y = Math.random() * s
            const r = 4 + Math.random() * 14
            const g = ctx.createRadialGradient(x, y, 0, x, y, r)
            g.addColorStop(0, 'rgba(58, 44, 30, 0.55)')
            g.addColorStop(1, 'rgba(58, 44, 30, 0)')
            ctx.fillStyle = g
            ctx.beginPath()
            ctx.arc(x, y, r, 0, Math.PI * 2)
            ctx.fill()
          }
        },
        [24, 24]
      ),
    []
  )
}

function useRockTexture() {
  return useMemo(
    () =>
      makeCanvasTexture(128, (ctx, s) => {
        ctx.fillStyle = '#4a4a52'
        ctx.fillRect(0, 0, s, s)
        for (let i = 0; i < 1200; i++) {
          const shade = 55 + Math.random() * 45
          ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 6})`
          ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2)
        }
        // Fissures
        ctx.strokeStyle = 'rgba(20,20,25,0.5)'
        ctx.lineWidth = 1
        for (let i = 0; i < 8; i++) {
          ctx.beginPath()
          let x = Math.random() * s
          let y = Math.random() * s
          ctx.moveTo(x, y)
          for (let j = 0; j < 5; j++) {
            x += (Math.random() - 0.5) * 40
            y += (Math.random() - 0.5) * 40
            ctx.lineTo(x, y)
          }
          ctx.stroke()
        }
      }),
    []
  )
}

function useStonePathTexture() {
  return useMemo(
    () =>
      makeCanvasTexture(
        256,
        (ctx, s) => {
          ctx.fillStyle = '#2a2a30'
          ctx.fillRect(0, 0, s, s)
          // Dalles de pierre
          const cell = 64
          for (let cy = 0; cy < s / cell; cy++) {
            for (let cx = 0; cx < s / cell; cx++) {
              const shade = 60 + Math.random() * 30
              ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 8})`
              const pad = 4
              ctx.fillRect(cx * cell + pad, cy * cell + pad, cell - pad * 2, cell - pad * 2)
            }
          }
        },
        [1, 8]
      ),
    []
  )
}

// ════════════════════════════════════════════════════════════════════════════
// 💧 WATER — EAU FLUIDE ANIMÉE (shader procédural)
// Vagues de Gerstner simplifiées + fresnel + reflets spéculaires lunaires
// ════════════════════════════════════════════════════════════════════════════

const waterVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveSpeed;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vWave;

  // Somme de vagues sinusoïdales directionnelles (style Gerstner simplifié)
  float waveSum(vec2 p, float t) {
    float w = 0.0;
    w += sin(p.x * 0.8  + t * 1.10) * 0.45;
    w += sin(p.y * 1.1  + t * 0.90) * 0.30;
    w += sin((p.x + p.y) * 0.5 + t * 1.40) * 0.25;
    w += sin(length(p) * 0.7 - t * 1.8) * 0.18;
    w += sin(p.x * 2.3 - p.y * 1.7 + t * 2.2) * 0.08;
    return w;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    float t = uTime * uWaveSpeed;

    float wave = waveSum(pos.xy, t);
    pos.z += wave * uWaveHeight;
    vWave = wave;

    // Normale recalculée par différences finies (pour les reflets)
    float eps = 0.35;
    float wx = waveSum(pos.xy + vec2(eps, 0.0), t) - wave;
    float wy = waveSum(pos.xy + vec2(0.0, eps), t) - wave;
    vNormal = normalize(vec3(-wx * uWaveHeight / eps, -wy * uWaveHeight / eps, 1.0));

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const waterFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorDeep;
  uniform vec3 uColorShallow;
  uniform vec3 uMoonDir;
  uniform vec3 uMoonColor;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vWave;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 normal = normalize(vNormal);
    // Le plan est tourné -90° en X: la normale locale +Z pointe vers +Y monde
    vec3 worldNormal = normalize(vec3(normal.x, normal.z, -normal.y));

    // Couleur profondeur — mélange selon la hauteur de vague
    float depthMix = smoothstep(-1.0, 1.0, vWave);
    vec3 color = mix(uColorDeep, uColorShallow, depthMix * 0.6);

    // Fresnel — plus réfléchissant en angle rasant
    float fresnel = pow(1.0 - max(dot(viewDir, worldNormal), 0.0), 3.0);
    color += fresnel * vec3(0.10, 0.16, 0.24);

    // Reflet spéculaire de la lune
    vec3 halfDir = normalize(uMoonDir + viewDir);
    float spec = pow(max(dot(worldNormal, halfDir), 0.0), 90.0);
    color += uMoonColor * spec * 1.4;

    // Scintillement de surface (petites étincelles)
    float sparkle = sin(vUv.x * 320.0 + uTime * 3.0) * sin(vUv.y * 280.0 - uTime * 2.2);
    sparkle = pow(max(sparkle, 0.0), 24.0);
    color += vec3(0.55, 0.7, 0.85) * sparkle * 0.35;

    // Écume sur les crêtes
    float foam = smoothstep(0.85, 1.15, vWave);
    color = mix(color, vec3(0.75, 0.85, 0.92), foam * 0.30);

    gl_FragColor = vec4(color, uOpacity + fresnel * 0.15);
  }
`

interface WaterProps {
  position?: [number, number, number]
  size?: [number, number]
  waveHeight?: number
  waveSpeed?: number
  colorDeep?: string
  colorShallow?: string
  opacity?: number
}

export function Water({
  position = [-35, -0.45, -30],
  size = [55, 45],
  waveHeight = 0.22,
  waveSpeed = 0.9,
  colorDeep = '#0a2238',
  colorShallow = '#16486e',
  opacity = 0.86,
}: WaterProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWaveHeight: { value: waveHeight },
      uWaveSpeed: { value: waveSpeed },
      uColorDeep: { value: new THREE.Color(colorDeep) },
      uColorShallow: { value: new THREE.Color(colorShallow) },
      uMoonDir: { value: new THREE.Vector3(0.35, 0.8, 0.45).normalize() },
      uMoonColor: { value: new THREE.Color('#cdd8ee') },
      uOpacity: { value: opacity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <group position={position}>
      {/* Surface de l'eau — shader fluide animé */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0], size[1], 96, 96]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={waterVertexShader}
          fragmentShader={waterFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Fond du lac (sombre, sous la surface) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry args={[size[0], size[1]]} />
        <meshBasicMaterial color="#04101c" />
      </mesh>

      {/* Berge — anneau de sable/galets autour de l'eau */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[Math.min(size[0], size[1]) * 0.5, Math.min(size[0], size[1]) * 0.58, 48]} />
        <meshStandardMaterial color="#3a3528" roughness={1} />
      </mesh>
    </group>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TERRAIN GROUND — sol herbeux avec relief doux
// ════════════════════════════════════════════════════════════════════════════

export function TerrainGround({ size = 200 }: { size?: number }) {
  const grassTex = useGrassTexture()

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, 64, 64)
    const pos = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const dist = Math.sqrt(x * x + y * y)
      // Relief doux, plat près du centre (la chambre), vallonné au loin
      const falloff = THREE.MathUtils.smoothstep(dist, 18, size * 0.5)
      const h =
        (Math.sin(x * 0.06) * Math.cos(y * 0.05) * 1.6 +
          Math.sin(x * 0.13 + y * 0.11) * 0.8) *
        falloff
      pos.setZ(i, h)
    }
    geo.computeVertexNormals()
    return geo
  }, [size])

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <meshStandardMaterial map={grassTex} roughness={1} metalness={0} />
    </mesh>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TERRAIN SKY — dôme nocturne étoilé
// ════════════════════════════════════════════════════════════════════════════

export function TerrainSky() {
  const stars = useMemo(() => {
    const count = 1500
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // Distribution sur une demi-sphère
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 0.95) // au-dessus de l'horizon
      const r = 380
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi)
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      sizes[i] = Math.random()
    }
    return { positions, sizes }
  }, [])

  return (
    <group>
      {/* Dôme dégradé nuit */}
      <mesh>
        <sphereGeometry args={[400, 32, 24]} />
        <meshBasicMaterial color="#050510" side={THREE.BackSide} fog={false} />
      </mesh>
      {/* Étoiles */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={1.6} color="#cdd6f4" transparent opacity={0.9} sizeAttenuation fog={false} />
      </points>
    </group>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CLOUDS — nuages low-poly dérivants
// ════════════════════════════════════════════════════════════════════════════

export function Clouds({ count = 12 }: { count?: number }) {
  const groupRef = useRef<THREE.Group>(null)

  const clouds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() - 0.5) * 300,
        y: 45 + Math.random() * 30,
        z: (Math.random() - 0.5) * 300,
        scale: 4 + Math.random() * 8,
        speed: 0.3 + Math.random() * 0.5,
        puffs: 3 + Math.floor(Math.random() * 3),
        seed: i * 13.7,
      })),
    [count]
  )

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.children.forEach((cloud, i) => {
      const c = clouds[i]
      cloud.position.x = c.x + ((t * c.speed * 2) % 320) - 160
    })
  })

  return (
    <group ref={groupRef}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.scale}>
          {Array.from({ length: c.puffs }, (_, j) => (
            <mesh key={j} position={[j * 0.8 - (c.puffs * 0.4), Math.sin(c.seed + j) * 0.2, Math.cos(c.seed + j * 2) * 0.3]}>
              <sphereGeometry args={[0.6 + (j % 2) * 0.3, 7, 6]} />
              <meshStandardMaterial color="#2a2a3a" transparent opacity={0.55} flatShading fog={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUN/MOON — lune avec halo
// ════════════════════════════════════════════════════════════════════════════

export function SunMoon() {
  const moonRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (moonRef.current) {
      // Très lente dérive de la lune
      const t = state.clock.elapsedTime * 0.004
      moonRef.current.position.x = 90 + Math.sin(t) * 30
      moonRef.current.position.y = 110 + Math.cos(t) * 12
    }
  })

  return (
    <group ref={moonRef} position={[90, 110, -140]}>
      {/* Lune */}
      <mesh>
        <sphereGeometry args={[9, 24, 24]} />
        <meshBasicMaterial color="#e8ecf5" fog={false} />
      </mesh>
      {/* Halo */}
      <mesh>
        <sphereGeometry args={[13, 24, 24]} />
        <meshBasicMaterial color="#8a93b5" transparent opacity={0.18} fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[20, 24, 24]} />
        <meshBasicMaterial color="#5a6285" transparent opacity={0.08} fog={false} />
      </mesh>
      {/* Lumière lunaire */}
      <pointLight color="#aab4d4" intensity={0.6} distance={500} decay={0.5} />
    </group>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MOUNTAINS — chaîne des Laurentides
// ════════════════════════════════════════════════════════════════════════════

export function Mountains({ count = 10 }: { count?: number }) {
  const mountains = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + 0.3
        const dist = 130 + Math.random() * 60
        return {
          x: Math.cos(angle) * dist,
          z: Math.sin(angle) * dist,
          height: 28 + Math.random() * 40,
          radius: 22 + Math.random() * 26,
          color: ['#15192a', '#1a1f33', '#10141f'][i % 3],
          rotation: Math.random() * Math.PI,
        }
      }),
    [count]
  )

  return (
    <group>
      {mountains.map((m, i) => (
        <group key={i} position={[m.x, -0.5, m.z]} rotation={[0, m.rotation, 0]}>
          <mesh>
            <coneGeometry args={[m.radius, m.height, 6]} />
            <meshStandardMaterial color={m.color} flatShading roughness={1} />
          </mesh>
          {/* Sommet enneigé */}
          <mesh position={[0, m.height * 0.38, 0]}>
            <coneGeometry args={[m.radius * 0.26, m.height * 0.25, 6]} />
            <meshStandardMaterial color="#3d4660" flatShading roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// VEGETATION — sapins boréals instanciés
// ════════════════════════════════════════════════════════════════════════════

export function Vegetation() {
  const trees = useMemo(() => {
    const arr: { x: number; z: number; scale: number; tilt: number }[] = []
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 25 + Math.random() * 70
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist
      // Éviter le lac (autour de -35, -30)
      const dLake = Math.sqrt((x + 35) ** 2 + (z + 30) ** 2)
      if (dLake < 32) continue
      arr.push({ x, z, scale: 0.7 + Math.random() * 1.6, tilt: (Math.random() - 0.5) * 0.08 })
    }
    return arr
  }, [])

  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, -0.5, t.z]} scale={t.scale} rotation={[t.tilt, 0, t.tilt]}>
          {/* Tronc */}
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.2, 2, 5]} />
            <meshStandardMaterial color="#241a12" roughness={1} />
          </mesh>
          {/* Étages de sapin */}
          {[0, 1, 2].map((lvl) => (
            <mesh key={lvl} position={[0, 2 + lvl * 1.1, 0]} castShadow>
              <coneGeometry args={[1.5 - lvl * 0.38, 1.7, 7]} />
              <meshStandardMaterial color={lvl % 2 === 0 ? '#13261a' : '#0f2015'} flatShading roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ROCKS — rochers dispersés
// ════════════════════════════════════════════════════════════════════════════

export function Rocks() {
  const rockTex = useRockTexture()

  const rocks = useMemo(
    () =>
      Array.from({ length: 22 }, () => {
        const angle = Math.random() * Math.PI * 2
        const dist = 15 + Math.random() * 75
        return {
          x: Math.cos(angle) * dist,
          z: Math.sin(angle) * dist,
          scale: 0.4 + Math.random() * 1.8,
          rotY: Math.random() * Math.PI,
          rotZ: (Math.random() - 0.5) * 0.4,
          flat: 0.5 + Math.random() * 0.5,
        }
      }),
    []
  )

  return (
    <group>
      {rocks.map((r, i) => (
        <mesh
          key={i}
          position={[r.x, -0.4 + r.scale * 0.25, r.z]}
          rotation={[0, r.rotY, r.rotZ]}
          scale={[r.scale, r.scale * r.flat, r.scale]}
          castShadow
        >
          <dodecahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial map={rockTex} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PATHWAY — sentier de pierre menant au lac
// ════════════════════════════════════════════════════════════════════════════

export function Pathway() {
  const stoneTex = useStonePathTexture()

  // Dalles le long d'une courbe douce du bâtiment vers le lac
  const slabs = useMemo(() => {
    const arr: { x: number; z: number; rot: number }[] = []
    const steps = 16
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const x = -8 - t * 24 + Math.sin(t * Math.PI * 1.5) * 3
      const z = -10 - t * 16
      arr.push({ x, z, rot: Math.atan2(-16, -24 + Math.cos(t * Math.PI * 1.5) * 4.5) })
    }
    return arr
  }, [])

  return (
    <group>
      {slabs.map((s, i) => (
        <mesh key={i} position={[s.x, -0.46, s.z]} rotation={[-Math.PI / 2, 0, s.rot + (i % 3) * 0.1]} receiveShadow>
          <circleGeometry args={[0.9 + (i % 2) * 0.2, 7]} />
          <meshStandardMaterial map={stoneTex} color="#6a6a75" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EXTERIOR LIGHTING — éclairage lunaire bleuté
// ════════════════════════════════════════════════════════════════════════════

export function ExteriorLighting() {
  return (
    <group>
      {/* Lumière lunaire principale */}
      <directionalLight
        position={[90, 110, -140]}
        intensity={0.35}
        color="#8a96c0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={400}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      {/* Ambiance nocturne */}
      <hemisphereLight args={['#1a2040', '#0a0c14', 0.25]} />
    </group>
  )
}
