import { useSeasonStore } from "../stores/useSeasonStore";
import { DynamicSky }      from "../components/DynamicSky";
import { DynamicSun }      from "../components/DynamicSun";
import { WeatherParticles } from "../components/WeatherParticles";
import { AutoLights }       from "../components/AutoLights";
import { PlayerCharacter }  from "../components/PlayerCharacter";
import { SaintMarc }       from "../villages/SaintMarc";
import { Donnacona }       from "../villages/Donnacona";
import { SaintCasimir }    from "../villages/SaintCasimir";
import { SaintAlban }      from "../villages/SaintAlban";
import { Deschambault }    from "../villages/Deschambault";
import { ForestPatch }     from "../props/nature/Trees";
import { CropField }       from "../props/nature/Fields";
import { SaintLaurentRiver, SmallRiver } from "../props/nature/Rivers";
import { AdminHouse } from "./AdminHouse";

// ════════════════════════════════════════════════════════════════════════════
// POSITIONS DES VILLAGES — Espacés réalistement le long de la 138
// ════════════════════════════════════════════════════════════════════════════
//
// Disposition géographique réelle (ouest → est) :
//   Donnacona → Saint-Marc → Saint-Casimir (nord) → Deschambault
//   Saint-Alban est au nord, accessible par une route secondaire
//
// Échelle : ~1 unité = ~1 mètre, villages espacés de 400-800 unités
//
//  Donnacona        Saint-Marc (spawn)     Deschambault
//    x=-600            x=0                    x=800
//    ←────── 600u ──────┼────── 800u ────────→
//
//  Saint-Casimir (nord-est de Saint-Marc)
//    x=400, z=80
//
//  Saint-Alban (nord, route secondaire)
//    x=-200, z=500

const VILLAGE_POSITIONS = {
  donnacona:    [-600,  0,  25]  as [number, number, number],
  saintMarc:    [0,     0,  0]   as [number, number, number],
  saintCasimir: [450,   0,  80]  as [number, number, number],
  saintAlban:   [-200,  0,  500] as [number, number, number],
  deschambault: [850,   0,  -25] as [number, number, number],
} as const

// Route 138 doit couvrir toute la distance
const ROUTE_START_X = -900
const ROUTE_END_X = 1100
const ROUTE_LENGTH = ROUTE_END_X - ROUTE_START_X
const ROUTE_CENTER_X = (ROUTE_START_X + ROUTE_END_X) / 2

// ════════════════════════════════════════════════════════════════════════════
// GROUND — Agrandi pour couvrir le monde étendu
// ════════════════════════════════════════════════════════════════════════════

