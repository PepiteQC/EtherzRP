/**
 * src/world/data/AuthenticQuebecHighway138Layout.ts
 * 
 * Base AAA AAA de Données Foncier, Urbanisme & Tracés Routiers Authentiques du Québec (Production).
 * Modélise avec la plus haute rigueur géographique l'axe Nord du Fleuve Saint-Laurent :
 * 1. Ville de Québec (Origine Est [0,0,0])
 * 2. L'autoroute et axe authentique de la Route 138 Ouest
 * 3. Les 6 véritables municipalités successives du Comté de Portneuf successives :
 *    Neuville → Donnacona → Cap-Santé → Portneuf (Ville) → Deschambault → Grondines
 * 4. Ville de Trois-Rivières (Hub Industriel & Métropolitain Ouest [-8500,0,-600])
 * 
 * Règle de stabilité : 
 * - Coordonnées 100% stables, Y-nivelées (y >= 0) et cohérentes
 * - 0 Impact ou modification sur les shaders / graphiques visuels
 */

import { BuildingType, TextureStyle } from '../buildings/BuildingSystem';
import type { BuildingConfig } from '../buildings/BuildingSystem';
import type { PortneufRoad } from './PortneufGeographicData';

/**
 * Registre Géographique Maître pour nos requêtes de tuiles
 */
export class AuthenticQuebecHighway138Layout {
  /**
   * 1. LE TRACÉ ROUTIER ET AUTOROUTIER COHÉRENT (Authentic Highway 138 & Regional Connectors)
   * Calcule un tracé fluide CatmullRom Bézier s'étendant sur 10 kilomètres réels d'Est en Ouest
   */
  static getCoherentHighwayNetwork(): PortneufRoad[] {
    return [
      // 1. L'Artère Épine Dorsale : La véritable Route 138 (Chemin du Roy)
      {
        id: 'real_highway_138',
        name: 'Route 138 Authentique (Chemin du Roy)',
        waypoints: [
          { x: 500,    z: 100 },  // Entrée Est Québec (Charest/Sainte-Foy)
          { x: 0,      z: 0 },    // Vieux-Québec / Saint-Roch
          { x: -750,   z: -100 }, // Sortie Québec Ouest
          { x: -1500,  z: -200 }, // Neuville (Village)
          { x: -2800,  z: -300 }, // Donnacona (Hub Sécurité)
          { x: -3600,  z: -350 }, // Cap-Santé (Cap Fleuve)
          { x: -4600,  z: -400 }, // Portneuf (Ville & Docks)
          { x: -5800,  z: -450 }, // Deschambault (Village Historique)
          { x: -6900,  z: -500 }, // Grondines (Frontière Maritime Portneuf Ouest)
          { x: -8500,  z: -600 }, // Entrée Trois-Rivières Centre
        ],
        type: 'highway',
        lanes: 4,
      },
      // 2. L'Autoroute 40 (Félix-Leclerc) en parallèle Nord pour transit rapide
      {
        id: 'real_autoroute_40',
        name: 'Autoroute 40 (Félix-Leclerc)',
        waypoints: [
          { x: 500,    z: 400 },
          { x: -1500,  z: 200 },
          { x: -4600,  z: 100 },
          { x: -8500,  z: -100 },
        ],
        type: 'highway',
        lanes: 4,
      },
      // 3. Connecteur Régional Route 367 (Axe Nord montant de Donnacona vers Saint-Raymond)
      {
        id: 'real_connector_367',
        name: 'Route 367 (Axe Donnacona - Vallée Nord)',
        waypoints: [
          { x: -2800,  z: -300 }, // Intersection Route 138
          { x: -2850,  z: 200 },
          { x: -2900,  z: 600 },  // Vallée
        ],
        type: 'regional',
        lanes: 2,
      },
      // 4. Connecteur Régional Portneuf Docks
      {
        id: 'real_connector_portneuf_docks',
        name: 'Route Maritime Docks Portneuf',
        waypoints: [
          { x: -4600,  z: -400 }, // Route 138
          { x: -4650,  z: -650 }, // Quai Marina
        ],
        type: 'regional',
        lanes: 2,
      }
    ];
  }

