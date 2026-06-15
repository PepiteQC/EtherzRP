import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import * as THREE from "three";
import { FileModelViewer } from "@/components/FileModelViewer";
import type { ViewMode, CameraSettings, CameraPreset, FileFormat, EnvPreset } from "@/components/FileModelViewer";
// ── helpers ───────────────────────────────────────────────────────────────────

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function detectFormat(name: string): FileFormat | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "glb") return "glb";
  if (ext === "gltf") return "gltf";
  if (ext === "obj")  return "obj";
  if (ext === "stl")  return "stl";
  return null;
}

const CAMERA_PRESETS: { id: CameraPreset; label: string }[] = [
  { id: "front", label: "F" },
  { id: "back",  label: "B" },
  { id: "top",   label: "T" },
  { id: "right", label: "R" },
  { id: "left",  label: "L" },
  { id: "iso",   label: "↗" },
];

const PRESET_POSITIONS: Record<CameraPreset, THREE.Vector3> = {
  front:  new THREE.Vector3(0, 0, 5),
  back:   new THREE.Vector3(0, 0, -5),
  top:    new THREE.Vector3(0, 5, 0.01),
  right:  new THREE.Vector3(5, 0, 0),
  left:   new THREE.Vector3(-5, 0, 0),
  iso:    new THREE.Vector3(3.5, 3, 3.5),
};

const ENVS: EnvPreset[] = ["none", "studio", "warehouse", "city", "dawn", "forest", "night", "sunset"];

const VIEW_MODES: { id: ViewMode; label: string; desc: string }[] = [
  { id: "normal",    label: "Normal",    desc: "Matériaux originaux" },
  { id: "wireframe", label: "Wireframe", desc: "Structure des polygones" },
  { id: "clay",      label: "Clay",      desc: "Rendu argile neutre" },
  { id: "normals",   label: "Normales",  desc: "Vecteurs normaux colorés" },
  { id: "xray",      label: "X-Ray",     desc: "Transparence filaire" },
];

// ── drop zone ─────────────────────────────────────────────────────────────────

