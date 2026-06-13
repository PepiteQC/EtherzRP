import * as THREE from 'three'
import type { MaterialDef, GeometryDef, ObjectCreatorConfig, ObjectPartDef } from './types'

const textureCache = new Map<string, THREE.CanvasTexture>()

function makeTexture(key: string) {
  if (textureCache.has(key)) return textureCache.get(key)!
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const noise = (x: number, y: number) => Math.sin(x * 0.07) * Math.cos(y * 0.09) + Math.sin(x * 0.17 + y * 0.11) * 0.45

  if (key === 'wood') {
    ctx.fillStyle = '#6b3a20'; ctx.fillRect(0, 0, size, size)
    for (let y = 0; y < size; y++) {
      const v = 0.8 + Math.sin(y * 0.12) * 0.16 + Math.sin(y * 0.035) * 0.1
      ctx.fillStyle = `rgb(${Math.floor(115 * v)},${Math.floor(70 * v)},${Math.floor(32 * v)})`
      ctx.fillRect(0, y, size, 1)
    }
  } else if (key === 'stone') {
    ctx.fillStyle = '#8a8070'; ctx.fillRect(0, 0, size, size)
    for (let x = 0; x < size; x += 2) for (let y = 0; y < size; y += 2) {
      const v = Math.floor(132 + noise(x, y) * 24)
      ctx.fillStyle = `rgb(${v},${v - 7},${v - 15})`; ctx.fillRect(x, y, 2, 2)
    }
  } else if (key === 'brick') {
    ctx.fillStyle = '#3a1d16'; ctx.fillRect(0, 0, size, size)
    const bw = 58, bh = 24, m = 4
    for (let row = 0; row * (bh + m) < size + bh; row++) {
      const off = row % 2 ? (bw + m) / 2 : 0
      for (let col = -1; col * (bw + m) < size + bw; col++) {
        const v = 0.92 + Math.sin(row * 17 + col * 11) * 0.12
        ctx.fillStyle = `rgb(${Math.floor(140 * v)},${Math.floor(58 * v)},${Math.floor(42 * v)})`
        ctx.fillRect(col * (bw + m) + off + m, row * (bh + m) + m, bw, bh)
      }
    }
  } else if (key === 'metal' || key === 'gold') {
    const grad = ctx.createLinearGradient(0, 0, size, size)
    if (key === 'gold') { grad.addColorStop(0, '#ffd700'); grad.addColorStop(0.5, '#b88a00'); grad.addColorStop(1, '#fff2a8') }
    else { grad.addColorStop(0, '#64748b'); grad.addColorStop(0.5, '#cbd5e1'); grad.addColorStop(1, '#334155') }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    for (let y = 0; y < size; y += 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y + Math.sin(y) * 6); ctx.stroke() }
  } else if (key === 'rubber') {
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    for (let x = 0; x < size; x += 12) for (let y = 0; y < size; y += 12) if ((x + y) % 24 === 0) ctx.fillRect(x, y, 6, 2)
  } else if (key === 'green') {
    ctx.fillStyle = '#14532d'; ctx.fillRect(0, 0, size, size)
    for (let x = 0; x < size; x += 2) for (let y = 0; y < size; y += 2) {
      const n = noise(x, y)
      ctx.fillStyle = `rgb(${Math.floor(20 + n * 8)},${Math.floor(95 + n * 25)},${Math.floor(45 + n * 14)})`
      ctx.fillRect(x, y, 2, 2)
    }
  } else {
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, size, size)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.needsUpdate = true
  textureCache.set(key, tex)
  return tex
}

export function createGeometry(def: GeometryDef): THREE.BufferGeometry {
  switch (def.type) {
    case 'sphere': return new THREE.SphereGeometry(def.args[0], def.args[1], def.args[2])
    case 'box': return new THREE.BoxGeometry(def.args[0], def.args[1], def.args[2])
    case 'cylinder': return new THREE.CylinderGeometry(def.args[0], def.args[1], def.args[2], def.args[3])
    case 'cone': return new THREE.ConeGeometry(def.args[0], def.args[1], def.args[2])
    case 'torus': return new THREE.TorusGeometry(def.args[0], def.args[1], def.args[2], def.args[3])
    case 'torusKnot': return new THREE.TorusKnotGeometry(def.args[0], def.args[1], def.args[2], def.args[3])
    case 'octahedron': return new THREE.OctahedronGeometry(def.args[0], def.args[1] ?? 0)
    case 'icosahedron': return new THREE.IcosahedronGeometry(def.args[0], def.args[1] ?? 0)
    case 'dodecahedron': return new THREE.DodecahedronGeometry(def.args[0], def.args[1] ?? 0)
    case 'capsule': return new THREE.CapsuleGeometry(def.args[0], def.args[1], def.args[2], def.args[3])
    default: return new THREE.BoxGeometry(1, 1, 1)
  }
}

export function createMaterial(def: MaterialDef): THREE.Material {
  const base = {
    color: new THREE.Color(def.color),
    emissive: new THREE.Color(def.emissive),
    emissiveIntensity: def.emissiveIntensity,
    metalness: def.metalness,
    roughness: def.roughness,
    transparent: def.transparent,
    opacity: def.opacity,
    wireframe: def.wireframe ?? false,
  }
  if ((def.transmission ?? 0) > 0) {
    return new THREE.MeshPhysicalMaterial({
      ...base,
      transmission: def.transmission,
      thickness: def.thickness ?? 1,
      iridescence: def.iridescence ?? 0,
      iridescenceIOR: 1.4,
      envMapIntensity: 1.3,
      side: THREE.DoubleSide,
    })
  }
  return new THREE.MeshStandardMaterial({
    ...base,
    side: def.transparent ? THREE.DoubleSide : THREE.FrontSide,
    ...(def.textureKey ? { map: makeTexture(def.textureKey) } : {}),
  })
}

export function createObjectGroup(config: ObjectCreatorConfig) {
  const group = new THREE.Group()
  group.name = config.name
  group.userData.objectCreatorConfig = config
  config.parts.forEach((p) => {
    const mesh = new THREE.Mesh(createGeometry(p.geometry), createMaterial(p.material))
    mesh.name = p.id
    mesh.position.set(...p.position)
    mesh.rotation.set(...p.rotation)
    mesh.scale.set(...p.scale)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  })
  return group
}

export function partToMesh(part: ObjectPartDef) {
  const mesh = new THREE.Mesh(createGeometry(part.geometry), createMaterial(part.material))
  mesh.position.set(...part.position)
  mesh.rotation.set(...part.rotation)
  mesh.scale.set(...part.scale)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}