function Ground() {
  const season = useSeasonStore(s => s.currentSeason);
  const colors: Record<string, string> = {
    winter:  "#c8d8e0",
    spring:  "#5a8840",
    summer:  "#4a7830",
    autumn:  "#7a6030",
  };
  const color = colors[season] ?? "#4a7830";
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[ROUTE_CENTER_X, -0.05, 100]}>
      <planeGeometry args={[ROUTE_LENGTH + 400, 1200, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ROUTE 138 — Étendue sur toute la distance
// ════════════════════════════════════════════════════════════════════════════

function Route138() {
  return (
    <group>
      {/* ══ ASPHALTE PRINCIPAL ══ */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[ROUTE_CENTER_X, 0.01, 0]}>
        <planeGeometry args={[ROUTE_LENGTH, 10]} />
        <meshStandardMaterial color="#252525" roughness={0.9} />
      </mesh>

      {/* ══ LIGNE CENTRALE JAUNE (double) ══ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROUTE_CENTER_X, 0.02, -0.08]}>
        <planeGeometry args={[ROUTE_LENGTH, 0.1]} />
        <meshStandardMaterial color="#e8c020" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROUTE_CENTER_X, 0.02, 0.08]}>
        <planeGeometry args={[ROUTE_LENGTH, 0.1]} />
        <meshStandardMaterial color="#e8c020" />
      </mesh>

      {/* ══ ACCOTEMENTS ══ */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[ROUTE_CENTER_X, 0.01, 6]}>
        <planeGeometry args={[ROUTE_LENGTH, 2]} />
        <meshStandardMaterial color="#6a6060" roughness={1} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[ROUTE_CENTER_X, 0.01, -6]}>
        <planeGeometry args={[ROUTE_LENGTH, 2]} />
        <meshStandardMaterial color="#6a6060" roughness={1} />
      </mesh>

      {/* ══ LIGNES BLANCHES DE BORD ══ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROUTE_CENTER_X, 0.02, 4.9]}>
        <planeGeometry args={[ROUTE_LENGTH, 0.08]} />
        <meshStandardMaterial color="#d8dce4" transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROUTE_CENTER_X, 0.02, -4.9]}>
        <planeGeometry args={[ROUTE_LENGTH, 0.08]} />
        <meshStandardMaterial color="#d8dce4" transparent opacity={0.7} />
      </mesh>

      {/* ══ LIGNES POINTILLÉES BLANCHES ══ */}
      {Array.from({ length: Math.floor(ROUTE_LENGTH / 13) }).map((_, i) => (
        <mesh key={`dash-${i}`} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[ROUTE_START_X + 6 + i * 13, 0.025, 0]}>
          <planeGeometry args={[7, 0.14]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* ══ ROUTE SECONDAIRE VERS SAINT-ALBAN (nord) ══ */}
      {/* Part de x=-200 et monte vers z=500 */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-200, 0.01, 250]}>
        <planeGeometry args={[8, 500]} />
        <meshStandardMaterial color="#303030" roughness={0.92} />
      </mesh>
      {/* Ligne centrale de la route secondaire */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-200, 0.02, 250]}>
        <planeGeometry args={[0.12, 500]} />
        <meshStandardMaterial color="#e8c020" />
      </mesh>
      {/* Accotements route secondaire */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-196, 0.01, 250]}>
        <planeGeometry args={[1.5, 500]} />
        <meshStandardMaterial color="#6a6060" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-204, 0.01, 250]}>
        <planeGeometry args={[1.5, 500]} />
        <meshStandardMaterial color="#6a6060" roughness={1} />
      </mesh>

      {/* ══ ROUTE SECONDAIRE VERS SAINT-CASIMIR ══ */}
      {/* Part de x=300 sur la 138 et monte en diagonale */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[375, 0.01, 40]} rotation-z={0}>
        <planeGeometry args={[8, 180]} />
        <meshStandardMaterial color="#303030" roughness={0.92} />
      </mesh>

      {/* ══ LAMPADAIRES LE LONG DE LA 138 ══ */}
      {Array.from({ length: Math.floor(ROUTE_LENGTH / 35) }).map((_, i) => (
        <group key={`lamp-${i}`} position={[ROUTE_START_X + 15 + i * 35, 0, 7]}>
          <mesh castShadow position={[0, 3.5, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 7, 6]} />
            <meshStandardMaterial color="#778890" metalness={0.6} />
          </mesh>
          <mesh castShadow position={[1.2, 6.8, 0]}>
            <boxGeometry args={[2.4, 0.18, 0.5]} />
            <meshStandardMaterial color="#556677" metalness={0.4} />
          </mesh>
          <pointLight
            position={[1.2, 6.5, 0]}
            color="#ffd090"
            intensity={0}
            distance={20}
            decay={2}
            name="street-lamp"
          />
        </group>
      ))}

      {/* ══ PANNEAUX DE SIGNALISATION ENTRE LES VILLAGES ══ */}
      {/* Direction Donnacona (ouest) */}
      <RoadSign138
        position={[-300, 0, -8]}
        text="Donnacona"
        subText="← 3 km"
      />
      <RoadSign138
        position={[-450, 0, -8]}
        text="Donnacona"
        subText="← 1.5 km"
      />

      {/* Direction Saint-Marc (centre) */}
      <RoadSign138
        position={[-100, 0, -8]}
        text="Saint-Marc"
        subText="← 1 km"
      />

      {/* Direction Deschambault (est) */}
      <RoadSign138
        position={[200, 0, -8]}
        text="Deschambault"
        subText="→ 6 km"
      />
      <RoadSign138
        position={[500, 0, -8]}
        text="Deschambault"
        subText="→ 3.5 km"
      />
      <RoadSign138
        position={[700, 0, -8]}
        text="Deschambault"
        subText="→ 1.5 km"
      />

      {/* Direction Saint-Casimir (nord) */}
      <RoadSign138
        position={[290, 0, -8]}
        text="Saint-Casimir ↗"
        subText="Route 363 Nord"
      />

      {/* Direction Saint-Alban (nord) */}
      <RoadSign138
        position={[-210, 0, -8]}
        text="Saint-Alban ↑"
        subText="Route 354 Nord"
      />

      {/* Panneaux de vitesse */}
      <SpeedSign position={[-500, 0, -8]} speed={90} />
      <SpeedSign position={[-100, 0, -8]} speed={50} />
      <SpeedSign position={[100, 0, -8]} speed={90} />
      <SpeedSign position={[400, 0, -8]} speed={90} />
      <SpeedSign position={[750, 0, -8]} speed={50} />

      {/* Panneaux d'entrée de village */}
      <VillageEntrySign position={[-550, 0, -8]} name="DONNACONA" pop="6 800" />
      <VillageEntrySign position={[-50, 0, -8]} name="SAINT-MARC" pop="2 100" />
      <VillageEntrySign position={[800, 0, -8]} name="DESCHAMBAULT" pop="2 200" />
    </group>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PANNEAUX ROUTIERS
