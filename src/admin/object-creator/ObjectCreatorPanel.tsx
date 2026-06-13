import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Brain, Sparkles, Save, Plus, Trash2, Wand2, Boxes, Gauge } from 'lucide-react'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { useEditorStore } from '../EtherWorld-Editor/useEditorStore'
import ObjectPreview3D from './ObjectPreview3D'
import { useObjectCreatorStore } from './ObjectCreatorStore'
import { EXAMPLE_PROMPTS, createObjectFromPrompt } from './semanticObjectEngine'
import { createObjectGroup } from './objectFactory'
import type { CreatorQuality } from './types'

function notify(message: string) {
  window.dispatchEvent(new CustomEvent('hud-notification', { detail: { message, duration: 2600 } }))
}

export default function ObjectCreatorPanel() {
  const prompt = useObjectCreatorStore(s => s.prompt)
  const quality = useObjectCreatorStore(s => s.quality)
  const current = useObjectCreatorStore(s => s.current)
  const saved = useObjectCreatorStore(s => s.saved)
  const setPrompt = useObjectCreatorStore(s => s.setPrompt)
  const setQuality = useObjectCreatorStore(s => s.setQuality)
  const generate = useObjectCreatorStore(s => s.generate)
  const saveCurrent = useObjectCreatorStore(s => s.saveCurrent)
  const removeSaved = useObjectCreatorStore(s => s.removeSaved)
  const addEditorObject = useEditorStore(s => s.addObject)
  const [busy, setBusy] = useState(false)

  const live = useMemo(() => prompt.trim().length > 2 ? generatePreviewOnly(prompt, quality) : null, [prompt, quality])
  const shown = current ?? live

  const handleGenerate = () => {
    setBusy(true)
    setTimeout(() => {
      generate(prompt)
      setBusy(false)
      notify('Objet modélisé par le moteur sémantique')
    }, 220)
  }

  const handleSave = () => {
    const item = saveCurrent()
    if (item) notify(`Sauvegardé: ${item.name}`)
  }

  const handleExport = () => {
    if (!shown) return
    const group = createObjectGroup(shown)
    const exporter = new GLTFExporter()
    exporter.parse(
      group,
      (result) => {
        const blob = new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${shown.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_${Date.now()}.glb`
        a.click()
        URL.revokeObjectURL(url)
      },
      (error) => console.error(error),
      { binary: true }
    )
  }

  const handleAddToEditor = () => {
    if (!shown) return
    const mainColor = shown.parts[0]?.material.color ?? '#8b5cf6'
    addEditorObject({
      type: `object-creator:${shown.blueprint ?? 'custom'}`,
      position: [(Math.random() - 0.5) * 80, 8, (Math.random() - 0.5) * 80],
      rotation: [0, Math.random() * Math.PI * 2, 0],
      scale: [1, 1, 1],
      color: mainColor,
    })
    notify('Objet ajouté à la scène éditeur')
  }

  return (
    <div className="h-full grid grid-cols-[380px_1fr_320px] gap-3 p-3 text-white overflow-hidden">
      <section className="rounded-2xl border border-white/10 bg-black/35 p-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 grid place-items-center">
            <Brain className="w-5 h-5 text-violet-300" />
          </div>
          <div>
            <div className="font-black tracking-[0.18em] text-sm">OBJECT CREATOR</div>
            <div className="text-[10px] text-white/35 uppercase tracking-wider">Sémantique · matériaux · blueprints</div>
          </div>
        </div>

        <label className="text-[10px] uppercase tracking-[0.22em] text-white/35">Prompt intelligent</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: voiture police Québec néon bleu futuriste"
          className="mt-2 w-full h-28 rounded-xl border border-white/10 bg-black/45 px-3 py-3 text-sm outline-none focus:border-violet-500/70 resize-none"
        />

        <div className="mt-3 flex gap-2">
          {(['fast', 'balanced', 'high'] as CreatorQuality[]).map(q => (
            <button key={q} onClick={() => setQuality(q)} className={`flex-1 rounded-lg px-3 py-2 text-[10px] uppercase tracking-wider border ${quality === q ? 'bg-violet-600 border-violet-400 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}>
              {q}
            </button>
          ))}
        </div>

        <button onClick={handleGenerate} disabled={!prompt.trim() || busy} className="mt-4 w-full rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 py-3 font-black uppercase tracking-[0.16em] text-sm flex items-center justify-center gap-2">
          <Wand2 className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
          {busy ? 'Analyse...' : 'Créer objet'}
        </button>

        <div className="mt-5 text-[10px] uppercase tracking-[0.2em] text-white/30">Prompts experts</div>
        <div className="mt-2 grid gap-2">
          {EXAMPLE_PROMPTS.map(ex => (
            <button key={ex} onClick={() => { setPrompt(ex); generate(ex) }} className="text-left rounded-lg border border-white/10 bg-white/[0.03] hover:bg-violet-500/10 hover:border-violet-500/35 px-3 py-2 text-xs text-white/55">
              <span className="text-violet-400">&gt;</span> {ex}
            </button>
          ))}
        </div>
      </section>

      <section className="min-w-0 overflow-hidden relative">
        <ObjectPreview3D config={shown} />
        {shown && (
          <div className="absolute top-4 left-4 right-4 flex justify-between gap-3 pointer-events-none">
            <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur px-4 py-2 text-xs font-mono text-white/65 truncate">
              <span className="text-violet-300">{Math.round(shown.confidence * 100)}%</span> compréhension · {shown.name}
            </div>
            <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur px-4 py-2 text-xs font-mono text-white/45">
              {shown.stats.partCount} pièces · ~{shown.stats.estimatedPolygons.toLocaleString('fr-CA')} polys
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-4 overflow-y-auto">
        {shown ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Boxes className="w-4 h-4 text-cyan-300" />
              <div className="font-bold text-sm">Diagnostic IA</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Stat label="Pièces" value={shown.stats.partCount} />
              <Stat label="Matériaux" value={shown.stats.materialCount} />
              <Stat label="Complexité" value={shown.stats.complexity} />
              <Stat label="Layout" value={shown.layout} />
            </div>

            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Reconnaissance</div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {shown.recognitions.length === 0 ? <span className="text-xs text-white/25">Aucun token explicite, fallback intelligent.</span> : shown.recognitions.map((r, i) => (
                <span key={i} className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-[10px] text-violet-200">
                  {r.category.slice(0, 3)} · {r.label}
                </span>
              ))}
            </div>

            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Raisonnement</div>
            <div className="space-y-2 mb-4">
              {shown.reasoning.map((line, i) => <div key={i} className="rounded-lg bg-white/[0.04] border border-white/10 p-2 text-xs text-white/55">{line}</div>)}
            </div>

            <div className="grid gap-2">
              <button onClick={handleSave} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 py-2.5 text-sm font-bold text-emerald-200 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Sauvegarder</button>
              <button onClick={handleAddToEditor} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/15 py-2.5 text-sm font-bold text-cyan-200 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Ajouter au monde</button>
              <button onClick={handleExport} className="rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] py-2.5 text-sm font-bold text-white/70 flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Export GLB</button>
            </div>
          </>
        ) : (
          <div className="h-full grid place-items-center text-center text-white/25">
            <div>
              <Gauge className="w-10 h-10 mx-auto mb-3 text-violet-400/40" />
              <div className="text-xs uppercase tracking-[0.2em]">Moteur prêt</div>
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Vault admin</div>
            <span className="text-[10px] text-white/25">{saved.length}</span>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {saved.map(item => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-white/10 bg-white/[0.035] p-2">
                <button onClick={() => useObjectCreatorStore.setState({ current: item.config, prompt: item.prompt })} className="w-full text-left text-xs text-white/65 hover:text-violet-200 truncate">{item.name}</button>
                <div className="flex justify-between mt-1 text-[10px] text-white/25">
                  <span>{new Date(item.createdAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</span>
                  <button onClick={() => removeSaved(item.id)} className="hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function generatePreviewOnly(prompt: string, quality: CreatorQuality) {
  try {
    return createObjectFromPrompt(prompt, quality)
  } catch {
    return null
  }
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2"><div className="text-[9px] uppercase tracking-wider text-white/30">{label}</div><div className="text-sm font-bold text-white/75 truncate">{value}</div></div>
}
