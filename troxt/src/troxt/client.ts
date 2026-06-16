/**
 * TroxtClient — client HTTP minimal vers ton backend Express (engine-lab/server/).
 *
 * Zéro dépendance cloud. Tout passe par /api/troxt/* sur TON serveur.
 */

import type {
  TroxtConfig,
  TroxtRequestOptions,
  TroxtResponse,
  UploadedFile,
  GenerateImageInput,
  GenerateImageOutput,
} from './types';

export class TroxtClient {
  private readonly baseUrl: string;
  private readonly authToken?: string;
  private readonly defaultTimeoutMs: number;
  private readonly extraHeaders: Record<string, string>;

  constructor(config: TroxtConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.authToken = config.authToken;
    this.defaultTimeoutMs = config.timeoutMs ?? 30_000;
    this.extraHeaders = config.headers ?? {};
  }

  /**
   * Requête bas niveau. Renvoie une TroxtResponse typée.
   * Lève une Error si le réseau échoue ou si timeout dépassé.
   */
  async request<T = unknown>(
    path: string,
    options: TroxtRequestOptions = {},
  ): Promise<TroxtResponse<T>> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.extraHeaders,
      ...options.headers,
    };
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const res = await fetch(url, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });

      const text = await res.text();
      const json: TroxtResponse<T> = text
        ? JSON.parse(text)
        : { ok: res.ok, status: res.status, data: undefined as unknown as T };

      if (!res.ok && !json.error) {
        json.ok = false;
        json.error = { code: `HTTP_${res.status}`, message: res.statusText };
      }
      return json;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        status: 0,
        data: undefined as unknown as T,
        error: { code: 'NETWORK_ERROR', message },
      };
    } finally {
      clearTimeout(timer);
    }
  }

  /** GET helper. */
  get<T>(path: string, opts?: TroxtRequestOptions): Promise<TroxtResponse<T>> {
    return this.request<T>(path, { ...opts, method: 'GET' });
  }

  /** POST helper. */
  post<T>(path: string, body?: unknown, opts?: TroxtRequestOptions): Promise<TroxtResponse<T>> {
    return this.request<T>(path, { ...opts, method: 'POST', body });
  }

  /** PUT helper. */
  put<T>(path: string, body?: unknown, opts?: TroxtRequestOptions): Promise<TroxtResponse<T>> {
    return this.request<T>(path, { ...opts, method: 'PUT', body });
  }

  /** DELETE helper. */
  delete<T>(path: string, opts?: TroxtRequestOptions): Promise<TroxtResponse<T>> {
    return this.request<T>(path, { ...opts, method: 'DELETE' });
  }

  // ─────────────────────────────────────────────────────────
  // Service: ai — génération d'images via TON backend.
  // ─────────────────────────────────────────────────────────
  ai = {
    generateImage: async (input: GenerateImageInput): Promise<GenerateImageOutput> => {
      const res = await this.post<{ urls: string[]; metadata?: Record<string, unknown> }>(
        '/troxt/ai/generate-image',
        input,
      );
      if (!res.ok) {
        throw new Error(`troxt.ai.generateImage failed: ${res.error?.message}`);
      }
      return { urls: res.data.urls, metadata: res.data.metadata };
    },

    /**
     * Suppression de fond via TON backend (modèle local ONNX ou autre).
     * Retourne l'image en dataURL ou URL temporaire.
     */
    removeBackground: async (image: string): Promise<{ url: string }> => {
      const res = await this.post<{ url: string }>(
        '/troxt/ai/remove-background',
        { image },
      );
      if (!res.ok) {
        throw new Error(`troxt.ai.removeBackground failed: ${res.error?.message}`);
      }
      return res.data;
    },

    /**
     * Estimation de profondeur via TON backend.
     */
    estimateDepth: async (image: string): Promise<{ depthMapUrl: string }> => {
      const res = await this.post<{ depthMapUrl: string }>(
        '/troxt/ai/depth',
        { image },
      );
      if (!res.ok) {
        throw new Error(`troxt.ai.estimateDepth failed: ${res.error?.message}`);
      }
      return res.data;
    },
  };

  // ─────────────────────────────────────────────────────────
  // Service: storage — upload de fichiers.
  // ─────────────────────────────────────────────────────────
  storage = {
    /**
     * Upload un fichier (Blob) et renvoie ses métadonnées.
     */
    uploadFile: async (file: Blob, filename: string): Promise<UploadedFile> => {
      const form = new FormData();
      form.append('file', file, filename);
      const res = await fetch(`${this.baseUrl}/troxt/storage/upload`, {
        method: 'POST',
        body: form,
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
      });
      if (!res.ok) {
        throw new Error(`troxt.storage.uploadFile failed: HTTP ${res.status}`);
      }
      const data = await res.json() as UploadedFile;
      return data;
    },

    deleteFile: async (id: string): Promise<void> => {
      await this.delete(`/troxt/storage/${encodeURIComponent(id)}`);
    },
  };

  // ─────────────────────────────────────────────────────────
  // Service: data — KV simple.
  // ─────────────────────────────────────────────────────────
  data = {
    get: async <T>(key: string): Promise<T | null> => {
      const res = await this.get<{ value: T | null }>(`/troxt/data/${encodeURIComponent(key)}`);
      return res.ok ? res.data.value : null;
    },
    set: async <T>(key: string, value: T): Promise<void> => {
      await this.put(`/troxt/data/${encodeURIComponent(key)}`, { value });
    },
    delete: async (key: string): Promise<void> => {
      await this.delete(`/troxt/data/${encodeURIComponent(key)}`);
    },
  };

  // ─────────────────────────────────────────────────────────
  // Service: functions — invocation de fonctions serveur.
  // ─────────────────────────────────────────────────────────
  functions = {
    invoke: async <TIn, TOut>(name: string, input: TIn): Promise<TOut> => {
      const res = await this.post<TOut>(`/troxt/functions/${encodeURIComponent(name)}`, input);
      if (!res.ok) {
        throw new Error(`troxt.functions.invoke(${name}) failed: ${res.error?.message}`);
      }
      return res.data;
    },
  };

  // ─────────────────────────────────────────────────────────
  // Service: visual-forge — endpoints dédiés.
  // ─────────────────────────────────────────────────────────
  visualForge = {
    submit: async <TJob>(job: TJob): Promise<{ jobId: string }> => {
      const res = await this.post<{ jobId: string }>('/troxt/visual-forge/jobs', job);
      if (!res.ok) {
        throw new Error(`troxt.visualForge.submit failed: ${res.error?.message}`);
      }
      return res.data;
    },
    status: async (jobId: string): Promise<{ status: string; progress: number; manifestId?: string }> => {
      const res = await this.get(`/troxt/visual-forge/jobs/${encodeURIComponent(jobId)}`);
      if (!res.ok) {
        throw new Error(`troxt.visualForge.status failed: ${res.error?.message}`);
      }
      return res.data;
    },
    approve: async (jobId: string): Promise<void> => {
      await this.post(`/troxt/visual-forge/jobs/${encodeURIComponent(jobId)}/approve`);
    },
    reject: async (jobId: string, reason: string): Promise<void> => {
      await this.post(`/troxt/visual-forge/jobs/${encodeURIComponent(jobId)}/reject`, { reason });
    },
  };
}

/**
 * Instance par défaut, configurée via variables d'env ou valeurs par défaut.
 * Côté client Vite, import.meta.env.VITE_TROXT_URL peut surcharger baseUrl.
 */
const envBase =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TROXT_URL) ||
  '/api';

export const troxt = new TroxtClient({
  baseUrl: envBase,
  timeoutMs: 60_000,
});
