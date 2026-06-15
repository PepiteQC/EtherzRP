/**
 * src/world/roads/AdvancedRoadSystem.ts
 * 
 * Générateur AAA de "Belles Routes" AAA AAA pour EtherWorld (Québec & Route 138).
 * Construit un réseau routier CatmullRom Bézier d'une esthétique saisissante :
 * - Bitume ardoise sombre avec agrégats et usure réaliste
 * - Double ligne jaune centrale immaculée pour la Route 138 Principale
 * - Bordures blanches continues d'accotements avec réflecteurs de sécurité
 * - Bordures de trottoirs surélevées en béton dans les traversées de villages (Donnacona, Neuville)
 * - Carrefours giratoires fleuris et signalisation institutionnelle debout
 */

import * as THREE from 'three';
import type { PortneufRoad } from '../data/PortneufGeographicData';

export interface RoadIntersection {
  position: THREE.Vector3;
  roads: string[];
  type: 'cross' | 'tee' | 'roundabout';
}

export interface RoadSegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  controlPoints?: THREE.Vector3[];
  width: number;
  lanes: number;
  markings: 'dashed' | 'solid' | 'double' | 'none';
  type: 'highway' | 'regional' | 'street' | 'rural' | 'historic';
}

export class AdvancedRoadGenerator {
  private static textureCache = new Map<string, THREE.Texture>();

  /**
   * Construction de Route Bézier Maîtresse Raccourcissant "Belles Routes"
   */
  static createCurvedRoad(roadDef: PortneufRoad, materialLibrary: any): THREE.Group {
    const group = new THREE.Group();
    group.name  = `BeautifulRoad_${roadDef.id}`;

    // Aiguillage géospatial par waypoints
    for (let i = 0; i < roadDef.waypoints.length - 1; i++) {
      const curr = roadDef.waypoints[i];
      const next = roadDef.waypoints[i + 1];

      const controlPoints = this.generateBezierControlPoints(curr, next);

      const segment: RoadSegment = {
        start: new THREE.Vector3(curr.x, 0.01, curr.z),
        end:   new THREE.Vector3(next.x, 0.01, next.z),
        controlPoints,
        width: this.getRoadWidth(roadDef.type),
        lanes: roadDef.lanes,
        markings: this.getRoadMarkings(roadDef.type),
        type: roadDef.type as any,
      };

      // 1. Maille Tube Bézier Principale (Bitume Noir avec Double Ligne Jaune)
      const roadwayMesh = this.createRoadwayMesh(segment, roadDef);
      group.add(roadwayMesh);

      // 2. Bandes d'Accotements et Réflecteurs en zone Voie Rapide (Highway)
      if (roadDef.type === 'highway') {
        const shoulders = this.createShouldersAndReflectors(segment);
        group.add(shoulders);
      }

      // 3. Bordures de Trottoirs surélevées 3D dans les zones urbaines
      const rType = roadDef.type as string;
      if (rType === 'regional' || rType === 'street' || rType === 'rural') {
        const curbs = this.createElevatedCurbs(segment);
        group.add(curbs);
      }

      // 4. Panneaux de Signalisation Stratégique aux waypoints
      if (i % 2 === 0) {
        const roadSign = this.createStandingRoadShield(segment.start, roadDef);
        group.add(roadSign);
      }
    }

    return group;
  }

  private static generateBezierControlPoints(start: { x: number; z: number }, end: { x: number; z: number }): THREE.Vector3[] {
    const dx   = end.x - start.x;
    const dz   = end.z - start.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const off  = dist * 0.3;

    return [
      new THREE.Vector3(start.x + off, 0.01, start.z),
      new THREE.Vector3(end.x - off, 0.01, end.z),
    ];
  }

