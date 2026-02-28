<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Send } from 'lucide-vue-next'
import { useChatStore } from '@/stores/chat'
import { useGameStore } from '@/stores/game'
import ScrollArea from '@/components/ui/ScrollArea.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const chat = useChatStore()
const game = useGameStore()
const text = ref('')
const bottomRef = ref<HTMLElement | null>(null)

watch(() => chat.messages.length, async () => {
  await nextTick()
  bottomRef.value?.scrollIntoView({ behavior: 'smooth' })
})

function handleSend() {
  const trimmed = text.value.trim()
  if (!trimmed) return
  game.send({ type: 'SEND_CHAT', payload: { text: trimmed } })
  text.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <ScrollArea class="flex-1 p-4">
      <div class="flex flex-col gap-2">
        <p v-if="chat.messages.length === 0" class="text-sm text-muted-foreground text-center py-8">
          Повідомлень поки немає
        </p>
        <div
          v-for="(msg, i) in chat.messages"
          :key="`${msg.ts}-${i}`"
          :class="['flex flex-col', msg.playerId === game.playerId ? 'items-end' : 'items-start']"
        >
          <span class="text-[10px] text-muted-foreground mb-0.5">
            {{ msg.nickname }}
          </span>
          <div
            :class="[
              'rounded-lg px-3 py-1.5 text-sm max-w-[85%]',
              msg.playerId === game.playerId
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            ]"
          >
            {{ msg.text }}
          </div>
        </div>
        <div ref="bottomRef" />
      </div>
    </ScrollArea>

    <div class="flex gap-2 p-4 border-t">
      <Input
        :model-value="text"
        @update:model-value="(v: string) => text = v"
        placeholder="Повідомлення..."
        auto-complete="off"
        class="flex-1"
        @keydown="onKeydown"
      />
      <Button type="button" size="icon" :disabled="!text.trim()" @click="handleSend">
        <Send class="size-4" />
      </Button>
    </div>
  </div>
</template>
