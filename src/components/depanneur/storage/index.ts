/**
 * storage/index.ts
 * Barrel export — point d'entrée unique pour le storage du dépanneur
 */

// ── Types ──
export type {
  Product,
  ProductCategory,
  ProductLocation,
  ProductSnapshot,
  CartItem,
  Transaction,
  PaymentMethod,
  DailyReport,
  StoreState,
  StoreStatus,
  Employee,
  EmployeeRole,
  Shift,
  DeliveryOrder,
  DeliveryStatus,
  SyncStatus,
  DepanneurSaveData,
} from './types'

// ── Stores ──
export { useInventoryStore } from './inventoryStore'
export { useTransactionStore } from './transactionStore'
export { useStoreStateStore } from './storeStateStore'
export { useEmployeeStore } from './employeeStore'

// ── Firebase ──
export {
  uploadInventory,
  downloadInventory,
  uploadStoreState,
  uploadPendingTransactions,
  subscribeInventory,
  useDepanneurSync,
} from './firebaseSync'