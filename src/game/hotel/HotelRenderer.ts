// src/game/hotel/HotelRenderer.ts

import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface HotelRendererConfig {
  buildingWidth?: number;
  buildingDepth?: number;
  floorHeight?: number;
  floorCount?: number;
  corridorLength?: number;
  corridorWidth?: number;
}

export interface DoorOptions {
  isLocked?: boolean;
  hasActivity?: boolean;
  isPlayerRoom?: boolean;
}

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════

const DEFAULTS = {
  BUILDING_WIDTH:    20,
  BUILDING_DEPTH:    15,
  FLOOR_HEIGHT:       5,
  FLOOR_COUNT:        4,
  CORRIDOR_LENGTH:   30,
  CORRIDOR_WIDTH:     5,
  WALL_THICKNESS:     0.2,
  CEILING_HEIGHT:     3.5,
  ROOMS_PER_FLOOR:    5,
  ROOM_SPACING:       5,
  ROOM_START_X:     -10,
  DOOR_WIDTH:         1.5,
  DOOR_HEIGHT:        2.4,
  CORRIDOR_LIGHTS:    6,
  EXTERIOR_WINDOWS_X: 4,
  CARPET_WIDTH:       1.5,
} as const;

// ─── Material Colors ─────────────────────────────────────────

const COLOR = {
  BUILDING_FACADE:    0x2a2a3a,
  BUILDING_TRIM:      0x1a1a2a,
  ENTRANCE_GLASS:     0x88ccff,
  AWNING:             0x111111,
  SIGN_BACK:          0x111111,
  SIGN_TEXT:          0xffd700,
  WINDOW_FRAME:       0x333333,
  WINDOW_GLASS:       0x1e3a5f,
  WALL_INTERIOR:      0xf5f0e8,
  WALL_ACCENT:        0xe8e0d0,
  FLOOR_EVEN:         0x4a3728,
  FLOOR_ODD:          0x8b7355,
  CEILING:            0xffffff,
  LIGHT_TUBE:         0xffffee,
  CARPET_RED:         0x8b0000,
  CARPET_TRIM:        0x6b0000,
  DOOR_WOOD:          0x4a3728,
  DOOR_DARK:          0x2a1a0e,
  DOOR_GLASS:         0x88d8ff,
  NUMBER_PLATE:       0xffd700,
  ELEVATOR_DOOR:      0xcccccc,
  ELEVATOR_PANEL:     0x444444,
  BUTTON_ACTIVE:      0x00ff88,
  BUTTON_INACTIVE:    0x333333,
  COLUMN_MARBLE:      0xe8e0d0,
  BASEBOARD:          0x2a1a0e,
  PAINTING_FRAME:     0x5c3a1e,
  PLANT_POT:          0x5a3010,
  PLANT_LEAVES:       0x228B22,
  FIRE_EXTINGUISHER:  0xcc0000,
  EMERGENCY_SIGN:     0x00cc00,
  SKYLIGHT:           0x87ceeb,
} as const;

// ─── Reusable Geometry Cache ─────────────────────────────────

const _geoCache = new Map<string, THREE.BufferGeometry>();

function cachedBox(w: number, h: number, d: number): THREE.BoxGeometry {
  const key = `box_${w}_${h}_${d}`;
  if (!_geoCache.has(key)) _geoCache.set(key, new THREE.BoxGeometry(w, h, d));
  return _geoCache.get(key) as THREE.BoxGeometry;
}

function cachedPlane(w: number, h: number): THREE.PlaneGeometry {
  const key = `plane_${w}_${h}`;
  if (!_geoCache.has(key)) _geoCache.set(key, new THREE.PlaneGeometry(w, h));
  return _geoCache.get(key) as THREE.PlaneGeometry;
}

function cachedCylinder(rt: number, rb: number, h: number, s: number): THREE.CylinderGeometry {
  const key = `cyl_${rt}_${rb}_${h}_${s}`;
  if (!_geoCache.has(key)) _geoCache.set(key, new THREE.CylinderGeometry(rt, rb, h, s));
  return _geoCache.get(key) as THREE.CylinderGeometry;
}

// ─── Material Cache ──────────────────────────────────────────

const _matCache = new Map<string, THREE.MeshStandardMaterial>();

interface MatOpts {
  color: number;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  emissive?: number;
  emissiveIntensity?: number;
}

function mat(opts: MatOpts): THREE.MeshStandardMaterial {
  const key = JSON.stringify(opts);
  if (!_matCache.has(key)) {
    _matCache.set(key, new THREE.MeshStandardMaterial({
      color:             opts.color,
      roughness:         opts.roughness         ?? 0.6,
      metalness:         opts.metalness         ?? 0.0,
      transparent:       opts.transparent       ?? false,
      opacity:           opts.opacity           ?? 1.0,
      emissive:          opts.emissive          !== undefined ? new THREE.Color(opts.emissive) : undefined,
      emissiveIntensity: opts.emissiveIntensity ?? 0,
    }));
  }
  return _matCache.get(key)!;
}

// ─── Mesh Helpers ────────────────────────────────────────────

