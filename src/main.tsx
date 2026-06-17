// ═══════════════════════════════════════════════════════════════
// src/main.tsx — EtherWorld QC RP
// Point d'entrée Vite
// ═══════════════════════════════════════════════════════════════

import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'

const isLabTestMode = (() => {
  const params = new URLSearchParams(window.location.search)
  return params.get('lab') === 'test' || window.location.hash === '#lab-test'
})()

if (!isLabTestMode) {
  await import('./lib/firebase/config')
  await import('./index.css')
}

const RootApp = lazy(() => (
  isLabTestMode
    ? import('./lab/LabTestApp')
    : import('./App')
))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<div style={{ padding: 24, color: '#fff', background: '#08080e' }}>Loading...</div>}>
      <RootApp />
    </Suspense>
  </React.StrictMode>
)
