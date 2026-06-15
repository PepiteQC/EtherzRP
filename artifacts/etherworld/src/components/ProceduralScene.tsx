import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import type { SceneConfig, ObjectDef, ParticleDef } from "@/lib/promptParser";

// ── procedural texture cache ──────────────────────────────────────────────────
// Textures are generated once per browser session and reused forever.

const _texCache = new Map<string, THREE.CanvasTexture>();

function getOrGenTexture(key: string): THREE.CanvasTexture {
  if (_texCache.has(key)) return _texCache.get(key)!;
  const tex = _buildTexture(key);
  _texCache.set(key, tex);
  return tex;
}

function _buildTexture(key: string): THREE.CanvasTexture {
  const S = 512;
  const cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const ctx = cv.getContext("2d")!;

  switch (key) {
    case "wood": {
      ctx.fillStyle = "#5a3010"; ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y++) {
        const t = y / S;
        const br = 0.82 + Math.sin(t * 21) * 0.14 + Math.cos(t * 7) * 0.06;
        ctx.fillStyle = `rgb(${~~(90*br)},${~~(46*br)},${~~(16*br)})`;
        ctx.fillRect(0, y, S, 1);
      }
      for (const [kx,ky] of [[150,130],[380,320],[80,420]] as [number,number][]) {
        const gr = ctx.createRadialGradient(kx,ky,0,kx,ky,38);
        gr.addColorStop(0,"rgba(15,5,0,0.65)");
        gr.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle = gr; ctx.fillRect(kx-40,ky-40,80,80);
      }
      break;
    }
    case "stone": {
      ctx.fillStyle = "#8a8070"; ctx.fillRect(0, 0, S, S);
      for (let x = 0; x < S; x += 2) for (let y = 0; y < S; y += 2) {
        const n = Math.sin(x*.05)*Math.cos(y*.07)+Math.sin(x*.13+y*.09)*.5+Math.cos(x*.023-y*.031)*.3;
        const v = ~~(138 + n * 26);
        ctx.fillStyle = `rgb(${v},${v-8},${v-16})`; ctx.fillRect(x, y, 2, 2);
      }
      ctx.strokeStyle = "rgba(40,35,30,0.35)"; ctx.lineWidth = 0.7;
      for (let i = 0; i < 10; i++) {
        const sx = Math.random()*S, sy = Math.random()*S;
        ctx.beginPath(); ctx.moveTo(sx,sy);
        ctx.lineTo(sx+(Math.random()-.5)*90, sy+(Math.random()-.5)*90); ctx.stroke();
      }
      break;
    }
    case "brick": {
      const BW=60, BH=25, M=4;
      ctx.fillStyle = "#8a8070"; ctx.fillRect(0,0,S,S);
      for (let row=0; row*(BH+M)<S+BH; row++) {
        const off = row%2===0 ? 0 : (BW+M)/2;
        for (let col=-1; col*(BW+M)<S+BW; col++) {
          const bx=col*(BW+M)+off+M, by=row*(BH+M)+M;
          const v=1+Math.sin(col*7+row*13)*.08;
          ctx.fillStyle=`rgb(${~~(139*v)},${~~(58*v)},${~~(42*v)})`; ctx.fillRect(bx,by,BW,BH);
          ctx.fillStyle="rgba(255,200,150,0.06)"; ctx.fillRect(bx,by,BW,2);
        }
      }
      break;
    }
    case "metal": {
      const gr=ctx.createLinearGradient(0,0,S,S);
      gr.addColorStop(0,"#b0c0d0"); gr.addColorStop(.35,"#d8e8f0");
      gr.addColorStop(.65,"#a8b8c8"); gr.addColorStop(1,"#c0d0e0");
      ctx.fillStyle=gr; ctx.fillRect(0,0,S,S);
      ctx.strokeStyle="rgba(255,255,255,0.07)"; ctx.lineWidth=0.5;
      for(let y=0;y<S;y+=2){if(Math.random()>.5){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(S,y+(Math.random()-.5));ctx.stroke();}}
      ctx.strokeStyle="rgba(0,0,0,0.055)"; ctx.lineWidth=0.4;
      for(let i=0;i<22;i++){const sy=Math.random()*S;ctx.beginPath();ctx.moveTo(0,sy);ctx.lineTo(S,sy+(Math.random()-.5)*5);ctx.stroke();}
      break;
    }
    case "dark-metal": {
      ctx.fillStyle="#1a2030"; ctx.fillRect(0,0,S,S);
      ctx.strokeStyle="rgba(100,120,150,0.12)"; ctx.lineWidth=0.5;
      for(let y=0;y<S;y+=2){if(Math.random()>.6){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(S,y+(Math.random()-.5));ctx.stroke();}}
      break;
    }
    case "clay":
    case "terracotta": {
      ctx.fillStyle="#c2613a"; ctx.fillRect(0,0,S,S);
      for(let x=0;x<S;x+=2)for(let y=0;y<S;y+=2){
        const n=Math.sin(x*.06)*Math.cos(y*.09)+Math.sin(x*.14+y*.11)*.4;
        const br=1+n*.14;
        ctx.fillStyle=`rgb(${Math.min(255,~~(194*br))},${Math.min(255,~~(97*br))},${Math.min(255,~~(58*br))})`;
        ctx.fillRect(x,y,2,2);
      }
      break;
    }
    case "leather": {
      ctx.fillStyle="#4a2510"; ctx.fillRect(0,0,S,S);
      ctx.strokeStyle="rgba(255,180,100,0.06)"; ctx.lineWidth=0.6;
      for(let y=0;y<S;y+=5){ctx.beginPath();ctx.moveTo(0,y+Math.sin(y*.3)*2);ctx.lineTo(S,y+Math.sin(y*.3+2)*2);ctx.stroke();}
      ctx.strokeStyle="rgba(0,0,0,0.1)";
      for(let x=0;x<S;x+=5){ctx.beginPath();ctx.moveTo(x+Math.sin(x*.3)*2,0);ctx.lineTo(x+Math.sin(x*.3+2)*2,S);ctx.stroke();}
      break;
    }
    case "ceramic":
    case "white": {
      ctx.fillStyle="#f0ede8"; ctx.fillRect(0,0,S,S);
      for(let i=0;i<3000;i++){
        const px=Math.random()*S,py=Math.random()*S;
        const v=~~(200+Math.random()*55);
        ctx.fillStyle=`rgba(${v},${v},${v},0.05)`;
        ctx.fillRect(px,py,2,2);
      }
      break;
    }
    case "bone": {
      ctx.fillStyle="#e8dcc0"; ctx.fillRect(0,0,S,S);
      for(let x=0;x<S;x+=3)for(let y=0;y<S;y+=3){
        const n=Math.sin(x*.04+y*.03)*Math.cos(x*.07-y*.05);
        const v=~~(220+n*20);
        ctx.fillStyle=`rgb(${Math.min(255,v)},${Math.min(255,v-10)},${Math.min(255,v-26)})`; ctx.fillRect(x,y,3,3);
      }
      break;
    }
    case "green": {
      ctx.fillStyle="#1a7a20"; ctx.fillRect(0,0,S,S);
      for(let x=0;x<S;x+=2)for(let y=0;y<S;y+=2){
        const n=Math.sin(x*.08+y*.06)*Math.cos(x*.05-y*.08);
        const br=1+n*.2;
        ctx.fillStyle=`rgb(${Math.min(255,~~(26*br))},${Math.min(255,~~(122*br))},${Math.min(255,~~(32*br))})`;
        ctx.fillRect(x,y,2,2);
      }
      break;
    }
    case "darkgreen": {
      ctx.fillStyle="#0d4a12"; ctx.fillRect(0,0,S,S);
      for(let x=0;x<S;x+=2)for(let y=0;y<S;y+=2){
        const n=Math.sin(x*.09+y*.07)*Math.cos(x*.06-y*.09);
        const br=1+n*.22;
        ctx.fillStyle=`rgb(${Math.min(255,~~(13*br))},${Math.min(255,~~(74*br))},${Math.min(255,~~(18*br))})`;
        ctx.fillRect(x,y,2,2);
      }
      break;
    }
    case "red": {
      ctx.fillStyle="#cc2200"; ctx.fillRect(0,0,S,S);
      for(let x=0;x<S;x+=2)for(let y=0;y<S;y+=2){
        const n=Math.sin(x*.07)*Math.cos(y*.09)*.12;
        ctx.fillStyle=`rgba(${~~(200+n*50)},${~~(30+n*20)},0,0.25)`;
        ctx.fillRect(x,y,2,2);
      }
      break;
    }
    case "gold": {
      const gg=ctx.createLinearGradient(0,0,S,S);
      gg.addColorStop(0,"#ffd700"); gg.addColorStop(.3,"#ffec60");
      gg.addColorStop(.6,"#d4a000"); gg.addColorStop(1,"#ffd700");
      ctx.fillStyle=gg; ctx.fillRect(0,0,S,S);
      ctx.strokeStyle="rgba(255,255,200,0.1)"; ctx.lineWidth=0.5;
      for(let y=0;y<S;y+=3){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(S,y+(Math.random()-.5));ctx.stroke();}
      break;
    }
    case "rubber": {
      ctx.fillStyle="#141414"; ctx.fillRect(0,0,S,S);
      for(let x=0;x<S;x+=4)for(let y=0;y<S;y+=4){
        if(Math.sin(x*.15)*Math.cos(y*.15)>0.62){ctx.fillStyle="rgba(255,255,255,0.04)";ctx.fillRect(x,y,2,2);}
      }
      break;
    }
    default: {
      ctx.fillStyle="#808080"; ctx.fillRect(0,0,S,S);
      for(let x=0;x<S;x+=2)for(let y=0;y<S;y+=2){
        const n=Math.sin(x*.07+y*.06)*.1;
        const v=~~(128+n*18);
        ctx.fillStyle=`rgb(${v},${v},${v})`; ctx.fillRect(x,y,2,2);
      }
    }
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.needsUpdate = true;
  return tex;
}

