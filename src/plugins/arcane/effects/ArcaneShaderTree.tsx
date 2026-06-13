import { memo, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { installArcaneTreeWindowApi, subscribeArcaneTreeExplosion } from '../events/ArcaneTreeEvents'

const leavesVS = /* glsl */ `
  uniform sampler2D uNoiseMap;
  uniform vec3 uBoxMin;
  uniform vec3 uBoxSize;
  uniform vec3 uRaycast;
  uniform float uTime;
  uniform float uPointerStrength;
  uniform float uArcanePulse;

  varying vec3 vObjectPos;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying float vCloseToGround;
  varying float vPointerInfluence;

  vec4 getTriplanar(sampler2D tex, vec3 p){
    vec4 xPixel = texture2D(tex, (p.xy + uTime * 0.08) / 2.8);
    vec4 yPixel = texture2D(tex, (p.yz + uTime * 0.08) / 2.8);
    vec4 zPixel = texture2D(tex, (p.zx + uTime * 0.08) / 2.8);
    return (xPixel + yPixel + zPixel) / 3.0;
  }

  void main(){
    mat4 mouseDisplace = mat4(1.0);

    vec3 instancePos = instanceMatrix[3].xyz;
    vec4 worldBase = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vCloseToGround = clamp(worldBase.y, 0.0, 1.0);

    float distanceToPointer = distance(uRaycast, (modelMatrix * vec4(instancePos, 1.0)).xyz);
    float offset = clamp(1.25 - distanceToPointer, 0.0, 1.25);
    offset = pow(offset, 1.35) * uPointerStrength * vCloseToGround;
    vPointerInfluence = offset;

    vec3 pushDir = normalize(vec3(0.35, 0.18, 0.55));
    mouseDisplace[3].xyz = pushDir * offset;

    vec3 normalizedObject = ((worldBase.xyz - uBoxMin) * 2.0) / max(uBoxSize, vec3(0.0001)) - vec3(1.0);
    vObjectPos = normalizedObject;

    vec4 noiseOffset = getTriplanar(uNoiseMap, normalizedObject);
    vec3 wind = (noiseOffset.xyz - 0.5) * 0.13 * vCloseToGround;
    wind.x += sin(uTime * 1.8 + instancePos.y * 2.0) * 0.035 * vCloseToGround;
    wind.z += cos(uTime * 1.4 + instancePos.x * 2.0) * 0.035 * vCloseToGround;
    wind.y += sin(uTime * 3.0 + instancePos.z) * 0.015 * uArcanePulse;

    vec4 newPos = instanceMatrix * mouseDisplace * vec4(position, 1.0);
    newPos.xyz += wind;

    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * mat3(mouseDisplace) * normal);
    vWorldNormal = normalize((modelMatrix * instanceMatrix * mouseDisplace * vec4(normal, 0.0)).xyz);

    gl_Position = projectionMatrix * modelViewMatrix * newPos;
  }
`

const leavesFS = /* glsl */ `
  #include <common>
  #include <lights_pars_begin>

  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uArcaneColor;
  uniform float uTime;
  uniform float uArcanePulse;

  varying vec3 vObjectPos;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying float vCloseToGround;
  varying float vPointerInfluence;

  vec3 mix3(vec3 a, vec3 b, vec3 c, float f){
    return f > 0.55 ? mix(b, c, smoothstep(0.55, 1.0, f)) : mix(a, b, smoothstep(0.0, 0.55, f));
  }

  float getPosColors(){
    float p = smoothstep(0.15, 0.95, distance(vec3(0.0), vObjectPos));
    p *= (-(vWorldNormal.y / 2.0) + 0.5) * (-vObjectPos.y / 7.0 + 0.55);
    return clamp(p, 0.0, 1.0);
  }

  float getDiffuse(){
    float intensity = 0.0;
    #if NUM_DIR_LIGHTS > 0
      for(int i = 0; i < NUM_DIR_LIGHTS; i++){
        float d = dot(directionalLights[i].direction, normalize(vNormal));
        intensity += smoothstep(0.25, 1.0, d) * 0.75;
      }
    #endif
    return clamp(intensity, 0.0, 1.0);
  }

  void main(){
    float gradMap = (getPosColors() * 0.72 + getDiffuse() * 0.45) * vCloseToGround;
    vec3 base = mix3(uColorA, uColorB, uColorC, gradMap);

    float arcaneWave = 0.5 + 0.5 * sin(uTime * 4.0 + vObjectPos.x * 8.0 + vObjectPos.z * 6.0);
    float arcaneMask = smoothstep(0.18, 1.1, vPointerInfluence + uArcanePulse * 0.18 * arcaneWave);
    vec3 finalColor = mix(base, uArcaneColor, arcaneMask * 0.58);

    gl_FragColor = vec4(pow(finalColor, vec3(0.454545)), 1.0);
  }
`

interface ArcaneShaderTreeProps {
  position?: [number, number, number]
  scale?: number
  leafCount?: number
  autoShed?: boolean
  arcanePulse?: number
  colors?: {
    a?: string | number
    b?: string | number
    c?: string | number
    arcane?: string | number
  }
}

function createNoiseTexture(size = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255)
    img.data[i] = v
    img.data[i + 1] = Math.floor((v + Math.random() * 80) % 255)
    img.data[i + 2] = Math.floor((255 - v + Math.random() * 40) % 255)
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.needsUpdate = true
  return tex
}

function createLeafGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0.18)
  shape.bezierCurveTo(0.18, 0.08, 0.16, -0.18, 0, -0.28)
  shape.bezierCurveTo(-0.16, -0.18, -0.18, 0.08, 0, 0.18)
  const geo = new THREE.ShapeGeometry(shape, 6)
  geo.computeVertexNormals()
  return geo
}

function randomCrownPoint(i: number, count: number) {
  const golden = Math.PI * (3 - Math.sqrt(5))
  const y = 1 - (i / Math.max(1, count - 1)) * 2
  const radius = Math.sqrt(1 - y * y)
  const theta = golden * i
  const x = Math.cos(theta) * radius
  const z = Math.sin(theta) * radius
  const squashY = 0.82 + Math.random() * 0.25
  return new THREE.Vector3(x * 1.35, y * squashY + 2.2, z * 1.35)
}

export const ArcaneShaderTree = memo(function ArcaneShaderTree({
  position = [0, 0, 0],
  scale = 1,
  leafCount = 620,
  autoShed = true,
  arcanePulse = 0.0,
  colors,
}: ArcaneShaderTreeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const leavesRef = useRef<THREE.InstancedMesh>(null)
  const pixelRef = useRef<THREE.InstancedMesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const matrix = useMemo(() => new THREE.Matrix4(), [])
  const deadIds = useRef<number[]>([])
  const raycastTarget = useRef(new THREE.Vector3(999, 999, 999))
  const pixelLife = useRef(0)
  const pixelVelocities = useRef<THREE.Vector3[]>([])
  const pixelPositions = useRef<THREE.Vector3[]>([])
  const exploded = useRef(false)

  const leafGeometry = useMemo(() => createLeafGeometry(), [])
  const pixelGeometry = useMemo(() => new THREE.BoxGeometry(0.045, 0.045, 0.045), [])
  const pixelMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: colors?.arcane ?? 0x58e6ff, transparent: true, opacity: 0.0 }), [colors?.arcane])
  const noiseMap = useMemo(() => createNoiseTexture(), [])

  const uniforms = useMemo(() => THREE.UniformsUtils.merge([
    THREE.UniformsLib.lights,
    {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(colors?.a ?? 0x7f3b3b) },
      uColorB: { value: new THREE.Color(colors?.b ?? 0xd39a55) },
      uColorC: { value: new THREE.Color(colors?.c ?? 0xf2df9b) },
      uArcaneColor: { value: new THREE.Color(colors?.arcane ?? 0x58e6ff) },
      uBoxMin: { value: new THREE.Vector3(-2, 0, -2) },
      uBoxSize: { value: new THREE.Vector3(4, 4, 4) },
      uRaycast: { value: new THREE.Vector3(999, 999, 999) },
      uNoiseMap: { value: noiseMap },
      uPointerStrength: { value: 1.0 },
      uArcanePulse: { value: arcanePulse },
    },
  ]), [arcanePulse, colors?.a, colors?.arcane, colors?.b, colors?.c, noiseMap])

  const leavesMaterial = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      lights: true,
      side: THREE.DoubleSide,
      uniforms,
      vertexShader: leavesVS,
      fragmentShader: leavesFS,
    })
    materialRef.current = mat
    return mat
  }, [uniforms])

  const leafSeeds = useMemo(() => {
    const seeds: Array<{ p: THREE.Vector3; n: THREE.Vector3; s: number }> = []
    const bbox = new THREE.Box3()
    for (let i = 0; i < leafCount; i++) {
      const p = randomCrownPoint(i, leafCount)
      p.x += (Math.random() - 0.5) * 0.34
      p.y += (Math.random() - 0.5) * 0.28
      p.z += (Math.random() - 0.5) * 0.34
      const n = p.clone().sub(new THREE.Vector3(0, 1.95, 0)).normalize()
      const s = 0.78 + Math.random() * 0.42
      seeds.push({ p, n, s })
      bbox.expandByPoint(p)
    }
    uniforms.uBoxMin.value.copy(bbox.min)
    uniforms.uBoxSize.value.copy(bbox.getSize(new THREE.Vector3()))
    return seeds
  }, [leafCount, uniforms])

  useEffect(() => {
    installArcaneTreeWindowApi()
    return subscribeArcaneTreeExplosion((payload) => {
      if (!groupRef.current) return
      const worldPos = new THREE.Vector3()
      groupRef.current.getWorldPosition(worldPos)
      const impact = new THREE.Vector3(...payload.position)
      const distance = worldPos.distanceTo(impact)
      if (distance > payload.radius) return

      const strength = Math.max(0.15, 1.0 - distance / Math.max(0.001, payload.radius)) * payload.intensity
      exploded.current = true
      pixelLife.current = 1.0

      if (materialRef.current) {
        materialRef.current.uniforms.uArcanePulse.value = Math.max(materialRef.current.uniforms.uArcanePulse.value, 1.8 * strength)
        materialRef.current.uniforms.uRaycast.value.copy(impact)
      }

      const pixelMesh = pixelRef.current
      if (pixelMesh) {
        pixelMesh.visible = true
        pixelVelocities.current = []
        pixelPositions.current = []
        const max = Math.min(leafSeeds.length, pixelMesh.count)
        for (let i = 0; i < max; i++) {
          const seed = leafSeeds[i]
          const p = seed.p.clone()
          const dir = p.clone().sub(new THREE.Vector3(0, 1.6, 0)).normalize()
          dir.x += (Math.random() - 0.5) * 0.8
          dir.y += 0.65 + Math.random() * 0.9
          dir.z += (Math.random() - 0.5) * 0.8
          dir.normalize().multiplyScalar((1.8 + Math.random() * 4.8) * strength)
          pixelPositions.current[i] = p
          pixelVelocities.current[i] = dir
          dummy.position.copy(p)
          dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
          dummy.scale.setScalar(0.7 + Math.random() * 1.7)
          dummy.updateMatrix()
          pixelMesh.setMatrixAt(i, dummy.matrix)
        }
        pixelMesh.instanceMatrix.needsUpdate = true
        const mat = pixelMesh.material as THREE.MeshBasicMaterial
        mat.opacity = Math.min(1, 0.55 + strength * 0.35)
      }

      const amount = Math.min(leafSeeds.length, Math.floor(leafSeeds.length * Math.min(1, 0.35 + strength * 0.45)))
      for (let i = 0; i < amount; i++) deadIds.current.push(Math.floor(Math.random() * leafSeeds.length))
    })
  }, [dummy, leafSeeds])

  useEffect(() => {
    const mesh = leavesRef.current
    if (!mesh) return
    leafSeeds.forEach(({ p, n, s }, i) => {
      dummy.position.copy(p)
      dummy.lookAt(p.clone().add(n))
      dummy.rotation.z += Math.random() * Math.PI
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [dummy, leafSeeds])

  useEffect(() => {
    if (!autoShed) return
    let mounted = true
    const shed = () => {
      if (!mounted) return
      deadIds.current.push(Math.floor(Math.random() * leafCount))
      window.setTimeout(shed, 700 + Math.random() * 1600)
    }
    shed()
    return () => { mounted = false }
  }, [autoShed, leafCount])

  useFrame((_, delta) => {
    const mat = materialRef.current
    if (mat) {
      mat.uniforms.uTime.value += delta
      mat.uniforms.uRaycast.value.lerp(raycastTarget.current, 0.22)
      mat.uniforms.uArcanePulse.value = THREE.MathUtils.damp(mat.uniforms.uArcanePulse.value, arcanePulse, 2.5, delta)
    }

    const mesh = leavesRef.current
    if (mesh && deadIds.current.length > 0) {
      deadIds.current = deadIds.current.filter((id) => {
        mesh.getMatrixAt(id, matrix)
        matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
        if (dummy.position.y <= 0.06) return false
        dummy.position.y -= delta * (0.5 + Math.random() * 0.5)
        dummy.position.x += (Math.random() - 0.52) * delta * 0.45
        dummy.position.z += (Math.random() - 0.52) * delta * 0.45
        dummy.rotation.x += delta * 4.5
        dummy.rotation.z += delta * 2.5
        dummy.updateMatrix()
        mesh.setMatrixAt(id, dummy.matrix)
        return true
      })
      mesh.instanceMatrix.needsUpdate = true
    }

    const pixelMesh = pixelRef.current
    if (pixelMesh && pixelLife.current > 0) {
      pixelLife.current = Math.max(0, pixelLife.current - delta * 0.42)
      const mat = pixelMesh.material as THREE.MeshBasicMaterial
      mat.opacity = pixelLife.current * 0.9
      for (let i = 0; i < pixelMesh.count; i++) {
        const pos = pixelPositions.current[i]
        const vel = pixelVelocities.current[i]
        if (!pos || !vel) continue
        vel.y -= delta * 3.4
        pos.addScaledVector(vel, delta)
        dummy.position.copy(pos)
        dummy.rotation.set(pos.z * 2.0, pos.x * 1.7, pos.y * 1.1)
        dummy.scale.setScalar(Math.max(0.02, pixelLife.current) * (0.8 + (i % 5) * 0.14))
        dummy.updateMatrix()
        pixelMesh.setMatrixAt(i, dummy.matrix)
      }
      pixelMesh.instanceMatrix.needsUpdate = true
      if (pixelLife.current <= 0) pixelMesh.visible = false
    }
  })

  return (
    <group ref={groupRef} position={position} scale={scale} userData={{ type: 'arcane_shader_tree', mutableByArcane: true, explodeEvent: 'etherworld:arcane-tree-explode' }}>
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.32, 1.9, 9]} />
        <meshToonMaterial color="#5b3928" />
      </mesh>
      <mesh position={[0, 1.9, 0]} castShadow>
        <sphereGeometry args={[0.34, 9, 9]} />
        <meshToonMaterial color="#68452f" />
      </mesh>
      <instancedMesh
        ref={leavesRef}
        args={[leafGeometry, leavesMaterial, leafCount]}
        castShadow
        receiveShadow
        onPointerMove={(event) => {
          event.stopPropagation()
          raycastTarget.current.copy(event.point)
          const id = event.instanceId
          if (typeof id === 'number' && Math.random() > 0.76) deadIds.current.push(id)
        }}
        onPointerOut={() => raycastTarget.current.set(999, 999, 999)}
      />
      <instancedMesh
        ref={pixelRef}
        args={[pixelGeometry, pixelMaterial, Math.min(leafCount, 420)]}
        visible={false}
        frustumCulled={false}
        userData={{ type: 'arcane_tree_pixel_explosion' }}
      />
      <pointLight position={[0, 2.4, 0]} color={colors?.arcane ?? '#58e6ff'} intensity={0.25 + arcanePulse * 0.65 + pixelLife.current * 1.5} distance={7} />
    </group>
  )
})

export default ArcaneShaderTree
