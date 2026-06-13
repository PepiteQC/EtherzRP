import React, { useState, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

export type WeatherPreset = 'clear' | 'rain' | 'snow' | 'storm' | 'fog' | 'blizzard' | 'extreme'

interface Props {
  preset: WeatherPreset
  intensity?: number
  advancedControls?: boolean
  onPresetChange?: (preset: WeatherPreset) => void
}

export default function WeatherSystemComplex({ 
  preset = 'clear', 
  intensity = 1.0, 
  advancedControls = false,
  onPresetChange 
}: Props) {
  const { scene } = useThree()
  const [currentPreset, setCurrentPreset] = useState(preset)
  const [currentIntensity, setCurrentIntensity] = useState(intensity)

  const config = {
    clear: { fog: 0.003, color: '#05080f', desc: 'Dégagé' },
    rain: { fog: 0.012, color: '#112233', desc: 'Pluie' },
    snow: { fog: 0.009, color: '#334455', desc: 'Neige' },
    storm: { fog: 0.018, color: '#0a0f1f', desc: 'Tempête' },
    fog: { fog: 0.035, color: '#223344', desc: 'Brouillard' },
    blizzard: { fog: 0.022, color: '#1a2535', desc: 'Blizzard' },
    extreme: { fog: 0.028, color: '#0a0a12', desc: 'Extrême' }
  }[currentPreset]

  useEffect(() => {
    if (!scene) return
    scene.fog = new THREE.FogExp2(config.color, config.fog * currentIntensity)
    scene.background = new THREE.Color(config.color)
  }, [currentPreset, currentIntensity, scene])

  const change = (p: WeatherPreset) => {
    setCurrentPreset(p)
    onPresetChange?.(p)
  }

  return (
    <>
      {/* Particles would be rendered here in a full implementation */}
      {advancedControls && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[3000] glass-panel px-6 py-4 flex gap-2">
          {(['clear','rain','snow','storm','fog','blizzard','extreme'] as const).map(p => (
            <button key={p} onClick={() => change(p)} 
              className={`px-4 py-1.5 rounded text-xs ${currentPreset === p ? 'bg-white text-black' : 'bg-white/10'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
