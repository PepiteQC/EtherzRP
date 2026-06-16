/**
 * VisualRecognitionEngine — orchestrateur de reconnaissance visuelle.
 *
 * Stratégie en cascade :
 *   1. Toujours : SubjectDetector (CPU, instantané)
 *   2. Toujours : DepthEstimator luminance+saturation (CPU)
 *   3. Toujours : MaterialAnalyzer (CPU)
 *   4. Optionnel : TF.js (pose + segmentation) si disponible
 *   5. Optionnel : modèle serveur (MiDaS, depth-anything)
 *
 * Les modèles TF.js sont chargés en dynamic import pour ne pas alourdir
 * le bundle si l'utilisateur n'en a pas besoin.
 */

import type { SubjectType } from '@contracts/SubjectType';
import type { MaterialAnalysis } from './material-analyzer';
import { detectSubject, type SubjectDetection } from './subject-detector';
import {
  estimateFromLuminanceAndSaturation,
  type DepthResult,
} from './depth-estimator';
import { analyzeMaterials } from './material-analyzer';

export interface RecognizedElement {
  type:       'head' | 'body' | 'arm' | 'leg' | 'object' | 'accessory' | 'unknown';
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  shape:      'sphere' | 'cylinder' | 'box' | 'custom';
  estimatedDepth: number;        // 0..1
}

export interface SkeletonData {
  joints: Array<{
    name: string;
    position: { x: number; y: number; z: number };
    connections: string[];
  }>;
}

export interface PoseData {
  keypoints: Array<{
    name: string;
    position: { x: number; y: number };
    visibility: number;
  }>;
  facing: 'front' | 'back' | 'left' | 'right' | 'three-quarter';
}

export interface LightingAnalysis {
  direction: { x: number; y: number; z: number };
  intensity: number;             // 0..1
  shadows:   boolean;
  ambientOcclusion: number;      // 0..1
}

export interface ImageAnalysis {
  width:       number;
  height:      number;
  subject:     SubjectDetection;
  depth:       DepthResult;
  materials:   MaterialAnalysis[];
  elements:    RecognizedElement[];
  pose?:       PoseData;
  skeleton?:   SkeletonData;
  lighting:    LightingAnalysis;
  warnings:    string[];
}

export interface RecognitionOptions {
  enablePoseModel?:    boolean;
  enableSegmentation?: boolean;
  onProgress?:         (stage: string, pct: number) => void;
}

interface PoseModelHolder { detect: (img: HTMLImageElement) => Promise<any[]> }
interface SegmentationModelHolder { segment: (img: HTMLImageElement) => Promise<any> }

export class VisualRecognitionEngine {
  private poseModel:       PoseModelHolder | null = null;
  private segmentationModel: SegmentationModelHolder | null = null;
  private tfLoaded = false;

  /**
   * Initialise les modèles TF.js optionnels. Si les packages ne sont pas
   * installés, on log un avertissement et on continue sans.
   */
  async initialize(options: RecognitionOptions = {}): Promise<void> {
    if (this.tfLoaded) return;
    if (!options.enablePoseModel && !options.enableSegmentation) {
      return;
    }
    try {
      // Dynamic import : ne casse pas si @tensorflow/tfjs n'est pas installé.
      await import('@tensorflow/tfjs');
      await import('@tensorflow/tfjs-backend-webgl');
      if (options.enablePoseModel) {
        const mod = await import('@tensorflow-models/pose-detection').catch(() => null);
        if (mod) {
          const detector = await mod.createDetector(mod.SupportedModels.MoveNet, {
            modelType: 'SINGLEPOSE_THUNDER',
          });
          this.poseModel = { detect: (img) => detector.estimatePoses(img) };
        }
      }
      if (options.enableSegmentation) {
        const mod = await import('@tensorflow-models/body-segmentation').catch(() => null);
        if (mod) {
          const seg = await mod.load({
            architecture: 'MobileNetV3',
            outputStride: 16,
            multiplier: 1,
            quantBytes: 4,
          });
          this.segmentationModel = {
            segment: async (img) =>
              seg.segmentPeople(img, { flipHorizontal: false, segmentBodyParts: true }),
          };
        }
      }
      this.tfLoaded = true;
    } catch (err) {
      console.warn('[troxt.recognition] TF.js init échoué:', err);
    }
  }