// ── blueprint group — wraps all parts in a single rotating group ──────────────

function BlueprintGroup({ objects }: { objects: ObjectDef[] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Slow, elegant full rotation so user sees all sides
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.28;
    }
  });

  return (
    <group ref={groupRef}>
      {objects.map((obj, i) => (
        <BlueprintPart key={i} def={obj} />
      ))}
    </group>
  );
}

function BlueprintPart({ def }: { def: ObjectDef }) {
  const geo = useMemo(() => makeGeometry(def.geometry), [def.geometry]);
  const mat = useMemo(() => makeMaterial(def.material), [def.material]);
  const scl: [number, number, number] = def.scaleXYZ ?? [def.scale, def.scale, def.scale];

  return (
    <mesh
      geometry={geo}
      material={mat}
      position={def.position}
      rotation={def.rotation}
      scale={scl}
    />
  );
}

// ── geometry factory ──────────────────────────────────────────────────────────

function makeGeometry(def: ObjectDef["geometry"]): THREE.BufferGeometry {
  switch (def.type) {
    case "sphere":       return new THREE.SphereGeometry(...(def.args as [number, number, number]));
    case "box":          return new THREE.BoxGeometry(...(def.args as [number, number, number]));
    case "torus":        return new THREE.TorusGeometry(...(def.args as [number, number, number, number]));
    case "torusKnot":    return new THREE.TorusKnotGeometry(...(def.args as [number, number, number, number, number?, number?]));
    case "cone":         return new THREE.ConeGeometry(...(def.args as [number, number, number]));
    case "cylinder":     return new THREE.CylinderGeometry(...(def.args as [number, number, number, number]));
    case "octahedron":   return new THREE.OctahedronGeometry(...(def.args as [number, number?]));
    case "icosahedron":  return new THREE.IcosahedronGeometry(...(def.args as [number, number?]));
    case "dodecahedron": return new THREE.DodecahedronGeometry(...(def.args as [number, number?]));
    case "tetrahedron":  return new THREE.TetrahedronGeometry(...(def.args as [number, number?]));
    case "capsule":      return new THREE.CapsuleGeometry(...(def.args as [number, number, number, number]));
    case "circle":       return new THREE.CircleGeometry(...(def.args as [number, number]));
    default:             return new THREE.SphereGeometry(1.2, 64, 64);
  }
}

