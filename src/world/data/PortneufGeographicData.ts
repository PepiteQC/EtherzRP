/**
 * PortneufGeographicData.ts - Système géographique réaliste du comté Portneuf
 * Coordonnées GPS réelles converties en world coordinates
 * Routes historiques + chemins d'époque
 */

/**
 * Coordonnées GPS réelles (latitude, longitude)
 * Conversion: 1 degree lat/lng ≈ 111.32 km
 */
export const PORTNEUF_GPS = {
  QUEBEC: { lat: 46.8139, lng: -71.2080, name: 'Québec (Vieux-Québec)' },
  TROIS_RIVIERES: { lat: 46.3434, lng: -72.5536, name: 'Trois-Rivières' },
  
  // Villages du comté Portneuf
  PORTNEUF_VILLAGE: { lat: 46.6818, lng: -71.8824, name: 'Portneuf (village)' },
  SAINT_RAYMOND: { lat: 46.7661, lng: -71.8948, name: 'Saint-Raymond' },
  SAINT_GABRIEL: { lat: 46.8158, lng: -71.7825, name: 'Saint-Gabriel-de-Valcartier' },
  STONEHAM: { lat: 46.8664, lng: -71.3426, name: 'Stoneham-Tewkesbury' },
  DONNACONA: { lat: 46.6885, lng: -71.6987, name: 'Donnacona' },
  NEUVILLE: { lat: 46.6277, lng: -71.6240, name: 'Neuville' },
};

/**
 * Conversion GPS → World Coordinates 3D
 * Centre du monde = Québec (0, 0, 0)
 * X = Est/Ouest (longitude)
 * Z = Nord/Sud (latitude)  
 * Y = Hauteur
 */
export class PortneufCoordinateConverter {
  private centerLat: number;
  private centerLng: number;
  private scale: number; // pixels per km
  
  constructor(
    centerLat: number = PORTNEUF_GPS.QUEBEC.lat,
    centerLng: number = PORTNEUF_GPS.QUEBEC.lng,
    scale: number = 10 // 1 km = 10 pixels
  ) {
    this.centerLat = centerLat;
    this.centerLng = centerLng;
    this.scale = scale;
  }

  /**
   * Convertir GPS (lat, lng) → World (x, z)
   */
  gpsToWorld(lat: number, lng: number): { x: number; z: number } {
    const latDiff = (lat - this.centerLat) * 111.32; // km
    const lngDiff = (lng - this.centerLng) * 111.32 * Math.cos((this.centerLat * Math.PI) / 180); // km

    return {
      x: lngDiff * this.scale, // Est/Ouest
      z: latDiff * this.scale, // Nord/Sud
    };
  }

  /**
   * Obtenir coordonnées world d'un village
   */
  getVillageCoords(village: { lat: number; lng: number }): { x: number; z: number } {
    return this.gpsToWorld(village.lat, village.lng);
  }