// ════════════════════════════════════════════════════════════════════════════

function RoadSign138({
  position, text, subText,
}: {
  position: [number, number, number]; text: string; subText?: string
}) {
  return (
    <group position={position}>
      {/* Double poteau */}
      <mesh position={[-0.8, 2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 4, 6]} />
        <meshStandardMaterial color="#888" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0.8, 2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 4, 6]} />
        <meshStandardMaterial color="#888" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Panneau vert */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <boxGeometry args={[2.8, 1.2, 0.04]} />
        <meshStandardMaterial color="#1a6a2a" roughness={0.4} metalness={0.15} />
      </mesh>
      {/* Dos aluminium */}
      <mesh position={[0, 4.2, -0.025]}>
        <boxGeometry args={[2.8, 1.2, 0.01]} />
        <meshStandardMaterial color="#aaa" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Bordure blanche */}
      <mesh position={[0, 4.2, 0.022]}>
        <boxGeometry args={[2.7, 1.1, 0.003]} />
        <meshStandardMaterial color="#1a6a2a" roughness={0.5} />
      </mesh>
    </group>
  );
}

function SpeedSign({
  position, speed,
}: {
  position: [number, number, number]; speed: number
}) {
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 4, 6]} />
        <meshStandardMaterial color="#888" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Panneau blanc */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <boxGeometry args={[0.9, 1.1, 0.04]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      {/* Cercle rouge */}
      <mesh position={[0, 4.2, 0.025]}>
        <ringGeometry args={[0.35, 0.44, 16]} />
        <meshStandardMaterial color="#cc0000" />
      </mesh>
    </group>
  );
}