  /**
   * Maille Principale du Rendu Routier
   */
  private static createRoadwayMesh(segment: RoadSegment, roadDef: PortneufRoad): THREE.Mesh {
    const points = [segment.start, ...(segment.controlPoints || []), segment.end];
    const curve  = new THREE.CatmullRomCurve3(points);

    const roadGeo = new THREE.TubeGeometry(
      curve,
      80,                 // Forte densité de segments pour des virages parfaits
      segment.width / 2,  // Rayon
      12,                 // Segments radiaux
      false
    );

    const textureKey = `road_tex_${roadDef.type}_${segment.lanes}`;
    const texture    = this.getBeautifulRoadTexture(1024, roadDef.type, segment.markings);

    const material = new THREE.MeshStandardMaterial({
      color: 0x161d2b,     // Ardoise bitume luxueuse
      roughness: 0.35,     // Lisse pour capter merveilleusement la lumière
      metalness: 0.15,
      map: texture,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(roadGeo, material);
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Génération de Texture Routière Haute Définition (1024 px)
   */
  private static getBeautifulRoadTexture(size: number, type: string, markings: string): THREE.Texture {
    const cacheKey = `tex_${size}_${type}_${markings}`;
    if (this.textureCache.has(cacheKey)) return this.textureCache.get(cacheKey)!;

    const canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // 1. Base Asphalte Ardoise Bitume
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, size, size);

    // 2. Bruit d'agrégats (Speckles de bitume)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 400; i++) {
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }

    // 3. Peinture Réglementaire S.A.A.Q.
    const mid = size / 2;

    if (type === 'highway') {
      // ✨ DOUBLE LIGNE JAUNE CENTRALE IMMACULÉE
      ctx.fillStyle = '#FFEA00';
      ctx.fillRect(0, mid - 12, size, 8);
      ctx.fillRect(0, mid + 4,  size, 8);

      // ✨ BORDURES BLANCHES CONTINUES SUR lES RIVES D'ACCOTEMENT
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 32, size, 12);
      ctx.fillRect(0, size - 44, size, 12);
    } else if (type === 'regional') {
      // Ligne Jaune Pointillée Centrale
      ctx.fillStyle = '#FFEA00';
      const stripeLen = 40;
      for (let x = 0; x < size; x += stripeLen * 2) {
        ctx.fillRect(x, mid - 6, stripeLen, 12);
      }
      // Bordures blanches
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 20, size, 8);
      ctx.fillRect(0, size - 28, size, 8);
    } else if (type === 'street') {
      // Voie Urbaine Blanche
      ctx.fillStyle = '#FFFFFF';
      for (let x = 0; x < size; x += 30) {
        ctx.fillRect(x, mid - 4, 15, 8);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(15, 1); // Répétition fluide le long du tube
    tex.colorSpace = THREE.SRGBColorSpace;
    
    this.textureCache.set(cacheKey, tex);
    return tex;
  }

  /**
   * Ajoute Accotements de Sécurité et Réflecteurs Rapprochés
   */
  private static createShouldersAndReflectors(segment: RoadSegment): THREE.Group {
    const group = new THREE.Group();
    const halfW = segment.width / 2;

    // Lignes de catadioptres (Réflecteurs de chaussée)
    const points = [segment.start, segment.end];
    const curve  = new THREE.LineCurve3(segment.start, segment.end);
    const dist   = segment.start.distanceTo(segment.end);
    const count  = Math.floor(dist / 30);

    const refMat = new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#d97706', emissiveIntensity: 0.8 });
    const refGeo = new THREE.BoxGeometry(0.2, 0.05, 0.2);

    for (let i = 1; i < count; i++) {
      const pos = curve.getPointAt(i / count);
      const ref = new THREE.Mesh(refGeo, refMat);
      ref.position.set(pos.x, 0.03, pos.z);
      group.add(ref);
    }

    return group;
  }

  /**
   * Trottoirs et Bordures de Béton Surélevées 3D (0.15m) en Village
   */
  private static createElevatedCurbs(segment: RoadSegment): THREE.Group {
    const group = new THREE.Group();
    const halfW = segment.width / 2;
    const curve = new THREE.LineCurve3(segment.start, segment.end);

    const curbGeo = new THREE.TubeGeometry(curve, 32, 0.25, 6, false);
    const curbMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.95 });

    // Rive Nord
    const curbNorth = new THREE.Mesh(curbGeo, curbMat);
    curbNorth.position.y = 0.15;
    curbNorth.position.z -= halfW;
    curbNorth.castShadow = true;
    group.add(curbNorth);

    // Rive Sud
    const curbSouth = new THREE.Mesh(curbGeo, curbMat.clone());
    curbSouth.position.y = 0.15;
    curbSouth.position.z += halfW;
    curbSouth.castShadow = true;
    group.add(curbSouth);

    return group;
  }

  /**
   * Panneaux de Route 138 Debout aux Entrées
   */
  private static createStandingRoadShield(pos: THREE.Vector3, roadDef: PortneufRoad): THREE.Group {
    const group = new THREE.Group();
    
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 5, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: '#334155' });
    const post    = new THREE.Mesh(postGeo, postMat);
    post.position.set(pos.x + 8, 2.5, pos.z - 8);
    group.add(post);

    const shieldGeo = new THREE.BoxGeometry(2.5, 1.8, 0.1);
    const shieldMat = new THREE.MeshStandardMaterial({ color: roadDef.type === 'highway' ? '#003366' : '#166534' });
    const shield    = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(pos.x + 8, 4.5, pos.z - 7.95);
    group.add(shield);

    return group;
  }

  static getRoadWidth(type: string): number {
    switch (type) {
      case 'highway':  return 22; // 4 voies généreuses
      case 'regional': return 14; // 2 voies
      case 'street':   return 12; // Voie de Limoilou
      default:         return 10;
    }
  }

  static getRoadMarkings(type: string): RoadSegment['markings'] {
    return type === 'highway' ? 'double' : 'dashed';
  }
}

export default AdvancedRoadGenerator;
