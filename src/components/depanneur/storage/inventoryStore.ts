/**
 * inventoryStore.ts
 * Gestion de l'inventaire — Zustand store
 * - CRUD produits
 * - Stock management
 * - Alertes bas stock
 * - Calcul valeur inventaire
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  Product,
  ProductCategory,
  ProductLocation,
  ProductSnapshot,
} from './types'

// ─────────────────────────────────────────────
// CATALOGUE INITIAL — Produits Couche-Tard typiques
// ─────────────────────────────────────────────

const INITIAL_PRODUCTS: Product[] = [
  // ── CHIPS & SNACKS ──
  {
    id: 'lays-original',
    name: 'Lay\'s Original',
    nameFr: 'Lay\'s Original',
    category: 'chips_snacks',
    price: 4.99,
    cost: 2.10,
    stock: 24,
    maxStock: 36,
    location: 'shelf_left',
    barcode: '060410000001',
    taxable: false,
    ageRestricted: false,
    imageColor: '#f5e642',
    weight: 235,
  },
  {
    id: 'doritos-nacho',
    name: 'Doritos Nacho Cheese',
    nameFr: 'Doritos Fromage Nacho',
    category: 'chips_snacks',
    price: 4.99,
    cost: 2.10,
    stock: 18,
    maxStock: 30,
    location: 'shelf_left',
    barcode: '060410000002',
    taxable: false,
    ageRestricted: false,
    imageColor: '#e85d04',
    weight: 255,
  },
  {
    id: 'pringles-original',
    name: 'Pringles Original',
    nameFr: 'Pringles Original',
    category: 'chips_snacks',
    price: 3.49,
    cost: 1.60,
    stock: 20,
    maxStock: 28,
    location: 'shelf_left',
    barcode: '060410000003',
    taxable: false,
    ageRestricted: false,
    imageColor: '#cc0000',
    weight: 165,
  },

  // ── BOISSONS ──
  {
    id: 'pepsi-2l',
    name: 'Pepsi 2L',
    nameFr: 'Pepsi 2 litres',
    category: 'boissons',
    price: 3.29,
    cost: 1.55,
    stock: 12,
    maxStock: 24,
    location: 'fridge_center',
    barcode: '060410000010',
    taxable: false,
    ageRestricted: false,
    imageColor: '#1a3a8c',
    weight: 2000,
  },
  {
    id: 'coke-355ml',
    name: 'Coca-Cola 355ml',
    nameFr: 'Coca-Cola 355ml',
    category: 'boissons',
    price: 2.49,
    cost: 1.00,
    stock: 48,
    maxStock: 72,
    location: 'fridge_left',
    barcode: '060410000011',
    taxable: false,
    ageRestricted: false,
    imageColor: '#cc0000',
    weight: 355,
  },
  {
    id: 'red-bull-250ml',
    name: 'Red Bull 250ml',
    nameFr: 'Red Bull 250ml',
    category: 'boissons',
    price: 3.99,
    cost: 1.85,
    stock: 36,
    maxStock: 48,
    location: 'fridge_right',
    barcode: '060410000012',
    taxable: false,
    ageRestricted: false,
    imageColor: '#e8d400',
    weight: 250,
  },
  {
    id: 'gatorade-blue',
    name: 'Gatorade Blue Lightning',
    nameFr: 'Gatorade Électricité Bleue',
    category: 'boissons',
    price: 2.99,
    cost: 1.30,
    stock: 30,
    maxStock: 48,
    location: 'fridge_center',
    barcode: '060410000013',
    taxable: false,
    ageRestricted: false,
    imageColor: '#1a88e8',
    weight: 591,
  },
  {
    id: 'brisk-ice-tea',
    name: 'Brisk Ice Tea 500ml',
    nameFr: 'Brisk Thé Glacé 500ml',
    category: 'boissons',
    price: 2.29,
    cost: 0.95,
    stock: 24,
    maxStock: 36,
    location: 'fridge_left',
    barcode: '060410000014',
    taxable: false,
    ageRestricted: false,
    imageColor: '#c87d2a',
    weight: 500,
  },

  // ── CONFISERIE ──
  {
    id: 'oh-henry',
    name: 'Oh Henry! 58g',
    nameFr: 'Oh Henry! 58g',
    category: 'confiserie',
    price: 2.29,
    cost: 0.95,
    stock: 30,
    maxStock: 50,
    location: 'counter',
    barcode: '060410000020',
    taxable: false,
    ageRestricted: false,
    imageColor: '#8b4513',
    weight: 58,
  },
  {
    id: 'kit-kat',
    name: 'Kit Kat 45g',
    nameFr: 'Kit Kat 45g',
    category: 'confiserie',
    price: 2.19,
    cost: 0.90,
    stock: 24,
    maxStock: 40,
    location: 'counter',
    barcode: '060410000021',
    taxable: false,
    ageRestricted: false,
    imageColor: '#cc2222',
    weight: 45,
  },
  {
    id: 'extra-gum',
    name: 'Extra Gum Spearmint',
    nameFr: 'Gomme Extra Spearmint',
    category: 'confiserie',
    price: 1.99,
    cost: 0.80,
    stock: 40,
    maxStock: 60,
    location: 'counter',
    barcode: '060410000022',
    taxable: false,
    ageRestricted: false,
    imageColor: '#4CAF50',
    weight: 15,
  },

  // ── TABAC ──
  {
    id: 'du-maurier-king',
    name: 'Du Maurier King Size 20',
    nameFr: 'Du Maurier Format Roi 20',
    category: 'tabac',
    price: 18.50,
    cost: 14.00,
    stock: 40,
    maxStock: 80,
    location: 'cigarette_display',
    barcode: '060410000030',
    taxable: true,
    ageRestricted: true,
    imageColor: '#2a2a2a',
    weight: 23,
  },
  {
    id: 'export-a-light',
    name: 'Export \'A\' Light 25',
    nameFr: 'Export \'A\' Légères 25',
    category: 'tabac',
    price: 21.00,
    cost: 16.00,
    stock: 30,
    maxStock: 60,
    location: 'cigarette_display',
    barcode: '060410000031',
    taxable: true,
    ageRestricted: true,
    imageColor: '#003366',
    weight: 28,
  },

  // ── LOTERIE ──
  {
    id: 'lotto-649',
    name: 'Lotto 6/49',
    nameFr: 'Lotto 6/49',
    category: 'loterie',
    price: 3.00,
    cost: 2.50,
    stock: 999,
    maxStock: 999,
    location: 'counter',
    barcode: '060410000040',
    taxable: false,
    ageRestricted: false,
    imageColor: '#ffcc00',
  },
  {
    id: 'gratteux-5',
    name: 'Gratteux $5',
    nameFr: 'Gratteux 5$',
    category: 'loterie',
    price: 5.00,
    cost: 4.20,
    stock: 100,
    maxStock: 200,
    location: 'counter',
    barcode: '060410000041',
    taxable: false,
    ageRestricted: false,
    imageColor: '#ff4444',
  },

  // ── HOT FOOD ──
  {
    id: 'hot-dog',
    name: 'Hot Dog',
    nameFr: 'Hot-Dog',
    category: 'hot_food',
    price: 2.50,
    cost: 0.60,
    stock: 10,
    maxStock: 10,
    location: 'hot_food_station',
    taxable: false,
    ageRestricted: false,
    imageColor: '#c47030',
    expiresIn: 0.5,
  },

  // ── CAFÉ ──
  {
    id: 'cafe-petit',
    name: 'Café Petit (8oz)',
    nameFr: 'Café Petit (8oz)',
    category: 'café',
    price: 1.99,
    cost: 0.35,
    stock: 999,
    maxStock: 999,
    location: 'coffee_station',
    taxable: false,
    ageRestricted: false,
    imageColor: '#6b4423',
  },
  {
    id: 'cafe-grand',
    name: 'Café Grand (16oz)',
    nameFr: 'Café Grand (16oz)',
    category: 'café',
    price: 2.79,
    cost: 0.50,
    stock: 999,
    maxStock: 999,
    location: 'coffee_station',
    taxable: false,
    ageRestricted: false,
    imageColor: '#5a3a1a',
  },
  {
    id: 'slurpee-small',
    name: 'Slurpee Small',
    nameFr: 'Sloche Petit',
    category: 'café',
    price: 1.89,
    cost: 0.30,
    stock: 999,
    maxStock: 999,
    location: 'coffee_station',
    taxable: false,
    ageRestricted: false,
    imageColor: '#ff2244',
  },

  // ── DAIRY / CONGELÉ ──
  {
    id: 'lait-2l',
    name: 'Lait 2% 2L',
    nameFr: 'Lait 2% 2 litres',
    category: 'dairy',
    price: 5.49,
    cost: 3.80,
    stock: 8,
    maxStock: 16,
    location: 'fridge_right',
    barcode: '060410000060',
    taxable: false,
    ageRestricted: false,
    imageColor: '#f0f0f0',
    weight: 2000,
    expiresIn: 7,
  },
]

// ─────────────────────────────────────────────
// LOW STOCK THRESHOLD
// ─────────────────────────────────────────────

const LOW_STOCK_RATIO = 0.25 // < 25% du max = alerte

// ─────────────────────────────────────────────
// STORE INTERFACE
// ─────────────────────────────────────────────

interface InventoryStore {
  products:     Map<string, Product>
  lowStockIds:  Set<string>
  lastUpdated:  number

  // ── Actions ──
  init:               () => void
  getProduct:         (id: string) => Product | undefined
  getByCategory:      (category: ProductCategory) => Product[]
  getByLocation:      (location: ProductLocation) => Product[]
  getLowStock:        () => Product[]
  
  decrementStock:     (id: string, qty?: number) => boolean
  incrementStock:     (id: string, qty: number) => void
  setStock:           (id: string, qty: number) => void
  
  restockAll:         () => void
  restockProduct:     (id: string) => void
  
  getTotalValue:      () => number
  getRetailValue:     () => number
  
  applySnapshot:      (snapshots: ProductSnapshot[]) => void
  toSnapshot:         () => ProductSnapshot[]
}

// ─────────────────────────────────────────────
// STORE IMPLEMENTATION
// ─────────────────────────────────────────────

export const useInventoryStore = create<InventoryStore>()(
  subscribeWithSelector((set, get) => ({
    products:    new Map(INITIAL_PRODUCTS.map(p => [p.id, { ...p }])),
    lowStockIds: new Set<string>(),
    lastUpdated: Date.now(),

    // ── Init — calcule low stock initial ──
    init() {
      const { products } = get()
      const lowStockIds = new Set<string>()
      products.forEach((p, id) => {
        if (p.stock / p.maxStock < LOW_STOCK_RATIO) lowStockIds.add(id)
      })
      set({ lowStockIds })
    },

    // ── Getters ──
    getProduct: (id) => get().products.get(id),

    getByCategory: (category) => {
      const result: Product[] = []
      get().products.forEach(p => {
        if (p.category === category) result.push(p)
      })
      return result
    },

    getByLocation: (location) => {
      const result: Product[] = []
      get().products.forEach(p => {
        if (p.location === location) result.push(p)
      })
      return result
    },

    getLowStock: () => {
      const result: Product[] = []
      get().products.forEach(p => {
        if (p.stock / p.maxStock < LOW_STOCK_RATIO) result.push(p)
      })
      return result
    },

    // ── Stock operations ──
    decrementStock: (id, qty = 1) => {
      const products = new Map(get().products)
      const product = products.get(id)
      if (!product || product.stock < qty) return false

      const updated: Product = { ...product, stock: product.stock - qty }
      products.set(id, updated)

      const lowStockIds = new Set(get().lowStockIds)
      if (updated.stock / updated.maxStock < LOW_STOCK_RATIO) {
        lowStockIds.add(id)
      }

      set({ products, lowStockIds, lastUpdated: Date.now() })
      return true
    },

    incrementStock: (id, qty) => {
      const products = new Map(get().products)
      const product = products.get(id)
      if (!product) return

      const newStock = Math.min(product.stock + qty, product.maxStock)
      const updated: Product = { ...product, stock: newStock }
      products.set(id, updated)

      const lowStockIds = new Set(get().lowStockIds)
      if (newStock / updated.maxStock >= LOW_STOCK_RATIO) {
        lowStockIds.delete(id)
      }

      set({ products, lowStockIds, lastUpdated: Date.now() })
    },

    setStock: (id, qty) => {
      const products = new Map(get().products)
      const product = products.get(id)
      if (!product) return

      const clampedQty = Math.max(0, Math.min(qty, product.maxStock))
      products.set(id, { ...product, stock: clampedQty })
      set({ products, lastUpdated: Date.now() })
    },

    // ── Restock ──
    restockAll: () => {
      const products = new Map(get().products)
      products.forEach((p, id) => {
        products.set(id, { ...p, stock: p.maxStock })
      })
      set({ products, lowStockIds: new Set(), lastUpdated: Date.now() })
    },

    restockProduct: (id) => {
      const products = new Map(get().products)
      const product = products.get(id)
      if (!product) return
      products.set(id, { ...product, stock: product.maxStock })
      const lowStockIds = new Set(get().lowStockIds)
      lowStockIds.delete(id)
      set({ products, lowStockIds, lastUpdated: Date.now() })
    },

    // ── Valeur ──
    getTotalValue: () => {
      let total = 0
      get().products.forEach(p => { total += p.cost * p.stock })
      return Math.round(total * 100) / 100
    },

    getRetailValue: () => {
      let total = 0
      get().products.forEach(p => { total += p.price * p.stock })
      return Math.round(total * 100) / 100
    },

    // ── Firebase sync ──
    applySnapshot: (snapshots) => {
      const products = new Map(get().products)
      snapshots.forEach(({ productId, stock }) => {
        const p = products.get(productId)
        if (p) products.set(productId, { ...p, stock })
      })
      set({ products, lastUpdated: Date.now() })
    },

    toSnapshot: () => {
      const snapshots: ProductSnapshot[] = []
      get().products.forEach((p, productId) => {
        snapshots.push({ productId, stock: p.stock, updatedAt: Date.now() })
      })
      return snapshots
    },
  }))
)