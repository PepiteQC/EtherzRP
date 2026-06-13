'use client'

import React, { useState } from 'react'
import { useStore } from '../lib/etherworld/game-store'
import { ShoppingCart, X, Package, Move, Save, Check } from 'lucide-react'

// Liste des meubles disponibles
const FURNITURE_CATALOG = [
  { id: 'LuxuryBed', name: 'Lit de Luxe', price: 1500, category: 'chambre', icon: '🛏️' },
  { id: 'Nightstand', name: 'Table de Chevet', price: 200, category: 'chambre', icon: '🪑' },
  { id: 'ModernSofa', name: 'Canapé Moderne', price: 2500, category: 'salon', icon: '🛋️' },
  { id: 'CoffeeTable', name: 'Table Basse', price: 400, category: 'salon', icon: '🧊' },
  { id: 'TVStand', name: 'Meuble TV', price: 800, category: 'salon', icon: '📺' },
  { id: 'GamingDesk', name: 'Bureau Gaming', price: 1200, category: 'bureau', icon: '🖥️' },
  { id: 'GamingChair', name: 'Chaise Gaming', price: 600, category: 'bureau', icon: '💺' },
  { id: 'Bookshelf', name: 'Bibliothèque', price: 500, category: 'bureau', icon: '📚' },
  { id: 'KitchenCounters', name: 'Comptoirs de Cuisine', price: 3000, category: 'cuisine', icon: '🍳' },
  { id: 'DiningSet', name: 'Table à Manger', price: 1800, category: 'cuisine', icon: '🍽️' },
  { id: 'Refrigerator', name: 'Réfrigérateur', price: 1500, category: 'cuisine', icon: '🧊' },
  { id: 'Wardrobe', name: 'Garde-robe', price: 1000, category: 'chambre', icon: '🚪' },
  { id: 'Safe', name: 'Coffre-fort', price: 5000, category: 'divers', icon: '🔐' },
  { id: 'WallArt', name: 'Tableau', price: 300, category: 'déco', icon: '🖼️' },
  { id: 'Plant', name: 'Plante d\'intérieur', price: 150, category: 'déco', icon: '🪴' },
  { id: 'Rug', name: 'Tapis', price: 250, category: 'déco', icon: '🧶' },
  { id: 'CeilingLight', name: 'Plafonnier', price: 200, category: 'éclairage', icon: '💡' },
  { id: 'NeonSign', name: 'Enseigne Néon', price: 800, category: 'éclairage', icon: '✨' },
]

export function FurnitureShop() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('tous')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  
  // Store connection
  const buildMode = useStore(s => s.buildMode)
  const setGameMode = useStore(s => s.setGameMode)
  const selectedModelType = useStore(s => s.selectedModelType)
  const selectModel = useStore(s => s.selectModel)
  const placedObjects = useStore(s => s.placedObjects)

  const categories = ['tous', ...Array.from(new Set(FURNITURE_CATALOG.map(item => item.category)))]
  
  const filteredCatalog = activeCategory === 'tous' 
    ? FURNITURE_CATALOG 
    : FURNITURE_CATALOG.filter(item => item.category === activeCategory)

  const toggleBuildMode = () => {
    setGameMode(buildMode ? 'rp' : 'builder')
    if (!buildMode && !isOpen) {
      setIsOpen(true)
    }
  }

  const handleSelectItem = (id: string) => {
    selectModel(id)
    if (!buildMode) {
      setGameMode('builder')
    }
  }

  const handleSaveLayout = () => {
    setSaveStatus('saving')
    
    // Simulation of saving the layout (e.g. to localStorage or database)
    setTimeout(() => {
      try {
        const layoutData = JSON.stringify(placedObjects)
        localStorage.setItem('etherworld_room_layout', layoutData)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (err) {
        console.error('Failed to save layout', err)
        setSaveStatus('idle')
      }
    }, 800)
  }

  return (
    <>
      <button 
        onClick={toggleBuildMode}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
          borderRadius: 8, fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          backgroundColor: buildMode ? '#f59e0b' : '#4f46e5',
          color: 'white', border: 'none', cursor: 'pointer'
        }}
      >
        {buildMode ? <Move size={18} /> : <ShoppingCart size={18} />}
        {buildMode ? 'Mode Construction' : 'Boutique Meubles'}
      </button>

      {buildMode && isOpen && (
        <div style={{
          position: 'absolute', right: 16, top: 64, width: 320, maxHeight: '80vh',
          backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
          border: '1px solid #334155', borderRadius: 12, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', zIndex: 50, overflow: 'hidden', color: '#f1f5f9'
        }}>
          <div style={{ padding: 16, borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
            <h2 style={{ fontWeight: 'bold', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Package size={18} color="#818cf8" />
              Catalogue IKEA
            </h2>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', overflowX: 'auto', padding: 8, borderBottom: '1px solid #1e293b', gap: 4 }}>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '4px 12px', fontSize: 12, borderRadius: 9999, textTransform: 'capitalize', whiteSpace: 'nowrap',
                  border: 'none', cursor: 'pointer',
                  backgroundColor: activeCategory === cat ? '#6366f1' : '#1e293b',
                  color: activeCategory === cat ? 'white' : '#cbd5e1'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredCatalog.map(item => {
              const isSelected = selectedModelType === item.id;
              return (
                <div 
                  key={item.id}
                  onClick={() => handleSelectItem(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12,
                    borderRadius: 8, cursor: 'pointer', border: '1px solid',
                    backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.3)' : '#1e293b',
                    borderColor: isSelected ? '#6366f1' : '#334155',
                    boxShadow: isSelected ? '0 0 10px rgba(99,102,241,0.3)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 24, backgroundColor: '#0f172a', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid #334155' }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#34d399', fontFamily: 'monospace' }}>{item.price.toLocaleString()} $</div>
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{ color: '#818cf8' }}>
                      <Move size={18} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ padding: 16, borderTop: '1px solid #334155', backgroundColor: 'rgba(30, 41, 59, 0.8)' }}>
            <button 
              onClick={handleSaveLayout}
              disabled={saveStatus !== 'idle'}
              style={{
                width: '100%', padding: '8px 0', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                fontWeight: 600, border: 'none', cursor: saveStatus === 'idle' ? 'pointer' : 'default',
                backgroundColor: saveStatus === 'saved' ? '#059669' : '#4f46e5',
                color: 'white'
              }}
            >
              {saveStatus === 'idle' && <><Save size={18} /> Sauvegarder Layout</>}
              {saveStatus === 'saving' && <span>Sauvegarde...</span>}
              {saveStatus === 'saved' && <><Check size={18} /> Sauvegardé !</>}
            </button>
            <div style={{ fontSize: 11, textAlign: 'center', color: '#94a3b8', marginTop: 8 }}>
              Cliquez dans le monde pour placer. <br/>
              Maj + Clic pour pivoter. Clic Droit pour supprimer.
            </div>
          </div>
        </div>
      )}
      
      {buildMode && !isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            position: 'absolute', right: 16, top: 64, backgroundColor: '#1e293b', border: '1px solid #334155',
            color: 'white', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', zIndex: 50, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
          }}
        >
          <Package size={16} />
          Ouvrir Catalogue
        </button>
      )}
    </>
  )
}