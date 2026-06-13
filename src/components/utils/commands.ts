// Game commands handler
import { setGameState, addChatMessage, addMoney, toggleBuildMode, toggleFlyMode, toggleGodMode } from '@/store/game-store'

export const handleGameCommand = (command: string, args: string[]) => {
  const cmd = command.toLowerCase()

  switch (cmd) {
    case 'help':
      addChatMessage('System', '📖 Commands: /money [amount], /pos, /tp [x] [y] [z], /godmode, /flymode, /builder, /weather [type]')
      break

    case 'money':
      if (args.length > 0) {
        const amount = parseInt(args[0])
        if (!isNaN(amount)) {
          addMoney(amount)
          addChatMessage('Admin', `💰 Added $${amount}`)
        }
      }
      break

    case 'pos':
      addChatMessage('System', `📍 Your position is visible in HUD`)
      break

    case 'godmode':
      toggleGodMode()
      addChatMessage('Admin', `🛡️ God Mode toggled`)
      break

    case 'flymode':
      toggleFlyMode()
      addChatMessage('Admin', `🪰 Fly Mode toggled`)
      break

    case 'builder':
      toggleBuildMode()
      addChatMessage('Admin', `🏗️ Builder Mode toggled`)
      break

    case 'weather':
      if (args.length > 0) {
        const weathers = ['clear', 'rain', 'snow', 'fog']
        const weather = args[0].toLowerCase()
        if (weathers.includes(weather)) {
          setGameState({ weather })
          addChatMessage('Admin', `🌤️ Weather changed to ${weather}`)
        }
      }
      break

    case 'time':
      if (args.length > 0) {
        const time = parseInt(args[0])
        if (!isNaN(time) && time >= 0 && time < 24) {
          setGameState({ timeOfDay: time })
          addChatMessage('Admin', `⏱️ Time set to ${time}:00`)
        }
      }
      break

    case 'clear':
      addChatMessage('System', '🧹 Chat cleared')
      break

    default:
      addChatMessage('System', `❌ Unknown command: ${cmd}. Type /help for help.`)
  }
}

export const parseCommand = (input: string) => {
  if (!input.startsWith('/')) return null

  const parts = input.slice(1).split(' ')
  const command = parts[0]
  const args = parts.slice(1)

  return { command, args }
}
