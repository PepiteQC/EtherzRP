import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '@/lib/etherworld/game-store'

type TimeValue = string | number
type Phase = 'night' | 'dawn' | 'day' | 'dusk'

function resolvePhase(time: TimeValue, explicit?: string): Phase {
  if (explicit === 'night' || explicit === 'dawn' || explicit === 'dusk') return explicit
  if (typeof time === 'string') return time === 'night' || time === 'dawn' || time === 'dusk' ? time : 'day'
  if (time >= 21 || time < 5) return 'night'
  if (time >= 5 && time < 8) return 'dawn'
  if (time >= 18 && time < 21) return 'dusk'
  return 'day'
}

function palette(phase: Phase, weather: string) {
  const rainy = weather === 'rain' || weather === 'storm'
  const snowy = weather === 'snow' || weather === 'blizzard'
  const foggy = weather === 'fog'

  if (phase === 'night') {
    return {
      background: '#071024',
      fog: rainy ? '#0b1522' : snowy ? '#182438' : '#09111f',
      ambient: '#1b2b52',
      hemiSky: '#162c60',
      hemiGround: '#0c1711',
      sun: '#9db8ff',
      fill: '#2d74ff',
      rim: '#8fdcff',
      keyIntensity: 0.45,
      ambientIntensity: 0.28,
      hemiIntensity: 0.55,
      fogNear: foggy ? 12 : 34,
      fogFar: foggy ? 170 : rainy ? 330 : snowy ? 290 : 560,
    }
  }

  if (phase === 'dawn') {
    return {
      background: '#8fb7d6',
      fog: snowy ? '#d6e0ea' : rainy ? '#7890a0' : '#b8c7cf',
      ambient: '#ffe0bf',
      hemiSky: '#cbdcff',
      hemiGround: '#5d7144',
      sun: '#ffb16b',
      fill: '#7ec8ff',
      rim: '#ffd3a1',
      keyIntensity: 1.25,
      ambientIntensity: 0.48,
      hemiIntensity: 0.72,
      fogNear: foggy ? 10 : 56,
      fogFar: foggy ? 170 : rainy ? 370 : snowy ? 330 : 720,
    }
  }

  if (phase === 'dusk') {
    return {
      background: '#4d668c',
      fog: snowy ? '#8897a8' : rainy ? '#3e4f60' : '#5f5a74',
      ambient: '#d8a0d0',
      hemiSky: '#8068b8',
      hemiGround: '#35482f',
      sun: '#ff8648',
      fill: '#3b82f6',
      rim: '#ffcc88',
      keyIntensity: 0.95,
      ambientIntensity: 0.38,
      hemiIntensity: 0.68,
      fogNear: foggy ? 10 : 48,
      fogFar: foggy ? 160 : rainy ? 330 : snowy ? 300 : 650,
    }
  }

  return {
    background: rainy ? '#7c93a3' : snowy ? '#c7ddeb' : '#84c7f0',
    fog: rainy ? '#7f96a4' : snowy ? '#d8e7ef' : '#a9d5ee',
    ambient: '#dceeff',
    hemiSky: '#bfe8ff',
    hemiGround: '#51743a',
    sun: '#fff1c2',
    fill: '#8bd3ff',
    rim: '#ffffff',
    keyIntensity: rainy ? 0.95 : snowy ? 1.15 : 1.55,
    ambientIntensity: rainy ? 0.46 : 0.58,
    hemiIntensity: rainy ? 0.62 : 0.76,
    fogNear: foggy ? 12 : rainy ? 42 : snowy ? 38 : 135,
    fogFar: foggy ? 190 : rainy ? 360 : snowy ? 340 : 880,
  }
}

