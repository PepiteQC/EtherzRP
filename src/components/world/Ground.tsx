'use client'

import { memo } from 'react'

const GROUND_SIZE = 200

export const Ground = memo(function Ground() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      <meshStandardMaterial color="#0a0a14" roughness={0.9} metalness={0.1} />
    </mesh>
  )
})
