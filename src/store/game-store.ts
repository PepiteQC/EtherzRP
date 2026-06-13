export * from '@/components/store/game-store'
export { default } from '@/components/store/game-store'

import useGameStore from '@/components/store/game-store'

export const setGameState = (partial: Record<string, unknown>) => useGameStore.getState().setState(partial as never)
export const addChatMessage = (sender: string, text: string) => useGameStore.getState().addChatMessage(sender, text)
export const addMoney = (amount: number) => useGameStore.setState((s) => ({ playerBalance: s.playerBalance + amount }))
export const toggleBuildMode = () => useGameStore.getState().toggleBuildMode()
export const toggleFlyMode = () => useGameStore.getState().toggleFlyMode()
export const toggleGodMode = () => useGameStore.getState().toggleGodMode()
