/**
 * Système de bâtiments polytexturés, polymorphes et Props d'Ambiance Québec
 * Supporte Phase 1 (Matériaux propres, Fissures, Usure) et Phase 2 (Quartiers, Panneaux, Trottoirs, Végétation)
 */

import * as THREE from 'three';

export enum BuildingType {
  RESIDENTIAL = 'residential',
  COMMERCIAL  = 'commercial',
  INDUSTRIAL  = 'industrial',
  CIVIC       = 'civic',
  ROAD        = 'road',
  PARK        = 'park',
  PROP        = 'prop',       // Panneaux français, cônes, barrières, poubelles, bancs
  VEGETATION  = 'vegetation', // Forêts denses, rochers, neige sale
  SIDEWALK    = 'sidewalk',   // Trottoirs usés, stationnements peints
}

export enum TextureStyle {
  BRICK        = 'brick',
  CONCRETE     = 'concrete',
  WOOD         = 'wood',
  METAL        = 'metal',
  GLASS        = 'glass',
  STONE        = 'stone',
  ASPHALT_WORN = 'asphalt_worn', // Asphalte roughness élevé avec fissures
  BRICK_QUEBEC = 'brick_quebec', // Brique variations rouges/brunes traditionnelles
  SNOW_DIRT    = 'snow_dirt',    // Blend automne/hiver (neige sale bord de route)
  SIGN_FRENCH  = 'sign_french',  // Panneaux textuels fictifs (SAQ-like, Dépanneur, Route 138)
}

export interface BuildingConfig {
  id: string;
  type: BuildingType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  height: number;
  width: number;
  depth: number;
  textures: TextureStyle[];
  roofType?: 'flat' | 'pitched' | 'dome';
  windowCount?: { x: number; y: number };
  doorCount?: number;
  color?: number;
  metadata?: {
    propType?: 'sign_138' | 'sign_depanneur' | 'sign_sap' | 'sign_garage' | 'sign_motel' | 'sign_arret' | 'sign_police' | 'sign_hospital' | 'cone' | 'dumpster' | 'bench';
    customText?: string;
    signColor?: string;
    treeCount?: number;
    parkingSlots?: number;
    [key: string]: any;
  };
}

/**
 * 1. Bibliothèque de Matériaux Propres (Phase 1 & 2)
 */
export class MaterialLibrary {
  private materials = new Map<string, THREE.Material>();
  private textureCache = new Map<string, THREE.Texture>();

  constructor() {
    this.initializeDefaultMaterials();
    this.initializeProceduralTextures();
  }

