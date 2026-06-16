/**
 * Types partagés du SDK TROXT.
 */

export interface TroxtConfig {
  baseUrl:    string;          // ex: '/api' ou 'http://localhost:4101'
  authToken?: string;
  timeoutMs?: number;          // défaut 30000
  headers?:   Record<string, string>;
}

export interface TroxtRequestOptions {
  method?:     'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?:       unknown;
  headers?:    Record<string, string>;
  timeoutMs?:  number;
  signal?:     AbortSignal;
}

export interface TroxtResponse<T = unknown> {
  ok:      boolean;
  status:  number;
  data:    T;
  error?:  { code: string; message: string };
}

/** Format générique d'un fichier uploadé. */
export interface UploadedFile {
  id:         string;
  filename:   string;
  mime:       string;
  size:       number;
  url:        string;
  uploadedAt: number;
}

export interface GenerateImageInput {
  prompt:     string;
  image?:     string;          // dataURL ou URL
  n?:         number;
  size?:      '512x512' | '1024x1024' | '2048x2048';
  negativePrompt?: string;
}

export interface GenerateImageOutput {
  urls:       string[];
  metadata?:  Record<string, unknown>;
}

/** Événements émis par le bus TROXT. */
export interface TroxtEventMap {
  'manifest:created':  { id: string; filename: string };
  'manifest:updated':  { id: string };
  'manifest:rejected': { id: string; reason: string };
  'job:started':       { jobId: string };
  'job:progress':      { jobId: string; stage: string; pct: number };
  'job:completed':     { jobId: string; manifestId: string };
  'job:failed':        { jobId: string; error: string };
}