  /**
   * Distance entre deux GPS points (km)
   */
  distanceBetweenGPS(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Rayon terre km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

/**
 * Routes réalistes historiques du Portneuf
 * Basées sur vraies routes avant autoroute
 */
export interface PortneufRoad {
  id: string;
  name: string;
  type: 'highway' | 'regional' | 'rural' | 'historic'; // historic = chemins d'époque
  waypoints: Array<{ x: number; z: number }>;
  lanes: number;
  speed?: number; // km/h
  historicalPeriod?: string; // "1700s", "1800s", "pre-1970"
}

/**
 * Générateur de routes Portneuf
 */
export class PortneufRoadNetwork {
  private converter: PortneufCoordinateConverter;
  private roads: PortneufRoad[] = [];

  constructor() {
    this.converter = new PortneufCoordinateConverter();
    this.generateRoads();
  }

  private generateRoads(): void {
    // Route 138 - Ancien chemin nord/sud (PRIORITAIRE)
    const route138 = this.createRoute138();
    this.roads.push(route138);

    // Routes régionales reliant villages
    const regionalRoutes = this.createRegionalRoutes();
    this.roads.push(...regionalRoutes);

    // Petits chemins historiques d'époque
    const historicPaths = this.createHistoricPaths();
    this.roads.push(...historicPaths);
  }

  /**
   * Route 138 - Axe principal historique
   * Passe par: Donnacona → Portneuf → Saint-Raymond
   */
  private createRoute138(): PortneufRoad {
    const donnacona = this.converter.getVillageCoords(PORTNEUF_GPS.DONNACONA);
    const portneuf = this.converter.getVillageCoords(PORTNEUF_GPS.PORTNEUF_VILLAGE);
    const stRaymond = this.converter.getVillageCoords(PORTNEUF_GPS.SAINT_RAYMOND);

    // Générer waypoints avec courbes réalistes
    const waypoints = this.interpolateWaypoints([donnacona, portneuf, stRaymond], 10);

    return {
      id: 'route_138',
      name: 'Route 138 (Chemin Royal de Portneuf)',
      type: 'regional',
      waypoints,
      lanes: 2,
      speed: 80,
      historicalPeriod: '1700s-present',
    };
  }

  /**
   * Routes régionales reliant villages
   */
  private createRegionalRoutes(): PortneufRoad[] {
    const routes: PortneufRoad[] = [];

    // Route: Québec → Stoneham (montagne)
    routes.push({
      id: 'route_stoneham',
      name: 'Route vers Stoneham',
      type: 'regional',
      waypoints: this.interpolateWaypoints([
        this.converter.getVillageCoords(PORTNEUF_GPS.QUEBEC),
        this.converter.getVillageCoords(PORTNEUF_GPS.STONEHAM),
      ], 8),
      lanes: 2,
      speed: 60,
    });

    // Route: Neuville → Donnacona (côte)
    routes.push({
      id: 'route_cote_nord',
      name: 'Route côte nord',
      type: 'regional',
      waypoints: this.interpolateWaypoints([
        this.converter.getVillageCoords(PORTNEUF_GPS.NEUVILLE),
        this.converter.getVillageCoords(PORTNEUF_GPS.DONNACONA),
      ], 8),
      lanes: 2,
      speed: 70,
    });

    // Route: Saint-Gabriel → Saint-Raymond
    routes.push({
      id: 'route_gabriel_raymond',
      name: 'Route traversière',
      type: 'regional',
      waypoints: this.interpolateWaypoints([
        this.converter.getVillageCoords(PORTNEUF_GPS.SAINT_GABRIEL),
        this.converter.getVillageCoords(PORTNEUF_GPS.SAINT_RAYMOND),
      ], 8),
      lanes: 2,
      speed: 50,
    });

    return routes;
  }

  /**
   * Petits chemins historiques (d'époque, avant autoroute)
   * Chemins de terre, sentiers
   */
  private createHistoricPaths(): PortneufRoad[] {
    const paths: PortneufRoad[] = [];

    // Chemin du Lot - Entre Saint-Raymond et Portneuf
    paths.push({
      id: 'chemin_lot',
      name: 'Chemin du Lot (sentier historique)',
      type: 'historic',
      waypoints: this.createWindingPath(
        this.converter.getVillageCoords(PORTNEUF_GPS.SAINT_RAYMOND),
        this.converter.getVillageCoords(PORTNEUF_GPS.PORTNEUF_VILLAGE),
        0.1 // sinuosité élevée = chemin tortueux
      ),
      lanes: 1,
      speed: 30,
      historicalPeriod: '1800s',
    });

    // Chemin de la Montagne - Saint-Gabriel
    paths.push({
      id: 'chemin_montagne',
      name: 'Chemin de la Montagne',
      type: 'historic',
      waypoints: this.createWindingPath(
        this.converter.getVillageCoords(PORTNEUF_GPS.SAINT_GABRIEL),
        { x: this.converter.getVillageCoords(PORTNEUF_GPS.SAINT_GABRIEL).x + 200, 
          z: this.converter.getVillageCoords(PORTNEUF_GPS.SAINT_GABRIEL).z - 150 },
        0.15
      ),
      lanes: 1,
      speed: 25,
      historicalPeriod: '1700s',
    });

    // Vieux Chemin Royal - Donnacona vers Québec
    paths.push({
      id: 'vieux_chemin_royal',
      name: 'Vieux Chemin Royal',
      type: 'historic',
      waypoints: this.createWindingPath(
        this.converter.getVillageCoords(PORTNEUF_GPS.DONNACONA),
        this.converter.getVillageCoords(PORTNEUF_GPS.QUEBEC),
        0.08
      ),
      lanes: 1,
      speed: 35,
      historicalPeriod: '1600s-1800s',
    });

    return paths;
  }

  /**
   * Interpoler waypoints entre deux points (lissage)
   */
  private interpolateWaypoints(points: Array<{ x: number; z: number }>, divisions: number): Array<{ x: number; z: number }> {
    const result: Array<{ x: number; z: number }> = [];

    for (let i = 0; i < points.length - 1; i++) {
      result.push(points[i]);
      const p1 = points[i];
      const p2 = points[i + 1];

      for (let j = 1; j < divisions; j++) {
        const t = j / divisions;
        result.push({
          x: p1.x + (p2.x - p1.x) * t,
          z: p1.z + (p2.z - p1.z) * t,
        });
      }
    }

    result.push(points[points.length - 1]);
    return result;
  }

  /**
   * Créer chemin sinueux (tortueux)
   */
  private createWindingPath(start: { x: number; z: number }, end: { x: number; z: number }, sinuosity: number): Array<{ x: number; z: number }> {
    const path: Array<{ x: number; z: number }> = [start];
    const steps = 20;

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const baseX = start.x + (end.x - start.x) * t;
      const baseZ = start.z + (end.z - start.z) * t;

      // Ajouter sinuosité aléatoire
      const offset = Math.sin(i) * sinuosity * 100;
      path.push({
        x: baseX + offset,
        z: baseZ + offset * 0.5,
      });
    }

    path.push(end);
    return path;
  }

  /**
   * Obtenir toutes les routes
   */
  getRoads(): PortneufRoad[] {
    return this.roads;
  }

  /**
   * Obtenir route par ID
   */
  getRoadById(id: string): PortneufRoad | undefined {
    return this.roads.find(r => r.id === id);
  }

  /**
   * Obtenir routes par type
   */
  getRoadsByType(type: PortneufRoad['type']): PortneufRoad[] {
    return this.roads.filter(r => r.type === type);
  }
}

/**
 * Données de villages (architecture, positions)
 */
export interface PortneufVillageData {
  id: string;
  gps: { lat: number; lng: number };
  world: { x: number; z: number };
  name: string;
  population: number;
  era: string; // "1700s", "1800s", "1900s"
  architecture: 'rural' | 'suburban' | 'historic';
  buildingVariations: number; // Nombre de modèles de bâtiments différents
}

/**
 * Générateur complet de données Portneuf
 */
export const PORTNEUF_VILLAGES: PortneufVillageData[] = [
  {
    id: 'village_portneuf',
    gps: PORTNEUF_GPS.PORTNEUF_VILLAGE,
    world: new PortneufCoordinateConverter().getVillageCoords(PORTNEUF_GPS.PORTNEUF_VILLAGE),
    name: 'Portneuf',
    population: 5200,
    era: '1700s-1900s',
    architecture: 'historic',
    buildingVariations: 8,
  },
  {
    id: 'village_straymond',
    gps: PORTNEUF_GPS.SAINT_RAYMOND,
    world: new PortneufCoordinateConverter().getVillageCoords(PORTNEUF_GPS.SAINT_RAYMOND),
    name: 'Saint-Raymond',
    population: 3800,
    era: '1800s',
    architecture: 'rural',
    buildingVariations: 6,
  },
  {
    id: 'village_gabriel',
    gps: PORTNEUF_GPS.SAINT_GABRIEL,
    world: new PortneufCoordinateConverter().getVillageCoords(PORTNEUF_GPS.SAINT_GABRIEL),
    name: 'Saint-Gabriel-de-Valcartier',
    population: 2100,
    era: '1700s',
    architecture: 'historic',
    buildingVariations: 5,
  },
  {
    id: 'village_stoneham',
    gps: PORTNEUF_GPS.STONEHAM,
    world: new PortneufCoordinateConverter().getVillageCoords(PORTNEUF_GPS.STONEHAM),
    name: 'Stoneham-Tewkesbury',
    population: 1900,
    era: '1900s',
    architecture: 'suburban',
    buildingVariations: 4,
  },
  {
    id: 'village_donnacona',
    gps: PORTNEUF_GPS.DONNACONA,
    world: new PortneufCoordinateConverter().getVillageCoords(PORTNEUF_GPS.DONNACONA),
    name: 'Donnacona',
    population: 6300,
    era: '1900s',
    architecture: 'suburban',
    buildingVariations: 7,
  },
  {
    id: 'village_neuville',
    gps: PORTNEUF_GPS.NEUVILLE,
    world: new PortneufCoordinateConverter().getVillageCoords(PORTNEUF_GPS.NEUVILLE),
    name: 'Neuville',
    population: 3200,
    era: '1800s-1900s',
    architecture: 'historic',
    buildingVariations: 6,
  },
];

export default {
  PortneufCoordinateConverter,
  PortneufRoadNetwork,
  PORTNEUF_GPS,
  PORTNEUF_VILLAGES,
};
