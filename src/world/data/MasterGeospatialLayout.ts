/**
 * src/world/data/MasterGeospatialLayout.ts
 * 
 * Cadastre Foncier Maître et Ordonnancement Stratégique Géospatial (Production AAA).
 * Calibre de manière ultra-réaliste l'intégralité des placements pour EtherWorld Québec RP.
 * Pas de génération aléatoire chaotique : chaque bâtiment, commerce, trottoir, carrefour,
 * forêt et ligne Hydro-Québec possède une place réelle, logique et stratégique.
 * 
 * Système Géospatial :
 * - 1 unité = ~10 mètres
 * - Origine [0, 0, 0] = Vieux-Québec (Château Frontenac & Fortifications)
 * - Axe X = Ouest (-) / Est (+)
 * - Axe Z = Sud (-) / Nord (+)
 */

import { BuildingType, TextureStyle } from '../buildings/BuildingSystem';
import type { BuildingConfig } from '../buildings/BuildingSystem';
import type { PortneufRoad } from './PortneufGeographicData';

export interface SectorDefinition {
  sectorId: string;
  name: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  description: string;
  civicColor: string;
  entities: BuildingConfig[];
}

/**
 * Base Maîtresse Raccourcissant l'Ordonnancement du Monde AAA
 */
export class MasterGeospatialLayout {
  /**
   * 1. SECTEUR 1 : LE CŒUR HISTORIQUE & CENTRE-VIllE (Québec City Core)
   */
  static getQuebecCityCoreEntities(): BuildingConfig[] {
    return [
      // 🏰 Château Frontenac & Place d'Armes (Vieux-Québec)
      {
        id: 'quebec_chateau_frontenac',
        type: BuildingType.CIVIC,
        position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 35, width: 45, depth: 30,
        textures: [TextureStyle.BRICK_QUEBEC, TextureStyle.STONE],
        roofType: 'pitched',
        metadata: { name: "Château Frontenac · Cœur Historique", district: "Vieux-Québec" },
      },
      // 🏢 Esplanade Commerciale Boulevard Charest (Saint-Roch)
      {
        id: 'quebec_strip_charest',
        type: BuildingType.COMMERCIAL,
        position: [-120, 0, 20], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 18, width: 60, depth: 25,
        textures: [TextureStyle.GLASS, TextureStyle.CONCRETE],
        roofType: 'flat', windowCount: { x: 8, y: 4 }, doorCount: 4,
        metadata: { name: "Complexe Commercial Charest", district: "Saint-Roch" },
      },
      // 🏪 Caisse & Dépanneur Central 7/24 (Saint-Roch)
      {
        id: 'quebec_depanneur_charest',
        type: BuildingType.COMMERCIAL,
        position: [-160, 0, 20], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 12, width: 20, depth: 22,
        textures: [TextureStyle.BRICK, TextureStyle.GLASS],
        roofType: 'flat', windowCount: { x: 3, y: 2 }, doorCount: 2,
        metadata: { name: "Dépanneur Central 7/24", district: "Saint-Roch", propType: 'sign_depanneur' },
      },
      // 🍷 Grand Magasin S.A.P. Saint-Roch
      {
        id: 'quebec_sap_charest',
        type: BuildingType.COMMERCIAL,
        position: [-200, 0, 20], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 14, width: 25, depth: 25,
        textures: [TextureStyle.STONE, TextureStyle.GLASS],
        roofType: 'flat', windowCount: { x: 4, y: 2 }, doorCount: 2,
        metadata: { name: "Société des Alcools (S.A.P.) Saint-Roch", district: "Saint-Roch", propType: 'sign_sap' },
      },
      // 🚶 Trottoir Boulevard Charest avec Stationnement
      {
        id: 'sidewalk_charest',
        type: BuildingType.SIDEWALK,
        position: [-160, 0, 36], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 0.2, width: 140, depth: 6,
        textures: [TextureStyle.CONCRETE],
        metadata: { parkingSlots: 28 },
      },
      // Panneau Signalisation Charest
      {
        id: 'sign_charest',
        type: BuildingType.PROP,
        position: [-100, 0, 38], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 7, width: 4, depth: 0.4,
        textures: [TextureStyle.METAL],
        metadata: { propType: 'sign_sap', customText: "BOULEVARD CHAREST · OUVERT", signColor: '#003366' },
      }
    ];
  }

