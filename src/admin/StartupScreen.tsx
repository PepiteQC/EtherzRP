import React, { useEffect, useState } from 'react'

interface Props {
  onComplete: () => void
}

export default function StartupScreen({ onComplete }: Props) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const steps = [18, 37, 58, 79, 94, 100]
    let i = 0
    const interval = setInterval(() => {
      if (i < steps.length) {
        setProgress(steps[i])
        i++
      } else {
        clearInterval(interval)
        setTimeout(onComplete, 400)
      }
    }, 320)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center">
      <div className="text-center">
        <div className="text-[68px] font-black tracking-[-3px] bg-gradient-to-r from-[#00f5ff] to-[#ff00aa] bg-clip-text text-transparent">
          ETHERWORLD
        </div>
        <div className="text-xs tracking-[3px] text-white/50 -mt-2 mb-8">v2.0 FUSION</div>
        
        <div className="w-80 h-px bg-white/10 mx-auto overflow-hidden">
          <div className="h-px bg-gradient-to-r from-[#00f5ff] to-[#ff00aa]" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs text-white/40 mt-3 font-mono">CHARGEMENT DES SYSTÈMES ADMIN...</div>
      </div>
    </div>
  )
}
