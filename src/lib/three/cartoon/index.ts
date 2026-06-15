/**
 * Design System "Low-Poly Cartoon" — EtherWorld QC
 * Point d'entrée unique. À copier dans : src/lib/three/cartoon/index.ts
 *
 *   import { PALETTE, cartoonMat, CartoonStage, CartoonPostFX } from '@/lib/three/cartoon'
 */
export { default as PALETTE, HEX, UI, RENDER } from './cartoonTokens'
export { cartoonMat, glowMat, applyCartoonRenderer, clearMaterialCache } from './cartoonMaterials'
export { default as CartoonStage } from './CartoonStage'
export { default as CartoonPostFX, type FXQuality } from './CartoonPostFX'
