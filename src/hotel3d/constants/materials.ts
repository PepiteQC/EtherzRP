// src/hotel3d/constants/materials.ts

import * as THREE from 'three';
import { getTextureSet } from '../textures/ProceduralTextureFactory';

export const LIGHT_ON = 0xffd580;
export const LIGHT_OFF = 0x0a0e1a;

export interface MaterialSet {
  concreteMain: THREE.MeshStandardMaterial;
  concreteDark: THREE.MeshStandardMaterial;
  concreteLight: THREE.MeshStandardMaterial;
  concretePanel: THREE.MeshStandardMaterial;
  slab: THREE.MeshStandardMaterial;
  marble: THREE.MeshStandardMaterial;
  marbleFloor: THREE.MeshStandardMaterial;
  asphalt: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  glassClear: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  metalDark: THREE.MeshStandardMaterial;
  gold: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  doorMetal: THREE.MeshStandardMaterial;
  doorFace: THREE.MeshStandardMaterial;
  wallInterior: THREE.MeshStandardMaterial;
  wallpaper: THREE.MeshStandardMaterial;
  floorCarpet: THREE.MeshStandardMaterial;
  ceiling: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  woodDark: THREE.MeshStandardMaterial;
  leather: THREE.MeshStandardMaterial;
  leatherDark: THREE.MeshStandardMaterial;
  fabric: THREE.MeshStandardMaterial;
  fabricLight: THREE.MeshStandardMaterial;
  porcelain: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  exitSign: THREE.MeshStandardMaterial;
  ledStrip: THREE.MeshStandardMaterial;
  emissiveWarm: THREE.MeshStandardMaterial;
}

function mk(o: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial(o);
}

let _matCache: MaterialSet | null = null;

export function getMaterialSet(): MaterialSet {
  if (!_matCache) {
    const T = getTextureSet();
    const nv = (x: number, y: number) => new THREE.Vector2(x, y);

    _matCache = {
      concreteMain: mk({ map: T.concreteMain, normalMap: T.normalMain, roughnessMap: T.roughMain, color: 0x9a9fa8, roughness: 0.85, metalness: 0.04, normalScale: nv(1.2, 1.2) }),
      concreteDark: mk({ map: T.concreteDark, normalMap: T.normalMain, roughnessMap: T.roughMain, color: 0x6a7080, roughness: 0.9, metalness: 0.02 }),
      concreteLight: mk({ map: T.concreteLight, normalMap: T.normalPanel, roughnessMap: T.roughMain, color: 0xb0b5be, roughness: 0.82, metalness: 0.03, normalScale: nv(0.9, 0.9) }),
      concretePanel: mk({ map: T.concretePanel, normalMap: T.normalPanel, roughnessMap: T.roughMain, color: 0x8e939c, roughness: 0.88, metalness: 0.03 }),
      slab: mk({ map: T.concreteDark, normalMap: T.normalMain, roughnessMap: T.roughMain, color: 0x5a6070, roughness: 0.9, metalness: 0.03 }),
      marble: mk({ map: T.marble, normalMap: T.normalPanel, roughnessMap: T.roughSmooth, color: 0xe8d5b0, roughness: 0.12, metalness: 0.14, normalScale: nv(0.3, 0.3) }),
      marbleFloor: mk({ map: T.marble, normalMap: T.normalPanel, roughnessMap: T.roughSmooth, color: 0xd8c8a0, roughness: 0.10, metalness: 0.16, normalScale: nv(0.25, 0.25) }),
      asphalt: mk({ map: T.asphalt, color: 0x1a1b20, roughness: 0.96, metalness: 0 }),
      glass: mk({ map: T.glass, color: 0x7dd3fc, transparent: true, opacity: 0.28, roughness: 0.04, metalness: 0.1 }),
      glassClear: mk({ color: 0xd8f0ff, transparent: true, opacity: 0.15, roughness: 0.02, metalness: 0.05 }),
      metal: mk({ map: T.metal, color: 0x2a3040, roughness: 0.25, metalness: 0.85 }),
      metalDark: mk({ map: T.metal, color: 0x0e1520, roughness: 0.2, metalness: 0.9 }),
      gold: mk({ color: 0xc9a84c, metalness: 0.92, roughness: 0.12 }),
      frame: mk({ color: 0x1a2535, roughness: 0.2, metalness: 0.85 }),
      doorMetal: mk({ map: T.metal, color: 0x1a2535, metalness: 0.8, roughness: 0.2 }),
      doorFace: mk({ color: 0x0d1520, roughness: 0.15, metalness: 0.7 }),
      wallInterior: mk({ map: T.wallpaper, color: 0xf0ece4, roughness: 0.85, metalness: 0.02 }),
      wallpaper: mk({ map: T.wallpaper, color: 0xe8e4dc, roughness: 0.88, metalness: 0.01 }),
      floorCarpet: mk({ map: T.carpet, color: 0x2a2520, roughness: 0.95, metalness: 0 }),
      ceiling: mk({ color: 0xf2ece0, roughness: 0.7 }),
      wood: mk({ map: T.wood, color: 0x8b5e3c, roughness: 0.65, metalness: 0.05 }),
      woodDark: mk({ map: T.wood, color: 0x3a2515, roughness: 0.7, metalness: 0.04 }),
      leather: mk({ color: 0x1c140e, roughness: 0.85, metalness: 0.02 }),
      leatherDark: mk({ color: 0x150d08, roughness: 0.75, metalness: 0.03 }),
      fabric: mk({ color: 0x2a1c14, roughness: 0.92, metalness: 0 }),
      fabricLight: mk({ color: 0xd5cfc5, roughness: 0.9, metalness: 0 }),
      porcelain: mk({ color: 0xf5f2ee, roughness: 0.15, metalness: 0.05 }),
      chrome: mk({ color: 0xc0c5cc, roughness: 0.08, metalness: 0.95 }),
      exitSign: mk({ color: 0x00ff44, emissive: new THREE.Color(0x00ff44), emissiveIntensity: 2.0 }),
      ledStrip: mk({ color: 0x7dd3fc, emissive: new THREE.Color(0x7dd3fc), emissiveIntensity: 0.9 }),
      emissiveWarm: mk({ color: 0xffd580, emissive: new THREE.Color(0xffd580), emissiveIntensity: 1.2 }),
    };
  }
  return _matCache;
}

export function disposeMaterialSet(): void {
  if (_matCache) {
    Object.values(_matCache).forEach((m) => (m as THREE.MeshStandardMaterial).dispose());
    _matCache = null;
  }
}