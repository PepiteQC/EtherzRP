import React, { useState } from 'react'
import { useEditorStore } from './useEditorStore'
import { Move, RotateCw, Scale, Trash2, Save, Plus } from 'lucide-react'

export default function EtherWorldEditor() {
  const { objects, addObject, removeObject, selectedId, selectObject } = useEditorStore()
  const [mode, setMode] = useState<'translate' | 'rotate' | 'scale'>('translate')

  const spawnable = [
    { type: 'hotel-ultra', label: 'Hôtel Ultra', color: '#334455' },
    { type: 'depanneur', label: 'Dépanneur', color: '#c94e3f' },
    { type: 'gas-station', label: 'Station Essence', color: '#223344' },
    { type: 'arcane-tree', label: 'Arbre Arcane', color: '#1a3a2a' },
    { type: 'police-car', label: 'Police Car', color: '#112244' },
    { type: 'road-sign', label: 'Panneau Route 138', color: '#ffcc00' },
  ]

  const spawn = (type: string) => {
    const template = spawnable.find(t => t.type === type)!
    addObject({
      type,
      position: [(Math.random()-0.5)*120, 12, (Math.random()-0.5)*120],
      rotation: [0, Math.random()*Math.PI*2, 0],
      scale: [1,1,1],
      color: template.color
    })
  }

  return (
    <div className="flex h-full text-sm">
      {/* Palette */}
      <div className="w-72 border-r border-white/10 p-4">
        <div className="font-bold mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Palette</div>
        {spawnable.map((item, i) => (
          <button key={i} onClick={() => spawn(item.type)} 
            className="w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-xl bg-white/5 hover:bg-white/10">
            <div className="w-6 h-6 rounded" style={{background: item.color}} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Viewport Info */}
      <div className="flex-1 p-6">
        <div className="flex gap-2 mb-4">
          {(['translate','rotate','scale'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} 
              className={`px-4 py-2 rounded ${mode === m ? 'bg-white text-black' : 'bg-white/10'}`}>
              {m === 'translate' && <Move className="inline w-4 h-4 mr-1" />}
              {m === 'rotate' && <RotateCw className="inline w-4 h-4 mr-1" />}
              {m === 'scale' && <Scale className="inline w-4 h-4 mr-1" />}
              {m}
            </button>
          ))}
        </div>

        <div className="text-white/60">Mode: {mode} • Objets: {objects.length}</div>
        
        <div className="mt-8 text-xs text-white/50">
          Utilisez les touches G / R / S pour changer de mode.<br />
          Cliquez sur un objet dans la scène 3D pour le sélectionner.
        </div>
      </div>

      {/* Inspector */}
      <div className="w-80 border-l border-white/10 p-5">
        <div className="font-semibold mb-4">Inspecteur</div>
        {selectedId ? (
          <div>
            <div className="text-xs text-white/50 mb-1">ID: {selectedId}</div>
            <button onClick={() => removeObject(selectedId)} 
              className="mt-4 w-full py-2 bg-red-500/10 text-red-400 rounded flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        ) : (
          <div className="text-white/40 text-sm">Sélectionnez un objet dans la scène</div>
        )}
      </div>
    </div>
  )
}
