'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type FeatureStatus = 'todo' | 'in-progress' | 'done' | 'locked'

interface Feature {
  id: string
  label: string
  description: string
  status: FeatureStatus
  progress?: number
  subFeatures?: { label: string; done: boolean }[]
}

interface FeatureCategory {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  features: Feature[]
}

const CATEGORIES: FeatureCategory[] = [
  {
    id: 'inventory',
    label: 'Inventaire',
    icon: <BackpackIcon />,
    color: '#f59e0b',
    features: [
      { 
        id: 'inv-system', 
        label: 'Systeme d\'inventaire', 
        description: 'Grille d\'items avec drag & drop',
        status: 'done',
        progress: 100,
        subFeatures: [
          { label: 'Grille 8x5 slots', done: true },
          { label: 'Drag & Drop deplacement', done: true },
          { label: 'Stacking items', done: true },
          { label: 'Categories/Filtres', done: true },
          { label: 'Recherche', done: true },
          { label: 'Tri par nom/rarete', done: true },
          { label: 'Panel details item', done: true },
          { label: 'Ajout/Suppression items', done: true },
        ]
      },
      { id: 'inv-ui', label: 'Interface inventaire', description: 'UI Panel avec onglets', status: 'done', progress: 100 },
      { id: 'inv-hotbar', label: 'Hotbar rapide', description: 'Barre d\'acces rapide 1-9', status: 'todo' },
    ]
  },
  {
    id: 'furniture',
    label: 'Meubles',
    icon: <ChairIcon />,
    color: '#8b5cf6',
    features: [
      { 
        id: 'furn-base', 
        label: 'Meubles de base', 
        description: 'Lit, bureau, chaises, tables',
        status: 'done',
        progress: 100,
        subFeatures: [
          { label: 'Lit de luxe', done: true },
          { label: 'Bureau gaming', done: true },
          { label: 'Canape', done: true },
          { label: 'TV & Meuble', done: true },
          { label: 'Mini-bar', done: true },
        ]
      },
      { id: 'furn-place', label: 'Placement libre', description: 'Drag & drop pour placer', status: 'todo' },
      { id: 'furn-shop', label: 'Boutique meubles', description: 'Catalogue avec prix', status: 'todo' },
      { id: 'furn-save', label: 'Sauvegarde layout', description: 'Sauvegarder la disposition', status: 'todo' },
    ]
  },
  {
    id: 'clothing',
    label: 'Vetements',
    icon: <ShirtIcon />,
    color: '#ec4899',
    features: [
      { id: 'cloth-system', label: 'Systeme vetements', description: 'Equipement sur avatar', status: 'todo' },
      { id: 'cloth-wardrobe', label: 'Garde-robe', description: 'Interface de selection', status: 'todo' },
      { id: 'cloth-layers', label: 'Layers vetements', description: 'Haut, bas, chaussures, accessoires', status: 'todo' },
      { id: 'cloth-colors', label: 'Customisation couleurs', description: 'Teintes personnalisables', status: 'todo' },
    ]
  },
  {
    id: 'auras',
    label: 'Auras',
    icon: <SparklesIcon />,
    color: '#06b6d4',
    features: [
      { id: 'aura-system', label: 'Systeme d\'auras', description: 'Effets visuels autour du joueur', status: 'todo' },
      { id: 'aura-particle', label: 'Particules', description: 'Effets de particules', status: 'todo' },
      { id: 'aura-glow', label: 'Effets lumineux', description: 'Glows et halos', status: 'todo' },
      { id: 'aura-rare', label: 'Auras rares', description: 'Auras legendaires/mythiques', status: 'locked' },
    ]
  },
  {
    id: 'movement',
    label: 'Deplacement',
    icon: <MoveIcon />,
    color: '#22c55e',
    features: [
      { id: 'move-wasd', label: 'Controles WASD', description: 'Deplacement clavier', status: 'todo' },
      { id: 'move-click', label: 'Click to move', description: 'Pathfinding au clic', status: 'todo' },
      { id: 'move-anim', label: 'Animations', description: 'Walk, run, idle', status: 'todo' },
      { id: 'move-collision', label: 'Collisions', description: 'Detection obstacles', status: 'todo' },
    ]
  },
  {
    id: 'isometric',
    label: 'Moteur Isometrique',
    icon: <CubeIcon />,
    color: '#6366f1',
    features: [
      { id: 'iso-camera', label: 'Camera isometrique', description: 'Vue 45 degres', status: 'todo' },
      { id: 'iso-grid', label: 'Grille de tiles', description: 'Systeme de tiles', status: 'todo' },
      { id: 'iso-depth', label: 'Depth sorting', description: 'Ordre de rendu correct', status: 'todo' },
      { id: 'iso-zoom', label: 'Zoom & Pan', description: 'Navigation camera', status: 'todo' },
    ]
  },
  {
    id: 'room-advanced',
    label: 'Chambre Avancee',
    icon: <HomeIcon />,
    color: '#f97316',
    features: [
      { 
        id: 'room-base', 
        label: 'Structure de base', 
        description: 'Murs, sol, plafond',
        status: 'done',
        progress: 100,
      },
      { 
        id: 'room-door', 
        label: 'Systeme de porte avance', 
        description: 'Porte magnetique avec carte d\'acces complete',
        status: 'done',
        progress: 100,
        subFeatures: [
          { label: 'Lecteur de carte avec scan anime', done: true },
          { label: 'LED indicatrice (ambre/vert/rouge)', done: true },
          { label: 'Animation ouverture/fermeture', done: true },
          { label: 'Niveaux d\'acces (guest/resident/vip/admin)', done: true },
          { label: 'Notifications visuelles', done: true },
          { label: 'Cooldown entre scans', done: true },
          { label: 'Sons acces (beep/erreur)', done: false },
          { label: 'Historique des acces', done: false },
          { label: 'Verrouillage d\'urgence', done: false },
          { label: 'Digicode backup', done: false },
        ]
      },
      { id: 'room-bathroom', label: 'Salle de bain', description: 'Zone separee avec douche/WC', status: 'done', progress: 100 },
      { id: 'room-balcony', label: 'Balcon', description: 'Espace exterieur', status: 'todo' },
      { id: 'room-view', label: 'Vue exterieure', description: 'Skyline de nuit', status: 'in-progress', progress: 50 },
    ]
  },
  {
    id: 'admin-play',
    label: 'Admin en Jeu',
    icon: <GamepadIcon />,
    color: '#ef4444',
    features: [
      { id: 'admin-fly', label: 'Mode vol', description: 'Voler dans la scene', status: 'todo' },
      { id: 'admin-noclip', label: 'Noclip', description: 'Traverser les murs', status: 'todo' },
      { id: 'admin-teleport', label: 'Teleportation', description: 'TP instantanee', status: 'todo' },
      { id: 'admin-spawn', label: 'Spawn items', description: 'Faire apparaitre objets', status: 'todo' },
    ]
  },
  {
    id: 'admin-tools',
    label: 'Outils Admin',
    icon: <WrenchIcon />,
    color: '#a855f7',
    features: [
      { id: 'tools-edit', label: 'Mode edition', description: 'Editer la scene en temps reel', status: 'todo' },
      { id: 'tools-inspector', label: 'Inspecteur', description: 'Voir/modifier proprietes', status: 'todo' },
      { id: 'tools-console', label: 'Console debug', description: 'Commandes textuelles', status: 'todo' },
      { id: 'tools-stats', label: 'Stats performance', description: 'FPS, draw calls, memory', status: 'todo' },
    ]
  },
]