function mesh(
  geo: THREE.BufferGeometry,
  material: THREE.MeshStandardMaterial,
  px = 0, py = 0, pz = 0,
  castShadow = true,
  receiveShadow = true
): THREE.Mesh {
  const m = new THREE.Mesh(geo, material);
  m.position.set(px, py, pz);
  m.castShadow = castShadow;
  m.receiveShadow = receiveShadow;
  return m;
}

function pointLight(
  color: number,
  intensity: number,
  distance: number,
  px: number, py: number, pz: number
): THREE.PointLight {
  const l = new THREE.PointLight(color, intensity, distance);
  l.position.set(px, py, pz);
  return l;
}

// ═══════════════════════════════════════════════════════════════
//  HOTEL RENDERER
// ═══════════════════════════════════════════════════════════════

export class HotelRenderer {
  private readonly hotelGroup:     THREE.Group;
  private readonly exteriorGroup:  THREE.Group;
  private readonly interiorGroups: Map<number, THREE.Group> = new Map();
  private readonly disposables:    Set<THREE.Object3D>       = new Set();

  private readonly cfg: Required<HotelRendererConfig>;

  constructor(private readonly scene: THREE.Scene, config: HotelRendererConfig = {}) {
    this.cfg = {
      buildingWidth:   config.buildingWidth   ?? DEFAULTS.BUILDING_WIDTH,
      buildingDepth:   config.buildingDepth   ?? DEFAULTS.BUILDING_DEPTH,
      floorHeight:     config.floorHeight     ?? DEFAULTS.FLOOR_HEIGHT,
      floorCount:      config.floorCount      ?? DEFAULTS.FLOOR_COUNT,
      corridorLength:  config.corridorLength  ?? DEFAULTS.CORRIDOR_LENGTH,
      corridorWidth:   config.corridorWidth   ?? DEFAULTS.CORRIDOR_WIDTH,
    };

    this.hotelGroup    = new THREE.Group();
    this.hotelGroup.name = 'HotelRoot';
    this.exteriorGroup = new THREE.Group();
    this.exteriorGroup.name = 'HotelExterior';

    this.hotelGroup.add(this.exteriorGroup);
    this.scene.add(this.hotelGroup);
  }

  // ═══════════════════════════════════════════════════════════
  //  EXTERIOR
  // ═══════════════════════════════════════════════════════════

  buildExterior(): void {
    const { buildingWidth, buildingDepth, floorHeight, floorCount } = this.cfg;
    const buildingHeight = floorHeight * floorCount;

    // ── Main structure ──────────────────────────────────────

    // Facade
    this.exteriorGroup.add(
      mesh(
        cachedBox(buildingWidth, buildingHeight, buildingDepth),
        mat({ color: COLOR.BUILDING_FACADE, roughness: 0.3, metalness: 0.2 }),
        0, buildingHeight / 2, 0
      )
    );

    // Floor separator ledges
    for (let f = 0; f <= floorCount; f++) {
      const ledge = mesh(
        cachedBox(buildingWidth + 0.5, 0.2, buildingDepth + 0.5),
        mat({ color: COLOR.BUILDING_TRIM, roughness: 0.4, metalness: 0.3 }),
        0, f * floorHeight, 0
      );
      ledge.castShadow = true;
      this.exteriorGroup.add(ledge);
    }

    // Roof parapet
    this.exteriorGroup.add(
      mesh(
        cachedBox(buildingWidth + 1, 0.8, buildingDepth + 1),
        mat({ color: COLOR.BUILDING_TRIM, roughness: 0.4, metalness: 0.3 }),
        0, buildingHeight + 0.4, 0
      )
    );

    // ── Entrance ────────────────────────────────────────────
    const entrance = this.buildEntrance();
    entrance.position.set(0, 0, buildingDepth / 2);
    this.exteriorGroup.add(entrance);

    // ── Sign ────────────────────────────────────────────────
    const sign = this.buildHotelSign();
    sign.position.set(0, buildingHeight - 2, buildingDepth / 2 + 0.1);
    this.exteriorGroup.add(sign);

    // ── Exterior windows ─────────────────────────────────────
    for (let floor = 0; floor < floorCount; floor++) {
      for (let x = 0; x < DEFAULTS.EXTERIOR_WINDOWS_X; x++) {
        const w = this.buildExteriorWindow(floor);
        w.position.set(
          -buildingWidth / 2 + 3 + x * 4.5,
          2 + floor * floorHeight,
          buildingDepth / 2
        );
        this.exteriorGroup.add(w);
      }
    }

    // ── Corner columns ───────────────────────────────────────
    const colPositions: [number, number][] = [
      [-buildingWidth / 2, -buildingDepth / 2],
      [ buildingWidth / 2, -buildingDepth / 2],
      [-buildingWidth / 2,  buildingDepth / 2],
      [ buildingWidth / 2,  buildingDepth / 2],
    ];
    for (const [cx, cz] of colPositions) {
      this.exteriorGroup.add(
        mesh(
          cachedBox(0.6, buildingHeight, 0.6),
          mat({ color: COLOR.BUILDING_TRIM, roughness: 0.3, metalness: 0.4 }),
          cx, buildingHeight / 2, cz
        )
      );
    }

    // ── Ground spotlights ────────────────────────────────────
    for (let i = -2; i <= 2; i++) {
      const spot = new THREE.SpotLight(0xfff8e0, 1.5, 20, Math.PI / 8, 0.4);
      spot.position.set(i * 4, 0.1, buildingDepth / 2 + 3);
      spot.target.position.set(i * 4, buildingHeight * 0.4, buildingDepth / 2);
      this.exteriorGroup.add(spot);
      this.exteriorGroup.add(spot.target);
    }

    this.disposables.add(this.exteriorGroup);
  }

