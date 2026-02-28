<script setup lang="ts">
import { computed } from 'vue'
import { Clock, MessageSquare } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import Input from '@/components/ui/Input.vue'

const game = useGameStore()

const settings = computed(() => game.room?.settings ?? { discussionTime: 120, votingTime: 60 })

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function update(key: 'discussionTime' | 'votingTime', value: string, min: number, max: number) {
  const num = parseInt(value, 10)
  if (isNaN(num)) return
  game.send({ type: 'UPDATE_SETTINGS', payload: { settings: { [key]: clamp(num, min, max) } } })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1.5">
      <label class="flex items-center gap-2 text-sm font-medium">
        <MessageSquare class="size-4" />
        обговорення
      </label>
      <Input
        v-if="game.isHost"
        type="number"
        :min="30"
        :max="300"
        :step="10"
        :model-value="String(settings.discussionTime)"
        @update:model-value="(v: string) => update('discussionTime', v, 30, 300)"
      />
      <p v-else class="text-sm text-muted-foreground">{{ settings.discussionTime }} сек</p>
      <span class="text-xs text-muted-foreground">30–300 сек</span>
    </div>
    <div class="flex flex-col gap-1.5">
      <label class="flex items-center gap-2 text-sm font-medium">
        <Clock class="size-4" />
        голосування
      </label>
      <Input
        v-if="game.isHost"
        type="number"
        :min="15"
        :max="120"
        :step="5"
        :model-value="String(settings.votingTime)"
        @update:model-value="(v: string) => update('votingTime', v, 15, 120)"
      />
      <p v-else class="text-sm text-muted-foreground">{{ settings.votingTime }} сек</p>
      <span class="text-xs text-muted-foreground">15–120 сек</span>
    </div>
  </div>
</template>
