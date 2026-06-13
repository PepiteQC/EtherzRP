/**
 * AdvancedRoadSystem.ts - Système de routes courbes et réalistes
 * Remplace le simple RoadFactory avec courbes de Bezier et intersections
 */

import * as THREE from 'three';
import { PortneufRoad } from './PortneufGeographicData';

export interface RoadIntersection {
  position: THREE.Vector3;
  roads: string[]; // IDs des routes qui se croisent
  type: 'cross' | 'tee' | 'roundabout';
}

export interface RoadSegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  controlPoints?: THREE.Vector3[]; // Pour courbes de Bezier
  width: number;
  lanes: number;
  markings: 'dashed' | 'solid' | 'double' | 'none';
  type: 'highway' | 'street' | 'rural' | 'historic';
}

/**
 * Générateur de routes courbes réalistes
 */
export class AdvancedRoadGenerator {
  /**
   * Créer route lisse avec courbes de Bézier
   */
  static createCurvedRoad(road: PortneufRoad, materialLibrary: any): THREE.Group {
    const group = new THREE.Group();
    group.name = `road_${road.id}`;

    // Créer segments entre waypoints
    for (let i = 0; i < road.waypoints.length - 1; i++) {
      const current = road.waypoints[i];
      const next = road.waypoints[i + 1];
      
      // Déterminer contrôle points pour courbe lisse
      const controlPoints = this.generateBezierControlPoints(current, next);
      
      const segment: RoadSegment = {
        start: new THREE.Vector3(current.x, 0, current.z),
        end: new THREE.Vector3(next.x, 0, next.z),
        controlPoints,
        width: this.getRoadWidth(road.type),
        lanes: road.lanes,
        markings: this.getRoadMarkings(road.type),
        type: road.type as any,
      };

      const roadMesh = this.createRoadSegmentMesh(segment, materialLibrary, road);
      group.add(roadMesh);

      // Ajouter marquages
      const markings = this.createRoadMarkings(segment, road);
      group.add(markings);
    }

    return group;
  }

  /**
   * Générer points de contrôle pour courbes Bézier lisses
   */
  private static generateBezierControlPoints(
    start: { x: number; z: number },
    end: { x: number; z: number }
  ): THREE.Vector3[] {
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // Points de contrôle offset de 1/3 de la distance
    const offset = distance * 0.33;
    
    return [
      new THREE.Vector3(start.x + offset, 0, start.z),
      new THREE.Vector3(end.x - offset, 0, end.z),
    ];
  }

  /**
   * Créer mesh de route avec texture réaliste
   */
  private static createRoadSegmentMesh(
    segment: RoadSegment,
    materialLibrary: any,
    road: PortneufRoad
  ): THREE.Mesh {
    // Créer géométrie route courbe
    const points = [
      segment.start,
      ...segment.controlPoints || [],
      segment.end,
    ];

    const curve = new THREE.CatmullRomCurve3(points);
    const roadGeometry = new THREE.TubeGeometry(
      curve,
      64, // segments
      segment.width / 2, // radius
      8, // tube segments
      false
    );

    // Sélectionner matériel selon type
    let material: THREE.Material;
    
    switch (road.type) {
      case 'highway':
        material = new THREE.MeshStandardMaterial({
          color: 0x444444,
          roughness: 0.8,
          metalness: 0.1,
          map: this.createRoadTexture(512, 'asphalt_worn'),
        });
        break;
      case 'regional':
        material = new THREE.MeshStandardMaterial({
          color: 0x555555,
          roughness: 0.85,
          metalness: 0.05,
          map: this.createRoadTexture(512, 'asphalt_rural'),
        });
        break;
      case 'historic':
        material = new THREE.MeshStandardMaterial({
          color: 0x8B7355, // Couleur terre
          roughness: 0.9,
          metalness: 0,
          map: this.createRoadTexture(512, 'dirt_path'),
        });
        break;
      default:
        material = materialLibrary.get('street_asphalt');
    }

    const mesh = new THREE.Mesh(roadGeometry, material);
    mesh.userData = { roadId: road.id, roadType: road.type };
    return mesh;
  }

