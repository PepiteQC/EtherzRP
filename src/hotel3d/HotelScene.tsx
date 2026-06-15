// src/hotel3d/HotelScene.tsx

import React, { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Hotel } from './hotel/Hotel';
import { Depanneur } from './depanneur/Depanneur';
import { Environment } from './environment/Environment';
import { useElevator } from './hooks/useElevator';
import { useRoomLights } from './hooks/useRoomLights';
import { HOTEL, BUILDING } from './constants/dimensions';
import { makeRoomId, roomDisplayNumber, type RoomId } from './constants/ids';

// ─── STYLES ──────────────────────────────────────────────────────────────────

const font = "'JetBrains Mono','Courier New',monospace";

const styles = {
  root: {
    width: '100vw',
    height: '100vh',
    background: '#020509',
    position: 'relative' as const,
    overflow: 'hidden',
    fontFamily: font,
  },
  badge: {
    position: 'absolute' as const,
    top: 16,
    left: 20,
    pointerEvents: 'none' as const,
  },
  clock: {
    position: 'absolute' as const,
    top: 16,
    right: 20,
    textAlign: 'right' as const,
    pointerEvents: 'none' as const,
  },
  hint: {
    position: 'absolute' as const,
    bottom: 70,
    left: 20,
    color: '#1e293b',
    fontSize: 9,
    letterSpacing: 2,
    lineHeight: 1.8,
    pointerEvents: 'none' as const,
  },
  fab: {
    position: 'absolute' as const,
    bottom: 24,
    right: 24,
    background: 'rgba(2,5,9,0.92)',
    border: '1px solid rgba(125,211,252,0.3)',
    borderRadius: 12,
    color: '#7dd3fc',
    padding: '10px 18px',
    cursor: 'pointer',
    fontSize: 11,
    letterSpacing: 2,
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
    fontFamily: font,
  },
  drawer: (open: boolean) => ({
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(2,5,9,0.97)',
    borderTop: '1px solid rgba(125,211,252,0.15)',
    backdropFilter: 'blur(14px)',
    transform: open ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
    padding: '18px 24px 24px',
    zIndex: 9,
    fontFamily: font,
  }),
};

// ─── UI ──────────────────────────────────────────────────────────────────────