  /**
   * 2. SECTEUR 2 : LIMOIlOU (Quartier Résidentiel Québécois Emblématique)
   * Duplexes et Triplexes en brique rouge avec ruelles et escaliers extérieurs
   */
  static getLimoilouEntities(): BuildingConfig[] {
    const entities: BuildingConfig[] = [];
    const originX = [-250, -290, -330];
    const originZ = [250, 300];

    // 🏡 Maisons Triplexes Typiques
    originX.forEach((ox, i) => {
      originZ.forEach((oz, j) => {
        entities.push({
          id: `limoilou_house_${i}_${j}`,
          type: BuildingType.RESIDENTIAL,
          position: [ox, 0, oz], rotation: [0, 0, 0], scale: [1, 1, 1],
          height: 14, width: 14, depth: 18,
          textures: [TextureStyle.BRICK_QUEBEC, TextureStyle.WOOD],
          roofType: 'flat', windowCount: { x: 3, y: 3 }, doorCount: 1,
          metadata: { name: `Triplex Typique ${i + 1}0 (3ème Avenue)`, district: "Limoilou", builtYear: 1945 },
        });

        if ((i + j) % 2 === 0) {
          entities.push({
            id: `limoilou_bench_${i}_${j}`,
            type: BuildingType.PROP,
            position: [ox + 4, 0, oz + 10], rotation: [0, 0, 0], scale: [1, 1, 1],
            height: 1, width: 2, depth: 0.8,
            textures: [TextureStyle.WOOD], metadata: { propType: 'bench' },
          });
        }
      });
    });

    // 🔧 Atelier Mécanique Ti-Guy Limoilou
    entities.push({
      id: 'limoilou_garage_tiguy',
      type: BuildingType.INDUSTRIAL,
      position: [-370, 0, 275], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1],
      height: 12, width: 30, depth: 25,
      textures: [TextureStyle.CONCRETE, TextureStyle.METAL],
      roofType: 'flat', windowCount: { x: 2, y: 1 }, doorCount: 2,
      metadata: { name: "Garage Ti-Guy (Limoilou)", district: "Limoilou", propType: 'sign_garage' },
    });

    // Trottoir 3ème Avenue
    entities.push({
      id: 'sidewalk_limoilou',
      type: BuildingType.SIDEWALK,
      position: [-290, 0, 318], rotation: [0, 0, 0], scale: [1, 1, 1],
      height: 0.2, width: 150, depth: 5,
      textures: [TextureStyle.CONCRETE],
    });