function VillageEntrySign({
  position, name, pop,
}: {
  position: [number, number, number]; name: string; pop: string
}) {
  return (
    <group position={position}>
      {/* Poteaux */}
      <mesh position={[-1.2, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 3, 6]} />
        <meshStandardMaterial color="#6a5a4a" roughness={0.7} />
      </mesh>
      <mesh position={[1.2, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 3, 6]} />
        <meshStandardMaterial color="#6a5a4a" roughness={0.7} />
      </mesh>
      {/* Panneau bois */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <boxGeometry args={[3.2, 1.2, 0.1]} />
        <meshStandardMaterial color="#4a3a25" roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Bordure */}
      <mesh position={[0, 3.2, 0.055]}>
        <boxGeometry args={[3.0, 1.0, 0.005]} />
        <meshStandardMaterial color="#3a2a18" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// NATURE — Beaucoup plus de forêts / champs pour remplir les espaces
// ════════════════════════════════════════════════════════════════════════════

function NatureLayer() {
  const season = useSeasonStore(s => s.currentSeason);
  const s = season as "spring" | "summer" | "autumn" | "winter";

  return (
    <>
      {/* ══════════════════════════════════════════
          FORÊTS LE LONG DE LA ROUTE 138
          - Nord de la route (z négatif) = vers le fleuve
          - Sud de la route (z positif) = vers l'intérieur
         ══════════════════════════════════════════ */}

      {/* Zone OUEST — entre départ et Donnacona */}
      <ForestPatch position={[-800, 0, -50]}  radius={60} density={25} season={s} />
      <ForestPatch position={[-750, 0, 50]}   radius={50} density={20} season={s} />
      <ForestPatch position={[-700, 0, -80]}  radius={45} density={18} season={s} />

      {/* Zone entre Donnacona et Saint-Marc (600 unités à remplir) */}
      <ForestPatch position={[-500, 0, -60]}  radius={55} density={22} season={s} />
      <ForestPatch position={[-450, 0, 60]}   radius={50} density={20} season={s} />
      <ForestPatch position={[-380, 0, -75]}  radius={48} density={18} season={s} />
      <ForestPatch position={[-320, 0, 55]}   radius={52} density={22} season={s} />
      <ForestPatch position={[-250, 0, -55]}  radius={45} density={18} season={s} />
      <ForestPatch position={[-180, 0, 80]}   radius={50} density={20} season={s} />
      <ForestPatch position={[-120, 0, -65]}  radius={40} density={16} season={s} />

      {/* Zone autour de Saint-Marc */}
      <ForestPatch position={[60, 0, -80]}    radius={45} density={18} season={s} />
      <ForestPatch position={[-40, 0, 70]}    radius={40} density={16} season={s} />

      {/* Zone entre Saint-Marc et Deschambault (800 unités) */}
      <ForestPatch position={[150, 0, -70]}   radius={55} density={22} season={s} />
      <ForestPatch position={[200, 0, 65]}    radius={50} density={20} season={s} />
      <ForestPatch position={[280, 0, -60]}   radius={48} density={18} season={s} />
      <ForestPatch position={[350, 0, 75]}    radius={52} density={22} season={s} />
      <ForestPatch position={[420, 0, -55]}   radius={45} density={18} season={s} />
      <ForestPatch position={[500, 0, 60]}    radius={50} density={20} season={s} />
      <ForestPatch position={[580, 0, -70]}   radius={48} density={18} season={s} />
      <ForestPatch position={[650, 0, 55]}    radius={45} density={16} season={s} />
      <ForestPatch position={[720, 0, -50]}   radius={42} density={16} season={s} />

      {/* Zone EST — après Deschambault */}
      <ForestPatch position={[950, 0, -55]}   radius={55} density={22} season={s} />
      <ForestPatch position={[1000, 0, 60]}   radius={50} density={20} season={s} />

      {/* Zone NORD — le long de la route vers Saint-Alban */}
      <ForestPatch position={[-230, 0, 150]}  radius={55} density={22} season={s} />
      <ForestPatch position={[-170, 0, 250]}  radius={60} density={25} season={s} />
      <ForestPatch position={[-220, 0, 350]}  radius={55} density={22} season={s} />
      <ForestPatch position={[-160, 0, 420]}  radius={50} density={20} season={s} />

      {/* Zone autour de Saint-Casimir */}
      <ForestPatch position={[480, 0, 130]}   radius={50} density={20} season={s} />
      <ForestPatch position={[400, 0, 140]}   radius={45} density={18} season={s} />

      {/* ══════════════════════════════════════════
          CHAMPS AGRICOLES
          ══════════════════════════════════════════ */}

      {/* Champs entre Donnacona et Saint-Marc */}
      <CropField position={[-480, 0, 40]}  width={55} depth={65} crop="corn" rotation={0.05} />
      <CropField position={[-350, 0, 50]}  width={50} depth={60} crop="wheat" />
      <CropField position={[-220, 0, 45]}  width={60} depth={70} crop="hay" rotation={-0.04} />

      {/* Champs autour de Saint-Marc */}
      <CropField position={[-80, 0, 45]}   width={50} depth={60} crop="corn" rotation={0.05} />
      <CropField position={[80, 0, 48]}    width={55} depth={70} crop="wheat" />

      {/* Champs entre Saint-Marc et Deschambault */}
      <CropField position={[180, 0, 50]}   width={55} depth={65} crop="hay" rotation={0.06} />
      <CropField position={[320, 0, 55]}   width={50} depth={60} crop="corn" rotation={-0.03} />
      <CropField position={[500, 0, 48]}   width={60} depth={70} crop="wheat" />
      <CropField position={[650, 0, 45]}   width={50} depth={55} crop="hay" rotation={0.08} />

      {/* Champs vers Saint-Alban */}
      <CropField position={[-250, 0, 200]} width={60} depth={70} crop="wheat" rotation={0.1} />
      <CropField position={[-150, 0, 320]} width={55} depth={65} crop="corn" />

      {/* Champs vers Saint-Casimir */}
      <CropField position={[380, 0, 110]}  width={50} depth={60} crop="hay" rotation={-0.06} />

      {/* ══════════════════════════════════════════
          RIVIÈRES
          ══════════════════════════════════════════ */}

      {/* Petite rivière entre Donnacona et Saint-Marc */}
      <SmallRiver startX={-350} startZ={-30} endX={-350} endZ={120} width={7} />

      {/* Petite rivière entre Saint-Marc et la route de Saint-Casimir */}
      <SmallRiver startX={[200]} startZ={-20} endX={200} endZ={60} width={5} />

      {/* Rivière Jacques-Cartier (plus large, près de Donnacona) */}
      <SmallRiver startX={-550} startZ={-40} endX={-550} endZ={100} width={12} />

      {/* Ruisseau vers Saint-Alban */}
      <SmallRiver startX={-180} startZ={100} endX={-180} endZ={400} width={4} />

      {/* Petite rivière près de Deschambault */}
      <SmallRiver startX={780} startZ={-30} endX={780} endZ={80} width={6} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ÉLÉMENTS AMBIANTS — Étendu sur toute la distance
// ════════════════════════════════════════════════════════════════════════════

function AmbientElements() {
  return (
    <>
      {/* ══ ROCHERS le long du fleuve ══ */}
      {Array.from({ length: 20 }).map((_, i) => {
        const x = ROUTE_START_X + 50 + i * (ROUTE_LENGTH / 20) + (Math.random() - 0.5) * 30
        const z = -155 - Math.random() * 20
        const s = 1 + Math.random() * 1.5
        return (
          <mesh key={`rock-${i}`} castShadow receiveShadow position={[x, 0.3, z]}>
            <dodecahedronGeometry args={[s, 0]} />
            <meshStandardMaterial color="#8a8880" roughness={0.95} flatShading />
          </mesh>
        )
      })}

      {/* ══ CLÔTURES le long de la 138 (côté sud) ══ */}
      {Array.from({ length: Math.floor(ROUTE_LENGTH / 18) }).map((_, i) => (
        <group key={`fence-${i}`} position={[ROUTE_START_X + 10 + i * 18, 0, 12]}>
          {/* Piquet */}
          <mesh castShadow position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 1.6, 5]} />
            <meshStandardMaterial color="#5a3d22" roughness={0.95} />
          </mesh>
          {/* Rail horizontal (un sur deux) */}
          {i % 2 === 0 && (
            <>
              <mesh castShadow position={[9, 0.65, 0]}>
                <boxGeometry args={[18, 0.1, 0.08]} />
                <meshStandardMaterial color="#6a4d32" roughness={0.95} />
              </mesh>
              <mesh castShadow position={[9, 0.35, 0]}>
                <boxGeometry args={[18, 0.08, 0.06]} />
                <meshStandardMaterial color="#5a3d22" roughness={0.95} />
              </mesh>
            </>
          )}
        </group>
      ))}

      {/* ══ CLÔTURES le long de la route vers Saint-Alban ══ */}
      {Array.from({ length: 25 }).map((_, i) => (
        <group key={`fence-alban-${i}`} position={[-195, 0, 20 + i * 20]}>
          <mesh castShadow position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 1.5, 5]} />
            <meshStandardMaterial color="#5a3d22" roughness={0.95} />
          </mesh>
          {i % 2 === 0 && (
            <mesh castShadow position={[0, 0.6, 10]}>
              <boxGeometry args={[0.08, 0.08, 20]} />
              <meshStandardMaterial color="#6a4d32" roughness={0.95} />
            </mesh>
          )}
        </group>
      ))}

      {/* ══ BOÎTES AUX LETTRES rurales ══ */}
      {[-400, -200, 100, 350, 600].map((x, i) => (
        <group key={`mailbox-${i}`} position={[x, 0, 10]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.4, 6]} />
            <meshStandardMaterial color="#555" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.3, 0.1]} castShadow>
            <boxGeometry args={[0.3, 0.2, 0.18]} />
            <meshStandardMaterial color="#333" metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* ══ PANNEAUX KM ══ */}
      {Array.from({ length: Math.floor(ROUTE_LENGTH / 100) }).map((_, i) => {
        const x = ROUTE_START_X + 50 + i * 100
        return (
          <group key={`km-${i}`} position={[x, 0, -8]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[0.12, 0.6, 0.06]} />
              <meshStandardMaterial color="#1a6a2a" roughness={0.5} metalness={0.15} />
            </mesh>
          </group>
        )
      })}

      {/* ══ CROIX DE CHEMIN (typique Portneuf) ══ */}
      {[-400, 0, 400].map((x, i) => (
        <group key={`cross-${i}`} position={[x, 0, -12]}>
          {/* Poteau vertical */}
          <mesh position={[0, 2, 0]} castShadow>
            <boxGeometry args={[0.12, 4, 0.12]} />
            <meshStandardMaterial color="#e8e0d0" roughness={0.7} />
          </mesh>
          {/* Barre horizontale */}
          <mesh position={[0, 3.2, 0]} castShadow>
            <boxGeometry args={[1.2, 0.1, 0.1]} />
            <meshStandardMaterial color="#e8e0d0" roughness={0.7} />
          </mesh>
          {/* Base pierre */}
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[0.6, 0.3, 0.6]} />
            <meshStandardMaterial color="#8a8880" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* ══ GRANGES / SILOS (entre les villages) ══ */}
      {[-350, 200, 550].map((x, i) => (
        <group key={`barn-${i}`} position={[x, 0, 40 + i * 10]}>
          {/* Grange */}
          <mesh position={[0, 3, 0]} castShadow>
            <boxGeometry args={[8, 6, 12]} />
            <meshStandardMaterial color="#8a2a1a" roughness={0.8} />
          </mesh>
          {/* Toit */}
          <mesh position={[0, 6.5, 0]} castShadow rotation={[0, 0, 0]}>
            <boxGeometry args={[9, 1, 13]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.7} metalness={0.1} />
          </mesh>
          {/* Porte */}
          <mesh position={[0, 2, 6.05]}>
            <boxGeometry args={[3, 4, 0.1]} />
            <meshStandardMaterial color="#5a1a0a" roughness={0.8} />
          </mesh>
          {/* Silo à côté */}
          <mesh position={[7, 4, 0]} castShadow>
            <cylinderGeometry args={[2, 2, 8, 8]} />
            <meshStandardMaterial color="#c8c0b8" roughness={0.5} metalness={0.2} />
          </mesh>
          <mesh position={[7, 8.5, 0]} castShadow>
            <coneGeometry args={[2.2, 1.5, 8]} />
            <meshStandardMaterial color="#8a8a88" roughness={0.5} metalness={0.2} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCÈNE PRINCIPALE
// ════════════════════════════════════════════════════════════════════════════

export function Route138World() {
  return (
    <>
      {/* Météo et ciel */}
      <DynamicSky />
      <DynamicSun />
      <WeatherParticles />
      <AutoLights />

      {/* Terrain et routes */}
      <Ground />
      <Route138 />
      <NatureLayer />
      <AmbientElements />

      {/* Saint-Laurent — fleuve au nord, agrandi pour la distance */}
      <SaintLaurentRiver
        position={[ROUTE_CENTER_X, -0.18, -180]}
        length={ROUTE_LENGTH + 200}
        width={220}
      />

      {/* Maison Admin — spawn du joueur (à Saint-Marc) */}
      <AdminHouse position={[0, 0, -60]} />

      {/* ════════════════════════════════════════════
          VILLAGES — Espacés réalistement
          ════════════════════════════════════════════ */}

      {/* Donnacona — 600u à l'OUEST de Saint-Marc */}
      <Donnacona position={VILLAGE_POSITIONS.donnacona} />

      {/* Saint-Marc — CENTRE / SPAWN (position 0,0,0) */}
      <SaintMarc position={VILLAGE_POSITIONS.saintMarc} />

      {/* Saint-Casimir — 450u à l'EST + 80u au NORD */}
      <SaintCasimir position={VILLAGE_POSITIONS.saintCasimir} />

      {/* Saint-Alban — 200u à l'OUEST + 500u au NORD (route secondaire) */}
      <SaintAlban position={VILLAGE_POSITIONS.saintAlban} />

      {/* Deschambault — 850u à l'EST de Saint-Marc */}
      <Deschambault position={VILLAGE_POSITIONS.deschambault} />

      {/* Joueur — spawn à l'entrée de la maison admin */}
      <PlayerCharacter spawnPos={[0, 0.1, -48]} />
    </>
  );
}