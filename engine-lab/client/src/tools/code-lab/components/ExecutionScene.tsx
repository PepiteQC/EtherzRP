import {
  Canvas,
  useFrame,
} from '@react-three/fiber'

import {
  Float,
  OrbitControls,
  Stars,
} from '@react-three/drei'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import * as THREE from 'three'

import type {
  CodeExecutionResult,
} from '../types'

function isWebGLAvailable(): boolean {
  try {
    const canvas =
      document.createElement('canvas')

    return Boolean(
      window.WebGLRenderingContext &&
      (
        canvas.getContext('webgl') ||
        canvas.getContext(
          'experimental-webgl'
        )
      )
    )
  } catch {
    return false
  }
}

function hashText(
  value: string
): number {
  let hash = 0

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash =
      (
        hash * 31 +
        value.charCodeAt(index)
      ) | 0
  }

  return Math.abs(hash)
}

function positionForExecution(
  execution: CodeExecutionResult,
  index: number
): [number, number, number] {
  const seed =
    hashText(execution.id)

  const angle =
    (
      seed % 360
    ) * Math.PI / 180

  const radius =
    3.5 + (index % 5) * 1.15

  return [
    Math.cos(angle) * radius,
    (
      (seed % 700) / 700 -
      0.5
    ) * 8,
    Math.sin(angle) * radius,
  ]
}

function ExecutionNode({
  execution,
  position,
}: {
  execution: CodeExecutionResult
  position: [number, number, number]
}) {
  const meshRef =
    useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) {
      return
    }

    const elapsed =
      clock.getElapsedTime()

    meshRef.current.rotation.x =
      elapsed * 0.45

    meshRef.current.rotation.y =
      elapsed * 0.3
  })

  const color =
    execution.success
      ? '#00ff72'
      : '#ff315c'

  const scale =
    Math.max(
      0.35,
      Math.min(
        1.8,
        execution.duration / 180
      )
    )

  return (
    <Float
      speed={1.8}
      rotationIntensity={1.2}
      floatIntensity={1.5}
    >
      <mesh
        ref={meshRef}
        position={position}
      >
        <icosahedronGeometry
          args={[scale, 1]}
        />

        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.25}
          wireframe
        />

        <pointLight
          color={color}
          intensity={
            execution.success
              ? 1.6
              : 2.4
          }
          distance={9}
        />
      </mesh>
    </Float>
  )
}

function WebGLScene({
  executions,
}: {
  executions: CodeExecutionResult[]
}) {
  const positions =
    useMemo(
      () =>
        executions.map(
          positionForExecution
        ),
      [executions]
    )

  return (
    <Canvas
      camera={{
        position: [0, 1, 15],
        fov: 60,
      }}
      dpr={[1, 1.5]}
    >
      <color
        attach="background"
        args={['#000000']}
      />

      <fog
        attach="fog"
        args={[
          '#000000',
          10,
          34,
        ]}
      />

      <ambientLight
        intensity={0.28}
      />

      <Stars
        radius={100}
        depth={50}
        count={2200}
        factor={4}
        saturation={1}
        fade
        speed={1.5}
      />

      <mesh>
        <sphereGeometry
          args={[2, 18, 18]}
        />

        <meshBasicMaterial
          color="#00ff72"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>

      {executions.map(
        (execution, index) => (
          <ExecutionNode
            key={execution.id}
            execution={execution}
            position={positions[index]}
          />
        )
      )}

      <OrbitControls
        makeDefault
        autoRotate
        autoRotateSpeed={0.45}
        enableDamping
        dampingFactor={0.05}
      />
    </Canvas>
  )
}

function FallbackScene({
  executions,
}: {
  executions: CodeExecutionResult[]
}) {
  return (
    <div className="code-lab-fallback">
      <div className="code-lab-fallback__grid" />

      <div className="code-lab-fallback__content">
        <strong>
          EXECUTION HISTORY
        </strong>

        {executions.length === 0 ? (
          <span>
            AWAITING INPUT
          </span>
        ) : (
          <div className="code-lab-fallback__nodes">
            {executions
              .slice(-16)
              .map((execution) => {
                const size =
                  Math.max(
                    14,
                    Math.min(
                      44,
                      execution.duration / 12
                    )
                  )

                return (
                  <div
                    key={execution.id}
                    className={
                      execution.success
                        ? 'is-success'
                        : 'is-error'
                    }
                    style={{
                      width: size,
                      height: size,
                    }}
                    title={
                      `${execution.duration} ms`
                    }
                  />
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}

export function ExecutionScene({
  executions,
}: {
  executions: CodeExecutionResult[]
}) {
  const [
    webGLAvailable,
    setWebGLAvailable,
  ] = useState<boolean | null>(null)

  useEffect(() => {
    setWebGLAvailable(
      isWebGLAvailable()
    )
  }, [])

  if (webGLAvailable === null) {
    return (
      <div className="code-lab-scene is-loading" />
    )
  }

  return (
    <div className="code-lab-scene">
      {webGLAvailable ? (
        <WebGLScene
          executions={executions}
        />
      ) : (
        <FallbackScene
          executions={executions}
        />
      )}

      <div className="code-lab-scene__hud">
        <span>
          NODES
        </span>

        <strong>
          {executions.length}
        </strong>

        <span>
          RENDER
        </span>

        <strong>
          {webGLAvailable
            ? 'WEBGL'
            : '2D'}
        </strong>
      </div>
    </div>
  )
}
