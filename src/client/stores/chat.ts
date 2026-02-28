import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ChatMessage {
  playerId: string
  nickname: string
  text: string
  ts: number
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])

  function addMessage(msg: ChatMessage) {
    messages.value = [...messages.value, msg]
  }

  function reset() {
    messages.value = []
  }

  return { messages, addMessage, reset }
})