  /**
   * 2. VIlLE DE QUÉBEC (Gateway Est)
   */
  static getQuebecCityCoreArchitecture(): BuildingConfig[] {
    return [
      // Château Frontenac au centre historique
      {
        id: 'qc_chateau_frontenac',
        type: BuildingType.CIVIC,
        position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 38, width: 50, depth: 35,
        textures: [TextureStyle.BRICK_QUEBEC, TextureStyle.STONE],
        roofType: 'pitched',
        metadata: { name: "Château Frontenac (Vieux-Québec)", district: "Québec" },
      },
      // Esplanade Charest Ouest
      {
        id: 'qc_esplanade_charest',
        type: BuildingType.COMMERCIAL,
        position: [-200, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 16, width: 70, depth: 25,
        textures: [TextureStyle.GLASS, TextureStyle.CONCRETE],
        roofType: 'flat', windowCount: { x: 8, y: 3 }, doorCount: 4,
        metadata: { name: "Complexe Commercial Charest", district: "Québec" },
      },
      // Dépanneur Central 7/24
      {
        id: 'qc_depanneur_central',
        type: BuildingType.COMMERCIAL,
        position: [-260, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 12, width: 22, depth: 20,
        textures: [TextureStyle.BRICK, TextureStyle.GLASS],
        metadata: { name: "Dépanneur Central EtherWorld 7/24", district: "Québec", propType: 'sign_depanneur' },
      },
      // S.A.P. Saint-Roch
      {
        id: 'qc_sap_saintroch',
        type: BuildingType.COMMERCIAL,
        position: [-310, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 14, width: 28, depth: 22,
        textures: [TextureStyle.STONE, TextureStyle.GLASS],
        metadata: { name: "Société des Alcools (S.A.P.) Saint-Roch", district: "Québec", propType: 'sign_sap' },
      },
      // Trottoir
      {
        id: 'qc_sidewalk_charest',
        type: BuildingType.SIDEWALK,
        position: [-255, 0, 16], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 0.2, width: 180, depth: 6,
        textures: [TextureStyle.CONCRETE],
        metadata: { parkingSlots: 35 },
      }
    ];
  }

  /**
   * 3. LES 6 VRAIS VIllAGES DU COMTÉ DE PORTNEUF SUCCESSIFS SUR lA 138 (Authentic North Shore Authentic Architecture)
   */
  static getAuthenticPortneufVillagesArchitecture(): BuildingConfig[] {
    return [
      // ══════════════════════════════════════════════════════════════════════
      // 1. NEUVIllE (x = -1500)
      // Village Agricole Patrimonial surplombant l'eau
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'neuville_church',
        type: BuildingType.CIVIC,
        position: [-1500, 0, -200], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 28, width: 30, depth: 40,
        textures: [TextureStyle.STONE, TextureStyle.WOOD],
        roofType: 'pitched', windowCount: { x: 3, y: 4 }, doorCount: 2,
        metadata: { name: "Église Saint-François-de-Sales (Neuville)", district: "Neuville" },
      },
      {
        id: 'neuville_historic_market',
        type: BuildingType.COMMERCIAL,
        position: [-1545, 0, -200], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 10, width: 35, depth: 20,
        textures: [TextureStyle.STONE, TextureStyle.BRICK_QUEBEC],
        roofType: 'pitched', doorCount: 3,
        metadata: { name: "Halles du Marché Patrimonial (Neuville)", district: "Neuville" },
      },
      {
        id: 'neuville_sign',
        type: BuildingType.PROP,
        position: [-1470, 0, -170], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 8, width: 5, depth: 0.4, textures: [TextureStyle.METAL],
        metadata: { propType: 'sign_138', customText: "NEUVIllE · Halte Agricole 138", signColor: '#166534' },
      },

      // ══════════════════════════════════════════════════════════════════════
      // 2. DONNACONA (x = -2800)
      // Capitale Régionale, Hub Économique, Motel 101 et Poste de Police Principal
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'donnacona_main_sheriff',
        type: BuildingType.CIVIC,
        position: [-2800, 0, -300], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 18, width: 40, depth: 32,
        textures: [TextureStyle.STONE, TextureStyle.CONCRETE],
        roofType: 'flat', windowCount: { x: 6, y: 2 }, doorCount: 2,
        metadata: { name: "Poste de Police Sûreté QC (Donnacona)", district: "Donnacona", propType: 'sign_police' },
      },
      {
        id: 'donnacona_motel_laurentides',
        type: BuildingType.COMMERCIAL,
        position: [-2860, 0, -300], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 12, width: 55, depth: 22,
        textures: [TextureStyle.WOOD, TextureStyle.BRICK_QUEBEC],
        roofType: 'pitched', windowCount: { x: 10, y: 2 }, doorCount: 10,
        metadata: { name: "Motel des Laurentides Chambre 101 (Donnacona)", district: "Donnacona", propType: 'sign_motel' },
      },
      {
        id: 'donnacona_garage_tiguy',
        type: BuildingType.INDUSTRIAL,
        position: [-2740, 0, -300], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 14, width: 35, depth: 30,
        textures: [TextureStyle.CONCRETE, TextureStyle.METAL],
        roofType: 'flat', windowCount: { x: 2, y: 1 }, doorCount: 2,
        metadata: { name: "Atelier Mécanique Central Ti-Guy", district: "Donnacona", propType: 'sign_garage' },
      },
      {
        id: 'donnacona_sidewalk',
        type: BuildingType.SIDEWALK,
        position: [-2800, 0, -270], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 0.2, width: 180, depth: 6, textures: [TextureStyle.CONCRETE],
        metadata: { parkingSlots: 36 },
      },

      // ══════════════════════════════════════════════════════════════════════
      // 3. CAP-SANTÉ (x = -3600)
      // Pôle Résidentiel Historique avec Démarrage du Promontoire Fleuve
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'capsante_saintefamille',
        type: BuildingType.CIVIC,
        position: [-3600, 0, -350], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 26, width: 28, depth: 38,
        textures: [TextureStyle.STONE, TextureStyle.WOOD],
        roofType: 'pitched', windowCount: { x: 3, y: 3 },
        metadata: { name: "Église Sainte-Famille (Cap-Santé)", district: "Cap-Santé" },
      },
      {
        id: 'capsante_old_duplex',
        type: BuildingType.RESIDENTIAL,
        position: [-3645, 0, -350], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 12, width: 25, depth: 18,
        textures: [TextureStyle.BRICK_QUEBEC, TextureStyle.STONE],
        roofType: 'pitched', windowCount: { x: 4, y: 2 }, doorCount: 2,
        metadata: { name: "Maison de Pierre Emblématique (Cap-Santé)", district: "Cap-Santé" },
      },

      // ══════════════════════════════════════════════════════════════════════
      // 4. PORTNEUF (VillE) (x = -4600)
      // Plaque Tournante Maritime, Quais de Port, Marina et Grand Dépôt S.A.P.
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'portneuf_marina_docks',
        type: BuildingType.INDUSTRIAL,
        position: [-4600, 0, -400], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 10, width: 65, depth: 40,
        textures: [TextureStyle.CONCRETE, TextureStyle.WOOD],
        metadata: { name: "Quais de Port & Docks Maritime (Portneuf)", district: "Portneuf" },
      },
      {
        id: 'portneuf_sap_central_depot',
        type: BuildingType.COMMERCIAL,
        position: [-4675, 0, -400], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 16, width: 45, depth: 35,
        textures: [TextureStyle.STONE, TextureStyle.GLASS],
        roofType: 'flat', windowCount: { x: 6, y: 2 }, doorCount: 4,
        metadata: { name: "Entrepôt d'Élevage S.A.P. Central de Portneuf", district: "Portneuf", propType: 'sign_sap' },
      },

      // ══════════════════════════════════════════════════════════════════════
      // 5. DESCHAMBAUlT (x = -5800)
      // Un des plus beaux villages culturels du Québec, Presbytère et Artisans
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'deschambault_stjoseph',
        type: BuildingType.CIVIC,
        position: [-5800, 0, -450], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 30, width: 32, depth: 42,
        textures: [TextureStyle.STONE, TextureStyle.BRICK_QUEBEC],
        roofType: 'pitched', windowCount: { x: 4, y: 4 },
        metadata: { name: "Église Saint-Joseph de Deschambault", district: "Deschambault" },
      },
      {
        id: 'deschambault_presbytere_artisans',
        type: BuildingType.COMMERCIAL,
        position: [-5850, 0, -450], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 14, width: 35, depth: 22,
        textures: [TextureStyle.BRICK_QUEBEC, TextureStyle.WOOD],
        roofType: 'pitched', doorCount: 3,
        metadata: { name: "Vieux Presbytère & Boutique d'Artisans", district: "Deschambault" },
      },

