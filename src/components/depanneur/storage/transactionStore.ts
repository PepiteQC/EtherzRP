/**
 * transactionStore.ts
 * Gestion des transactions — caisse, panier, reçus
 * - Calcul TPS/TVQ automatique
 * - Gestion monnaie
 * - Historique journalier
 * - Rapport de ventes
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  CartItem,
  Transaction,
  PaymentMethod,
  DailyReport,
  Product,
} from './types'
import { useInventoryStore } from './inventoryStore'

// ─────────────────────────────────────────────
// TAXES QUÉBEC
// ─────────────────────────────────────────────

const TPS_RATE = 0.05       // Taxe fédérale
const TVQ_RATE = 0.09975    // Taxe provinciale QC

function calcTaxes(subtotal: number, hasTaxableItem: boolean) {
  if (!hasTaxableItem) return { tps: 0, tvq: 0 }
  const tps = Math.round(subtotal * TPS_RATE * 100) / 100
  const tvq = Math.round(subtotal * TVQ_RATE * 100) / 100
  return { tps, tvq }
}

function generateReceiptNo(): string {
  const date = new Date()
  const d = date.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `CT-${d}-${rand}`
}

function generateTxId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─────────────────────────────────────────────
// STORE INTERFACE
// ─────────────────────────────────────────────

interface TransactionStore {
  // Panier actif
  cart:             CartItem[]
  activeRegister:   1 | 2

  // Transactions
  transactions:     Transaction[]
  pendingSync:      Transaction[]

  // Totaux panier
  cartSubtotal:     number
  cartTPS:          number
  cartTVQ:          number
  cartTotal:        number

  // ── Panier ──
  addToCart:        (product: Product, qty?: number) => void
  removeFromCart:   (productId: string) => void
  updateQty:        (productId: string, qty: number) => void
  applyDiscount:    (productId: string, pct: number) => void
  clearCart:        () => void

  // ── Paiement ──
  checkout:         (method: PaymentMethod, cashGiven?: number) => Transaction | null

  // ── Historique ──
  getToday:         () => Transaction[]
  getDailyReport:   (date?: string) => DailyReport
  getTransaction:   (id: string) => Transaction | undefined

  // ── Interne ──
  _recalcCart:      () => void
}

// ─────────────────────────────────────────────
// STORE IMPLEMENTATION
// ─────────────────────────────────────────────

export const useTransactionStore = create<TransactionStore>()(
  subscribeWithSelector((set, get) => ({
    cart:           [],
    activeRegister: 1,
    transactions:   [],
    pendingSync:    [],
    cartSubtotal:   0,
    cartTPS:        0,
    cartTVQ:        0,
    cartTotal:      0,

    // ── Recalcul totaux panier ──
    _recalcCart: () => {
      const { cart } = get()
      let subtotal = 0
      let hasTaxable = false

      cart.forEach(item => {
        const effectivePrice = item.product.price * (1 - item.discount / 100)
        subtotal += effectivePrice * item.quantity
        if (item.product.taxable) hasTaxable = true
      })

      subtotal = Math.round(subtotal * 100) / 100
      const { tps, tvq } = calcTaxes(subtotal, hasTaxable)
      const total = Math.round((subtotal + tps + tvq) * 100) / 100

      set({ cartSubtotal: subtotal, cartTPS: tps, cartTVQ: tvq, cartTotal: total })
    },

    // ── Ajout au panier ──
    addToCart: (product, qty = 1) => {
      const { cart } = get()
      const existing = cart.find(i => i.product.id === product.id)

      let newCart: CartItem[]
      if (existing) {
        newCart = cart.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + qty }
            : i
        )
      } else {
        newCart = [...cart, { product, quantity: qty, discount: 0 }]
      }

      set({ cart: newCart })
      get()._recalcCart()
    },

    // ── Retrait du panier ──
    removeFromCart: (productId) => {
      set({ cart: get().cart.filter(i => i.product.id !== productId) })
      get()._recalcCart()
    },

    // ── Mise à jour quantité ──
    updateQty: (productId, qty) => {
      if (qty <= 0) {
        get().removeFromCart(productId)
        return
      }
      set({
        cart: get().cart.map(i =>
          i.product.id === productId ? { ...i, quantity: qty } : i
        ),
      })
      get()._recalcCart()
    },

    // ── Rabais ──
    applyDiscount: (productId, pct) => {
      const discount = Math.max(0, Math.min(100, pct))
      set({
        cart: get().cart.map(i =>
          i.product.id === productId ? { ...i, discount } : i
        ),
      })
      get()._recalcCart()
    },

    // ── Vider panier ──
    clearCart: () => {
      set({ cart: [], cartSubtotal: 0, cartTPS: 0, cartTVQ: 0, cartTotal: 0 })
    },

    // ── Checkout ──
    checkout: (method, cashGiven) => {
      const {
        cart, cartSubtotal, cartTPS, cartTVQ, cartTotal, transactions, pendingSync,
      } = get()

      if (cart.length === 0) return null

      // Vérifier stock suffisant
      const inventory = useInventoryStore.getState()
      for (const item of cart) {
        const product = inventory.getProduct(item.product.id)
        if (product && product.stock !== 999 && product.stock < item.quantity) {
          console.warn(`[transactionStore] Stock insuffisant: ${item.product.id}`)
          return null
        }
      }

      // Calculer monnaie
      const changeDue =
        method === 'cash' && cashGiven !== undefined
          ? Math.max(0, Math.round((cashGiven - cartTotal) * 100) / 100)
          : undefined

      const tx: Transaction = {
        id:          generateTxId(),
        items:       [...cart],
        subtotal:    cartSubtotal,
        tps:         cartTPS,
        tvq:         cartTVQ,
        total:       cartTotal,
        payment:     method,
        cashGiven,
        changeDue,
        timestamp:   Date.now(),
        receiptNo:   generateReceiptNo(),
      }

      // Décrémenter le stock
      cart.forEach(item => {
        if (item.product.stock !== 999) {
          inventory.decrementStock(item.product.id, item.quantity)
        }
      })

      set({
        transactions:  [...transactions, tx],
        pendingSync:   [...pendingSync, tx],
      })

      get().clearCart()
      return tx
    },

    // ── Transactions du jour ──
    getToday: () => {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      return get().transactions.filter(tx => tx.timestamp >= startOfDay.getTime())
    },

    // ── Rapport journalier ──
    getDailyReport: (date) => {
      const targetDate = date ?? new Date().toISOString().slice(0, 10)
      const startMs = new Date(targetDate).setHours(0, 0, 0, 0)
      const endMs   = new Date(targetDate).setHours(23, 59, 59, 999)

      const txs = get().transactions.filter(
        tx => tx.timestamp >= startMs && tx.timestamp <= endMs
      )

      const revenue = txs.reduce((s, tx) => s + tx.total, 0)
      const cogs = txs.reduce((s, tx) =>
        s + tx.items.reduce((si, item) => si + item.product.cost * item.quantity, 0), 0
      )

      // Top produits
      const productMap = new Map<string, { qty: number; revenue: number }>()
      txs.forEach(tx => {
        tx.items.forEach(item => {
          const prev = productMap.get(item.product.id) ?? { qty: 0, revenue: 0 }
          productMap.set(item.product.id, {
            qty:     prev.qty + item.quantity,
            revenue: prev.revenue + item.product.price * item.quantity,
          })
        })
      })

      const topProducts = Array.from(productMap.entries())
        .map(([productId, data]) => ({ productId, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      // Paiements
      const paymentBreakdown: Record<PaymentMethod, number> = {
        cash: 0, debit: 0, credit: 0, coupon: 0,
      }
      txs.forEach(tx => {
        paymentBreakdown[tx.payment] += tx.total
      })

      return {
        date:     targetDate,
        transactions: txs.length,
        revenue:  Math.round(revenue * 100) / 100,
        cogs:     Math.round(cogs * 100) / 100,
        grossProfit: Math.round((revenue - cogs) * 100) / 100,
        topProducts,
        paymentBreakdown,
      }
    },

    // ── Get transaction ──
    getTransaction: (id) => get().transactions.find(tx => tx.id === id),
  }))
)