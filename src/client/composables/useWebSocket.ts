import { useGameStore } from '@/stores/game'
import * as ws from '@/services/ws'
import type { ServerMessage } from '../../shared'

let initialized = false

export function useWebSocket() {
  const game = useGameStore()

  if (!initialized) {
    initialized = true

    ws.addMessageHandler((msg: ServerMessage) => {
      game.handleMessage(msg)
    })

    ws.connect(() => {
      game.isConnected = true
    })
  }

  return {
    send: game.send,
    isConnected: game.isConnected,
  }
}