  private buildEntrance(): THREE.Group {
    const g = new THREE.Group();
    g.name = 'HotelEntrance';

    // Revolving door glass panels
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const panel = mesh(
        cachedBox(1.4, 2.8, 0.06),
        mat({ color: COLOR.ENTRANCE_GLASS, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.35 }),
        Math.cos(angle) * 0.7, 1.4, Math.sin(angle) * 0.7,
        false, false
      );
      panel.rotation.y = angle;
      g.add(panel);
    }

    // Revolving door hub
    g.add(
      mesh(
        cachedCylinder(0.08, 0.08, 2.8, 8),
        mat({ color: COLOR.WINDOW_FRAME, roughness: 0.2, metalness: 0.9 }),
        0, 1.4, 0
      )
    );

    // Awning
    g.add(
      mesh(
        cachedBox(6, 0.1, 2.5),
        mat({ color: COLOR.AWNING, roughness: 0.3, metalness: 0.8 }),
        0, 3.6, 1.2
      )
    );

    // Awning underside glow
    g.add(
      mesh(
        cachedBox(5.8, 0.04, 2.3),
        mat({ color: 0xfff8e0, roughness: 0.1, emissive: 0xfff8e0, emissiveIntensity: 0.2 }),
        0, 3.53, 1.2,
        false, false
      )
    );

    // Awning support arms
    for (const ax of [-2.5, 2.5]) {
      g.add(
        mesh(
          cachedBox(0.05, 1.5, 0.05),
          mat({ color: COLOR.WINDOW_FRAME, roughness: 0.2, metalness: 0.9 }),
          ax, 2.85, 2.35
        )
      );
    }

    // Welcome mat
    g.add(
      mesh(
        cachedBox(3, 0.04, 1.5),
        mat({ color: 0x1a1a1a, roughness: 0.95 }),
        0, 0.02, 1.2
      )
    );

    // Door light
    g.add(pointLight(0xfff8e0, 2, 10, 0, 3.5, 1));