// ── material factory ──────────────────────────────────────────────────────────

function makeMaterial(m: ObjectDef["material"]): THREE.Material {
  const isGlass = m.transmission != null && m.transmission > 0.5;

  const base = {
    color:             new THREE.Color(m.color),
    emissive:          new THREE.Color(m.emissive),
    emissiveIntensity: m.emissiveIntensity,
    wireframe:         m.wireframe,
    // For transmission/glass, opacity must be 1 — transmission handles see-through
    transparent:       isGlass ? false : m.transparent,
    opacity:           isGlass ? 1.0   : m.opacity,
    // DoubleSide so inside faces render for glass/hollow objects
    side:              isGlass ? THREE.DoubleSide : THREE.FrontSide,
  };

  if (m.transmission != null && m.transmission > 0) {
    return new THREE.MeshPhysicalMaterial({
      ...base,
      metalness:       m.metalness,
      roughness:       m.roughness,
      transmission:    m.transmission,
      ior:             1.5,
      thickness:       m.thickness ?? 2.0,
      iridescence:     m.iridescence ?? 0,
      iridescenceIOR:  1.3,
      envMapIntensity: 1.5,
    });
  }

  if ((m.iridescence ?? 0) > 0) {
    return new THREE.MeshPhysicalMaterial({
      ...base,
      metalness:       m.metalness,
      roughness:       m.roughness,
      iridescence:     m.iridescence!,
      iridescenceIOR:  1.6,
      envMapIntensity: 1.2,
    });
  }

  const map = (m.textureKey && m.transmission == null && (m.emissiveIntensity ?? 0) < 1.5)
    ? getOrGenTexture(m.textureKey)
    : null;

  return new THREE.MeshStandardMaterial({
    ...base,
    metalness: m.metalness,
    roughness: m.roughness,
    ...(map ? { map } : {}),
  });
}

