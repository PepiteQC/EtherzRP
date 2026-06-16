// ═══════════════════════════════════════════════════════════════
// src/main.tsx — EtherWorld QC RP
// Point d'entrée Vite
// ═══════════════════════════════════════════════════════════════

import React from 'react'
import ReactDOM from 'react-dom/client'

// Firebase init — doit être le premier import pour que auth/db/storage
// soient prêts avant que n'importe quel composant les utilise
import './lib/firebase/config'

import App from './App'

import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
