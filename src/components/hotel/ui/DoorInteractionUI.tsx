// src/components/hotel/ui/DoorInteractionUI.tsx

import React, { useState, useCallback } from 'react';
import { useRoomAccess } from '../hooks/useRoomAccess';
import type { RoomId } from '../constants/ids';
import { roomDisplayNumber } from '../constants/ids';

interface DoorInteractionUIProps {
  roomId: RoomId;
  uid: string;
  onClose: () => void;
}

const font = "'JetBrains Mono','Courier New',monospace";

export const DoorInteractionUI: React.FC<DoorInteractionUIProps> = ({
  roomId,
  uid,
  onClose,
}) => {
  const { state, tryKeycard, tryPin, lockDoor, engageDeadbolt, disengageDeadbolt, error } =
    useRoomAccess(uid);
  const [pinInput, setPinInput] = useState('');
  const [mode, setMode] = useState<'main' | 'pin'>('main');
  const [feedback, setFeedback] = useState<string | null>(null);

  const displayNum = roomDisplayNumber(roomId.floor, roomId.side, roomId.position);

  const handleKeycard = useCallback(async () => {
    setFeedback(null);
    const success = await tryKeycard(roomId.key);
    setFeedback(success ? '✓ Porte déverrouillée' : '✕ Accès refusé');
  }, [tryKeycard, roomId]);

  const handlePin = useCallback(async () => {
    if (pinInput.length < 4) {
      setFeedback('Code trop court (min 4 chiffres)');
      return;
    }
    setFeedback(null);
    const success = await tryPin(roomId.key, pinInput);
    setFeedback(success ? '✓ Porte déverrouillée' : '✕ Code incorrect');
    setPinInput('');
  }, [tryPin, roomId, pinInput]);

  const handleLock = useCallback(async () => {
    await lockDoor(roomId.key);
    setFeedback('✓ Porte verrouillée');
  }, [lockDoor, roomId]);

  const handleDeadbolt = useCallback(async () => {
    if (state.deadboltEngaged) {
      await disengageDeadbolt(roomId.key);
      setFeedback('Verrou de sécurité désactivé');
    } else {
      await engageDeadbolt(roomId.key);
      setFeedback('Verrou de sécurité activé');
    }
  }, [state.deadboltEngaged, engageDeadbolt, disengageDeadbolt, roomId]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(2,5,9,0.97)',
        border: '1px solid rgba(125,211,252,0.3)',
        borderRadius: 16,
        padding: 28,
        width: 320,
        zIndex: 100,
        fontFamily: font,
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ color: '#7dd3fc', fontSize: 10, letterSpacing: 3 }}>CHAMBRE</div>
          <div style={{ color: '#c9a84c', fontSize: 24, fontWeight: 700 }}>{displayNum}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#475569',
            cursor: 'pointer', fontSize: 20, fontFamily: font,
          }}
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 16,
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#334155', fontSize: 8, letterSpacing: 2 }}>SERRURE</div>
          <div style={{
            color: state.doorLocked ? '#ef4444' : '#22c55e',
            fontSize: 12, fontWeight: 700,
          }}>
            {state.doorLocked ? '🔒 VERROUILLÉE' : '🔓 OUVERTE'}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#334155', fontSize: 8, letterSpacing: 2 }}>VERROU</div>
          <div style={{
            color: state.deadboltEngaged ? '#f59e0b' : '#475569',
            fontSize: 12, fontWeight: 700,
          }}>
            {state.deadboltEngaged ? '⚡ ENGAGÉ' : '— LIBRE'}
          </div>
        </div>
      </div>

      {/* Actions */}
      {mode === 'main' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={handleKeycard}
            style={{
              background: 'rgba(125,211,252,0.1)',
              border: '1px solid rgba(125,211,252,0.3)',
              borderRadius: 8, padding: '12px 16px',
              color: '#7dd3fc', cursor: 'pointer',
              fontSize: 12, fontFamily: font, fontWeight: 600,
              textAlign: 'left',
            }}
          >
            🔑 SCANNER CARTE D'ACCÈS
          </button>

          <button
            onClick={() => setMode('pin')}
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: 8, padding: '12px 16px',
              color: '#c9a84c', cursor: 'pointer',
              fontSize: 12, fontFamily: font, fontWeight: 600,
              textAlign: 'left',
            }}
          >
            🔢 ENTRER CODE PIN
          </button>

          {!state.doorLocked && (
            <>
              <button
                onClick={handleLock}
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 8, padding: '12px 16px',
                  color: '#ef4444', cursor: 'pointer',
                  fontSize: 12, fontFamily: font, fontWeight: 600,
                  textAlign: 'left',
                }}
              >
                🔒 VERROUILLER
              </button>

              <button
                onClick={handleDeadbolt}
                style={{
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 8, padding: '12px 16px',
                  color: '#f59e0b', cursor: 'pointer',
                  fontSize: 12, fontFamily: font, fontWeight: 600,
                  textAlign: 'left',
                }}
              >
                {state.deadboltEngaged ? '🔓 DÉSACTIVER VERROU SÉCURITÉ' : '⚡ ACTIVER VERROU SÉCURITÉ'}
              </button>
            </>
          )}
        </div>
      ) : (
        <div>
          <div style={{ color: '#c9a84c', fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>
            ENTRER VOTRE CODE
          </div>

          {/* Pin display */}
          <div style={{
            background: '#0a0e1a',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 8, padding: '12px 16px',
            textAlign: 'center', marginBottom: 12,
            fontSize: 24, fontWeight: 700,
            color: '#c9a84c', letterSpacing: 8,
            fontFamily: font,
          }}>
            {pinInput.split('').map(() => '●').join('') || '----'}
          </div>

          {/* Numpad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) => (
              <button
                key={i}
                onClick={() => {
                  if (key === null) return;
                  if (key === 'del') {
                    setPinInput((p) => p.slice(0, -1));
                  } else if (pinInput.length < 8) {
                    setPinInput((p) => p + key);
                  }
                }}
                disabled={key === null}
                style={{
                  background: key === null ? 'transparent' : 'rgba(255,255,255,0.04)',
                  border: key === null ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6, padding: '10px',
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
              onClick={() => { setMode('main'); setPinInput(''); setFeedback(null); }}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6, padding: '10px',
                color: '#475569', cursor: 'pointer',
                fontSize: 11, fontFamily: font,
              }}
            >
              RETOUR
            </button>
            <button
              onClick={handlePin}
              style={{
                flex: 1, background: 'rgba(201,168,76,0.15)',
                border: '1px solid rgba(201,168,76,0.4)',
                borderRadius: 6, padding: '10px',
                color: '#c9a84c', cursor: 'pointer',
                fontSize: 11, fontFamily: font, fontWeight: 700,
              }}
            >
              CONFIRMER
            </button>
          </div>
        </div>
      )}

      {/* Feedback */}
      {(feedback || error) && (
        <div style={{
          marginTop: 12, padding: '8px 12px',
          background: (feedback?.startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'),
          border: `1px solid ${feedback?.startsWith('✓') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: 6,
          color: feedback?.startsWith('✓') ? '#22c55e' : '#ef4444',
          fontSize: 11, textAlign: 'center',
        }}>
          {feedback || error}
        </div>
      )}

      {/* Battery indicator */}
      <div style={{
        marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
        color: '#334155', fontSize: 8, letterSpacing: 2,
      }}>
        <span>BATTERIE</span>
        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
          <div style={{
            height: '100%',
            width: `${state.batteryLevel}%`,
            background: state.batteryLevel > 20
              ? 'linear-gradient(90deg,#22c55e,#4ade80)'
              : 'linear-gradient(90deg,#ef4444,#f87171)',
            borderRadius: 2,
          }} />
        </div>
        <span>{state.batteryLevel}%</span>
      </div>
    </div>
  );
};