// ── animated object ───────────────────────────────────────────────────────────

function AnimatedObject({ def, index }: { def: ObjectDef; index: number }) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const geo = useMemo(() => makeGeometry(def.geometry), [def.geometry]);
  const mat = useMemo(() => makeMaterial(def.material), [def.material]);

  const off = index * 1.37;

  useFrame(({ clock }) => {
    const t  = clock.getElapsedTime();
    const m  = meshRef.current;
    const pv = pivotRef.current;
    if (!m) return;

    switch (def.animate) {
      case "spin":
        m.rotation.y += def.animSpeed * 0.012;
        m.rotation.x += def.animSpeed * 0.004;
        break;
      case "float":
        m.position.y = def.position[1] + Math.sin(t * def.animSpeed + off) * 0.28;
        m.rotation.y += 0.005;
        break;
      case "orbit":
        if (pv) pv.rotation.y += def.animSpeed * 0.009;
        m.rotation.y += 0.025;
        break;
      case "pulse": {
        const s = def.scale * (1 + Math.sin(t * def.animSpeed * 2 + off) * 0.1);
        m.scale.setScalar(s);
        m.rotation.y += 0.006;
        break;
      }
      case "wave":
        m.position.y = def.position[1] + Math.sin(t * def.animSpeed + off) * 0.35;
        m.position.x = def.position[0] + Math.cos(t * def.animSpeed * 0.7 + off) * 0.15;
        m.rotation.z = Math.sin(t * def.animSpeed * 0.5 + off) * 0.2;
        break;
      case "breathe": {
        const s2 = def.scale * (1 + Math.sin(t * def.animSpeed + off) * 0.18);
        m.scale.setScalar(s2);
        break;
      }
      default:
        m.rotation.y += 0.004;
    }
  });

  const isOrbit = def.animate === "orbit";
  const orbitRadius = Math.sqrt(def.position[0] ** 2 + def.position[2] ** 2);
  // Support non-uniform scale (blueprint parts use scaleXYZ)
  const baseScale: [number, number, number] = def.scaleXYZ ?? [def.scale, def.scale, def.scale];

  const mesh = (
    <mesh
      ref={meshRef}
      geometry={geo}
      material={mat}
      position={isOrbit ? [orbitRadius, def.position[1], 0] : def.position}
      rotation={def.rotation}
      scale={def.animate !== "pulse" && def.animate !== "breathe" ? baseScale : baseScale}
    />
  );

  if (isOrbit) {
    return <group ref={pivotRef}>{mesh}</group>;
  }
  return mesh;
}

// ── ambient particle cloud ────────────────────────────────────────────────────

function AmbientParticles({ def }: { def: ParticleDef }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(def.count * 3);
    for (let i = 0; i < def.count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * def.spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * def.spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * def.spread;
    }
    return pos;
  }, [def.count, def.spread]);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      ref.current.rotation.y = t * 0.025;
      ref.current.rotation.x = t * 0.012;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={def.color} size={def.size} transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ── galaxy particle system ────────────────────────────────────────────────────