  private initializeDefaultMaterials(): void {
    const brickMat = new THREE.MeshStandardMaterial({ color: 0xb44e3a, roughness: 0.85, side: THREE.DoubleSide });
    this.materials.set('brick', brickMat);

    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.95, side: THREE.DoubleSide });
    this.materials.set('concrete', concreteMat);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6b47, roughness: 0.65, side: THREE.DoubleSide });
    this.materials.set('wood', woodMat);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.35, metalness: 0.85, side: THREE.DoubleSide });
    this.materials.set('metal', metalMat);

    const glassMat = new THREE.MeshStandardMaterial({ color: 0xb3d9ff, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
    this.materials.set('glass', glassMat);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6e6e6e, roughness: 0.9, side: THREE.DoubleSide });
    this.materials.set('stone', stoneMat);

    const roofMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.75, metalness: 0.2, side: THREE.DoubleSide });
    this.materials.set('roof', roofMat);

    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.95, side: THREE.DoubleSide });
    this.materials.set('asphalt', asphaltMat);

    const grassMat = new THREE.MeshStandardMaterial({ color: 0x2d8659, roughness: 0.9, side: THREE.DoubleSide });
    this.materials.set('grass', grassMat);
  }

  private initializeProceduralTextures(): void {
    // Phase 1 : Asphalte avec roughness élevé et fissures
    const wornAsphaltTex = this.createCanvasTexture(512, 'asphalt_worn');
    const wornAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0x2e2e32,
      roughness: 0.98,
      metalness: 0.05,
      map: wornAsphaltTex,
      side: THREE.DoubleSide,
    });
    this.materials.set('asphalt_worn', wornAsphaltMat);

    // Phase 1 : Brique variations rouges/brunes du Québec
    const quebecBrickTex = this.createCanvasTexture(512, 'brick_quebec');
    const quebecBrickMat = new THREE.MeshStandardMaterial({
      color: 0x9e422e,
      roughness: 0.9,
      map: quebecBrickTex,
      side: THREE.DoubleSide,
    });
    this.materials.set('brick_quebec', quebecBrickMat);

    // Phase 1 : Neige/Saleté (blend automne/hiver bord de route)
    const snowDirtTex = this.createCanvasTexture(512, 'snow_dirt');
    const snowDirtMat = new THREE.MeshStandardMaterial({
      color: 0xe0e8f0,
      roughness: 0.95,
      map: snowDirtTex,
      side: THREE.DoubleSide,
    });
    this.materials.set('snow_dirt', snowDirtMat);
  }

  /**
   * Générateur de Canvas Textural procédural
   */
  private createCanvasTexture(size: number, type: string): THREE.CanvasTexture {
    if (this.textureCache.has(type)) {
      return this.textureCache.get(type)! as THREE.CanvasTexture;
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    if (type === 'asphalt_worn') {
      ctx.fillStyle = '#28282c';
      ctx.fillRect(0, 0, size, size);
      // Fissures / Usure
      ctx.strokeStyle = '#111113';
      ctx.lineWidth = 2;
      for (let i = 0; i < 25; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * size, Math.random() * size);
        ctx.lineTo(Math.random() * size, Math.random() * size);
        ctx.lineTo(Math.random() * size, Math.random() * size);
        ctx.stroke();
      }
    } else if (type === 'brick_quebec') {
      ctx.fillStyle = '#7a3122';
      ctx.fillRect(0, 0, size, size);
      // Variations de briques rouges et brunes
      const rows = 16;
      const cols = 8;
      const bw = size / cols;
      const bh = size / rows;
      for (let r = 0; r < rows; r++) {
        const offset = (r % 2) * (bw / 2);
        for (let c = -1; c < cols + 1; c++) {
          ctx.fillStyle = Math.random() > 0.5 ? '#9e3b2b' : Math.random() > 0.5 ? '#69261a' : '#54271f';
          ctx.fillRect(c * bw + offset + 1, r * bh + 1, bw - 2, bh - 2);
        }
      }
    } else if (type === 'snow_dirt') {
      // Blend hiver/automne
      ctx.fillStyle = '#f0f4f8';
      ctx.fillRect(0, 0, size, size);
      // Accumulation de boue/saleté et feuilles brunes
      for (let i = 0; i < 120; i++) {
        ctx.fillStyle = Math.random() > 0.7 ? 'rgba(100, 70, 50, 0.4)' : 'rgba(50, 50, 55, 0.25)';
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 8 + 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.textureCache.set(type, texture);
    return texture;
  }

  getMaterial(style: TextureStyle | string): THREE.Material {
    const key = style.toLowerCase();
    if (this.materials.has(key)) return this.materials.get(key)!.clone();
    return this.materials.get('concrete')!.clone();
  }

  getMaterialByKey(key: string): THREE.Material {
    return this.materials.get(key)?.clone() || this.materials.get('concrete')!.clone();
  }

  dispose(): void {
    this.materials.forEach(m => m.dispose());
    this.textureCache.forEach(t => t.dispose());
    this.materials.clear();
    this.textureCache.clear();
  }
}

/**
 * 2. Usine de Géométries de Bâtiments
 */
export class BuildingGeometryFactory {
  static createBox(width: number, height: number, depth: number): THREE.BoxGeometry {
    return new THREE.BoxGeometry(width, height, depth);
  }

  static createRoof(width: number, depth: number, height: number, style: 'flat' | 'pitched' | 'dome'): THREE.BufferGeometry {
    if (style === 'pitched') return this.createPitchedRoof(width, depth, height);
    if (style === 'dome') return this.createDomeRoof(width, depth, height);
    return new THREE.PlaneGeometry(width, depth);
  }

  private static createPitchedRoof(width: number, depth: number, height: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      -width / 2, 0, -depth / 2,
      width / 2, 0, -depth / 2,
      0, height, 0,
      width / 2, 0, depth / 2,
      -width / 2, 0, depth / 2,
      0, height, 0,
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    return geometry;
  }

  private static createDomeRoof(width: number, depth: number, height: number): THREE.BufferGeometry {
    return new THREE.SphereGeometry(Math.max(width, depth) / 2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  }

  static createWindow(width: number, height: number): THREE.PlaneGeometry {
    return new THREE.PlaneGeometry(width, height);
  }

  static createDoor(width: number, height: number): THREE.PlaneGeometry {
    return new THREE.PlaneGeometry(width, height);
  }
}

/**
 * 3. Bâtiment 3D Polymorphe — Gère Bâtiments, Trottoirs, Props et Végétation
 */
export class Building3D {
  config: BuildingConfig;
  mesh?: THREE.Group;
  materialLib: MaterialLibrary;
  private doorsMeshes: THREE.Mesh[] = [];
  private windowsMeshes: THREE.Mesh[] = [];

  constructor(config: BuildingConfig, materialLib: MaterialLibrary) {
    this.config = config;
    this.materialLib = materialLib;
  }

  createMesh(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(...this.config.position);
    group.rotation.set(...this.config.rotation);
    group.scale.set(...this.config.scale);
    group.name = `entity_${this.config.id}`;

    // Aiguillage selon le type d'entité
    if (this.config.type === BuildingType.PROP) {
      this.createPropEntity(group);
    } else if (this.config.type === BuildingType.VEGETATION) {
      this.createVegetationEntity(group);
    } else if (this.config.type === BuildingType.SIDEWALK) {
      this.createSidewalkEntity(group);
    } else {
      this.createStandardBuilding(group);
    }

    this.mesh = group;
    return this.mesh;
  }

  /**
   * Création de Bâtiment Standard (Maisons Québécoises, Commerces)
   */
  private createStandardBuilding(group: THREE.Group): void {
    const wallGeometry = BuildingGeometryFactory.createBox(this.config.width, this.config.height, this.config.depth);
    const wallMaterial = this.materialLib.getMaterial(this.config.textures[0] || 'concrete');
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.position.y = this.config.height / 2;
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    group.add(wallMesh);

    if (this.config.roofType) {
      const roofGeometry = BuildingGeometryFactory.createRoof(this.config.width, this.config.depth, this.config.height * 0.35, this.config.roofType);
      const roofMaterial = this.materialLib.getMaterialByKey('roof');
      const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
      roofMesh.position.y = this.config.height;
      roofMesh.castShadow = true;
      group.add(roofMesh);
    }

    if (this.config.windowCount) {
      this.addWindows(group, this.config.windowCount.x, this.config.windowCount.y);
    }

    if (this.config.doorCount && this.config.doorCount > 0) {
      this.addDoors(group, this.config.doorCount);
    }
  }

  /**
   * Création de Props d'Ambiance Québec (Panneaux, SAQ-like sans marque, Dépanneur)
   */
  private createPropEntity(group: THREE.Group): void {
    const propType = this.config.metadata?.propType || 'bench';
    const text = this.config.metadata?.customText || '';

    if (propType.startsWith('sign_')) {
      // Panneau sur poteau
      const postGeo = new THREE.CylinderGeometry(0.1, 0.1, this.config.height, 8);
      const postMat = this.materialLib.getMaterial('metal');
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.y = this.config.height / 2;
      group.add(post);

      // Panneau affichage
      const boardGeo = new THREE.BoxGeometry(this.config.width, this.config.height * 0.5, 0.15);
      const signColor = this.config.metadata?.signColor ? new THREE.Color(this.config.metadata.signColor) : new THREE.Color(0xb44e3a);
      const boardMat = new THREE.MeshStandardMaterial({ color: signColor });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.y = this.config.height * 0.85;
      board.position.z = 0.1;
      group.add(board);
    } else if (propType === 'dumpster') {
      const boxGeo = new THREE.BoxGeometry(3, 2, 2);
      const mat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 }); // Vert poubelle
      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.position.y = 1;
      group.add(mesh);
    } else if (propType === 'cone') {
      const coneGeo = new THREE.ConeGeometry(0.3, 0.9, 12);
      const mat = new THREE.MeshStandardMaterial({ color: 0xff4500, roughness: 0.3 }); // Orange vif
      const mesh = new THREE.Mesh(coneGeo, mat);
      mesh.position.y = 0.45;
      group.add(mesh);
    } else {
      // Banc de parc par défaut
      const seatGeo = new THREE.BoxGeometry(2.2, 0.15, 0.8);
      const mat = this.materialLib.getMaterial('wood');
      const seat = new THREE.Mesh(seatGeo, mat);
      seat.position.y = 0.5;
      group.add(seat);
    }
  }

  /**
   * Création de Forêts et Végétation denses Québécoises
   */
  private createVegetationEntity(group: THREE.Group): void {
    const count = this.config.metadata?.treeCount || 5;
    const spread = this.config.width / 2;

    const leavesGeo = new THREE.ConeGeometry(1.8, 4.5, 8);
    const leavesMat = this.materialLib.getMaterial('grass');
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
    const trunkMat = this.materialLib.getMaterial('wood');

    for (let i = 0; i < count; i++) {
      const treeGroup = new THREE.Group();
      const tx = (Math.random() - 0.5) * spread;
      const tz = (Math.random() - 0.5) * spread;
      const scale = 0.8 + Math.random() * 0.6;

      const trunk = new THREE.Mesh(trunkGeo, trunkMat.clone());
      trunk.position.y = 1;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Trois étages de sapin
      for (let j = 0; j < 3; j++) {
        const leaves = new THREE.Mesh(leavesGeo, leavesMat.clone());
        leaves.position.y = 2.5 + j * 1.5;
        const s = (3 - j) / 3;
        leaves.scale.set(s, s, s);
        leaves.castShadow = true;
        treeGroup.add(leaves);
      }

      treeGroup.position.set(tx, 0, tz);
      treeGroup.scale.set(scale, scale, scale);
      group.add(treeGroup);
    }
  }

  /**
   * Création de Trottoirs avec Bordures et Stationnements peints
   */
  private createSidewalkEntity(group: THREE.Group): void {
    // Dalle de béton de trottoir
    const sidewalkGeo = new THREE.BoxGeometry(this.config.width, 0.2, this.config.depth);
    const sidewalkMat = this.materialLib.getMaterial('concrete');
    const sidewalkMesh = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    sidewalkMesh.position.y = 0.1;
    sidewalkMesh.receiveShadow = true;
    group.add(sidewalkMesh);

    // Lignes de stationnement si spécifié
    const slots = this.config.metadata?.parkingSlots || 0;
    if (slots > 0) {
      const lineMat = new THREE.MeshStandardMaterial({ color: 0xFFEE00, emissive: 0x333300 });
      const slotWidth = this.config.width / slots;
      for (let i = 0; i < slots + 1; i++) {
        const lineGeo = new THREE.BoxGeometry(0.15, 0.02, 5);
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.set(-this.config.width / 2 + i * slotWidth, 0.21, 2.5);
        group.add(line);
      }
    }
  }

  private addWindows(group: THREE.Group, columnsX: number, rowsY: number): void {
    const windowMat = this.materialLib.getMaterial('glass');
    const windowWidth = this.config.width / (columnsX + 1);
    const windowHeight = this.config.height / (rowsY + 1);
    const windowGeo = BuildingGeometryFactory.createWindow(windowWidth * 0.75, windowHeight * 0.75);

    for (let y = 0; y < rowsY; y++) {
      for (let x = 0; x < columnsX; x++) {
        const windowMesh = new THREE.Mesh(windowGeo, windowMat.clone());
        windowMesh.position.set(
          -this.config.width / 2 + windowWidth * (x + 1),
          this.config.height - windowHeight * (y + 1),
          this.config.depth / 2 + 0.02
        );
        group.add(windowMesh);
        this.windowsMeshes.push(windowMesh);
      }
    }
  }

  private addDoors(group: THREE.Group, count: number): void {
    const doorMat = this.materialLib.getMaterial('wood');
    const doorWidth = this.config.width / (count + 1);
    const doorHeight = Math.min(this.config.height * 0.8, 3.5);
    const doorGeo = BuildingGeometryFactory.createDoor(doorWidth * 0.8, doorHeight);

    for (let i = 0; i < count; i++) {
      const doorMesh = new THREE.Mesh(doorGeo, doorMat.clone());
      doorMesh.position.set(
        -this.config.width / 2 + doorWidth * (i + 1),
        doorHeight / 2,
        this.config.depth / 2 + 0.02
      );
      group.add(doorMesh);
    }
  }

  dispose(): void {
    if (this.mesh) {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material?.dispose();
        }
      });
    }
  }
}

export default {
  Building3D,
  BuildingGeometryFactory,
  MaterialLibrary,
};
