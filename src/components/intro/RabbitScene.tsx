// ============================================================
//  EtherWorld QC RP — Rabbit Scene
//  Lapin pilote dans une carotte volante.
//  Version autonome optimisée: Three.js + requestAnimationFrame, sans GSAP.
//  Utilisée uniquement dans l'intro, ne touche pas au personnage joueur.
// ============================================================

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const mats = {
  orange: new THREE.MeshPhongMaterial({ color: 0xb7513c, flatShading: true }),
  green: new THREE.MeshPhongMaterial({ color: 0x379351, flatShading: true }),
  brown: new THREE.MeshPhongMaterial({ color: 0x5c2c22, flatShading: true }),
  pink: new THREE.MeshPhongMaterial({ color: 0xb1325e, flatShading: true }),
  gray: new THREE.MeshPhongMaterial({ color: 0x666666, flatShading: true }),
  clouds: new THREE.MeshPhongMaterial({ color: 0xeeeeee, flatShading: true }),
  rabbit: new THREE.MeshPhongMaterial({ color: 0xaaaaaa, flatShading: true }),
}

function enableShadows(group: THREE.Group) {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true
      obj.receiveShadow = true
    }
  })
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function createCloud(cfg: { y: number; z: number; delay: number }) {
  const group = new THREE.Group()
  const geo = new THREE.SphereGeometry(5, 4, 6)

  const c1 = new THREE.Mesh(geo, mats.clouds)
  c1.scale.set(1, 0.8, 1)

  const c2 = c1.clone()
  c2.scale.set(0.55, 0.35, 1)
  c2.position.set(5, -1.5, 2)

  const c3 = c1.clone()
  c3.scale.set(0.75, 0.5, 1)
  c3.position.set(-5.5, -2, -1)

  group.add(c1, c2, c3)
  enableShadows(group)
  group.position.set(200 + cfg.delay * 75, cfg.y, cfg.z)
  group.userData.baseY = cfg.y
  group.userData.speed = 82 + cfg.delay * 8
  return group
}

function createPilot() {
  const group = new THREE.Group()

  const body = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), mats.rabbit)
  body.position.set(0, 1, 4)

  const seat = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 6), mats.brown)
  seat.position.set(0, -2.5, 0)
  seat.rotation.x = 0.25
  body.add(seat)

  const earGeo = new THREE.BoxGeometry(2, 6, 0.5)
  const earPivotL = new THREE.Object3D()
  earPivotL.name = 'earPivotL'
  earPivotL.position.y = 2.5
  earPivotL.rotation.x = -Math.PI / 2.25

  const earL = new THREE.Mesh(earGeo, mats.rabbit)
  earL.position.set(-1.5, 2.5, 0)
  const earInsideL = new THREE.Mesh(earGeo, mats.pink)
  earInsideL.scale.set(0.5, 0.7, 0.5)
  earInsideL.position.z = 0.25
  earL.add(earInsideL)
  earPivotL.add(earL)
  body.add(earPivotL)

  const earPivotR = new THREE.Object3D()
  earPivotR.name = 'earPivotR'
  earPivotR.position.y = 2.5
  earPivotR.rotation.x = -Math.PI / 3

  const earR = new THREE.Mesh(earGeo, mats.rabbit)
  earR.position.set(1.5, 2.5, 0)
  const earInsideR = new THREE.Mesh(earGeo, mats.pink)
  earInsideR.scale.set(0.5, 0.7, 0.5)
  earInsideR.position.z = 0.25
  earR.add(earInsideR)
  earPivotR.add(earR)
  body.add(earPivotR)

  const eyeGeo = new THREE.BoxGeometry(0.5, 1, 0.5)
  const eyeL = new THREE.Mesh(eyeGeo, mats.gray)
  eyeL.name = 'eyeL'
  eyeL.position.set(1, 0.5, 2.5)
  body.add(eyeL)

  const eyeR = eyeL.clone()
  eyeR.name = 'eyeR'
  eyeR.position.x = -1
  body.add(eyeR)

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mats.pink)
  nose.position.set(0, -0.5, 2.5)
  body.add(nose)

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.5), mats.gray)
  mouth.position.set(0, -1.5, 2.5)
  body.add(mouth)

  group.add(body)
  enableShadows(group)
  group.rotation.x = 1.5
  group.position.set(0, 7, 5)

  return group
}