  /**
   * Analyse complète d'une image (HTMLImageElement ou HTMLCanvasElement).
   */
  async analyze(
    source: HTMLImageElement | HTMLCanvasElement,
    options: RecognitionOptions = {},
  ): Promise<ImageAnalysis> {
    const { width, height } = source;
    const ctx = this.ensureContext(source);
    const imageData = ctx.getImageData(0, 0, width, height);
    return this.analyzeImageData(imageData, options, width, height);
  }

  /**
   * Variante : on passe directement l'ImageData.
   */
  async analyzeImageData(
    imageData: ImageData,
    options: RecognitionOptions = {},
    knownWidth?: number,
    knownHeight?: number,
  ): Promise<ImageAnalysis> {
    const w = knownWidth  ?? imageData.width;
    const h = knownHeight ?? imageData.height;
    const progress = options.onProgress ?? (() => {});

    progress('subject', 5);
    const subject = detectSubject(imageData);

    progress('depth', 25);
    const depth = estimateFromLuminanceAndSaturation(imageData, {
      blurRadius: 4,
      invert: false,
    });

    progress('materials', 45);
    const materials = analyzeMaterials(imageData);

    progress('lighting', 60);
    const lighting = this.analyzeLighting(imageData);

    let pose: PoseData | undefined;
    let skeleton: SkeletonData | undefined;
    let elements: RecognizedElement[] = [];

    if (this.poseModel || options.enablePoseModel) {
      try {
        progress('pose', 70);
        await this.initialize(options);
        if (this.poseModel) {
          const img = await this.imageDataToImage(imageData);
          const poses = await this.poseModel.detect(img);
          pose = this.processPoses(poses);
          if (pose.keypoints.length > 0) {
            skeleton = this.buildSkeleton(pose);
            elements = this.buildElements(pose, depth, w);
          }
        }
      } catch (err) {
        console.warn('[troxt.recognition] pose échoué:', err);
      }
    }

    const warnings: string[] = [];
    if (subject.confidence < 0.6) {
      warnings.push(`Sujet identifié avec confiance faible (${subject.confidence.toFixed(2)})`);
    }
    if (depth.strategy === 'brightness') {
      warnings.push('Profondeur estimée par luminance — qualité limitée');
    }
    if (pose && pose.keypoints.length === 0) {
      warnings.push('Aucune pose humaine détectée — reconstruction générique');
    }

    progress('done', 100);
    return {
      width: w,
      height: h,
      subject,
      depth,
      materials,
      elements,
      pose,
      skeleton,
      lighting,
      warnings,
    };
  }

  // ─────────────────────────────────────────────────────────
  //  Helpers privés
  // ─────────────────────────────────────────────────────────
  private ensureContext(source: HTMLImageElement | HTMLCanvasElement): CanvasRenderingContext2D {
    if (source instanceof HTMLCanvasElement) {
      const ctx = source.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context indisponible');
      return ctx;
    }
    const canvas = document.createElement('canvas');
    canvas.width  = source.naturalWidth;
    canvas.height = source.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponible');
    ctx.drawImage(source, 0, 0);
    return ctx;
  }