interface DropZoneProps {
  onFile: (f: File) => void;
}
function DropZone({ onFile }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div
      className={`absolute inset-8 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer
        ${dragging ? "border-violet-500 bg-violet-500/10 scale-[1.01]" : "border-white/10 hover:border-violet-500/40 hover:bg-white/5"}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept=".glb,.gltf,.obj,.stl" className="hidden" onChange={handleChange} />
      <div className="text-center select-none">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-violet-500/50" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M6 20h12" />
          </svg>
        </div>
        <p className="text-sm font-mono text-white/50 mb-2">Déposer un fichier 3D</p>
        <p className="text-xs font-mono text-white/20 tracking-wider">GLB • GLTF • OBJ • STL</p>
        <div className={`mt-5 px-5 py-2 rounded-lg border text-xs font-mono tracking-[0.15em] uppercase transition-colors
          ${dragging ? "border-violet-500 text-violet-400" : "border-white/10 text-white/30 hover:border-violet-500/50 hover:text-violet-400"}`}
        >
          {dragging ? "Relâcher" : "Parcourir"}
        </div>
      </div>
    </div>
  );
}

// ── section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] uppercase tracking-[0.25em] text-white/20 mb-2">{children}</p>;
}

// ── main viewer page ──────────────────────────────────────────────────────────

export default function Viewer() {
  const [file, setFile]             = useState<File | null>(null);
  const [fileUrl, setFileUrl]       = useState<string | null>(null);
  const [format, setFormat]         = useState<FileFormat | null>(null);
  const [viewMode, setViewMode]     = useState<ViewMode>("normal");
  const [targetPos, setTargetPos]   = useState<THREE.Vector3 | null>(null);
  const [panelOpen, setPanelOpen]   = useState(true);
  const [settings, setSettings]     = useState<CameraSettings>({
    fov: 50,
    autoRotate: false,
    autoRotateSpeed: 1.0,
    damping: true,
    env: "studio",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  const handleFile = useCallback((f: File) => {
    const fmt = detectFormat(f.name);
    if (!fmt) {
      alert("Format non supporté. Utilisez GLB, GLTF, OBJ ou STL.");
      return;
    }
    // Revoke old URL
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    const url = URL.createObjectURL(f);
    setFile(f);
    setFileUrl(url);
    setFormat(fmt);
    setViewMode("normal");
  }, [fileUrl]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => { if (fileUrl) URL.revokeObjectURL(fileUrl); };
  }, [fileUrl]);

  const gotoPreset = (p: CameraPreset) => {
    setTargetPos(PRESET_POSITIONS[p].clone());
    // reset target after a frame so next preset triggers effect
    setTimeout(() => setTargetPos(null), 100);
  };

  const clearFile = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl(null);
    setFormat(null);
    setViewMode("normal");
  };

  const setSetting = <K extends keyof CameraSettings>(k: K, v: CameraSettings[K]) =>
    setSettings((s) => ({ ...s, [k]: v }));

  return (
    <div className="flex flex-col h-[100dvh] bg-[#070010] text-white font-mono overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-sm z-20 shrink-0">
        <Link href="/" className="text-xl font-bold tracking-[0.15em] text-violet-400 hover:text-violet-300 transition-colors">
          ETHERWORLD
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/"       className="text-xs uppercase tracking-[0.2em] text-white/30 hover:text-violet-400 transition-colors">Generator</Link>
          <Link href="/models" className="text-xs uppercase tracking-[0.2em] text-white/30 hover:text-violet-400 transition-colors">Vault</Link>
          <span className="text-xs uppercase tracking-[0.2em] text-violet-400 border-b border-violet-500">Viewer</span>
        </nav>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden">
          {fileUrl ? (
            <FileModelViewer
              fileUrl={fileUrl}
              format={format}
              viewMode={viewMode}
              settings={settings}
              targetPos={targetPos}
              controlsRef={controlsRef}
            />
          ) : (
            <div className="absolute inset-0 bg-[#070010]">
              <DropZone onFile={handleFile} />
            </div>
          )}

          {/* Floating drop button when file is loaded */}
          {fileUrl && (
            <button
              onClick={() => { const i = document.createElement("input"); i.type="file"; i.accept=".glb,.gltf,.obj,.stl"; i.onchange=(e)=>{ const f=(e.target as HTMLInputElement).files?.[0]; if(f) handleFile(f); }; i.click(); }}
              className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white/40 hover:text-violet-400 hover:border-violet-500/50 transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M6 20h12" />
              </svg>
              Changer de fichier
            </button>
          )}

          {/* Panel toggle */}
          <button
            onClick={() => setPanelOpen(o => !o)}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/50 backdrop-blur border border-white/10 rounded text-white/30 hover:text-violet-400 hover:border-violet-500/50 transition-all"
            title={panelOpen ? "Fermer" : "Ouvrir les contrôles"}
          >
            {panelOpen ? "›" : "‹"}
          </button>

          {/* View mode badge */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <span className="bg-black/50 backdrop-blur border border-white/10 text-[9px] uppercase tracking-[0.2em] text-white/30 px-2 py-1 rounded">
              {viewMode}
            </span>
          </div>
        </div>

        {/* Control panel */}
        <aside
          className={`flex flex-col shrink-0 overflow-y-auto border-l border-white/5 bg-black/50 backdrop-blur transition-all duration-300 overflow-hidden
            ${panelOpen ? "w-72" : "w-0"}`}
        >
          <div className="flex flex-col gap-5 p-5 min-w-[288px]">

            {/* File info */}
            {file ? (
              <div>
                <SectionLabel>Fichier chargé</SectionLabel>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-1">
                  <p className="text-xs text-white/80 truncate">{file.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-violet-400 uppercase">{format}</span>
                    <span className="text-[10px] text-white/30">{fmtBytes(file.size)}</span>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="mt-2 w-full py-1.5 rounded border border-red-500/20 text-red-400/50 text-[10px] uppercase tracking-[0.15em] hover:border-red-500/50 hover:text-red-400 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <div>
                <SectionLabel>Fichier</SectionLabel>
                <p className="text-[10px] text-white/20">Aucun fichier chargé</p>
              </div>
            )}

            <div className="h-px bg-white/5" />

            {/* View mode */}
            <div>
              <SectionLabel>Mode d'affichage</SectionLabel>
              <div className="flex flex-col gap-1">
                {VIEW_MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setViewMode(m.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all ${
                      viewMode === m.id
                        ? "border-violet-500/60 bg-violet-500/10"
                        : "border-transparent hover:border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <span className={`text-xs font-semibold w-20 ${viewMode === m.id ? "text-violet-300" : "text-white/50"}`}>{m.label}</span>
                    <span className="text-[9px] text-white/20">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Camera controls */}
            <div>
              <SectionLabel>Caméra</SectionLabel>
              <div className="flex flex-col gap-4">

                {/* FOV */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">FOV</span>
                    <span className="text-[10px] text-violet-400 tabular-nums">{settings.fov}°</span>
                  </div>
                  <input
                    type="range" min={20} max={100} step={1} value={settings.fov}
                    onChange={(e) => setSetting("fov", Number(e.target.value))}
                    className="w-full accent-violet-500 h-1 cursor-pointer"
                  />
                </div>

                {/* Auto-rotate */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">Auto-rotation</span>
                  <button
                    onClick={() => setSetting("autoRotate", !settings.autoRotate)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${settings.autoRotate ? "bg-violet-600" : "bg-white/10"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings.autoRotate ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>

                {/* Speed */}
                {settings.autoRotate && (
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] text-white/40 uppercase tracking-wider">Vitesse</span>
                      <span className="text-[10px] text-violet-400 tabular-nums">{settings.autoRotateSpeed.toFixed(1)}×</span>
                    </div>
                    <input
                      type="range" min={0.1} max={5} step={0.1} value={settings.autoRotateSpeed}
                      onChange={(e) => setSetting("autoRotateSpeed", Number(e.target.value))}
                      className="w-full accent-violet-500 h-1 cursor-pointer"
                    />
                  </div>
                )}

                {/* Damping */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">Inertie</span>
                  <button
                    onClick={() => setSetting("damping", !settings.damping)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${settings.damping ? "bg-violet-600" : "bg-white/10"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings.damping ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Camera presets */}
            <div>
              <SectionLabel>Points de vue</SectionLabel>
              <div className="grid grid-cols-6 gap-1">
                {CAMERA_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => gotoPreset(p.id)}
                    title={p.id}
                    className="aspect-square flex items-center justify-center rounded border border-white/10 text-[10px] text-white/40 hover:border-violet-500/50 hover:text-violet-400 hover:bg-violet-500/10 transition-all font-bold"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 mt-1 flex-wrap text-[9px] text-white/15 font-mono">
                <span>F=Face</span><span>·</span>
                <span>B=Dos</span><span>·</span>
                <span>T=Haut</span><span>·</span>
                <span>R/L=Côtés</span><span>·</span>
                <span>↗=Iso</span>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Environment */}
            <div>
              <SectionLabel>Environnement</SectionLabel>
              <div className="grid grid-cols-2 gap-1">
                {ENVS.map((env) => (
                  <button
                    key={env}
                    onClick={() => setSetting("env", env)}
                    className={`px-2 py-1.5 rounded border text-[10px] uppercase tracking-wider transition-all capitalize ${
                      settings.env === env
                        ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                        : "border-white/10 text-white/30 hover:border-white/20 hover:text-white/50"
                    }`}
                  >
                    {env === "none" ? "Aucun" : env}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Shortcuts */}
            <div>
              <SectionLabel>Contrôles souris</SectionLabel>
              <div className="space-y-1 text-[10px] text-white/20">
                <div className="flex justify-between"><span>Orbite</span><span>Clic gauche</span></div>
                <div className="flex justify-between"><span>Pan</span><span>Clic droit / Shift</span></div>
                <div className="flex justify-between"><span>Zoom</span><span>Molette</span></div>
              </div>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}