export function DevPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)

  const totalFeatures = CATEGORIES.reduce((acc, cat) => acc + cat.features.length, 0)
  const completedFeatures = CATEGORIES.reduce((acc, cat) => 
    acc + cat.features.filter(f => f.status === 'done').length, 0)
  const progressPercent = Math.round((completedFeatures / totalFeatures) * 100)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 translate-x-[200px] z-50 
          bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500
          text-white px-4 py-2 rounded-lg shadow-lg border border-violet-400/30
          flex items-center gap-2 transition-all duration-200 hover:scale-105"
      >
        <CodeIcon className="w-4 h-4" />
        <span className="font-semibold text-sm">Dev Panel</span>
        <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{progressPercent}%</span>
      </button>
    )
  }

  return (
    <div className={cn(
      "fixed z-50 bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-2xl transition-all duration-300",
      isMinimized 
        ? "top-4 right-4 w-80" 
        : "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] max-w-[95vw] max-h-[85vh]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <CodeIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">EtherWorld Dev Panel</h2>
            <p className="text-xs text-muted-foreground">Roadmap & Fonctionnalites</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
            <div className="w-24 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-foreground">{progressPercent}%</span>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {isMinimized ? <MaximizeIcon className="w-4 h-4" /> : <MinimizeIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex h-[600px] max-h-[70vh]">
          {/* Sidebar */}
          <div className="w-64 border-r border-border p-3 overflow-y-auto">
            <div className="space-y-1">
              {CATEGORIES.map(category => {
                const completed = category.features.filter(f => f.status === 'done').length
                const total = category.features.length
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left",
                      selectedCategory === category.id
                        ? "bg-muted border border-border"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">{category.label}</div>
                      <div className="text-xs text-muted-foreground">{completed}/{total} complete</div>
                    </div>
                    {completed === total && (
                      <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedCategory ? (
              <CategoryDetail category={CATEGORIES.find(c => c.id === selectedCategory)!} />
            ) : (
              <OverviewGrid categories={CATEGORIES} onSelect={setSelectedCategory} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OverviewGrid({ categories, onSelect }: { categories: FeatureCategory[], onSelect: (id: string) => void }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-foreground mb-4">Vue d'ensemble</h3>
      <div className="grid grid-cols-3 gap-4">
        {categories.map(category => {
          const completed = category.features.filter(f => f.status === 'done').length
          const total = category.features.length
          const percent = Math.round((completed / total) * 100)
          
          return (
            <button
              key={category.id}
              onClick={() => onSelect(category.id)}
              className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 
                transition-all duration-200 text-left group hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${category.color}20`, color: category.color }}
                >
                  {category.icon}
                </div>
                <div className="font-semibold text-foreground">{category.label}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percent}%`, backgroundColor: category.color }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{percent}%</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {completed}/{total} fonctionnalites
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CategoryDetail({ category }: { category: FeatureCategory }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${category.color}20`, color: category.color }}
        >
          {category.icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">{category.label}</h3>
          <p className="text-sm text-muted-foreground">
            {category.features.filter(f => f.status === 'done').length}/{category.features.length} fonctionnalites completes
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {category.features.map(feature => (
          <FeatureCard key={feature.id} feature={feature} color={category.color} />
        ))}
      </div>
    </div>
  )
}

function FeatureCard({ feature, color }: { feature: Feature, color: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const statusConfig = {
    'todo': { label: 'A faire', bg: 'bg-muted', text: 'text-muted-foreground', icon: <CircleIcon /> },
    'in-progress': { label: 'En cours', bg: 'bg-amber-500/20', text: 'text-amber-500', icon: <LoaderIcon /> },
    'done': { label: 'Termine', bg: 'bg-green-500/20', text: 'text-green-500', icon: <CheckIcon /> },
    'locked': { label: 'Verrouille', bg: 'bg-red-500/20', text: 'text-red-500', icon: <LockIcon /> },
  }
  
  const status = statusConfig[feature.status]
  
  return (
    <div 
      className={cn(
        "p-4 rounded-xl border transition-all duration-200",
        feature.status === 'done' 
          ? "border-green-500/30 bg-green-500/5" 
          : feature.status === 'locked'
          ? "border-red-500/30 bg-red-500/5 opacity-60"
          : "border-border bg-muted/20 hover:bg-muted/40"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div 
            className={cn("w-6 h-6 rounded-full flex items-center justify-center mt-0.5", status.bg, status.text)}
          >
            {status.icon}
          </div>
          <div>
            <div className="font-medium text-foreground">{feature.label}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{feature.description}</div>
            
            {feature.progress !== undefined && feature.status !== 'done' && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-32 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${feature.progress}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{feature.progress}%</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={cn("px-2 py-1 rounded-md text-xs font-medium", status.bg, status.text)}>
            {status.label}
          </span>
          {feature.subFeatures && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <ChevronIcon className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
            </button>
          )}
        </div>
      </div>
      
      {isExpanded && feature.subFeatures && (
        <div className="mt-4 ml-9 space-y-2 border-l-2 border-border pl-4">
          {feature.subFeatures.map((sub, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className={cn(
                "w-4 h-4 rounded flex items-center justify-center",
                sub.done ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
              )}>
                {sub.done ? <CheckIcon className="w-3 h-3" /> : <CircleIcon className="w-3 h-3" />}
              </div>
              <span className={sub.done ? "text-muted-foreground line-through" : "text-foreground"}>
                {sub.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Icons
function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  )
}

function BackpackIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
}

function ChairIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function ShirtIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v3m-2 4v9a2 2 0 002 2h8a2 2 0 002-2v-9m-10 0l-2-4h14l-2 4m-10 0h10" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}

function MoveIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  )
}

function CubeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function GamepadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  )
}

function WrenchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function MinimizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
    </svg>
  )
}

function MaximizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CircleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-3 h-3", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-3 h-3 animate-spin", className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-3 h-3", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-3 h-3", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}