function GalaxyParticles({ def }: { def: ParticleDef }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(def.count * 3);
    const arms    = 3;
    const spread  = 0.5;
    const radius  = def.spread * 0.5;
    for (let i = 0; i < def.count; i++) {
      const r         = Math.random() * radius;
      const spinAngle = r * 2.5;
      const armAngle  = ((i % arms) / arms) * Math.PI * 2;
      const angle     = armAngle + spinAngle;
      const randX     = (Math.random() ** 3) * (Math.random() < 0.5 ? 1 : -1) * spread;
      const randY     = (Math.random() ** 3) * (Math.random() < 0.5 ? 1 : -1) * spread * 0.3;
      const randZ     = (Math.random() ** 3) * (Math.random() < 0.5 ? 1 : -1) * spread;
      pos[i * 3]     = Math.cos(angle) * r + randX;
      pos[i * 3 + 1] = randY;
      pos[i * 3 + 2] = Math.sin(angle) * r + randZ;
    }
    return pos;
  }, [def.count, def.spread]);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={def.color} size={def.size} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ── vortex particle system ────────────────────────────────────────────────────

function VortexParticles({ def }: { def: ParticleDef }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(def.count * 3);
    for (let i = 0; i < def.count; i++) {
      const t     = i / def.count;
      const angle = t * Math.PI * 20;
      const r     = t * def.spread * 0.5;
      const y     = (t - 0.5) * def.spread * 0.6 + (Math.random() - 0.5) * 0.8;
      pos[i * 3]     = Math.cos(angle) * r + (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 0.5;
    }
    return pos;
  }, [def.count, def.spread]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.12;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={def.color} size={def.size * 1.4} transparent opacity={0.65} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ── rain particles ────────────────────────────────────────────────────────────

function RainParticles({ def }: { def: ParticleDef }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(def.count * 3);
    const vel = new Float32Array(def.count);
    for (let i = 0; i < def.count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * def.spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * def.spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * def.spread;
      vel[i]         = 0.01 + Math.random() * 0.03;
    }
    return { positions: pos, velocities: vel };
  }, [def.count, def.spread]);

  useFrame(() => {
    if (!ref.current) return;
    const pos = (ref.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const half = def.spread / 2;
    for (let i = 0; i < def.count; i++) {
      pos[i * 3 + 1] -= velocities[i];
      if (pos[i * 3 + 1] < -half) pos[i * 3 + 1] = half;
    }
    (ref.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={def.color} size={def.size * 0.8} transparent opacity={0.45} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ── particle dispatcher ───────────────────────────────────────────────────────

function Particles({ def }: { def: ParticleDef }) {
  switch (def.mode) {
    case "galaxy":  return <GalaxyParticles  def={def} />;
    case "vortex":  return <VortexParticles  def={def} />;
    case "rain":    return <RainParticles    def={def} />;
    default:        return <AmbientParticles def={def} />;
  }
}

// ── scene root ────────────────────────────────────────────────────────────────

export function ProceduralScene({ config }: { config: SceneConfig }) {
  const hasFog = !!config.fogColor;

  return (
    <>
      <color attach="background" args={[config.background]} />
      {hasFog && <fog attach="fog" args={[config.fogColor!, 6, 22]} />}

      {/* Ambient */}
      <ambientLight color={config.ambientColor} intensity={1.8} />

      {/* Key light */}
      <pointLight
        color={config.lightColor}
        intensity={45}
        position={[5, 5, 5]}
        distance={30}
        decay={2}
      />
      {/* Fill light */}
      <pointLight
        color={config.lightColor2}
        intensity={20}
        position={[-5, -3, -5]}
        distance={25}
        decay={2}
      />
      {/* Rim light */}
      <spotLight
        color="#ffffff"
        intensity={25}
        position={[0, 9, 2]}
        angle={0.5}
        penumbra={1}
        distance={20}
        decay={2}
        castShadow={false}
      />
      {/* Accent underlight */}
      <pointLight
        color={config.lightColor}
        intensity={10}
        position={[0, -4, 0]}
        distance={12}
        decay={2}
      />

      {/* Environment map — required for MeshPhysicalMaterial (glass, iridescent, metallic) */}
      <Environment preset="studio" />

      {/* Objects — blueprint mode wraps all in a single rotating group */}
      {config.isBlueprint
        ? <BlueprintGroup objects={config.objects} />
        : config.objects.map((obj, i) => (
            <AnimatedObject key={i} def={obj} index={i} />
          ))
      }

      {/* Particles */}
      {config.particles && <Particles def={config.particles} />}
    </>
  );
}
