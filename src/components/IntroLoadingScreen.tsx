import { useEffect, useState } from 'react'

interface IntroLoadingScreenProps {
  durationMs?: number
}

export default function IntroLoadingScreen({ durationMs = 3200 }: IntroLoadingScreenProps) {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), Math.max(0, durationMs - 700))
    const hideTimer = setTimeout(() => setVisible(false), durationMs)
    return () => {
      clearTimeout(leaveTimer)
      clearTimeout(hideTimer)
    }
  }, [durationMs])

  if (!visible) return null

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 999,
      pointerEvents: 'none',
      display: 'grid',
      placeItems: 'center',
      background: 'radial-gradient(circle at 50% 42%, rgba(42,126,189,0.26), rgba(3,10,20,0.98) 58%, #02040a 100%)',
      opacity: leaving ? 0 : 1,
      transition: 'opacity 700ms ease',
      overflow: 'hidden',
      color: '#e0f2fe',
      fontFamily: 'monospace',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(115deg, transparent 0%, rgba(94,205,255,0.06) 45%, transparent 60%)',
        animation: 'etherIntroSweep 2.8s ease-in-out infinite',
      }} />

      <div style={{
        position: 'absolute',
        width: 520,
        height: 520,
        borderRadius: '50%',
        border: '1px solid rgba(56,189,248,0.18)',
        boxShadow: '0 0 70px rgba(56,189,248,0.12), inset 0 0 60px rgba(56,189,248,0.06)',
        animation: 'etherIntroPulse 2.6s ease-in-out infinite',
      }} />

      <div style={{ textAlign: 'center', transform: leaving ? 'translateY(-10px)' : 'translateY(0)', transition: 'transform 700ms ease' }}>
        <div style={{ fontSize: 11, letterSpacing: 9, color: '#67e8f9', marginBottom: 10 }}>
          ROUTE 138 · PORTNEUF · QUÉBEC
        </div>
        <div style={{
          fontSize: 'clamp(42px, 8vw, 86px)',
          lineHeight: 0.92,
          fontWeight: 950,
          letterSpacing: 5,
          textShadow: '0 0 24px rgba(56,189,248,0.42), 0 8px 32px rgba(0,0,0,0.65)',
        }}>
          ETHERWORLD
        </div>
        <div style={{
          marginTop: 6,
          fontSize: 'clamp(20px, 3vw, 32px)',
          fontWeight: 850,
          letterSpacing: 14,
          color: '#3b82f6',
          textShadow: '0 0 18px rgba(59,130,246,0.5)',
        }}>
          QC RP
        </div>

        <div style={{
          margin: '28px auto 0',
          width: 280,
          height: 3,
          borderRadius: 999,
          background: 'rgba(15,23,42,0.9)',
          overflow: 'hidden',
          border: '1px solid rgba(125,211,252,0.25)',
        }}>
          <div style={{
            width: '45%',
            height: '100%',
            borderRadius: 999,
            background: 'linear-gradient(90deg, transparent, #67e8f9, #3b82f6)',
            animation: 'etherIntroLoad 1.15s ease-in-out infinite',
          }} />
        </div>

        <div style={{ marginTop: 14, fontSize: 10, letterSpacing: 4, color: '#7dd3fc', opacity: 0.75 }}>
          CHARGEMENT DU MONDE RP
        </div>
      </div>

      <style>{`
        @keyframes etherIntroLoad {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(260%); }
        }
        @keyframes etherIntroPulse {
          0%, 100% { transform: scale(0.96); opacity: 0.66; }
          50% { transform: scale(1.04); opacity: 1; }
        }
        @keyframes etherIntroSweep {
          0% { transform: translateX(-70%); }
          100% { transform: translateX(70%); }
        }
      `}</style>
    </div>
  )
}
