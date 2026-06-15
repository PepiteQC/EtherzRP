import { useState, useRef, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { clsx } from "clsx";
import {
  Boxes,
  Type,
  ImagePlus,
  Upload,
  X,
  Sparkles,
  Loader2,
  RotateCw,
  Zap,
  Gauge,
  Rabbit,
} from "lucide-react";
import { useSaveModel, useListModels, getListModelsQueryKey } from "@workspace/api-client-react";
import { ModelViewer, type QualityLevel } from "@/components/ModelViewer";
import { RecognitionPanel } from "@/components/RecognitionPanel";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { parsePrompt } from "@/lib/promptParser";

// ── constants ─────────────────────────────────────────────────────────────────

const CHIPS = [
  "neon violet torus knot floating",
  "golden crystal cluster orbiting",
  "glass dodecahedron iridescent",
  "galaxy nebula cosmic spiral",
  "helix DNA électrique",
  "metallic obsidian pyramid ancient",
  "plasma vortex éthéré",
  "orbital solar system spinning",
];

const QUALITY_OPTIONS = [
  { value: "high",   label: "High",      hint: "Maximum detail", icon: Zap },
  { value: "medium", label: "Balanced",  hint: "Recommended",    icon: Gauge },
  { value: "low",    label: "Fast",      hint: "Quick preview",  icon: Rabbit },
] as const;

type Mode = "text" | "image";

// ── helpers ───────────────────────────────────────────────────────────────────

function parsePromptSafe(p: string) {
  try { return parsePrompt(p).recognitions; } catch { return []; }
}

function sceneLabel(p: string): string | null {
  try {
    const map: Record<string, string> = {
      single: "SINGLE", cluster: "CLUSTER", orbital: "ORBITAL",
      ring: "RING", helix: "HELIX", grid: "GRID",
      galaxy: "GALAXY", vortex: "VORTEX",
    };
    return map[parsePrompt(p).sceneType] ?? null;
  } catch { return null; }
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [mode, setMode]           = useState<Mode>("text");
  const [prompt, setPrompt]       = useState("");
  const [quality, setQuality]     = useState<string>("medium");
  const qualityLevel: QualityLevel = quality === "high" ? "high" : quality === "low" ? "fast" : "balanced";
  const [images, setImages]       = useState<File[]>([]);
  const [previews, setPreviews]   = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const { toast }    = useToast();
  const queryClient  = useQueryClient();

  const saveModel = useSaveModel();
  const { data: models = [] } = useListModels();
  const busy = saveModel.isPending;

  // Live recognition while typing
  const liveRecs = useMemo(() => {
    const t = prompt.trim();
    if (t.length < 3) return [];
    try { return parsePrompt(t).recognitions; } catch { return []; }
  }, [prompt]);

  const displayPrompt = activePrompt ?? (models[0]?.prompt ?? null);
  const displayRecs   = displayPrompt ? parsePromptSafe(displayPrompt) : [];
  const displayScene  = displayPrompt ? sceneLabel(displayPrompt) : null;

  // ── image handling ──────────────────────────────────────────────────────────

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const accepted = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (!accepted.length) return;
    setImages((p) => [...p, ...accepted].slice(0, 5));
    setPreviews((p) => [...p, ...accepted.map((f) => URL.createObjectURL(f))].slice(0, 5));
  }, []);

  const removeImage = useCallback((i: number) => {
    setImages((p) => p.filter((_, j) => j !== i));
    setPreviews((p) => p.filter((_, j) => j !== i));
  }, []);

  // ── generation ─────────────────────────────────────────────────────────────

  const generate = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast({ title: "Prompt vide", description: "Décris un objet 3D.", variant: "destructive" });
      return;
    }
    setActivePrompt(trimmed);
    saveModel.mutate({ data: { prompt: trimmed } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListModelsQueryKey() });
        toast({
          title: "Matérialisé",
          description: `"${trimmed}" conjuré dans l'éther.`,
          className: "border-violet-500 bg-[#0a0010] text-violet-300 font-mono",
        });
        setPrompt("");
      },
    });
  }, [prompt, saveModel, queryClient, toast]);

  const reset = useCallback(() => {
    setActivePrompt(null);
    setPrompt("");
    setImages([]);
    setPreviews([]);
    saveModel.reset();
  }, [saveModel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a000f] text-white font-mono">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-violet-600/8 blur-3xl" />
        <div className="absolute -bottom-40 right-0 size-[30rem] rounded-full bg-violet-900/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-black/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-violet-600 text-white">
              <Boxes className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-[0.2em] text-violet-300">ETHERWORLD</p>
              <p className="text-[10px] text-white/30">Procedural 3D Generator</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <Link href="/viewer" className="px-3 py-1.5 rounded text-xs uppercase tracking-[0.15em] text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-colors">
              Viewer
            </Link>
            <Link href="/models" className="px-3 py-1.5 rounded text-xs uppercase tracking-[0.15em] text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-colors">
              Vault
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-10 text-center sm:px-6">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/40">
          <span className="size-1.5 rounded-full bg-violet-500 animate-pulse" />
          Text-to-3D &amp; Image-to-3D · Génération procédurale
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Transforme tes idées en{" "}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            modèles 3D
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/35 sm:text-base">
          ETHERWORLD génère des scènes 3D interactives directement dans le navigateur — sans clé API, sans serveur. Décris un objet et regarde-le prendre forme.
        </p>
      </section>

      {/* Generator grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,400px)_1fr]">

          {/* ── Left: control panel ── */}
          <div className="flex flex-col gap-5 rounded-2xl border border-white/8 bg-white/3 p-5 backdrop-blur">

            {/* Mode tabs */}
            <div className="flex rounded-lg border border-white/8 bg-black/30 p-1 gap-1">
              {(["text", "image"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs uppercase tracking-[0.15em] transition-all",
                    mode === m
                      ? "bg-violet-600 text-white shadow"
                      : "text-white/40 hover:text-white/70"
                  )}
                >
                  {m === "text" ? <Type className="size-3.5" /> : <ImagePlus className="size-3.5" />}
                  {m === "text" ? "Texte" : "Image"}
                </button>
              ))}
            </div>

            {/* Text mode */}
            {mode === "text" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.15em] text-white/40">
                  Décris ton modèle
                </label>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={busy}
                  placeholder={"Un cristal neon violet flottant dans le vide…"}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/15 outline-none focus:border-violet-500 focus:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all font-mono disabled:opacity-50"
                />
                {/* Live recognition */}
                {liveRecs.length > 0 && (
                  <RecognitionPanel recognitions={liveRecs} />
                )}
                {liveRecs.length === 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {CHIPS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setPrompt(c)}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-white/8 text-white/25 hover:text-violet-400 hover:border-violet-500/40 transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-white/20">
                  Sois précis : matière, style, mouvement, couleur. <span className="text-white/10">Ctrl+Entrée pour générer.</span>
                </p>
              </div>
            )}

            {/* Image mode */}
            {mode === "image" && (
              <div className="flex flex-col gap-3">
                <label className="text-xs uppercase tracking-[0.15em] text-white/40">
                  Images de référence
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files) addFiles(e.dataTransfer.files); }}
                  disabled={busy}
                  className={clsx(
                    "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors disabled:opacity-50",
                    dragActive ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-black/20 hover:border-violet-500/40"
                  )}
                >
                  <Upload className="size-5 text-violet-500" />
                  <span className="text-xs font-medium text-white/50">Glisse ici ou clique pour uploader</span>
                  <span className="text-[10px] text-white/20">PNG · JPG · jusqu'à 5 images</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
                />
                {previews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {previews.map((src, i) => (
                      <div key={src} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10">
                        <img src={src} alt={`ref ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-lg border border-violet-500/15 bg-violet-500/5 px-3 py-2 text-[10px] text-violet-400/60">
                  ⚡ Mode procédural — les images servent d'inspiration visuelle. Ajoute un prompt texte pour guider la scène.
                </div>
                <label className="text-xs uppercase tracking-[0.15em] text-white/30">
                  Prompt optionnel
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={busy}
                  placeholder="Prompt pour guider la génération…"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/15 outline-none focus:border-violet-500 transition-all font-mono disabled:opacity-50"
                />
              </div>
            )}

            {/* Quality */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.15em] text-white/40">
                Qualité
              </label>
              <div className="grid grid-cols-3 gap-2">
                {QUALITY_OPTIONS.map(({ value, label, hint, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setQuality(value)}
                    disabled={busy}
                    className={clsx(
                      "rounded-lg border px-3 py-2.5 text-left transition-all disabled:opacity-50",
                      quality === value
                        ? "border-violet-500 bg-violet-500/10 text-violet-300"
                        : "border-white/8 bg-black/20 text-white/40 hover:border-white/20"
                    )}
                  >
                    <Icon className="size-3.5 mb-1" />
                    <span className="block text-xs font-medium">{label}</span>
                    <span className="block text-[10px] opacity-60">{hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              type="button"
              onClick={generate}
              disabled={busy || !prompt.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white transition-all shadow-[0_0_24px_rgba(124,58,237,0.3)] hover:shadow-[0_0_32px_rgba(124,58,237,0.5)]"
            >
              {busy ? (
                <><Loader2 className="size-4 animate-spin" /> Génération…</>
              ) : (
                <><Sparkles className="size-4" /> Générer le modèle</>
              )}
            </button>

            {activePrompt && !busy && (
              <button
                type="button"
                onClick={reset}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/3 hover:bg-white/6 px-6 py-2.5 text-xs uppercase tracking-[0.15em] text-white/40 hover:text-white/70 transition-all"
              >
                <RotateCw className="size-3.5" /> Nouvelle génération
              </button>
            )}

            {/* Recent */}
            {models.length > 0 && (
              <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/20">Récents</span>
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                  {models.slice(0, 6).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { setActivePrompt(m.prompt); setPrompt(m.prompt); }}
                      className={clsx(
                        "w-full text-left px-3 py-1.5 rounded-lg border text-[11px] uppercase tracking-widest truncate transition-all",
                        activePrompt === m.prompt
                          ? "border-violet-500 text-violet-400 bg-violet-500/10"
                          : "border-white/8 text-white/30 hover:border-violet-500/30 hover:text-white/60"
                      )}
                    >
                      {m.prompt}
                    </button>
                  ))}
                </div>
                <Link href="/models" className="text-[10px] uppercase tracking-[0.15em] text-white/20 hover:text-violet-400 transition-colors">
                  Tout voir dans le Vault →
                </Link>
              </div>
            )}
          </div>

          {/* ── Right: 3D viewer ── */}
          <div className="relative min-h-[55vh] overflow-hidden rounded-2xl border border-white/8 bg-[#060010] lg:min-h-[65vh]">
            <ModelViewer prompt={displayPrompt} quality={qualityLevel} />

            {/* Overlays */}
            {displayScene && (
              <div className="absolute top-3 right-3 pointer-events-none z-10">
                <span className="bg-black/60 backdrop-blur border border-yellow-500/20 text-yellow-400/50 text-[9px] uppercase tracking-[0.2em] px-2 py-1 rounded">
                  {displayScene}
                </span>
              </div>
            )}

            {displayPrompt && (
              <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none z-10 px-16">
                <div className="bg-black/70 backdrop-blur border border-white/10 px-4 py-1.5 rounded text-[10px] uppercase tracking-[0.2em] text-white/40 max-w-md truncate">
                  <span className="text-violet-400">&gt;</span> {displayPrompt}
                </div>
              </div>
            )}

            {/* Tags overlay */}
            {displayRecs.length > 0 && (
              <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none z-10 px-6">
                <div className="flex flex-wrap gap-1.5 justify-center max-w-xl">
                  {displayRecs.map((r, i) => (
                    <span key={i} className="bg-black/60 backdrop-blur border border-white/8 px-2 py-0.5 rounded text-[9px] text-white/30 uppercase tracking-[0.1em]">
                      <span className="text-white/15">{r.category.slice(0, 3)} · </span>{r.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!displayPrompt && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 gap-3">
                <Boxes className="size-12 text-violet-500/20" />
                <div className="text-center">
                  <p className="font-mono text-sm text-white/20">Ton modèle apparaîtra ici</p>
                  <p className="mt-1 text-xs text-white/10">Décris quelque chose et clique sur Générer</p>
                </div>
              </div>
            )}

            {/* Generating overlay */}
            {busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-4 bg-black/40 backdrop-blur-sm">
                <div className="relative">
                  <Boxes className="size-12 text-violet-500" />
                  <Loader2 className="absolute -right-2 -top-2 size-5 animate-spin text-fuchsia-400" />
                </div>
                <div className="text-center">
                  <p className="font-mono text-sm font-medium">Génération en cours…</p>
                  <p className="mt-1 text-xs text-white/30">Calcul procédural · client-side</p>
                </div>
              </div>
            )}

            {/* Bottom hint */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-2.5 border-t border-white/5 bg-black/40 backdrop-blur text-[10px] text-white/20">
              <span>Orbit · scroll pour zoomer</span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
                Procédural · 0 API calls
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 mt-4">
        <div className="mx-auto max-w-7xl px-4 text-center text-[10px] text-white/15 sm:px-6">
          ETHERWORLD · Génération 3D procédurale · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
