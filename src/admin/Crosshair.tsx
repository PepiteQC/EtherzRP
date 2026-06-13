import React from 'react'

export default function Crosshair() {
  return (
    <div className="crosshair">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border border-white/70 rounded-full" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] bg-white rounded-full" />
    </div>
  )
}
