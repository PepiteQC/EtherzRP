/**
 * GameHUD - Unified UI for all game information
 * Combines 6+ previous versions with all features
 */

import React, { useState } from 'react'
import { useGameStore } from '@/store/game-store-unified'

export function GameHUD() {
  const [showDebug, setShowDebug] = useState(false)
  const [chatInput, setChatInput] = useState('')
  
  const buildMode = useGameStore((s) => s.buildMode)
  const playerData = useGameStore((s) => s.playerData)
  const playerPos = useGameStore((s) => s.playerPos)
  const godMode = useGameStore((s) => s.godMode)
  const flyMode = useGameStore((s) => s.flyMode)
  const weather = useGameStore((s) => s.weather)
  const timeOfDay = useGameStore((s) => s.timeOfDay)
  const placedObjects = useGameStore((s) => s.placedObjects)
  const chatMessages = useGameStore((s) => s.chatMessages)
  const showHUD = useGameStore((s) => s.showHUD)
  const showInventory = useGameStore((s) => s.showInventory)
  const chatOpen = useGameStore((s) => s.chatOpen)
  const showAdmin = useGameStore((s) => s.showAdmin)
  
  const toggleUI = useGameStore((s) => s.toggleUI)
  const toggleChat = useGameStore((s) => s.toggleChat)
  const toggleGodMode = useGameStore((s) => s.toggleGodMode)
  const toggleFlyMode = useGameStore((s) => s.toggleFlyMode)
  const addChatMessage = useGameStore((s) => s.addChatMessage)

  if (!showHUD) return null

  const handleSendChat = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && chatInput.trim()) {
      addChatMessage(playerData.name, chatInput.trim())
      setChatInput('')
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none select-none">
      {/* Top HUD Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black via-black to-transparent pointer-events-auto">
        <div className="flex justify-between items-center px-6 py-3 text-white font-mono text-sm">
          <div className="flex gap-8">
            <span className="text-cyan-400">ETHERWORLD</span>
            <span>FPS: 60</span>
            <span>Objects: {placedObjects.length}</span>
          </div>
          
          <div className="flex gap-4">
            <span className={buildMode ? 'text-green-400' : 'text-gray-500'}>
              BUILDER: {buildMode ? 'ON' : 'OFF'}
            </span>
            <span className={godMode ? 'text-red-400' : 'text-gray-500'}>
              GOD: {godMode ? 'ON' : 'OFF'}
            </span>
            <span className={flyMode ? 'text-blue-400' : 'text-gray-500'}>
              FLY: {flyMode ? 'ON' : 'OFF'}
            </span>
          </div>
          
          <div className="flex gap-4">
            <span>Time: {Math.floor(timeOfDay)}:00</span>
            <span className="capitalize">{weather}</span>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black via-black to-transparent pointer-events-auto">
        <div className="flex justify-between items-end px-6 py-4 text-white font-mono text-xs">
          <div className="space-y-1">
            <div>Health: {playerData.stats.health}/100</div>
            <div>Hunger: {playerData.stats.hunger}/100</div>
            <div>Stamina: {playerData.stats.energy}/100</div>
          </div>
          
          <div className="space-y-1">
            <div>Position: [{Math.round(playerPos[0])}, {Math.round(playerPos[1])}, {Math.round(playerPos[2])}]</div>
            <div>Mode: {buildMode ? 'BUILDER' : 'PLAY'}</div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => toggleUI('hud')}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded"
            >
              HUD
            </button>
            <button
              onClick={() => toggleUI('inventory')}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded"
            >
              INV
            </button>
            <button
              onClick={toggleChat}
              className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded"
            >
              CHAT
            </button>
            <button
              onClick={() => toggleUI('admin')}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded"
            >
              ADMIN
            </button>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {chatOpen && (
        <div className="absolute bottom-32 left-6 w-80 h-48 bg-black bg-opacity-80 border border-cyan-500 rounded pointer-events-auto">
          <div className="p-3 border-b border-cyan-500 text-cyan-400 font-mono text-sm">
            CHAT
          </div>
          <div className="h-32 overflow-y-auto p-2 text-xs text-gray-300 space-y-1">
            {chatMessages.map((msg) => (
              <div key={msg.id}>
                <span className="text-cyan-400">{msg.sender}:</span>
                <span className="ml-2">{msg.text}</span>
              </div>
            ))}
          </div>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleSendChat}
            placeholder="Type message..."
            className="w-full h-8 bg-gray-900 text-white text-sm px-2 border-t border-cyan-500"
          />
        </div>
      )}

      {/* Debug Info */}
      {showDebug && (
        <div className="absolute top-20 left-6 bg-black bg-opacity-80 border border-green-500 rounded p-3 text-green-400 font-mono text-xs max-w-sm pointer-events-auto">
          <div>Build: 5.0.0-FUSION</div>
          <div>Objects: {placedObjects.length}/5000</div>
          <div>Chat: {chatMessages.length} messages</div>
          <div>Mode: {buildMode ? 'BUILDER' : 'PLAY'}</div>
        </div>
      )}

      {/* Keyboard Hints */}
      <div className="absolute bottom-2 right-6 text-gray-500 font-mono text-xs space-y-1 pointer-events-auto">
        <div>B: Builder Mode</div>
        <div>R: Rotate Object</div>
        <div>+/-: Scale</div>
        <div>DEL: Delete</div>
        <div>G: God Mode</div>
      </div>
    </div>
  )
}