function createGradientTexture(top: string, bottom: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 64)
  g.addColorStop(0, top)
  g.addColorStop(0.55, bottom)
  g.addColorStop(1, '#e8f5ff')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 2, 64)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export default function HDVisualRig({ lowEnd = false }: { lowEnd?: boolean }) {
  const { gl, scene } = useThree()
  const timeOfDay = useStore(s => s.timeOfDay) as TimeValue
  const timePhase = useStore(s => s.timePhase)
  const weather = useStore(s => s.weather)
  const phase = resolvePhase(timeOfDay, timePhase)
  const p = palette(phase, weather)

  const skyTexture = useMemo(() => createGradientTexture(
    phase === 'night' ? '#071024' : phase === 'dawn' ? '#6d8fbf' : phase === 'dusk' ? '#5b467c' : '#68b9ee',
    p.background
  ), [phase, p.background])

  useEffect(() => {
    gl.outputColorSpace = THREE.SRGBColorSpace
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = phase === 'night' ? 1.0 : phase === 'dusk' ? 1.08 : 1.16
    gl.shadowMap.enabled = !lowEnd
    gl.shadowMap.type = THREE.PCFSoftShadowMap
  }, [gl, phase, lowEnd])

  useFrame(() => {
    const targetBg = new THREE.Color(p.background)
    if (scene.background instanceof THREE.Color) scene.background.lerp(targetBg, 0.015)
    else scene.background = targetBg

    const fog = scene.fog instanceof THREE.Fog ? scene.fog : null
    if (!fog) {
      scene.fog = new THREE.Fog(p.fog, p.fogNear, p.fogFar)
    } else {
      fog.color.lerp(new THREE.Color(p.fog), 0.025)
      fog.near = THREE.MathUtils.lerp(fog.near, p.fogNear, 0.025)
      fog.far = THREE.MathUtils.lerp(fog.far, p.fogFar, 0.025)
    }
  })

  return (
    <group name="HDVisualRig">
      {/* Dôme gradient HD cartoon */}
      <mesh scale={[1, 1, 1]}>
        <sphereGeometry args={[820, lowEnd ? 24 : 40, lowEnd ? 12 : 18]} />
        <meshBasicMaterial map={skyTexture} side={THREE.BackSide} fog={false} />
      </mesh>

      <ambientLight color={p.ambient} intensity={p.ambientIntensity} />
      <hemisphereLight args={[p.hemiSky, p.hemiGround, p.hemiIntensity]} />

      {/* Key light cartoon: ombres douces et lisibles */}
      <directionalLight
        position={phase === 'night' ? [-90, 120, -160] : [95, 135, -185]}
        color={p.sun}
        intensity={p.keyIntensity}
        castShadow={!lowEnd}
        shadow-mapSize-width={lowEnd ? 512 : 2048}
        shadow-mapSize-height={lowEnd ? 512 : 2048}
        shadow-camera-near={1}
        shadow-camera-far={520}
        shadow-camera-left={-185}
        shadow-camera-right={185}
        shadow-camera-top={185}
        shadow-camera-bottom={-185}
        shadow-bias={-0.00022}
        shadow-normalBias={0.035}
      />

      {/* Fill/rim pour donner un look HD cartoon même dans la noirceur */}
      <directionalLight position={[-120, 75, 130]} color={p.fill} intensity={phase === 'night' ? 0.42 : 0.28} />
      <pointLight position={[0, 38, -120]} color={p.rim} intensity={phase === 'night' ? 1.4 : 0.55} distance={260} decay={2} />

      {/* Soleil / lune stylisé sans postprocessing */}
      <mesh position={phase === 'night' ? [-120, 120, -360] : [135, 145, -430]}>
        <sphereGeometry args={[phase === 'night' ? 10 : 15, 20, 14]} />
        <meshBasicMaterial color={phase === 'night' ? '#dbe8ff' : '#fff0a8'} fog={false} />
      </mesh>
      <mesh position={phase === 'night' ? [-120, 120, -360] : [135, 145, -430]}>
        <sphereGeometry args={[phase === 'night' ? 18 : 30, 20, 14]} />
        <meshBasicMaterial color={phase === 'night' ? '#9db8ff' : '#ffd47a'} transparent opacity={phase === 'night' ? 0.12 : 0.16} depthWrite={false} fog={false} />
      </mesh>
    </group>
  )
}