const HotelUI: React.FC<{
  elevator: ReturnType<typeof useElevator>;
  lights: ReturnType<typeof useRoomLights>;
  selectedRoom: RoomId | null;
  onSelectRoom: (room: RoomId | null) => void;
}> = ({ elevator, lights, selectedRoom, onSelectRoom }) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      {/* Badge */}
      <div style={styles.badge}>
        <div style={{ color: '#7dd3fc', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>
          RÉSIDENCE ÉTHER
        </div>
        <div style={{ color: '#c9a84c', fontSize: 18, fontWeight: 700 }}>
          HÔTEL — 3 ÉTAGES — 30 CHAMBRES
        </div>
        <div style={{ color: '#334155', fontSize: 9, letterSpacing: 2, marginTop: 2 }}>
          RDC SERVICES · É1-É3 CHAMBRES · DÉPANNEUR INDÉPENDANT
        </div>
      </div>

      {/* Clock */}
      <div style={styles.clock}>
        <div style={{ color: '#7dd3fc', fontSize: 20, fontWeight: 700 }}>
          {time.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div style={{ color: '#334155', fontSize: 9, letterSpacing: 2 }}>
          {time.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
        </div>
      </div>

      <div style={styles.hint}>DRAG · SCROLL · CLIC FENÊTRE</div>

      {/* FAB */}
      <button onClick={() => setPanelOpen((o) => !o)} style={styles.fab}>
        <span style={{ fontSize: 14 }}>{panelOpen ? '✕' : '⚙'}</span>
        {panelOpen ? 'FERMER' : 'CONTRÔLES'}
      </button>

      {/* Control Panel */}
      <div style={styles.drawer(panelOpen)}>
        <div style={{
          width: 40, height: 3, background: 'rgba(125,211,252,0.18)',
          borderRadius: 2, margin: '0 auto 16px',
        }} />

        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 24, maxHeight: 320, overflowY: 'auto' }}>
          {/* Elevator */}
          <div>
            <div style={{ color: '#7dd3fc', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
              ASCENSEUR
            </div>
            <div style={{
              background: '#0a0e1a', border: '1px solid rgba(125,211,252,0.25)',
              borderRadius: 6, padding: '8px 12px', textAlign: 'center', marginBottom: 10,
            }}>
              <div style={{ color: '#334155', fontSize: 9 }}>NIVEAU</div>
              <div style={{ color: '#7dd3fc', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                {elevator.floorName(elevator.isMoving ? Math.round(elevator.currentFloor) : elevator.targetFloor)}
              </div>
              {elevator.isMoving && (
                <div style={{ color: '#c9a84c', fontSize: 9, marginTop: 2 }}>
                  {elevator.targetFloor > elevator.currentFloor ? '▲' : '▼'} EN MOUVEMENT
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Array.from({ length: HOTEL.totalLevels }, (_, i) => HOTEL.totalLevels - 1 - i).map((f) => (
                <button
                  key={f}
                  onClick={() => elevator.goToFloor(f)}
                  style={{
                    background: elevator.targetFloor === f ? 'rgba(125,211,252,0.2)' : 'rgba(255,255,255,0.04)',
                    border: elevator.targetFloor === f ? '1px solid rgba(125,211,252,0.6)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 5,
                    color: elevator.targetFloor === f ? '#7dd3fc' : '#475569',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontFamily: font,
                    fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  {elevator.floorName(f)}
                  <span style={{ color: '#334155', fontSize: 8, marginLeft: 8 }}>
                    {f === 0 ? 'ACCUEIL · SERVICES' : `10 CHAMBRES · ${f}01-${f}10`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Lights */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ color: '#c9a84c', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase' }}>
                LUMIÈRES — 30 CHAMBRES
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#ffd580', fontSize: 11, fontWeight: 700 }}>
                  {lights.litCount}/{lights.totalRooms}
                </span>
                <div style={{ width: 80, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{
                    height: '100%',
                    width: `${(lights.litCount / lights.totalRooms) * 100}%`,
                    background: 'linear-gradient(90deg,#c9a84c,#ffd580)',
                    borderRadius: 2,
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            </div>

            {Array.from({ length: HOTEL.chamberFloors }, (_, fi) => HOTEL.chamberFloors - 1 - fi).map((fi) => {
              const floor = fi + 1;
              return (
                <div key={floor} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    color: '#334155', fontSize: 9, width: 30,
                    textAlign: 'right', letterSpacing: 1, flexShrink: 0,
                  }}>
                    É{floor}
                  </span>

                  {/* Left side label */}
                  <span style={{ color: '#1e293b', fontSize: 7 }}>G</span>

                  <div style={{ display: 'flex', gap: 2, flex: 1 }}>
                    {Array.from({ length: HOTEL.roomsPerFloor }, (_, roomIdx) => {
                      const lit = lights.litStates[fi]?.[roomIdx] ?? false;
                      const side = roomIdx < 5 ? 'left' : 'right' as const;
                      const pos = roomIdx < 5 ? roomIdx : roomIdx - 5;
                      const dn = roomDisplayNumber(floor, side, pos);

                      return (
                        <button
                          key={roomIdx}
                          onClick={() => lights.toggleLight(makeRoomId('hotel', floor, side, pos))}
                          title={`Chambre ${dn} — ${lit ? 'Allumée' : 'Éteinte'}`}
                          style={{
                            flex: 1, height: 22, minWidth: 0,
                            background: lit ? 'rgba(255,213,128,0.3)' : 'rgba(255,255,255,0.03)',
                            border: lit ? '1px solid rgba(255,213,128,0.55)' : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 3, cursor: 'pointer', transition: 'all 0.18s',
                            boxShadow: lit ? '0 0 7px rgba(255,213,128,0.35)' : 'none',
                            fontSize: 7, color: lit ? '#ffd580' : '#334155',
                            fontFamily: font,
                            borderLeft: roomIdx === 5 ? '2px solid rgba(125,211,252,0.25)' : undefined,
                          }}
                        >
                          {dn}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right side label */}
                  <span style={{ color: '#1e293b', fontSize: 7 }}>D</span>
                </div>
              );
            })}

            {/* RDC info */}
            <div style={{
              marginTop: 10, padding: '6px 10px',
              background: 'rgba(125,211,252,0.05)',
              border: '1px solid rgba(125,211,252,0.12)',
              borderRadius: 5,
            }}>
              <span style={{ color: '#475569', fontSize: 8, letterSpacing: 2 }}>
                RDC — LOBBY · RÉCEPTION · HALL CENTRAL · SERVICES
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Room Tooltip */}
      {selectedRoom && !panelOpen && (
        <div style={{
          position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(2,5,9,0.95)', border: '1px solid rgba(125,211,252,0.25)',
          borderRadius: 10, padding: '10px 22px', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', gap: 16, whiteSpace: 'nowrap', zIndex: 11,
          fontFamily: font,
        }}>
          <div>
            <div style={{ color: '#475569', fontSize: 9, letterSpacing: 2 }}>CHAMBRE</div>
            <div style={{ color: '#7dd3fc', fontSize: 16, fontWeight: 700 }}>
              {roomDisplayNumber(selectedRoom.floor, selectedRoom.side, selectedRoom.position)}
            </div>
          </div>
          <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.07)' }} />
          <div>
            <div style={{ color: '#334155', fontSize: 8 }}>ÉTAGE {selectedRoom.floor}</div>
            <div style={{ color: '#475569', fontSize: 9 }}>
              {selectedRoom.side === 'left' ? 'AILE GAUCHE' : 'AILE DROITE'}
            </div>
          </div>
          <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.07)' }} />
          <button
            onClick={() => lights.toggleLight(selectedRoom)}
            style={{
              background: 'rgba(125,211,252,0.08)', border: '1px solid rgba(125,211,252,0.25)',
              borderRadius: 5, color: '#7dd3fc', padding: '6px 14px', cursor: 'pointer',
              fontSize: 10, fontFamily: font,
            }}
          >
            TOGGLE
          </button>
          <button
            onClick={() => onSelectRoom(null)}
            style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 15 }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function HotelScene() {
  const elevator = useElevator();
  const lights = useRoomLights();
  const [selectedRoom, setSelectedRoom] = useState<RoomId | null>(null);

  const handleWindowClick = useCallback((roomId: RoomId) => {
    lights.toggleLight(roomId);
    setSelectedRoom(roomId);
  }, [lights]);

  return (
    <div style={styles.root}>
      <Canvas
        shadows
        camera={{
          fov: 45,
          near: 0.1,
          far: 500,
          position: [55, 30, 55],
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <ambientLight color={0x1a2030} intensity={1.8} />
        <hemisphereLight color={0x2244aa} groundColor={0x332211} intensity={0.55} />
        <directionalLight
          color={0xc0d0ff}
          intensity={0.6}
          position={[-30, 60, 35]}
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-camera-near={1}
          shadow-camera-far={200}
          shadow-camera-left={-70}
          shadow-camera-right={70}
          shadow-camera-top={70}
          shadow-camera-bottom={-70}
        />
        <fogExp2 attach="fog" color={0x020509} density={0.006} />

        <Suspense fallback={null}>
          <Hotel
            litStates={lights.litStates}
            elevatorFloor={elevator.currentFloor}
            onWindowClick={handleWindowClick}
          />
          <Depanneur />
          <Environment />
        </Suspense>

        <OrbitControls
          target={[0, HOTEL.totalHeight * 0.35, 4]}
          minDistance={18}
          maxDistance={140}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2 - 0.05}
          autoRotate
          autoRotateSpeed={0.12}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      <HotelUI
        elevator={elevator}
        lights={lights}
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
      />
    </div>
  );
}