    return g;
  }

  private buildHotelSign(): THREE.Group {
    const g = new THREE.Group();
    g.name = 'HotelSign';

    // Backplate
    g.add(
      mesh(
        cachedBox(9, 1.8, 0.15),
        mat({ color: COLOR.SIGN_BACK, roughness: 0.3 }),
        0, 0, 0
      )
    );

    // Inner glow surface
    g.add(
      mesh(
        cachedBox(8.4, 1.2, 0.04),
        mat({ color: COLOR.SIGN_TEXT, roughness: 0.05, emissive: COLOR.SIGN_TEXT, emissiveIntensity: 1.8 }),
        0, 0, 0.1,
        false, false
      )
    );

    // Side neon rods
    for (const sx of [-4, 4]) {
      g.add(
        mesh(
          cachedBox(0.1, 1.8, 0.1),
          mat({ color: COLOR.SIGN_TEXT, roughness: 0.1, emissive: COLOR.SIGN_TEXT, emissiveIntensity: 2 }),
          sx, 0, 0.08,
          false, false
        )
      );
    }

    // Point light for sign glow
    g.add(pointLight(COLOR.SIGN_TEXT, 3, 12, 0, 0, 1));

    return g;
  }

  private buildExteriorWindow(floor: number): THREE.Group {
    const g = new THREE.Group();

    // Frame
    g.add(
      mesh(
        cachedBox(1.8, 2.2, 0.12),
        mat({ color: COLOR.WINDOW_FRAME, roughness: 0.3, metalness: 0.6 }),
        0, 0, 0
      )
    );

    // Glass — random occupancy glow
    const isLit = (floor * 7 + Math.round(Math.random())) % 3 !== 0;
    const glowColor = isLit ? 0xffd580 : 0x1e3a5f;
    g.add(
      mesh(
        cachedBox(1.5, 1.9, 0.04),
        mat({
          color: glowColor,
          roughness: 0.05,
          metalness: 0.8,
          transparent: true,
          opacity: isLit ? 0.85 : 0.3,
          emissive: glowColor,
          emissiveIntensity: isLit ? 0.4 : 0,
        }),
        0, 0, 0.07,
        false, false
      )
    );

    // Mullion cross
    g.add(mesh(cachedBox(1.5, 0.04, 0.08), mat({ color: COLOR.WINDOW_FRAME, roughness: 0.3, metalness: 0.6 }), 0, 0, 0.1));
    g.add(mesh(cachedBox(0.04, 1.9, 0.08), mat({ color: COLOR.WINDOW_FRAME, roughness: 0.3, metalness: 0.6 }), 0, 0, 0.1));

    return g;
  }

  // ═══════════════════════════════════════════════════════════
  //  INTERIOR FLOOR
  // ═══════════════════════════════════════════════════════════

  buildFloorInterior(floor: number): THREE.Group {
    if (this.interiorGroups.has(floor)) {
      return this.interiorGroups.get(floor)!;
    }

    const g = new THREE.Group();
    g.name = `Floor_${floor}`;

    const { corridorLength, corridorWidth } = this.cfg;
    const halfLen = corridorLength / 2;
    const halfWid = corridorWidth / 2;
    const isEven = floor % 2 === 0;

    // ── Floor ────────────────────────────────────────────────

    // Base floor
    g.add(
      mesh(
        cachedPlane(corridorLength, corridorWidth),
        mat({ color: isEven ? COLOR.FLOOR_EVEN : COLOR.FLOOR_ODD, roughness: 0.3, metalness: 0.1 }),
        0, 0, 0, false, true
      )
    );
    g.children[0].rotation.x = -Math.PI / 2;

    // Parquet planks overlay
    const plankMat = mat({ color: isEven ? 0x5a4338 : 0x9b8365, roughness: 0.4 });
    for (let i = 0; i < Math.floor(corridorLength / 0.5); i++) {
      const plank = mesh(
        cachedBox(0.48, 0.005, corridorWidth - 0.2),
        plankMat,
        -halfLen + 0.25 + i * 0.5, 0.003, 0,
        false, true
      );
      g.add(plank);
    }

    // ── Carpet strip ─────────────────────────────────────────

    const carpetStrip = mesh(
      cachedBox(corridorLength - 2, 0.005, DEFAULTS.CARPET_WIDTH),
      mat({ color: COLOR.CARPET_RED, roughness: 0.9 }),
      0, 0.005, 0,
      false, true
    );
    g.add(carpetStrip);

    // Carpet trim lines
    for (const tz of [-DEFAULTS.CARPET_WIDTH / 2, DEFAULTS.CARPET_WIDTH / 2]) {
      g.add(
        mesh(
          cachedBox(corridorLength - 2, 0.006, 0.05),
          mat({ color: COLOR.CARPET_TRIM, roughness: 0.9 }),
          0, 0.006, tz,
          false, false
        )
      );
    }

    // ── Walls ────────────────────────────────────────────────

    const wallMat = mat({ color: COLOR.WALL_INTERIOR, roughness: 0.6 });
    const wallH = DEFAULTS.CEILING_HEIGHT;

    // Left wall (z = -halfWid)
    const leftWall = mesh(
      cachedBox(corridorLength, wallH, DEFAULTS.WALL_THICKNESS),
      wallMat,
      0, wallH / 2, -halfWid
    );
    g.add(leftWall);

    // Right wall (z = +halfWid)
    const rightWall = mesh(
      cachedBox(corridorLength, wallH, DEFAULTS.WALL_THICKNESS),
      wallMat,
      0, wallH / 2, halfWid
    );
    g.add(rightWall);

    // End cap walls
    for (const ex of [-halfLen, halfLen]) {
      g.add(
        mesh(
          cachedBox(DEFAULTS.WALL_THICKNESS, wallH, corridorWidth),
          wallMat,
          ex, wallH / 2, 0
        )
      );
    }

    // Wall accent strip (wainscoting)
    const accentMat = mat({ color: COLOR.WALL_ACCENT, roughness: 0.5 });
    for (const wz of [-halfWid, halfWid]) {
      g.add(mesh(cachedBox(corridorLength, 0.8, 0.03), accentMat, 0, 0.4, wz + (wz < 0 ? 0.11 : -0.11), false, false));
      g.add(mesh(cachedBox(corridorLength, 0.04, 0.04), accentMat, 0, 0.82, wz + (wz < 0 ? 0.11 : -0.11), false, false));
    }

    // Baseboards
    const baseboardMat = mat({ color: COLOR.BASEBOARD, roughness: 0.5 });
    for (const wz of [-halfWid, halfWid]) {
      g.add(mesh(cachedBox(corridorLength, 0.12, 0.05), baseboardMat, 0, 0.06, wz + (wz < 0 ? 0.12 : -0.12), false, false));
    }

    // ── Ceiling ──────────────────────────────────────────────

    const ceilingPlane = mesh(
      cachedPlane(corridorLength, corridorWidth),
      mat({ color: COLOR.CEILING, roughness: 0.8 }),
      0, wallH, 0,
      false, false
    );
    ceilingPlane.rotation.x = Math.PI / 2;
    g.add(ceilingPlane);

    // Crown molding
    for (const wz of [-halfWid, halfWid]) {
      g.add(mesh(cachedBox(corridorLength, 0.1, 0.08), mat({ color: 0xf0ede0, roughness: 0.4 }), 0, wallH - 0.05, wz + (wz < 0 ? 0.12 : -0.12), false, false));
    }

    // ── Ceiling lights ───────────────────────────────────────

    for (let i = 0; i < DEFAULTS.CORRIDOR_LIGHTS; i++) {
      const lx = -halfLen + 2.5 + i * ((corridorLength - 5) / (DEFAULTS.CORRIDOR_LIGHTS - 1));

      // Fixture housing
      g.add(
        mesh(
          cachedBox(0.6, 0.08, 0.35),
          mat({ color: 0x333333, roughness: 0.3, metalness: 0.6 }),
          lx, wallH - 0.04, 0
        )
      );

      // Neon tube
      g.add(
        mesh(
          cachedBox(0.5, 0.05, 0.3),
          mat({ color: COLOR.LIGHT_TUBE, roughness: 0.1, emissive: COLOR.LIGHT_TUBE, emissiveIntensity: 0.9 }),
          lx, wallH - 0.075, 0,
          false, false
        )
      );

      // Point light
      g.add(pointLight(0xffeedd, 0.6, 9, lx, wallH - 0.3, 0));
    }

    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0xfff5e0, 0.15);
    g.add(ambientLight);

    // ── Decorations ──────────────────────────────────────────

    this.addCorridorDecorations(g, floor, halfLen, halfWid, wallH);

    // ── Floor sign ───────────────────────────────────────────

    const floorSign = this.buildFloorSign(floor);
    floorSign.position.set(-halfLen + 0.5, wallH * 0.7, 0);
    g.add(floorSign);

    // ── Emergency exit sign ──────────────────────────────────

    const exitSign = this.buildExitSign();
    exitSign.position.set(halfLen - 0.1, wallH - 0.3, 0);
    g.add(exitSign);

    this.interiorGroups.set(floor, g);
    this.disposables.add(g);
    return g;
  }

  private addCorridorDecorations(
    g: THREE.Group,
    floor: number,
    halfLen: number,
    halfWid: number,
    wallH: number
  ): void {
    // Potted plants at each end
    for (const px of [-halfLen + 1.5, halfLen - 1.5]) {
      g.add(this.buildPottedPlant(px, 0, 0));
    }

    // Wall paintings on left wall
    for (let i = 0; i < 3; i++) {
      const painting = this.buildWallPainting(floor * 3 + i);
      painting.position.set(-halfLen + 5 + i * 7, wallH * 0.55, -halfWid + 0.12);
      g.add(painting);
    }

    // Fire extinguisher
    const extinguisher = this.buildFireExtinguisher();
    extinguisher.position.set(halfLen - 1, 0, -halfWid + 0.15);
    g.add(extinguisher);

    // Security camera
    const camera = this.buildSecurityCamera();
    camera.position.set(0, wallH - 0.2, halfWid - 0.15);
    g.add(camera);
  }

  private buildFloorSign(floor: number): THREE.Group {
    const g = new THREE.Group();

    g.add(
      mesh(
        cachedBox(0.06, 0.4, 0.25),
        mat({ color: 0x1a1a2e, roughness: 0.3 }),
        0, 0, 0
      )
    );

    // Glowing label strip
    g.add(
      mesh(
        cachedBox(0.02, 0.32, 0.2),
        mat({ color: 0x00e0ff, roughness: 0.05, emissive: 0x00e0ff, emissiveIntensity: 0.8 }),
        0.04, 0, 0,
        false, false
      )
    );

    return g;
  }

  private buildExitSign(): THREE.Group {
    const g = new THREE.Group();

    g.add(
      mesh(
        cachedBox(0.06, 0.15, 0.35),
        mat({ color: 0x004400, roughness: 0.3 }),
        0, 0, 0
      )
    );
    g.add(
      mesh(
        cachedBox(0.02, 0.1, 0.3),
        mat({ color: COLOR.EMERGENCY_SIGN, roughness: 0.05, emissive: COLOR.EMERGENCY_SIGN, emissiveIntensity: 1.2 }),
        0.04, 0, 0,
        false, false
      )
    );
    g.add(pointLight(COLOR.EMERGENCY_SIGN, 0.3, 3, 0.2, 0, 0));

    return g;
  }

  private buildPottedPlant(px: number, py: number, pz: number): THREE.Group {
    const g = new THREE.Group();
    g.position.set(px, py, pz);

    // Pot
    g.add(
      mesh(
        cachedCylinder(0.15, 0.18, 0.4, 10),
        mat({ color: COLOR.PLANT_POT, roughness: 0.7 }),
        0, 0.2, 0
      )
    );

    // Soil
    g.add(
      mesh(
        cachedCylinder(0.14, 0.14, 0.04, 10),
        mat({ color: 0x2a1a05, roughness: 0.98 }),
        0, 0.42, 0
      )
    );

    // Foliage spheres
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const r = i === 0 ? 0 : 0.12;
      const leafY = 0.55 + (i === 0 ? 0.18 : 0.08);
      g.add(
        mesh(
          new THREE.SphereGeometry(0.1 + (i === 0 ? 0.06 : 0), 8, 8),
          mat({ color: i % 2 === 0 ? COLOR.PLANT_LEAVES : 0x2E8B57, roughness: 0.9 }),
          Math.cos(angle) * r, leafY, Math.sin(angle) * r
        )
      );
    }

    return g;
  }

  private buildWallPainting(seed: number): THREE.Group {
    const g = new THREE.Group();
    const hue = (seed * 67) % 360;
    const paintColor = new THREE.Color(`hsl(${hue}, 40%, 30%)`).getHex();

    // Frame
    g.add(
      mesh(
        cachedBox(0.04, 0.55, 0.75),
        mat({ color: COLOR.PAINTING_FRAME, roughness: 0.6 }),
        0, 0, 0
      )
    );

    // Canvas
    g.add(
      mesh(
        cachedBox(0.02, 0.46, 0.64),
        mat({ color: paintColor, roughness: 0.8 }),
        0.02, 0, 0,
        false, false
      )
    );

    return g;
  }

  private buildFireExtinguisher(): THREE.Group {
    const g = new THREE.Group();

    // Cylinder body
    g.add(
      mesh(
        cachedCylinder(0.06, 0.07, 0.5, 10),
        mat({ color: COLOR.FIRE_EXTINGUISHER, roughness: 0.3, metalness: 0.4 }),
        0, 0.25, 0
      )
    );

    // Valve head
    g.add(
      mesh(
        cachedCylinder(0.04, 0.04, 0.08, 8),
        mat({ color: 0x888888, roughness: 0.2, metalness: 0.8 }),
        0, 0.54, 0
      )
    );

    // Hose
    g.add(
      mesh(
        cachedCylinder(0.015, 0.015, 0.25, 6),
        mat({ color: 0x111111, roughness: 0.8 }),
        0.08, 0.35, 0
      )
    );

    // Wall bracket
    g.add(
      mesh(
        cachedBox(0.15, 0.05, 0.12),
        mat({ color: 0x555555, roughness: 0.3, metalness: 0.7 }),
        -0.08, 0.3, 0
      )
    );

    return g;
  }

  private buildSecurityCamera(): THREE.Group {
    const g = new THREE.Group();

    // Housing
    g.add(
      mesh(
        cachedBox(0.1, 0.08, 0.18),
        mat({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.5 }),
        0, 0, 0
      )
    );

    // Lens
    g.add(
      mesh(
        cachedCylinder(0.025, 0.03, 0.07, 8),
        mat({ color: 0x111111, roughness: 0.1, metalness: 0.9 }),
        0, 0, -0.1
      )
    );

    // Recording LED
    g.add(
      mesh(
        new THREE.SphereGeometry(0.01, 6, 6),
        mat({ color: 0xff0000, roughness: 0.1, emissive: 0xff0000, emissiveIntensity: 1.5 }),
        0.04, 0.025, 0.07,
        false, false
      )
    );

    return g;
  }

  // ═══════════════════════════════════════════════════════════
  //  DOORS
  // ═══════════════════════════════════════════════════════════

  addDoorToCorridor(
    floorGroup: THREE.Group,
    roomNumber: string,
    position: number,
    options: DoorOptions = {}
  ): void {
    const { isLocked = true, hasActivity = false, isPlayerRoom = false } = options;
    const x = DEFAULTS.ROOM_START_X + position * DEFAULTS.ROOM_SPACING;
    const { corridorWidth } = this.cfg;
    const wallZ = corridorWidth / 2 - 0.1;

    const doorGroup = new THREE.Group();
    doorGroup.name = `Door_${roomNumber}`;

    // ── Door frame ────────────────────────────────────────────

    const frameColor = isPlayerRoom ? 0x8b5cf6 : 0x2a1a0e;
    const frameMat = mat({ color: frameColor, roughness: 0.5, metalness: 0.1 });

    // Side jambs
    for (const jx of [-0.78, 0.78]) {
      doorGroup.add(mesh(cachedBox(0.06, DEFAULTS.DOOR_HEIGHT + 0.15, 0.14), frameMat, jx, DEFAULTS.DOOR_HEIGHT / 2, 0));
    }
    // Top rail
    doorGroup.add(mesh(cachedBox(DEFAULTS.DOOR_WIDTH + 0.12, 0.08, 0.14), frameMat, 0, DEFAULTS.DOOR_HEIGHT + 0.08, 0));

    // ── Door panel ────────────────────────────────────────────

    const doorPanel = new THREE.Group();
    doorPanel.name = `DoorPanel_${roomNumber}`;

    // Pivot from left edge
    doorPanel.position.x = -DEFAULTS.DOOR_WIDTH / 2;

    const panelMesh = mesh(
      cachedBox(DEFAULTS.DOOR_WIDTH, DEFAULTS.DOOR_HEIGHT, 0.05),
      mat({
        color: isPlayerRoom ? 0x2a1a4e : COLOR.DOOR_WOOD,
        roughness: 0.4,
        metalness: 0.1,
      }),
      DEFAULTS.DOOR_WIDTH / 2,
      DEFAULTS.DOOR_HEIGHT / 2,
      0
    );
    panelMesh.name = 'DoorPanel';
    doorPanel.add(panelMesh);

    // Door inset panels (decorative)
    const insetMat = mat({ color: isPlayerRoom ? 0x1e0a3e : 0x3a2010, roughness: 0.5 });
    doorPanel.add(mesh(cachedBox(DEFAULTS.DOOR_WIDTH - 0.25, 0.9, 0.02), insetMat, DEFAULTS.DOOR_WIDTH / 2, DEFAULTS.DOOR_HEIGHT * 0.72, 0.03, false, false));
    doorPanel.add(mesh(cachedBox(DEFAULTS.DOOR_WIDTH - 0.25, 0.9, 0.02), insetMat, DEFAULTS.DOOR_WIDTH / 2, DEFAULTS.DOOR_HEIGHT * 0.38, 0.03, false, false));

    // Handle
    doorPanel.add(
      mesh(
        cachedBox(0.04, 0.12, 0.035),
        mat({ color: 0xc9a84c, roughness: 0.15, metalness: 0.9 }),
        DEFAULTS.DOOR_WIDTH - 0.22,
        DEFAULTS.DOOR_HEIGHT * 0.5,
        0.05
      )
    );

    // Peephole
    doorPanel.add(
      mesh(
        new THREE.SphereGeometry(0.025, 8, 8),
        mat({ color: 0x222222, roughness: 0.1, metalness: 0.9 }),
        DEFAULTS.DOOR_WIDTH / 2 + 0.1,
        DEFAULTS.DOOR_HEIGHT * 0.65,
        0.04
      )
    );

    doorGroup.add(doorPanel);

    // ── Lock LED indicator ────────────────────────────────────

    const ledColor = isLocked ? 0xff3333 : 0x00ff60;
    doorGroup.add(
      mesh(
        new THREE.SphereGeometry(0.025, 8, 8),
        mat({ color: ledColor, roughness: 0.05, emissive: ledColor, emissiveIntensity: 1.2 }),
        0.7, DEFAULTS.DOOR_HEIGHT * 0.55, 0.1,
        false, false
      )
    );
    doorGroup.add(pointLight(ledColor, 0.3, 1.5, 0.7, DEFAULTS.DOOR_HEIGHT * 0.55, 0.3));

    // ── Number plate ─────────────────────────────────────────

    doorGroup.add(
      mesh(
        cachedBox(0.35, 0.18, 0.025),
        mat({ color: COLOR.NUMBER_PLATE, roughness: 0.2, metalness: 0.8, emissive: COLOR.NUMBER_PLATE, emissiveIntensity: 0.3 }),
        0, DEFAULTS.DOOR_HEIGHT + 0.25, 0
      )
    );

    // ── Over-door light ───────────────────────────────────────

    doorGroup.add(
      mesh(
        cachedBox(0.7, 0.06, 0.12),
        mat({ color: COLOR.LIGHT_TUBE, roughness: 0.1, emissive: COLOR.LIGHT_TUBE, emissiveIntensity: 0.6 }),
        0, DEFAULTS.DOOR_HEIGHT + 0.6, 0,
        false, false
      )
    );
    doorGroup.add(pointLight(0xffeedd, 0.4, 3, 0, DEFAULTS.DOOR_HEIGHT + 0.5, 0.3));

    // ── Activity indicator ────────────────────────────────────

    if (hasActivity) {
      doorGroup.add(
        mesh(
          new THREE.SphereGeometry(0.02, 6, 6),
          mat({ color: 0xffaa00, roughness: 0.1, emissive: 0xffaa00, emissiveIntensity: 1.5 }),
          0, DEFAULTS.DOOR_HEIGHT + 0.08, 0.06,
          false, false
        )
      );
    }

    // ── Player room marker ────────────────────────────────────

    if (isPlayerRoom) {
      doorGroup.add(
        mesh(
          cachedBox(0.06, 0.5, 0.5),
          mat({ color: 0x8b5cf6, roughness: 0.1, emissive: 0x8b5cf6, emissiveIntensity: 0.6, transparent: true, opacity: 0.4 }),
          -0.84, DEFAULTS.DOOR_HEIGHT / 2, 0,
          false, false
        )
      );
    }

    // Position the whole door group
    doorGroup.position.set(x, 0, wallZ);
    floorGroup.add(doorGroup);
  }

  // ═══════════════════════════════════════════════════════════
  //  ELEVATOR
  // ═══════════════════════════════════════════════════════════

  buildElevator(_floor: number): THREE.Group {
    const g = new THREE.Group();
    g.name = 'Elevator';

    const ex = this.cfg.corridorLength / 2 - 1;
    const ez = 0;

    // ── Shaft surround ────────────────────────────────────────

    g.add(
      mesh(
        cachedBox(2.4, DEFAULTS.CEILING_HEIGHT, 0.15),
        mat({ color: COLOR.WALL_INTERIOR, roughness: 0.6 }),
        ex, DEFAULTS.CEILING_HEIGHT / 2, ez - 1.2
      )
    );

    // ── Doors ─────────────────────────────────────────────────

    const doorMat = mat({ color: COLOR.ELEVATOR_DOOR, roughness: 0.2, metalness: 0.85 });

    // Left panel
    const leftDoor = mesh(cachedBox(0.88, 2.2, 0.08), doorMat, ex - 0.44, 1.1, ez - 1.16);
    leftDoor.name = 'ElevatorLeft';
    g.add(leftDoor);

    // Right panel
    const rightDoor = mesh(cachedBox(0.88, 2.2, 0.08), doorMat, ex + 0.44, 1.1, ez - 1.16);
    rightDoor.name = 'ElevatorRight';
    g.add(rightDoor);

    // Door gap trim
    g.add(mesh(cachedBox(1.9, 2.3, 0.04), mat({ color: COLOR.BUILDING_TRIM, roughness: 0.3, metalness: 0.7 }), ex, 1.15, ez - 1.12));

    // Safety edge strips
    for (const dx of [-0.88, 0.88]) {
      g.add(
        mesh(
          cachedBox(0.04, 2.2, 0.02),
          mat({ color: 0xffaa00, roughness: 0.2, emissive: 0xffaa00, emissiveIntensity: 0.4 }),
          ex + dx, 1.1, ez - 1.1,
          false, false
        )
      );
    }

    // ── Control panel ─────────────────────────────────────────

    const panelGroup = new THREE.Group();
    panelGroup.position.set(ex + 1.1, 1.1, ez - 1.1);

    // Panel plate
    panelGroup.add(
      mesh(
        cachedBox(0.04, 0.6, 0.4),
        mat({ color: COLOR.ELEVATOR_PANEL, roughness: 0.3, metalness: 0.7 }),
        0, 0, 0
      )
    );

    // Floor buttons
    for (let f = 0; f < this.cfg.floorCount; f++) {
      panelGroup.add(
        mesh(
          new THREE.SphereGeometry(0.03, 8, 8),
          mat({ color: 0x555566, roughness: 0.3, metalness: 0.6 }),
          0, -0.18 + f * 0.12, -0.12 + f * 0.01
        )
      );
    }

    // Open/Close buttons
    for (const [bz, bColor] of [[-0.1, 0x00aaff], [0.1, 0xff4444]] as const) {
      panelGroup.add(
        mesh(
          new THREE.SphereGeometry(0.025, 8, 8),
          mat({ color: bColor, roughness: 0.2, metalness: 0.5 }),
          0, -0.25, bz
        )
      );
    }

    g.add(panelGroup);

    // ── Floor indicator display ───────────────────────────────

    g.add(
      mesh(
        cachedBox(0.04, 0.14, 0.25),
        mat({ color: 0x00ff88, roughness: 0.05, emissive: 0x00ff88, emissiveIntensity: 1.5 }),
        ex, 2.4, ez - 1.12,
        false, false
      )
    );

    // Triangle arrows (up/down)
    g.add(
      mesh(
        new THREE.ConeGeometry(0.04, 0.06, 3),
        mat({ color: COLOR.BUTTON_ACTIVE, roughness: 0.1, emissive: COLOR.BUTTON_ACTIVE, emissiveIntensity: 0.8 }),
        ex + 0.15, 2.45, ez - 1.12,
        false, false
      )
    );

    return g;
  }

  // ═══════════════════════════════════════════════════════════
  //  UTILITIES
  // ═══════════════════════════════════════════════════════════

  /** Récupère le groupe d'un étage chargé, null sinon */
  getFloorGroup(floor: number): THREE.Group | null {
    return this.interiorGroups.get(floor) ?? null;
  }

  /** Positionne un étage intérieur à la bonne hauteur Y */
  positionFloor(floor: number, floorGroup: THREE.Group): void {
    floorGroup.position.y = floor * this.cfg.floorHeight;
  }

  /** Masque/affiche un étage (LOD / culling) */
  setFloorVisible(floor: number, visible: boolean): void {
    const g = this.interiorGroups.get(floor);
    if (g) g.visible = visible;
  }

  /** Retourne le groupe racine de l'hôtel */
  getRootGroup(): THREE.Group {
    return this.hotelGroup;
  }

  /** Nettoie les géométries et matériaux managés */
  dispose(): void {
    this.scene.remove(this.hotelGroup);

    // Dispose all tracked children
    for (const obj of this.disposables) {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Only dispose instance-unique geometries (not cached ones)
          if (!(child.geometry instanceof THREE.BoxGeometry ||
                child.geometry instanceof THREE.PlaneGeometry ||
                child.geometry instanceof THREE.CylinderGeometry)) {
            child.geometry.dispose();
          }
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            (child.material as THREE.Material).dispose();
          }
        }
      });
    }

    this.interiorGroups.clear();
    this.disposables.clear();
  }

  /** Dispose les caches globaux de géométries et matériaux */
  static disposeCache(): void {
    for (const geo of _geoCache.values()) geo.dispose();
    for (const m of _matCache.values()) m.dispose();
    _geoCache.clear();
    _matCache.clear();
  }
}