/**
 * Système de routes 3D optimisé pour EtherWorld RP
 * Génère les géométries de routes réutilisables
 */

import * as THREE from 'three';

export interface RoadMeshData {
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  bounds: { min: THREE.Vector3; max: THREE.Vector3 };
}

/**
 * Fabrique pour générer les géométries de routes
 */
export class RoadFactory {
  private materialCache = new Map<string, THREE.Material>();

  constructor() {
    this.initializeMaterials();
  }

  private initializeMaterials(): void {
    // Asphalte pour les routes standard
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    this.materialCache.set('asphalt', asphaltMat);

    // Route de campagne
    const dirtRoadMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    this.materialCache.set('dirt', dirtRoadMat);

    // Ligne blanche de séparation
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
    });
    this.materialCache.set('line', lineMat);

    // Ligne jaune double
    const yellowLineMat = new THREE.LineBasicMaterial({
      color: 0xffff00,
      linewidth: 2,
    });
    this.materialCache.set('yellowLine', yellowLineMat);
  }

  /**
   * Créer une route rectiligne
   */
  createStraightRoad(
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
    width: number,
    type: 'highway' | 'street' | 'road' = 'road'
  ): RoadMeshData {
    // Calculer la direction et la longueur
    const dx = endX - startX;
    const dz = endZ - startZ;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    // Créer la géométrie de la route
    const geometry = new THREE.PlaneGeometry(width, length);
    geometry.rotateX(-Math.PI / 2); // Placer à plat

    // Choisir le matériau
    const materialKey = type === 'highway' ? 'asphalt' : type === 'street' ? 'asphalt' : 'dirt';
    const material = this.materialCache.get(materialKey)!.clone();

    // Créer le mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(startX + dx / 2, 0, startZ + dz / 2);
    mesh.rotation.y = angle;

    // Calculer les limites
    const bounds = {
      min: new THREE.Vector3(
        Math.min(startX, endX) - width / 2,
        -1,
        Math.min(startZ, endZ) - width / 2
      ),
      max: new THREE.Vector3(
        Math.max(startX, endX) + width / 2,
        1,
        Math.max(startZ, endZ) + width / 2
      ),
    };

    // Ajouter les lignes de démarcation pour les routes à plusieurs voies
    if (type === 'highway') {
      this.addHighwayMarkings(mesh, startX, startZ, endX, endZ, width);
    }

    return { mesh, geometry, material, bounds };
  }

  /**
   * Créer une route courbe
   */
  createCurvedRoad(
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
    curveControlX: number,
    curveControlZ: number,
    width: number
  ): RoadMeshData {
    // Utiliser une courbe de Bézier quadratique
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(startX, 0, startZ),
      new THREE.Vector3(curveControlX, 0, curveControlZ),
      new THREE.Vector3(endX, 0, endZ)
    );

    const tubeGeometry = new THREE.TubeGeometry(curve, 64, width / 2, 8, false);
    tubeGeometry.rotateX(-Math.PI / 2);

    const material = this.materialCache.get('asphalt')!.clone();
    const mesh = new THREE.Mesh(tubeGeometry, material);

    // Calculer les limites approximatives
    const bounds = {
      min: new THREE.Vector3(
        Math.min(startX, endX, curveControlX) - width,
        -1,
        Math.min(startZ, endZ, curveControlZ) - width
      ),
      max: new THREE.Vector3(
        Math.max(startX, endX, curveControlX) + width,
        1,
        Math.max(startZ, endZ, curveControlZ) + width
      ),
    };

    return { mesh, geometry: tubeGeometry, material, bounds };
  }

  /**
   * Ajouter les marquages d'autoroute (lignes blanches/jaunes)
   */
  private addHighwayMarkings(
    roadMesh: THREE.Mesh,
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
    width: number
  ): void {
    const dx = endX - startX;
    const dz = endZ - startZ;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    // Ligne jaune centre pour deux sens
    const centerLineGeo = new THREE.BufferGeometry();
    const positions = new Float32Array([
      startX, 0.01, startZ,
      endX, 0.01, endZ,
    ]);
    centerLineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const yellowLine = this.materialCache.get('yellowLine')!;
    const centerLine = new THREE.Line(centerLineGeo, yellowLine);
    roadMesh.add(centerLine);

    // Lignes blanches pointillées sur les côtés
    const dotSpacing = 10;
    for (let i = 0; i < length; i += dotSpacing) {
      const t = i / length;
      const x = startX + dx * t;
      const z = startZ + dz * t;

      // Perpendiculaire à la route
      const perpX = Math.cos(angle + Math.PI / 2);
      const perpZ = Math.sin(angle + Math.PI / 2);

      // Ligne blanche à gauche
      const leftGeo = new THREE.BufferGeometry();
      const leftPos = new Float32Array([
        x + perpX * (width / 2 - 1), 0.01, z + perpZ * (width / 2 - 1),
        x + perpX * (width / 2 - 1) + Math.cos(angle) * 3, 0.01, z + perpZ * (width / 2 - 1) + Math.sin(angle) * 3,
      ]);
      leftGeo.setAttribute('position', new THREE.BufferAttribute(leftPos, 3));
      const leftLine = new THREE.Line(leftGeo, this.materialCache.get('line')!);
      roadMesh.add(leftLine);

      // Ligne blanche à droite
      const rightGeo = new THREE.BufferGeometry();
      const rightPos = new Float32Array([
        x - perpX * (width / 2 - 1), 0.01, z - perpZ * (width / 2 - 1),
        x - perpX * (width / 2 - 1) + Math.cos(angle) * 3, 0.01, z - perpZ * (width / 2 - 1) + Math.sin(angle) * 3,
      ]);
      rightGeo.setAttribute('position', new THREE.BufferAttribute(rightPos, 3));
      const rightLine = new THREE.Line(rightGeo, this.materialCache.get('line')!);
      roadMesh.add(rightLine);
    }
  }

  /**
   * Créer une intersection simple
   */
  createIntersection(
    centerX: number,
    centerZ: number,
    roadWidthNS: number,
    roadWidthEW: number,
    intersectionSize: number = 50
  ): THREE.Group {
    const group = new THREE.Group();

    // Route nord-sud
    const nsGeo = new THREE.PlaneGeometry(roadWidthNS, intersectionSize);
    nsGeo.rotateX(-Math.PI / 2);
    const nsMaterial = this.materialCache.get('asphalt')!.clone();
    const nsMesh = new THREE.Mesh(nsGeo, nsMaterial);
    nsMesh.position.set(centerX, 0, centerZ);
    group.add(nsMesh);

    // Route est-ouest
    const ewGeo = new THREE.PlaneGeometry(roadWidthEW, intersectionSize);
    ewGeo.rotateX(-Math.PI / 2);
    const ewMaterial = this.materialCache.get('asphalt')!.clone();
    const ewMesh = new THREE.Mesh(ewGeo, ewMaterial);
    ewMesh.position.set(centerX, 0, centerZ);
    group.add(ewMesh);

    // Zone de croisement
    const crossGeo = new THREE.PlaneGeometry(roadWidthEW, roadWidthNS);
    crossGeo.rotateX(-Math.PI / 2);
    const crossMaterial = this.materialCache.get('asphalt')!.clone();
    const crossMesh = new THREE.Mesh(crossGeo, crossMaterial);
    crossMesh.position.set(centerX, 0.01, centerZ);
    group.add(crossMesh);

    return group;
  }

  /**
   * Créer un carrefour giratoire
   */
  createRoundabout(centerX: number, centerZ: number, radius: number): THREE.Group {
    const group = new THREE.Group();

    // Anneau externe
    const outerGeo = new THREE.RingGeometry(radius - 5, radius, 32);
    outerGeo.rotateX(-Math.PI / 2);
    const outerMaterial = this.materialCache.get('asphalt')!.clone();
    const outerMesh = new THREE.Mesh(outerGeo, outerMaterial);
    outerMesh.position.set(centerX, 0, centerZ);
    group.add(outerMesh);

    // Îlot central avec herbe
    const innerGeo = new THREE.CircleGeometry(radius - 8, 32);
    innerGeo.rotateX(-Math.PI / 2);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d8659,
      roughness: 0.8,
      metalness: 0.0,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMaterial);
    innerMesh.position.set(centerX, 0.05, centerZ);
    group.add(innerMesh);

    return group;
  }

  /**
   * Disposer les ressources
   */
  dispose(): void {
    this.materialCache.forEach((mat) => mat.dispose());
    this.materialCache.clear();
  }
}

export default RoadFactory;
