/**
 * types.ts
 * Types partagés pour tout le système storage du dépanneur
 */

// ─────────────────────────────────────────────
// PRODUITS
// ─────────────────────────────────────────────

export type ProductCategory =
  | 'chips_snacks'
  | 'boissons'
  | 'confiserie'
  | 'tabac'
  | 'loterie'
  | 'congelé'
  | 'dairy'
  | 'boulangerie'
  | 'hygiene'
  | 'alcool'
  | 'café'
  | 'hot_food'

export type ProductLocation =
  | 'shelf_left'
  | 'shelf_right'
  | 'fridge_left'
  | 'fridge_center'
  | 'fridge_right'
  | 'counter'
  | 'coffee_station'
  | 'hot_food_station'
  | 'magazine_rack'
  | 'cigarette_display'
  | 'storage_back'

export interface Product {
  id:           string
  name:         string
  nameFr:       string
  category:     ProductCategory
  price:        number          // $ CAD
  cost:         number          // prix d'achat
  stock:        number          // unités en stock
  maxStock:     number          // capacité max étagère
  location:     ProductLocation
  barcode?:     string
  taxable:      boolean         // TPS/TVQ applicable
  ageRestricted: boolean        // 18+
  imageColor:   string          // couleur 3D représentative
  weight?:      number          // grammes
  expiresIn?:   number          // jours avant expiration
}

export interface ProductSnapshot {
  productId: string
  stock:     number
  updatedAt: number             // timestamp
}

// ─────────────────────────────────────────────
// TRANSACTIONS
// ─────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'coupon'

export interface CartItem {
  product:  Product
  quantity: number
  discount: number              // % rabais
}

export interface Transaction {
  id:            string
  items:         CartItem[]
  subtotal:      number
  tps:           number         // 5%
  tvq:           number         // 9.975%
  total:         number
  payment:       PaymentMethod
  cashGiven?:    number
  changeDue?:    number
  timestamp:     number
  cashierId?:    string
  receiptNo:     string
}

export interface DailyReport {
  date:          string         // YYYY-MM-DD
  transactions:  number
  revenue:       number
  cogs:          number         // coût des marchandises vendues
  grossProfit:   number
  topProducts:   Array<{ productId: string; qty: number; revenue: number }>
  paymentBreakdown: Record<PaymentMethod, number>
}

// ─────────────────────────────────────────────
// ÉTAT DU MAGASIN
// ─────────────────────────────────────────────

export type StoreStatus = 'open' | 'closed' | 'restricted'

export interface StoreState {
  status:           StoreStatus
  doorCode:         string       // code clavier
  doorUnlocked:     boolean
  alarmArmed:       boolean
  currentShiftId:   string | null
  lastOpenedAt:     number | null
  lastClosedAt:     number | null
  register1Balance: number       // $ dans caisse 1
  register2Balance: number       // $ dans caisse 2
  safeBalance:      number       // coffre-fort
  temperature:      number       // température frigos (°C)
  cameraOnline:     boolean
}

// ─────────────────────────────────────────────
// EMPLOYÉS / SHIFTS
// ─────────────────────────────────────────────

export type EmployeeRole = 'cashier' | 'manager' | 'stock_clerk' | 'security'

export interface Employee {
  id:        string
  name:      string
  role:      EmployeeRole
  hourlyRate: number
  active:    boolean
  pin:       string             // PIN 4 chiffres pour login caisse
}

export interface Shift {
  id:          string
  employeeId:  string
  startTime:   number           // timestamp
  endTime?:    number
  hoursWorked?: number
  earnings?:   number
  register:    1 | 2
  notes?:      string
}

// ─────────────────────────────────────────────
// LIVRAISONS
// ─────────────────────────────────────────────

export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'cancelled'

export interface DeliveryOrder {
  id:         string
  items:      Array<{ productId: string; quantity: number; unitCost: number }>
  supplier:   string
  status:     DeliveryStatus
  orderedAt:  number
  expectedAt: number
  deliveredAt?: number
  totalCost:  number
}

// ─────────────────────────────────────────────
// FIREBASE SYNC
// ─────────────────────────────────────────────

export interface SyncStatus {
  lastSync:   number | null
  pending:    boolean
  error:      string | null
}

export interface DepanneurSaveData {
  version:      number
  storeState:   StoreState
  inventory:    ProductSnapshot[]
  activeShift:  Shift | null
  pendingTx:    Transaction[]   // transactions non-synchées
  syncStatus:   SyncStatus
}