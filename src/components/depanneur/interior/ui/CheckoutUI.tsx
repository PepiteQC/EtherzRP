/**
 * CheckoutUI.tsx
 * Interface de caisse — liste des items, total, paiement
 */

import { memo, useCallback } from 'react'
import { useTransactionStore } from '../../storage/transactionStore'
import type { PlayerInventoryItem } from '../types'
import type { PaymentMethod } from '../../storage/types'

interface CheckoutUIProps {
  isOpen:        boolean
  playerItems:   PlayerInventoryItem[]
  playerMoney:   number
  cashierName:   string
  onPay:         (method: PaymentMethod) => void
  onCancel:      () => void
}

export const CheckoutUI = memo(function CheckoutUI({
  isOpen,
  playerItems,
  playerMoney,
  cashierName,
  onPay,
  onCancel,
}: CheckoutUIProps) {
  const cartSubtotal = useTransactionStore(s => s.cartSubtotal)
  const cartTPS      = useTransactionStore(s => s.cartTPS)
  const cartTVQ      = useTransactionStore(s => s.cartTVQ)
  const cartTotal    = useTransactionStore(s => s.cartTotal)
  const canAfford    = playerMoney >= cartTotal

  if (!isOpen) return null

  return (
    <div style={{
      position:   'fixed',
      top:        '50%',
      left:       '50%',
      transform:  'translate(-50%, -50%)',
      background: 'linear-gradient(135deg, #1a1a2a 0%, #0a0a1a 100%)',
      border:     '1px solid rgba(255,255,255,0.15)',
      borderRadius: 12,
      padding:    24,
      minWidth:   340,
      maxWidth:   420,
      color:      '#ffffff',
      fontFamily: 'monospace',
      zIndex:     200,
      boxShadow:  '0 20px 60px rgba(0,0,0,0.8)',
    }}>
      {/* Header */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   16,
        paddingBottom:  12,
        borderBottom:   '1px solid rgba(255,255,255,0.1)',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#cc0000' }}>
            🏪 COUCHE-TARD
          </div>
          <div style={{ fontSize: 11, color: '#aaaaaa' }}>
            Caissier: {cashierName}
          </div>
        </div>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            border:     '1px solid rgba(255,255,255,0.2)',
            borderRadius: 6,
            color:      '#aaaaaa',
            cursor:     'pointer',
            padding:    '4px 10px',
            fontFamily: 'monospace',
            fontSize:   12,
          }}
        >
          ✕ Annuler
        </button>
      </div>

      {/* Items list */}
      <div style={{
        maxHeight:  200,
        overflowY:  'auto',
        marginBottom: 16,
      }}>
        {playerItems.length === 0 ? (
          <div style={{ color: '#666666', textAlign: 'center', padding: 20 }}>
            Aucun article
          </div>
        ) : (
          playerItems.map((item, i) => (
            <div key={i} style={{
              display:        'flex',
              justifyContent: 'space-between',
              padding:        '6px 0',
              borderBottom:   '1px solid rgba(255,255,255,0.05)',
              fontSize:       13,
            }}>
              <span style={{ color: '#dddddd' }}>
                {item.product.nameFr}
                <span style={{ color: '#888888', marginLeft: 6 }}>
                  x{item.quantity}
                </span>
              </span>
              <span style={{ color: '#ffffff' }}>
                ${(item.product.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Totaux */}
      <div style={{
        background:   'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding:      '10px 12px',
        marginBottom: 16,
        fontSize:     12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#aaaaaa' }}>Sous-total</span>
          <span>${cartSubtotal.toFixed(2)}</span>
        </div>
        {cartTPS > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#aaaaaa' }}>TPS (5%)</span>
            <span>${cartTPS.toFixed(2)}</span>
          </div>
        )}
        {cartTVQ > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#aaaaaa' }}>TVQ (9.975%)</span>
            <span>${cartTVQ.toFixed(2)}</span>
          </div>
        )}
        <div style={{
          display:     'flex',
          justifyContent: 'space-between',
          marginTop:   8,
          paddingTop:  8,
          borderTop:   '1px solid rgba(255,255,255,0.1)',
          fontSize:    16,
          fontWeight:  'bold',
          color:       canAfford ? '#00ff88' : '#ff4444',
        }}>
          <span>TOTAL</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <div style={{
          textAlign:   'right',
          fontSize:    11,
          color:       '#666666',
          marginTop:   4,
        }}>
          Votre argent: ${playerMoney.toFixed(2)}
        </div>
      </div>

      {/* Boutons paiement */}
      {canAfford ? (
        <div style={{ display: 'flex', gap: 8 }}>
          {(['cash', 'debit', 'credit'] as PaymentMethod[]).map(method => {
            const labels = { cash: '💵 Comptant', debit: '💳 Débit', credit: '💳 Crédit' }
            return (
              <button
                key={method}
                onClick={() => onPay(method)}
                style={{
                  flex:       1,
                  background: method === 'cash' ? '#006600' : '#003366',
                  border:     'none',
                  borderRadius: 8,
                  color:      '#ffffff',
                  padding:    '10px 0',
                  cursor:     'pointer',
                  fontFamily: 'monospace',
                  fontSize:   12,
                  fontWeight: 'bold',
                  transition: 'opacity 0.15s',
                }}
              >
                {labels[method]}
              </button>
            )
          })}
        </div>
      ) : (
        <div style={{
          textAlign:   'center',
          color:       '#ff4444',
          fontSize:    13,
          padding:     '10px 0',
          fontWeight:  'bold',
        }}>
          💸 Fonds insuffisants
        </div>
      )}
    </div>
  )
})