  /**
   * Créer texture procédurale pour route
   */
  private static createRoadTexture(size: number, type: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Texture de base
    if (type === 'asphalt_worn') {
      ctx.fillStyle = '#444444';
      ctx.fillRect(0, 0, size, size);
      
      // Ajouter variations de couleur (usure)
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
        ctx.fillRect(
          Math.random() * size,
          Math.random() * size,
          Math.random() * 50,
          Math.random() * 50
        );
      }
    } else if (type === 'dirt_path') {
      ctx.fillStyle = '#9B8B7D';
      ctx.fillRect(0, 0, size, size);
      
      // Texture terre
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(139, 115, 85, ${Math.random() * 0.4})`;
        ctx.fillRect(
          Math.random() * size,
          Math.random() * size,
          Math.random() * 60,
          Math.random() * 60
        );
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.repeat.set(10, 10);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Obtenir largeur route selon type
   */
  private static getRoadWidth(type: string): number {
    switch (type) {
      case 'highway':
        return 24; // 4 lanes x 6m
      case 'regional':
        return 14; // 2 lanes x 7m
      case 'rural':
        return 8;  // 1 lane x 8m
      case 'historic':
        return 6;  // Sentier étroit
      default:
        return 10;
    }
  }

  /**
   * Type de marquages route
   */
  private static getRoadMarkings(type: string): RoadSegment['markings'] {
    switch (type) {
      case 'highway':
        return 'double'; // Ligne jaune centre
      case 'regional':
        return 'dashed'; // Tiretés
      case 'rural':
        return 'dashed';
      case 'historic':
        return 'none'; // Pas de marquages
      default:
        return 'solid';
    }
  }

  /**
   * Créer marquages routes (lignes peintes)
   */
  private static createRoadMarkings(segment: RoadSegment, road: PortneufRoad): THREE.Group {
    const group = new THREE.Group();

    if (segment.markings === 'none') return group;

    const markingGeometry = new THREE.PlaneGeometry(20, 0.5);
    const markingMaterial = new THREE.MeshStandardMaterial({
      color: road.type === 'historic' ? 0xFFFFFF : 0xFFEE00, // Blanc ou jaune
      emissive: 0x444444,
      roughness: 0.3,
    });

    // Placer marquages le long de la route
    const distance = new THREE.Vector3().subVectors(segment.end, segment.start).length();
    const markingSpacing = segment.markings === 'dashed' ? 10 : 5;
    const markingCount = Math.floor(distance / markingSpacing);

    for (let i = 0; i < markingCount; i++) {
      const t = i / markingCount;
      const position = segment.start.clone().lerp(segment.end, t);
      position.y = 0.1;

      const marking = new THREE.Mesh(markingGeometry, markingMaterial);
      marking.position.copy(position);
      marking.rotation.x = -Math.PI / 2;
      
      group.add(marking);
    }

    return group;
  }

  /**
   * Créer intersection avec roundabout
   */
  static createRoundabout(position: THREE.Vector3, radius: number = 30): THREE.Group {
    const group = new THREE.Group();
    group.name = `roundabout_${position.x}_${position.z}`;

    // Cercle extérieur (asphalt)
    const outerGeometry = new THREE.CylinderGeometry(radius, radius, 0.2, 32);
    const outerMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
    });
    const outer = new THREE.Mesh(outerGeometry, outerMaterial);
    outer.position.copy(position);
    group.add(outer);

    // Cercle intérieur (gazon/végétation)
    const innerGeometry = new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, 0.3, 32);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0x2D5016, // Vert gazon
      roughness: 0.9,
    });
    const inner = new THREE.Mesh(innerGeometry, innerMaterial);
    inner.position.copy(position);
    inner.position.y = 0.1;
    group.add(inner);

    // Marquages circulaires
    const markingGeometry = new THREE.BufferGeometry();
    const markingPoints: number[] = [];
    
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const x = position.x + Math.cos(angle) * radius;
      const z = position.z + Math.sin(angle) * radius;
      markingPoints.push(x, position.y + 0.15, z);
    }
    
    markingGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(markingPoints), 3));
    
    const markingMaterial = new THREE.LineBasicMaterial({ color: 0xFFEE00, linewidth: 3 });
    const marking = new THREE.Line(markingGeometry, markingMaterial);
    group.add(marking);

    return group;
  }

  /**
   * Créer intersection tee (T)
   */
  static createTeeIntersection(position: THREE.Vector3): THREE.Group {
    const group = new THREE.Group();
    
    // Élargir zone intersection
    const intersectionGeometry = new THREE.PlaneGeometry(40, 40);
    const intersectionMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.8,
    });
    const intersection = new THREE.Mesh(intersectionGeometry, intersectionMaterial);
    intersection.position.copy(position);
    intersection.position.y = 0.05;
    intersection.rotation.x = -Math.PI / 2;
    group.add(intersection);

    return group;
  }
}

export default AdvancedRoadGenerator;
