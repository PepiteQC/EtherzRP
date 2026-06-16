/**
 * Re-export groupé de tous les engines TROXT.
 *
 * Permet d'écrire :
 *   import { VisualRecognitionEngine, buildReliefMesh } from 'troxt/engines';
 */

export * from './recognition/visual-recognition-engine';
export * from './recognition/subject-detector';
export * from './recognition/depth-estimator';
export * from './recognition/material-analyzer';

export * from './mesh/geometry-helpers';
export * from './mesh/relief-mesh-builder';
export * from './mesh/symmetry-mesh-builder';
export * from './mesh/intelligent-mesh-builder';
export * from './mesh/topology-fixer';

export * from './export/gltf-exporter';
export * from './export/obj-exporter';
export * from './export/manifest-writer';

export * from './autonomous/event-emitter';
export * from './autonomous/job-queue';
export * from './autonomous/autonomous-engine';

export * from './visual-forge/forge-validator';
export * from './visual-forge/forge-planner';
export * from './visual-forge/forge-runner';