      // ══════════════════════════════════════════════════════════════════════
      // 6. GRONDINES (x = -6900)
      // La Frontière Occidentale du Comté de Portneuf, Quai Maritime et Phare
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'grondines_maritime_node',
        type: BuildingType.CIVIC,
        position: [-6900, 0, -500], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 24, width: 25, depth: 30,
        textures: [TextureStyle.STONE, TextureStyle.WOOD],
        metadata: { name: "Ancien Moulin à Vent & Quai de Grondines", district: "Grondines" },
      },
      {
        id: 'grondines_border_sign',
        type: BuildingType.PROP,
        position: [-6850, 0, -475], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 8, width: 5, depth: 0.4, textures: [TextureStyle.METAL],
        metadata: { propType: 'sign_138', customText: "GRONDINES · Frontière Ouest du Portneuf", signColor: '#003366' },
      }
    ];
  }

  /**
   * 4. VIlLE DE TROIS-RIVIÈRES (Gateway Ouest absolute [-8500])
   * Grande métropole de la Mauricie marquant la fin de notre carte
   */
  static getTroisRivieresMetropolisArchitecture(): BuildingConfig[] {
    return [
      // Pôle Commercial Boulevard des Forges au centre
      {
        id: 'tr_strip_forges',
        type: BuildingType.COMMERCIAL,
        position: [-8500, 0, -600], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 22, width: 75, depth: 35,
        textures: [TextureStyle.GLASS, TextureStyle.CONCRETE],
        roofType: 'flat', windowCount: { x: 10, y: 4 }, doorCount: 6,
        metadata: { name: "Promenade Commerciale Boulevard des Forges", district: "Trois-Rivières" },
      },
      // Dépanneur Mauricie
      {
        id: 'tr_depanneur_forges',
        type: BuildingType.COMMERCIAL,
        position: [-8585, 0, -600], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 12, width: 25, depth: 22,
        textures: [TextureStyle.BRICK, TextureStyle.GLASS],
        metadata: { name: "Dépanneur Mauricie 7/24", district: "Trois-Rivières", propType: 'sign_depanneur' },
      },
      // Parc Industriel Bécancour / Trois-Rivières
      {
        id: 'tr_industrial_zone',
        type: BuildingType.INDUSTRIAL,
        position: [-8650, 0, -600], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 16, width: 85, depth: 60,
        textures: [TextureStyle.CONCRETE, TextureStyle.METAL],
        metadata: { name: "Parc Industriel Métropolitain de Trois-Rivières", district: "Trois-Rivières" },
      },
      // Trottoir
      {
        id: 'tr_sidewalk',
        type: BuildingType.SIDEWALK,
        position: [-8540, 0, -570], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 0.2, width: 220, depth: 6, textures: [TextureStyle.CONCRETE],
        metadata: { parkingSlots: 45 },
      },
      {
        id: 'tr_gateway_sign',
        type: BuildingType.PROP,
        position: [-8420, 0, -575], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 9, width: 6, depth: 0.5, textures: [TextureStyle.METAL],
        metadata: { propType: 'sign_sap', customText: "TROIS-RIVIÈRES · HUB MÉTROPOLITAIN OUEST", signColor: '#003366' },
      }
    ];
  }

  /**
   * 5. VÉGÉTATION & PAYSAGES LAURENTIENS STRATÉGIQUES (Non-empty natural gaps)
   */
  static getAuthenticLandscapeClusters(): BuildingConfig[] {
    return [
      // Chaîne boisée encadrant Donnacona et Cap-Santé
      {
        id: 'nature_forest_portneuf_east',
        type: BuildingType.VEGETATION,
        position: [-3200, 0, -100], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 10, width: 250, depth: 150, textures: [TextureStyle.SNOW_DIRT],
        metadata: { treeCount: 55 },
      },
      // Relief forestier encadrant Portneuf et Deschambault
      {
        id: 'nature_forest_portneuf_west',
        type: BuildingType.VEGETATION,
        position: [-5200, 0, -200], rotation: [0, 0, 0], scale: [1, 1, 1],
        height: 10, width: 300, depth: 200, textures: [TextureStyle.SNOW_DIRT],
        metadata: { treeCount: 75 },
      }
    ];
  }

  /**
   * Synthèse Maîtresse Raccourcissant le Fichier Unique de Placements
   */
  static getAllMasterEntities(): BuildingConfig[] {
    return [
      ...this.getQuebecCityCoreArchitecture(),
      ...this.getAuthenticPortneufVillagesArchitecture(),
      ...this.getTroisRivieresMetropolisArchitecture(),
      ...this.getAuthenticLandscapeClusters(),
    ];
  }
}

export default AuthenticQuebecHighway138Layout;
