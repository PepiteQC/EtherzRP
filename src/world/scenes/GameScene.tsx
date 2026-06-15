/**
 * GameScene.tsx - Composant principal de rendu du monde 3D (Moteur V5 Production)
 * Organisation Procédurale Nivelée & Tuilée des 6 Municipalités du Portneuf le long de la vraie Route 138.
 * Modélise l'Axe Nord : Québec → Neuville → Donnacona → Cap-Santé → Portneuf → Deschambault → Grondines → Trois-Rivières.
 * Ne touche à AUCUN shader ou paramètre graphique pour garantir une stabilité inébranlable.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { KeyboardControls, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import * as THREE from 'three';
import { ChunkManager, FrameRateOptimizer, InstancedAssetPool, WebGLMemoryCleaner } from '../optimization';
import { MaterialLibrary } from '../buildings/BuildingSystem';
import { WorldDataManager, GEO_POINTS } from '../data/WorldDataManager';
import AdvancedRoadGenerator from '../roads/AdvancedRoadSystem';
import WeatherSystem, { type WeatherType, type SeasonType } from '../weather/WeatherSystem';
import GameplayController from '../gameplay/GameplayController';
import AdvancedRPModule from '../gameplay/AdvancedRPModule';
import InteriorManager, { type InteriorSceneType } from '../interiors/InteriorManager';
import AuthenticQuebecHighway138Layout from '../data/AuthenticQuebecHighway138Layout';
import CITY_TOKENS from '../../ui/theme/cityTokens';

interface GameSceneProps {
  playerPosition?: [number, number, number];
  onPositionChange?: (pos: [number, number, number]) => void;
  onReturnPortal?: () => void;
}

export const GameWorldManager: React.FC<GameSceneProps> = ({
  playerPosition = [0, 0.5, 0],
  onPositionChange,
  onReturnPortal,
}) => {
  const materialLibRef      = useRef<MaterialLibrary | null>(null);
  const chunkManagerRef     = useRef<ChunkManager | null>(null);
  const worldDataManagerRef = useRef<WorldDataManager | null>(null);
  
  const [showDebug, setShowDebug] = useState(true);
  const [stats, setStats]         = useState({ chunks: 0, buildings: 0, fps: 0, pos: playerPosition, leveled: 0 });

  // Paramètres Atmosphériques In-Character
  const [weather, setWeather]     = useState<WeatherType>('clear');
  const [timeOfDay, setTimeOfDay] = useState<number>(14.0); // Jour civil
  const [season, setSeason]       = useState<SeasonType>('summer');
  
  // Scène Confinée Active (Null = Voie Publique Chunks)
  const [activeInterior, setActiveInterior] = useState<InteriorSceneType | null>(null);

  // Aiguillage et Téléportation Géographique Instantanée
  const [currentCamPos, setCurrentCamPos] = useState<[number, number, number]>(playerPosition);

  useEffect(() => {
    materialLibRef.current      = new MaterialLibrary();
    worldDataManagerRef.current = new WorldDataManager();
    chunkManagerRef.current     = new ChunkManager({}, materialLibRef.current);

    return () => {
      materialLibRef.current?.dispose();
      chunkManagerRef.current?.clear();
    };
  }, []);

  const handleBusinessEnter = useCallback((bizName: string) => {
    console.info(`[World Engine] Demande d'accès intérieur : ${bizName}`);
    if (bizName.includes("Dépanneur")) setActiveInterior('depanneur');
    else if (bizName.includes("Garage")) setActiveInterior('garage');
    else if (bizName.includes("S.A.P.")) setActiveInterior('sap');
    else if (bizName.includes("Motel")) setActiveInterior('motel');
    else if (bizName.includes("Police")) setActiveInterior('police');
  }, []);

  const InnerGameScene = useCallback(() => {
    const { scene, camera } = useThree();
    const frameCountRef     = useRef(0);
    const lastUpdateRef     = useRef(Date.now());
    const chunksGroupRef    = useRef(new THREE.Group());
    const roadsGroupRef     = useRef(new THREE.Group());
    const instancedGroupRef = useRef(new THREE.Group());
    const [leveledCount, setLeveledCount] = useState(0);

    // 1. Montage du Réseau Routier CatmullRom Authentique (10 km réels)
    useEffect(() => {
      chunksGroupRef.current.name    = "ActiveCityChunks";
      roadsGroupRef.current.name     = "AuthenticCurvedRoadNetwork";
      instancedGroupRef.current.name = "InstancedHighVelocityAssets";
      
      scene.add(chunksGroupRef.current);
      scene.add(roadsGroupRef.current);
      scene.add(instancedGroupRef.current);

      if (materialLibRef.current) {
        // Construit et rend toutes les autoroutes et routes du cadastre authentique
        const roadSpecs = AuthenticQuebecHighway138Layout.getCoherentHighwayNetwork();
        roadSpecs.forEach((roadDef) => {
          const rMesh = AdvancedRoadGenerator.createCurvedRoad(roadDef, materialLibRef.current);
          roadsGroupRef.current.add(rMesh);
        });

        // Traffic Cones & Boulders Laurentiens le long de la Route 138 Ouest
        const conesSpecs = Array.from({ length: 30 }).map((_, i) => ({
          position: [-2750 + i * 15, 0.45, -290] as [number, number, number],
        }));
        const conesPool = InstancedAssetPool.createTrafficConesPool(conesSpecs, materialLibRef.current);
        instancedGroupRef.current.add(conesPool);

        const bouldersSpecs = Array.from({ length: 80 }).map((_, i) => ({
          position: [-(i * 110), 0.5, i % 2 === 0 ? -150 : 150] as [number, number, number],
        }));
        const bouldersPool = InstancedAssetPool.createBouldersPool(bouldersSpecs);
        instancedGroupRef.current.add(bouldersPool);
      }

      return () => {
        WebGLMemoryCleaner.purgeObject3D(chunksGroupRef.current, true);
        WebGLMemoryCleaner.purgeObject3D(instancedGroupRef.current, false);
        scene.remove(chunksGroupRef.current);
        scene.remove(roadsGroupRef.current);
        scene.remove(instancedGroupRef.current);
      };
    }, [scene]);

    // 2. Boucle Active de Spatial Tuile LOD & Analyseur Terrain (0 Objet Submergé)
    useFrame(() => {
      frameCountRef.current++;
      const now = Date.now();

      if (now - lastUpdateRef.current > 500) {
        const cameraPos = camera.position;
        const currentPos: [number, number, number] = [
          Math.round(cameraPos.x * 10) / 10,
          Math.round(cameraPos.y * 10) / 10,
          Math.round(cameraPos.z * 10) / 10
        ];

        // Maintien spatial des Chunks et Auto-Correcteur Y
        if (chunkManagerRef.current && activeInterior === null) {
          chunkManagerRef.current.updateVisibility(cameraPos.x, cameraPos.z);
          const activeChunks = chunkManagerRef.current.getActiveChunks();
          chunksGroupRef.current.clear();

          let autoCorrected = leveledCount;

          activeChunks.forEach((chunk) => {
            if (chunk.isVisible && chunk.buildings.length > 0) {
              chunk.buildings.forEach((building) => {
                if (building.mesh) {
                  // ✨ ANALYSEUR TERRAIN
                  const box = new THREE.Box3().setFromObject(building.mesh);
                  if (box.min.y < -0.05) {
                    const correction = Math.abs(box.min.y);
                    building.mesh.position.y += correction;
                    building.mesh.updateMatrixWorld(true);
                    autoCorrected++;
                  }
                  chunksGroupRef.current.add(building.mesh);
                }
              });
            }
          });

          setLeveledCount(autoCorrected);

          const chunkStats = chunkManagerRef.current.getStats();
          setStats({
            chunks: chunkStats.loadedChunks,
            buildings: chunkStats.totalBuildings,
            fps: frameCountRef.current * 2,
            pos: currentPos,
            leveled: autoCorrected,
          });
          frameCountRef.current = 0;
        }

        if (onPositionChange) {
          onPositionChange(currentPos);
        }

        lastUpdateRef.current = now;
      }
    });

    return (
      <group name="V5BoostMasterGroup">
        <FrameRateOptimizer targetFPS={60} enabled={true} />

        {/* Plan Réflectif Institutionnel */}
        {activeInterior === null && (
          <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[20000, 3000]} />
            <meshStandardMaterial color="#0b1329" roughness={0.25} metalness={0.15} />
          </mesh>
        )}

        <WeatherSystem timeOfDay={timeOfDay} weather={weather} season={season} timeSpeed={activeInterior ? 0.0 : 0.05} />

        {/* Guichets Intérieurs ou Gameplay Voie Publique */}
        {activeInterior ? (
          <InteriorManager interiorId={activeInterior} onExit={() => setActiveInterior(null)} />
        ) : (
          <GameplayController initialMode="walking" initialPosition={currentCamPos} onInteract={handleBusinessEnter} />
        )}
      </group>
    );
  }, [timeOfDay, weather, season, activeInterior, currentCamPos, handleBusinessEnter, onPositionChange]);

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none" style={{ background: '#0b1329' }}>
      <CityAudioEngine />

      <Canvas
        camera={{
          position: [playerPosition[0], playerPosition[1] + 4, playerPosition[2] + 8],
          fov: 75,
          near: 0.1,
          far: 1200,
        }}
        gl={{
          powerPreference: "high-performance",
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        dpr={[1, window.devicePixelRatio > 2 ? 2 : 1]}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <KeyboardControls
          map={[
            { name: 'forward',  keys: ['ArrowUp', 'KeyW'] },
            { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
            { name: 'left',     keys: ['ArrowLeft', 'KeyA'] },
            { name: 'right',    keys: ['ArrowRight', 'KeyD'] },
            { name: 'jump',     keys: ['Space'] },
            { name: 'interact', keys: ['KeyE'] },
          ]}
        >
          <InnerGameScene />
        </KeyboardControls>
      </Canvas>

      <AdvancedRPModule />

      {onReturnPortal && (
        <button
          onClick={onReturnPortal}
          style={{
            position: 'absolute',
            top: 16,
            right: 370,
            zIndex: 40,
            background: CITY_TOKENS.colors.primary,
            color: CITY_TOKENS.colors.textLight,
            border: `2px solid ${CITY_TOKENS.colors.accentBlue}`,
            padding: '10px 20px',
            borderRadius: CITY_TOKENS.borderRadius.md,
            fontFamily: CITY_TOKENS.typography.fontFamily,
            fontSize: '13px',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: CITY_TOKENS.shadows.card,
          }}
        >
          🏛️ Revenir à l'Hôtel de Ville (Portail Municipal)
        </button>
      )}

      {/* Bouton Diagnostic */}
      <button
        onClick={() => setShowDebug(prev => !prev)}
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 40,
          background: showDebug ? CITY_TOKENS.colors.primary : 'rgba(0,0,0,0.75)',
          color: CITY_TOKENS.colors.textLight,
          border: `1px solid ${CITY_TOKENS.colors.accentBlue}`,
          padding: '10px 16px',
          borderRadius: CITY_TOKENS.borderRadius.md,
          fontFamily: CITY_TOKENS.typography.fontFamily,
          fontSize: '12px',
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: CITY_TOKENS.shadows.header,
        }}
      >
        {showDebug ? '👁 Cache Nav Spatial & Chunks' : '👁 Navigation Villes (Axe 138 Nord)'}
      </button>

      {/* PANNEAU DIAGNOSTIC, METEO ET NAV GÉOSPATIALE DES VIlLES DU PORTNEUF */}
      {showDebug && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 16,
            zIndex: 40,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            border: `2px solid ${CITY_TOKENS.colors.accentBlue}`,
            borderRadius: CITY_TOKENS.borderRadius.xl,
            padding: '20px',
            color: '#f8fafc',
            fontFamily: CITY_TOKENS.typography.fontFamily,
            fontSize: '13px',
            lineHeight: 1.6,
            width: '320px',
            boxShadow: '0 15px 50px rgba(0,0,0,0.9)',
          }}
        >
          <div style={{ color: CITY_TOKENS.colors.accentBlue, fontWeight: 900, marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', fontSize: '13px', letterSpacing: '0.5px' }}>
            📍 S.A.A.Q. · URBANISME AXE 138 OUEST
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Cadence Three.js :</span>
            <span style={{ color: stats.fps >= 50 ? CITY_TOKENS.colors.success : stats.fps >= 30 ? CITY_TOKENS.colors.warning : CITY_TOKENS.colors.danger, fontWeight: 'bold' }}>{stats.fps} FPS</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Tuiles Chargées :</span>
            <span style={{ color: CITY_TOKENS.colors.accentBlue, fontWeight: 'bold' }}>{activeInterior ? "1 Salle" : `${stats.chunks} / 9 Chunks`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#94a3b8' }}>Structures 3D :</span>
            <span style={{ color: '#c084fc', fontWeight: 'bold' }}>{activeInterior ? "1 Scène" : stats.buildings} Entités</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: CITY_TOKENS.borderRadius.md, marginBottom: '16px', fontSize: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: CITY_TOKENS.colors.accentBlue, fontSize: '10px', fontWeight: 800, marginBottom: '2px', textTransform: 'uppercase' }}>Position Citoyenne (GPS)</div>
            <strong>X: {stats.pos[0]} · Y: {stats.pos[1]} · Z: {stats.pos[2]}</strong>
          </div>

          {/* TELEPORTATION STRATEGIQUE AUX 8 PÔLES GÉOGRAPHIQUES RÉELS (Axe 138) */}
          <div style={{ color: CITY_TOKENS.colors.warning, fontSize: '11px', fontWeight: 900, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🛣️ Navigation Villes & Pôles 138
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
            <button onClick={() => { setCurrentCamPos([0, 2, 0]);         setActiveInterior(null); }} style={{ ...intBtnStyle, background: 'rgba(255,255,255,0.05)', color: CITY_TOKENS.colors.accentBlue }}>🏰 Québec Est</button>
            <button onClick={() => { setCurrentCamPos([-1500, 2, -200]);  setActiveInterior(null); }} style={{ ...intBtnStyle, background: 'rgba(255,255,255,0.05)', color: '#4ade80' }}>🏡 Neuville</button>
            <button onClick={() => { setCurrentCamPos([-2800, 2, -300]);  setActiveInterior(null); }} style={{ ...intBtnStyle, background: 'rgba(255,255,255,0.05)', color: '#f87171' }}>🚨 Donnacona Shérif</button>
            <button onClick={() => { setCurrentCamPos([-3600, 2, -350]);  setActiveInterior(null); }} style={{ ...intBtnStyle, background: 'rgba(255,255,255,0.05)', color: '#c084fc' }}>🏡 Cap-Santé</button>
            <button onClick={() => { setCurrentCamPos([-4600, 2, -400]);  setActiveInterior(null); }} style={{ ...intBtnStyle, background: 'rgba(255,255,255,0.05)', color: '#facc15' }}>⚓ Portneuf Docks</button>
            <button onClick={() => { setCurrentCamPos([-5800, 2, -450]);  setActiveInterior(null); }} style={{ ...intBtnStyle, background: 'rgba(255,255,255,0.05)', color: '#38bdf8' }}>🏡 Deschambault</button>
            <button onClick={() => { setCurrentCamPos([-6900, 2, -500]);  setActiveInterior(null); }} style={{ ...intBtnStyle, background: 'rgba(255,255,255,0.05)', color: '#e2e8f0' }}>⚓ Quais Grondines</button>
            <button onClick={() => { setCurrentCamPos([-8500, 2, -600]);  setActiveInterior(null); }} style={{ ...intBtnStyle, background: 'rgba(255,255,255,0.05)', color: CITY_TOKENS.colors.danger }}>🏭 Trois-Rivières Ouest</button>
          </div>

          {/* ACCÈS INTÉRIEURS */}
          <div style={{ color: '#c084fc', fontSize: '11px', fontWeight: 900, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            🚪 Accès Intérieurs Confinés
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
            <button onClick={() => setActiveInterior('depanneur')} style={{ ...intBtnStyle, background: activeInterior === 'depanneur' ? '#ea580c' : 'rgba(255,255,255,0.05)' }}>🏪 Dépanneur</button>
            <button onClick={() => setActiveInterior('garage')}    style={{ ...intBtnStyle, background: activeInterior === 'garage'    ? '#dc2626' : 'rgba(255,255,255,0.05)' }}>🔧 Garage Ti-Guy</button>
            <button onClick={() => setActiveInterior('sap')}       style={{ ...intBtnStyle, background: activeInterior === 'sap'       ? '#800020' : 'rgba(255,255,255,0.05)' }}>🍷 S.A.P. Vins</button>
            <button onClick={() => setActiveInterior('motel')}     style={{ ...intBtnStyle, background: activeInterior === 'motel'     ? '#10b981' : 'rgba(255,255,255,0.05)' }}>🛏️ Motel 101</button>
            <button onClick={() => setActiveInterior('police')}    style={{ ...intBtnStyle, gridColumn: 'span 2', background: activeInterior === 'police' ? '#0284c7' : 'rgba(255,255,255,0.05)' }}>🚓 Shérif / Détention</button>
          </div>

          {activeInterior && (
            <button
              onClick={() => setActiveInterior(null)}
              style={{ width: '100%', padding: '10px', background: CITY_TOKENS.colors.success, color: '#fff', border: 'none', borderRadius: CITY_TOKENS.borderRadius.md, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              ← Regagner la Voie Publique (Ville)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const intBtnStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.15)',
  padding: '8px',
  borderRadius: '8px',
  fontSize: '11px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.1s ease',
  textAlign: 'center',
  color: '#ffffff',
};

const CityAudioEngine: React.FC = () => {
  const [playing, setPlaying] = useState(false);

  const startSynthAudio = useCallback(() => {
    if (playing) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 350;
      filter.Q.value = 3.5;

      const gain = ctx.createGain();
      gain.gain.value = 0.08;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
      setPlaying(true);
    } catch (err) {
      console.warn("[CityAudioEngine] Erreur audio :", err);
    }
  }, [playing]);

  return (
    <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 40 }}>
      {!playing && (
        <button
          onClick={startSynthAudio}
          style={{ background: CITY_TOKENS.colors.primary, color: '#fff', border: `1px solid ${CITY_TOKENS.colors.accentBlue}`, padding: '8px 14px', borderRadius: CITY_TOKENS.borderRadius.md, fontSize: '11px', fontWeight: 800, cursor: 'pointer', boxShadow: CITY_TOKENS.shadows.card }}
        >
          🎧 Activer Rumeur Route 138 & Vent du Fleuve
        </button>
      )}
    </div>
  );
};

export default GameWorldManager;