    return entities;
  }

  /**
   * 3. SECTEUR 3 : lES 6 VIllAGES STRATÉGIQUES DU PORTNEUF (Axe Route 138 Ouest)
   */
  static getPortneufVillagesEntities(): BuildingConfig[] {
    return [
      // 🏡 1. DONNACONA (Hub Civique et Sécurité de la Route 138)
      {
        id: 'donnacona_sheriff_station',
        type: BuildingType.CIVIC,
        position: [-1200, 0, -100], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 16, width: 35, depth: 30,
        textures: [TextureStyle.STONE, TextureStyle.CONCRETE],
        roofType: 'flat', windowCount: { x: 5, y: 2 }, doorCount: 2,
        metadata: { name: "Commissariat Sûreté QC (Donnacona)", district: "Donnacona" },
      },
      {
        id: 'donnacona_motel_laurentides',
        type: BuildingType.COMMERCIAL,
        position: [-1260, 0, -100], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 10, width: 45, depth: 20,
        textures: [TextureStyle.WOOD, TextureStyle.BRICK_QUEBEC],
        roofType: 'pitched', windowCount: { x: 10, y: 2 }, doorCount: 10,
        metadata: { name: "Motel des Laurentides (Donnacona)", district: "Donnacona", propType: 'sign_motel' },
      },
      {
        id: 'sign_donnacona',
        type: BuildingType.PROP,
        position: [-1150, 0, -75], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 8, width: 5, depth: 0.4,
        textures: [TextureStyle.METAL],
        metadata: { propType: 'sign_police', customText: "ENTRÉE DONNACONA · SÛRETÉ QC", signColor: '#003366' },
      },

      // 🏡 2. SAINT-RAYMOND (Hub Médical et Forestier du Nord)
      {
        id: 'straymond_hospital',
        type: BuildingType.CIVIC,
        position: [-1400, 0, 600], rotation: [0, Math.PI, 0], scale: [1, 1, 1],
        height: 22, width: 40, depth: 35,
        textures: [TextureStyle.BRICK, TextureStyle.GLASS],
        roofType: 'flat', windowCount: { x: 6, y: 3 }, doorCount: 3,
        metadata: { name: "Hôpital Régional Saint-Raymond", district: "Saint-Raymond" },
      },
      {
        id: 'straymond_forest_depot',
        type: BuildingType.INDUSTRIAL,
        position: [-1460, 0, 600], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 12, width: 50, depth: 40,
        textures: [TextureStyle.CONCRETE, TextureStyle.METAL],
        metadata: { name: "Entrepôt Forestier du Nord", district: "Saint-Raymond" },
      },

      // 🏡 3. NEUVIllE (Village Agricole Patrimonial en Pierre)
      {
        id: 'neuville_heritage_market',
        type: BuildingType.COMMERCIAL,
        position: [-800, 0, -150], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 12, width: 30, depth: 25,
        textures: [TextureStyle.STONE, TextureStyle.WOOD],
        roofType: 'pitched', windowCount: { x: 4, y: 2 },
        metadata: { name: "Marché Public Patrimonial (Neuville)", district: "Neuville" },
      },

      // 🏡 4. PORTNEUF (Village Industriel, Portuaire & S.A.P. Central)
      {
        id: 'portneuf_marina_sap',
        type: BuildingType.COMMERCIAL,
        position: [-2000, 0, -300], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 15, width: 40, depth: 35,
        textures: [TextureStyle.STONE, TextureStyle.GLASS],
        metadata: { name: "Entrepôt Maritime S.A.P. (Portneuf)", district: "Portneuf", propType: 'sign_sap' },
      },

      // 🏡 5. SAINT-GABRIEl-DE-VAlCARTIER (Hub Tactique & Base Armée)
      {
        id: 'valcartier_military_base',
        type: BuildingType.CIVIC,
        position: [-1000, 0, 900], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 16, width: 55, depth: 45,
        textures: [TextureStyle.CONCRETE, TextureStyle.METAL],
        metadata: { name: "Base Militaire BFC Valcartier", district: "Valcartier" },
      },

      // 🏡 6. STONEHAM-TEWKESBURY (Station Ski & Chalets Laurentiens)
      {
        id: 'stoneham_ski_resort',
        type: BuildingType.COMMERCIAL,
        position: [-400, 0, 1200], rotation: [0, Math.PI / 4, 0], scale: [1, 1, 1],
        height: 25, width: 50, depth: 40,
        textures: [TextureStyle.WOOD, TextureStyle.STONE],
        roofType: 'pitched',
        metadata: { name: "Station de Ski Stoneham & Chalets", district: "Stoneham", propType: 'sign_motel' },
      }
    ];
  }

  /**
   * 4. RELIEF NATUREl, FORÊTS ET ZONES VIDES STRATÉGIQUES (Non-Empty Living Gaps)
   * Connecte les villages avec de denses îlots de sapins et rochers laurentiens
   */
  static getLivingNatureClusters(): BuildingConfig[] {
    return [
      // Forêt flanquant la Route 138 entre Québec et Donnacona
      {
        id: 'nature_forest_1',
        type: BuildingType.VEGETATION,
        position: [-600, 0, -80], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 10, width: 180, depth: 100,
        textures: [TextureStyle.SNOW_DIRT],
        metadata: { treeCount: 45 },
      },
      // Îlot boisé montant vers Saint-Raymond
      {
        id: 'nature_forest_2',
        type: BuildingType.VEGETATION,
        position: [-1300, 0, 300], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 10, width: 200, depth: 150,
        textures: [TextureStyle.SNOW_DIRT],
        metadata: { treeCount: 60 },
      },
      // Montagnes Laurentiennes Nord (Stoneham)
      {
        id: 'nature_mountains_3',
        type: BuildingType.VEGETATION,
        position: [-600, 0, 1000], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 10, width: 250, depth: 200,
        textures: [TextureStyle.SNOW_DIRT],
        metadata: { treeCount: 50 },
      }
    ];
  }

  /**
   * 5. LE TRACÉ ROUTIER STRATÉGIQUE (Routes Bézier Maîtresses)
   */
  static getMasterRoadNetwork(): PortneufRoad[] {
    return [
      // 1. La Route 138 Principale (Axe Sud le long du fleuve)
      {
        id: 'road_highway_138',
        name: 'Route 138 (Chemin du Roy)',
        waypoints: [
          { x: 100,   z: 50 },
          { x: -200,  z: 30 },
          { x: -800,  z: -120 },
          { x: -1200, z: -90 },  // Donnacona
          { x: -1500, z: -180 }, // Neuville
          { x: -2200, z: -280 }, // Portneuf
        ],
        type: 'highway',
        lanes: 4,
      },
      // 2. La Route 367 (Axe Nord montant vers la vallée de Saint-Raymond)
      {
        id: 'road_regional_367',
        name: 'Route 367 (Axe Nord)',
        waypoints: [
          { x: -1200, z: -90 },  // Donnacona
          { x: -1300, z: 200 },
          { x: -1400, z: 580 },  // Saint-Raymond
          { x: -1000, z: 880 },  // Valcartier
        ],
        type: 'regional',
        lanes: 2,
      },
      // 3. La Route 175 (Axe Laurentides Nord montant vers Stoneham)
      {
        id: 'road_resort_175',
        name: 'Autoroute 175 (Axe Stoneham)',
        waypoints: [
          { x: -200, z: 30 },
          { x: -300, z: 400 },   // Limoilou
          { x: -380, z: 1150 },  // Stoneham
        ],
        type: 'highway',
        lanes: 4,
      }
    ];
  }

  /**
   * Récupère l'ordonnancement complet unifié pour la persistance spatiale
   */
  static getAllArchitecturalEntities(): BuildingConfig[] {
    return [
      ...this.getQuebecCityCoreEntities(),
      ...this.getLimoilouEntities(),
      ...this.getPortneufVillagesEntities(),
      ...this.getLivingNatureClusters(),
    ];
  }
}

export default MasterGeospatialLayout;