function createCarrot() {
  const group = new THREE.Group()

  const body = new THREE.Mesh(new THREE.CylinderGeometry(5, 2, 25, 8), mats.orange)
  group.add(body)

  const wingGeo = new THREE.BoxGeometry(7, 7, 0.5)
  const wingR = new THREE.Mesh(wingGeo, mats.brown)
  wingR.position.set(6, 2, 1)
  const wingL = wingR.clone()
  wingL.position.x = -6
  wingL.rotation.y = Math.PI
  group.add(wingR, wingL)

  const leafs = new THREE.Group()
  leafs.name = 'leafs'
  const leafGeo = new THREE.CylinderGeometry(1.5, 1, 5, 4)

  const leafA = new THREE.Mesh(leafGeo, mats.green)
  leafA.position.y = 16

  const leafB = leafA.clone()
  leafB.position.set(-1.75, 15, 0)
  leafB.rotation.z = 0.4

  const leafC = leafB.clone()
  leafC.position.x = 1.75
  leafC.rotation.z = -0.4

  leafs.add(leafA, leafB, leafC)
  group.add(leafs)
  group.add(createPilot())

  enableShadows(group)
  group.rotation.set(-Math.PI / 2, 0, Math.PI / 2)
  return group
}

export default function RabbitScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x000000, 100, 350)

    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / Math.max(1, el.clientHeight), 1, 1000)
    camera.position.set(40, 20, 100)
    scene.add(camera)

    const ambient = new THREE.AmbientLight(0x8888cc, 0.8)
    scene.add(ambient)

    const dir = new THREE.DirectionalLight(0xffffff, 1)
    dir.position.set(30, 20, 0)
    dir.castShadow = true
    scene.add(dir)

    const carrot = createCarrot()
    scene.add(carrot)

    const clouds = [
      createCloud({ y: -5, z: 20, delay: 0 }),
      createCloud({ y: 0, z: 10, delay: 1 }),
      createCloud({ y: 15, z: -10, delay: 0.5 }),
      createCloud({ y: -15, z: 10, delay: 2 }),
    ]
    clouds.forEach(c => scene.add(c))

    let raf = 0
    const clock = new THREE.Clock()

    const animate = () => {
      const t = clock.getElapsedTime()
      const dt = clock.getDelta()

      carrot.position.x = Math.sin(t * 1.7) * 2
      carrot.position.y = 2 + Math.sin(t * 2.2) * 3
      carrot.rotation.x = -1.62 + Math.sin(t * 2.2) * 0.08

      const leafs = carrot.getObjectByName('leafs')
      if (leafs) leafs.rotation.y += dt * 34

      const earL = carrot.getObjectByName('earPivotL')
      const earR = carrot.getObjectByName('earPivotR')
      if (earL) earL.rotation.x = -Math.PI / 2.25 + Math.sin(t * 38) * 0.08
      if (earR) earR.rotation.x = -Math.PI / 3 + Math.sin(t * 38 + 1.4) * 0.08

      const blink = Math.sin(t * 1.2) > 0.985 ? 0.12 : 1
      const eyeL = carrot.getObjectByName('eyeL')
      const eyeR = carrot.getObjectByName('eyeR')
      if (eyeL) eyeL.scale.y = THREE.MathUtils.lerp(eyeL.scale.y, blink, 0.35)
      if (eyeR) eyeR.scale.y = THREE.MathUtils.lerp(eyeR.scale.y, blink, 0.35)

      clouds.forEach((cloud) => {
        cloud.position.x -= cloud.userData.speed * dt
        if (cloud.position.x < -220) {
          cloud.position.x = 220
          cloud.position.y = randInt(-15, 20)
        }
      })

      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      const w = el.clientWidth
      const h = Math.max(1, el.clientHeight)
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
        }
      })
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none' }} />
}
