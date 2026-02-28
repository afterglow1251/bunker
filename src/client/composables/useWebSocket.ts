import { onMounted } from 'vue'
import { useGameStore } from '@/stores/game'
import { useChatStore } from '@/stores/chat'
import * as ws from '@/services/ws'
import type { ServerMessage } from '../../shared'

let initialized = false

export function useWebSocket() {
  const game = useGameStore()
  const chat = useChatStore()

  if (!initialized) {
    initialized = true

    ws.addMessageHandler((msg: ServerMessage) => {
      if (msg.type === 'CHAT_MESSAGE') {
        chat.addMessage(msg.payload)
      } else {
        game.handleMessage(msg)
      }
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
