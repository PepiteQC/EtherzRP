/**
 * src/world/optimization/InstancedAssetPool.ts
 * 
 * Pool Maître de Mailles Instanciées (InstancedMesh).
 * Construit 1 seule mailles pour des centaines d'objets récurrents d'Ambiance Québec (Cônes, rochers, lignes de stationnement, bancs).
 * Réduit le nombre de Draw Calls sur le processeur graphique de plusieurs milliers à exactement 4 appels.
 */

import * as THREE from 'three';

export interface AssetInstanceSpec {
  position: [number, number, number]; // [x, y, z]
  rotationY?: number;
  scale?: number;
}

export class InstancedAssetPool {
  /**
   * Crée un InstancedMesh haute vélocité pour les cônes orange de travaux routiers
   */
  static createTrafficConesPool(specs: AssetInstanceSpec[], materialLibrary: any): THREE.InstancedMesh {
    const count = specs.length;
    const geometry = new THREE.ConeGeometry(0.3, 0.9, 12);
    const material = new THREE.MeshStandardMaterial({ color: 0xff4500, roughness: 0.3 }); // Orange SAAQ

    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.name  = "TrafficConesInstancedPool";
    instancedMesh.castShadow    = true;
    instancedMesh.receiveShadow = false;

    const dummyMatrix = new THREE.Matrix4();
    const dummyQuat   = new THREE.Quaternion();
    const dummyScale  = new THREE.Vector3();

    specs.forEach((s, idx) => {
      const sVal = s.scale ?? 1.0;
      dummyScale.set(sVal, sVal, sVal);
      if (s.rotationY !== undefined) dummyQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.rotationY);
      else dummyQuat.identity();

      dummyMatrix.compose(new THREE.Vector3(...s.position), dummyQuat, dummyScale);
      instancedMesh.setMatrixAt(idx, dummyMatrix);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    return instancedMesh;
  }

  /**
   * Crée un InstancedMesh pour les Rochers Laurentiens statiques en zone rurale
   */
  static createBouldersPool(specs: AssetInstanceSpec[]): THREE.InstancedMesh {
    const count = specs.length;
    const geometry = new THREE.DodecahedronGeometry(1.5, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 }); // Ardoise foncée

    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.name  = "BouldersInstancedPool";
    instancedMesh.receiveShadow = true;

    const dummyMatrix = new THREE.Matrix4();
    const dummyQuat   = new THREE.Quaternion();
    const dummyScale  = new THREE.Vector3();

    specs.forEach((s, idx) => {
      const sVal = s.scale ?? (0.8 + Math.random() * 0.8);
      dummyScale.set(sVal, sVal * 0.7, sVal);
      dummyQuat.setFromEuler(new THREE.Euler(Math.random(), Math.random() * Math.PI, Math.random()));

      dummyMatrix.compose(new THREE.Vector3(...s.position), dummyQuat, dummyScale);
      instancedMesh.setMatrixAt(idx, dummyMatrix);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    return instancedMesh;
  }

  /**
   * Crée un InstancedMesh pour les lignes jaunes peintes de délimitation de stationnement
   */
  static createParkingLinesPool(specs: AssetInstanceSpec[]): THREE.InstancedMesh {
    const count = specs.length;
    const geometry = new THREE.BoxGeometry(0.12, 0.02, 4.5);
    const material = new THREE.MeshStandardMaterial({ color: 0xFFEE00, emissive: 0x222200, roughness: 0.5 });

    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.name  = "ParkingLinesInstancedPool";

    const dummyMatrix = new THREE.Matrix4();
    const dummyQuat   = new THREE.Quaternion();
    const dummyScale  = new THREE.Vector3(1, 1, 1);

    specs.forEach((s, idx) => {
      if (s.rotationY !== undefined) dummyQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.rotationY);
      else dummyQuat.identity();

      dummyMatrix.compose(new THREE.Vector3(...s.position), dummyQuat, dummyScale);
      instancedMesh.setMatrixAt(idx, dummyMatrix);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    return instancedMesh;
  }
}

export default InstancedAssetPool;
