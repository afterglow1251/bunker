<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'

const game = useGameStore()

const players = computed(() => game.room?.players ?? [])

function handleKick(targetId: string) {
  game.send({ type: 'KICK_PLAYER', payload: { playerId: targetId } })
}
</script>

<template>
  <div class="space-y-1 min-h-[52px]">
    <div
      v-for="player in players"
      :key="player.id"
      class="flex items-center gap-2 rounded-md px-2.5 py-1 text-sm bg-secondary font-medium"
    >
      <span class="truncate">
        {{ player.nickname }}
      </span>
      <span v-if="player.isHost" class="text-[10px] ml-auto">&#x1F451;</span>
      <button
        v-if="game.isHost && !player.isHost && player.id !== game.playerId"
        class="ml-auto text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
        :aria-label="`Вигнати ${player.nickname}`"
        @click="handleKick(player.id)"
      >
        <X class="size-3.5" />
      </button>
    </div>

    <p v-if="players.length === 0" class="text-sm text-muted-foreground text-center py-4">
      Очікування гравців...
    </p>
  </div>
</template>