  private async imageDataToImage(imageData: ImageData): Promise<HTMLImageElement> {
    if (typeof document === 'undefined') {
      throw new Error('Reconnaissance TF.js requiert un navigateur');
    }
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = canvas.toDataURL('image/png');
    });
  }

  private processPoses(rawPoses: any[]): PoseData {
    if (!rawPoses || rawPoses.length === 0) {
      return { keypoints: [], facing: 'front' };
    }
    const pose = rawPoses[0];
    const keypoints = (pose.keypoints ?? []).map((kp: any) => ({
      name: kp.name,
      position: { x: kp.x, y: kp.y },
      visibility: kp.score ?? 0,
    }));
    const facing = this.detectFacing(keypoints);
    return { keypoints, facing };
  }

  private detectFacing(kps: Array<{ name: string; position: {x:number;y:number} }>):
    PoseData['facing']
  {
    const nose = kps.find((k) => k.name === 'nose');
    const ls = kps.find((k) => k.name === 'left_shoulder');
    const rs = kps.find((k) => k.name === 'right_shoulder');
    if (!nose || !ls || !rs) return 'front';
    const cx = (ls.position.x + rs.position.x) / 2;
    const offset = nose.position.x - cx;
    const sw = Math.abs(ls.position.x - rs.position.x);
    if (Math.abs(offset) < sw * 0.1) return 'front';
    if (Math.abs(offset) > sw * 0.3) return offset > 0 ? 'right' : 'left';
    return 'three-quarter';
  }

  private buildSkeleton(pose: PoseData): SkeletonData {
    const connections: Record<string, string[]> = {
      nose: ['left_eye', 'right_eye'],
      left_shoulder:  ['left_elbow',  'right_shoulder'],
      left_elbow:     ['left_wrist'],
      right_shoulder: ['right_elbow'],
      right_elbow:    ['right_wrist'],
      left_hip:       ['left_knee',   'right_hip'],
      left_knee:      ['left_ankle'],
      right_hip:      ['right_knee'],
      right_knee:     ['right_ankle'],
    };
    return {
      joints: pose.keypoints.map((kp) => ({
        name: kp.name,
        position: { x: kp.position.x, y: kp.position.y, z: 0 },
        connections: connections[kp.name] ?? [],
      })),
    };
  }

  private buildElements(pose: PoseData, depth: DepthResult, imageW: number): RecognizedElement[] {
    const out: RecognizedElement[] = [];
    const kp = (name: string) => pose.keypoints.find((k) => k.name === name);

    const box = (
      points: Array<{ position: {x:number;y:number} }>,
      padding: number,
    ) => {
      const xs = points.map((p) => p.position.x);
      const ys = points.map((p) => p.position.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const w = maxX - minX;
      const h = maxY - minY;
      return {
        x: minX - w * (padding - 1) / 2,
        y: minY - h * (padding - 1) / 2,
        width:  w * padding,
        height: h * padding,
      };
    };

    const avgDepth = (b: {x:number;y:number;width:number;height:number}) => {
      let sum = 0, n = 0;
      for (let yy = b.y; yy < b.y + b.height; yy += 5) {
        for (let xx = b.x; xx < b.x + b.width; xx += 5) {
          const idx = Math.floor(yy) * imageW + Math.floor(xx);
          if (idx >= 0 && idx < depth.map.length) {
            sum += depth.map[idx];
            n++;
          }
        }
      }
      return n > 0 ? sum / n : 0.5;
    };

    const nose = kp('nose'); const leye = kp('left_eye'); const reye = kp('right_eye');
    if (nose && leye && reye) {
      const headBox = box([nose, leye, reye], 1.5);
      out.push({
        type: 'head',
        boundingBox: headBox,
        confidence: Math.min(nose.visibility, leye.visibility, reye.visibility),
        shape: 'sphere',
        estimatedDepth: avgDepth(headBox),
      });
    }

    const ls = kp('left_shoulder'); const rs = kp('right_shoulder');
    const lh = kp('left_hip');      const rh = kp('right_hip');
    if (ls && rs && lh && rh) {
      const torsoBox = box([ls, rs, lh, rh], 1.2);
      out.push({
        type: 'body',
        boundingBox: torsoBox,
        confidence: 0.9,
        shape: 'box',
        estimatedDepth: avgDepth(torsoBox),
      });
    }

    const limbPairs = [
      ['left_shoulder',  'left_elbow',  'left_wrist',  true ],
      ['right_shoulder', 'right_elbow', 'right_wrist', true ],
      ['left_hip',       'left_knee',   'left_ankle',  false],
      ['right_hip',      'right_knee',  'right_ankle', false],
    ] as const;
    for (const [a, b, c, isArm] of limbPairs) {
      const pts = [kp(a), kp(b), kp(c)].filter((x): x is NonNullable<typeof x> => Boolean(x));
      if (pts.length >= 2) {
        const lb = box(pts, 1.3);
        out.push({
          type: isArm ? 'arm' : 'leg',
          boundingBox: lb,
          confidence: Math.min(...pts.map((p) => p.visibility)),
          shape: 'cylinder',
          estimatedDepth: avgDepth(lb),
        });
      }
    }
    return out;
  }

  private analyzeLighting(imageData: ImageData): LightingAnalysis {
    const { data, width, height } = imageData;
    let left = 0, right = 0, top = 0, bottom = 0;
    let total = 0;
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const idx = (y * width + x) * 4;
        const lum = (data[idx] + data[idx+1] + data[idx+2]) / 3;
        if (x < width / 2) left += lum; else right += lum;
        if (y < height / 2) top += lum;  else bottom += lum;
        total += lum;
      }
    }
    const denom = total || 1;
    const horizontal = (right - left) / denom;
    const vertical   = (bottom - top) / denom;
    const intensity  = denom / (width * height * 255);
    return {
      direction: { x: horizontal * 8, y: vertical * 8, z: 1 },
      intensity,
      shadows:   intensity > 0.6,
      ambientOcclusion: 0.3,
    };
  }
}
