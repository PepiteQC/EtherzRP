// src/components/hotel/ui/SafeBoxUI.tsx

import React, { useState, useCallback } from 'react';
import { useSafeBox } from '../hooks/useSafeBox';

interface SafeBoxUIProps {
  roomId: string;
  uid: string;
  onClose: () => void;
}

const font = "'JetBrains Mono','Courier New',monospace";

export const SafeBoxUI: React.FC<SafeBoxUIProps> = ({ roomId, uid, onClose }) => {
  const safe = useSafeBox();
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'main' | 'set' | 'unlock'>('main');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSetCode = useCallback(async () => {
    if (code.length < 4) {
      setFeedback('Code trop court (min 4 chiffres)');
      return;
    }
    try {
      await safe.setCode(roomId, uid, code);
      setFeedback('✓ Code défini — coffre verrouillé');
      setCode('');
      setMode('main');
    } catch {
      setFeedback('✕ Erreur');
    }
  }, [safe, roomId, uid, code]);

  const handleUnlock = useCallback(async () => {
    if (code.length < 4) {
      setFeedback('Code trop court');
      return;
    }
    const success = await safe.unlock(roomId, uid, code);
    setFeedback(success ? '✓ Coffre ouvert' : `✕ Code incorrect — ${safe.attemptsRemaining} essais restants`);
    setCode('');
    if (success) setMode('main');
  }, [safe, roomId, uid, code]);

  const handleLock = useCallback(async () => {
    await safe.lock(roomId, uid);
    setFeedback('✓ Coffre verrouillé');
  }, [safe, roomId, uid]);

  const numpad = (onConfirm: () => void, confirmLabel: string) => (
    <div>
      <div style={{
        background: '#0a0e1a', border: '1px solid rgba(0,255,68,0.3)',
        borderRadius: 8, padding: '12px 16px', textAlign: 'center',
        marginBottom: 12, fontSize: 24, fontWeight: 700,
        color: '#00ff44', letterSpacing: 8, fontFamily: font,
      }}>
        {code.split('').map(() => '●').join('') || '----'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) => (
          <button
            key={i}
            onClick={() => {
              if (key === null) return;
              if (key === 'del') setCode((p) => p.slice(0, -1));
              else if (code.length < 8) setCode((p) => p + key);
            }}
            disabled={key === null}
            style={{
              background: key === null ? 'transparent' : 'rgba(255,255,255,0.04)',
              border: key === null ? 'none' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6, padding: 10,
              color: key === 'del' ? '#ef4444' : '#e2e8f0',
              cursor: key === null ? 'default' : 'pointer',
              fontSize: key === 'del' ? 10 : 16,
              fontFamily: font, fontWeight: 600,
            }}
          >
            {key === null ? '' : key === 'del' ? '⌫' : key}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => { setMode('main'); setCode(''); setFeedback(null); }}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, padding: 10, color: '#475569',
            cursor: 'pointer', fontSize: 11, fontFamily: font,
          }}
        >
          RETOUR
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1, background: 'rgba(0,255,68,0.1)',
            border: '1px solid rgba(0,255,68,0.3)',
            borderRadius: 6, padding: 10, color: '#00ff44',
            cursor: 'pointer', fontSize: 11, fontFamily: font, fontWeight: 700,
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(2,5,9,0.97)',
      border: '1px solid rgba(0,255,68,0.2)',
      borderRadius: 16, padding: 28, width: 300,
      zIndex: 100, fontFamily: font,
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ color: '#00ff44', fontSize: 10, letterSpacing: 3 }}>COFFRE-FORT</div>
          <div style={{
            color: safe.isLocked ? '#ef4444' : '#22c55e',
            fontSize: 16, fontWeight: 700, marginTop: 4,
          }}>
            {safe.isLocked ? '🔒 VERROUILLÉ' : '🔓 OUVERT'}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#475569',
          cursor: 'pointer', fontSize: 20, fontFamily: font,
        }}>✕</button>
      </div>

      {safe.isLockedOut && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '10px 14px',
          color: '#ef4444', fontSize: 11, marginBottom: 16,
          textAlign: 'center',
        }}>
          ⚠ COFFRE BLOQUÉ — Trop de tentatives. Attendez 15 minutes ou contactez la réception.
        </div>
      )}

      {mode === 'main' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {safe.isLocked ? (
            <>
              <button onClick={() => setMode('unlock')} disabled={safe.isLockedOut} style={{
                background: safe.isLockedOut ? 'rgba(255,255,255,0.02)' : 'rgba(0,255,68,0.08)',
                border: '1px solid rgba(0,255,68,0.25)',
                borderRadius: 8, padding: '12px 16px',
                color: safe.isLockedOut ? '#334155' : '#00ff44',
                cursor: safe.isLockedOut ? 'not-allowed' : 'pointer',
                fontSize: 12, fontFamily: font, fontWeight: 600,
              }}>
                🔓 OUVRIR LE COFFRE
              </button>
              <button onClick={() => setMode('set')} style={{
                background: 'rgba(125,211,252,0.08)',
                border: '1px solid rgba(125,211,252,0.25)',
                borderRadius: 8, padding: '12px 16px',
                color: '#7dd3fc', cursor: 'pointer',
                fontSize: 12, fontFamily: font, fontWeight: 600,
              }}>
                🔢 CHANGER LE CODE
              </button>
            </>
          ) : (
            <button onClick={handleLock} style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8, padding: '12px 16px',
              color: '#ef4444', cursor: 'pointer',
              fontSize: 12, fontFamily: font, fontWeight: 600,
            }}>
              🔒 FERMER ET VERROUILLER
            </button>
          )}
        </div>
      )}

      {mode === 'set' && numpad(handleSetCode, 'DÉFINIR CODE')}
      {mode === 'unlock' && numpad(handleUnlock, 'OUVRIR')}

      {feedback && (
        <div style={{
          marginTop: 12, padding: '8px 12px',
          background: feedback.startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${feedback.startsWith('✓') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: 6,
          color: feedback.startsWith('✓') ? '#22c55e' : '#ef4444',
          fontSize: 11, textAlign: 'center',
        }}>
          {feedback}
        </div>
      )}

      {!safe.isLockedOut && safe.isLocked && (
        <div style={{ marginTop: 8, color: '#334155', fontSize: 8, textAlign: 'center', letterSpacing: 1 }}>
          {safe.attemptsRemaining} ESSAIS RESTANTS
        </div>
      )}
    </div>
  );
};