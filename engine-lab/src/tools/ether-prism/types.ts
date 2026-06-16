// ═══════════════════════════════════════════════
// types.ts — EtherPrism
// Organe sensoriel de TroxT · Etherworld
// ═══════════════════════════════════════════════

import type { EtherPrismEvent, EtherPrismMode, EtherOutputFormat } from './types';

// ─── Modes ───
export type EtherPrismMode =
  | 'analyze'      // TroxT observe et décompose
  | 'transform'    // TroxT transforme la matière
  | 'generate'     // TroxT crée du neuf
  | 'orchestrate'; // TroxT coordonne tous les modules

// ─── Formats ───
export type EtherOutputFormat =
  | 'gltf' | 'obj' | 'fbx' | 'stl'      // 3D
  | 'png'  | 'webp' | 'svg' | 'avif'     // 2D
  | 'sprite-sheet' | 'atlas'              // Sprites
  | 'video' | 'gif'                       // Animé
  | 'shader'                              // Code shader
  | 'material';                           // Matériau PBR

// ─── Source ───
export interface EtherSource {
  type: 'file' | 'url' | 'base64' | 'canvas' | 'blob' | 'stream';
  data: File | string | HTMLCanvasElement | Blob | ReadableStream;
  mimeType?: string;
  name?: string;
  width?: number;
  height?: number;
}

// ─── Configuration ───
export interface EtherPrismConfig {
  outputFormat: EtherOutputFormat;
  quality: 'draft' | 'standard' | 'prism' | 'ultra';
  preservePalette: boolean;
  neuralDepth: number;        // 1-10 — profondeur d'analyse TroxT
  autoOrchestrate: boolean;
  compressOutput: boolean;
  batchMode: boolean;
  enhanceWithAI: boolean;
  syncToMemory: boolean;
}

export const DEFAULT_PRISM_CONFIG: EtherPrismConfig = {
  outputFormat: 'png',
  quality: 'standard',
  preservePalette: true,
  neuralDepth: 5,
  autoOrchestrate: true,
  compressOutput: false,
  batchMode: false,
  enhanceWithAI: true,
  syncToMemory: true,
};

// ─── Packet ───
export interface EtherPacket {
  id: string;
  source: EtherSource;
  mode: EtherPrismMode;
  config: EtherPrismConfig;
  createdAt: number;
  troxtSessionId: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  tags: string[];
}

// ─── Analyse ───
export interface EtherAnalysis {
  packetId: string;
  palette: EtherColor[];
  shapes: EtherShape[];
  complexity: number;           // 0-1
  dominantMood: EtherMood;
  suggestedOutputs: EtherOutputFormat[];
  troxtInsight: string;
  aiEnhancement?: AISuggestion;
  compressionStats?: CompressionStats;
  batchInfo?: BatchInfo;
}

export interface EtherColor {
  hex: string;
  name: string;
  weight: number;
  harmony: 'complementary' | 'analogous' | 'triadic' | 'monochromatic';
}

export interface EtherShape {
  type: 'organic' | 'geometric' | 'abstract' | 'chaotic' | 'fractal';
  confidence: number;
  regions: Array<{ x: number; y: number; w: number; h: number; label: string }>;
  complexity: number;
}

export type EtherMood =
  | 'serene' | 'energetic' | 'mystic'
  | 'dark' | 'luminous' | 'chaotic'
  | 'melancholic' | 'euphoric' | 'ethereal';

// ─── AI Enhancement ───
export interface AISuggestion {
  prompt: string;
  confidence: number;
  style: string;
  variations: string[];
}

// ─── Compression ───
export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  ratio: number;
  method: 'lossy' | 'lossless' | 'neural';
  quality: number;
}

// ─── Batch ───
export interface BatchInfo {
  total: number;
  processed: number;
  failed: number;
  estimatedTime: number;
}

// ─── Résultat ───
export interface EtherPrismResult {
  packetId: string;
  status: 'pending' | 'queued' | 'analyzing' | 'generating' | 'compressing' | 'complete' | 'error';
  analysis?: EtherAnalysis;
  output?: {
    url: string | Blob;
    format: EtherOutputFormat;
    size: number;
    generatedAt: number;
    thumbnail?: string;
  };
  error?: {
    code: string;
    message: string;
    troxtSuggestion?: string;
  };
  metadata?: {
    processingTime: number;
    troxtDecisions: string[];
    memorySynced: boolean;
  };
}

// ─── Événements vers TroxT ───
export type EtherPrismEvent =
  | { type: 'PRISM:packet_created';  packet: EtherPacket }
  | { type: 'PRISM:analysis_start';  packetId: string }
  | { type: 'PRISM:analysis_done';   packetId: string; analysis: EtherAnalysis }
  | { type: 'PRISM:ai_suggestion';   packetId: string; suggestion: AISuggestion }
  | { type: 'PRISM:generation_start'; packetId: string }
  | { type: 'PRISM:generation_done';  packetId: string; result: EtherPrismResult }
  | { type: 'PRISM:compression_start'; packetId: string }
  | { type: 'PRISM:compression_done';  packetId: string; stats: CompressionStats }
  | { type: 'PRISM:batch_progress';   info: BatchInfo }
  | { type: 'PRISM:batch_complete';   results: EtherPrismResult[] }
  | { type: 'PRISM:error';           packetId: string; error: { code: string; message: string } }
  | { type: 'PRISM:memory_synced';   packetId: string }
  | { type: 'PRISM:troxt_decision';  packetId: string; decision: string };