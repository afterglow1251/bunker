<script setup lang="ts">
import { useGameStore } from '@/stores/game'
import PlayerCard from '@/components/game/PlayerCard.vue'
import Separator from '@/components/ui/Separator.vue'

const game = useGameStore()
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Alive players grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <PlayerCard
        v-for="player in game.alivePlayers"
        :key="player.id"
        :player="player"
        :is-current-turn="player.id === game.currentTurnPlayerId"
        :is-me="player.id === game.playerId"
      />
    </div>

    <!-- Eliminated players -->
    <template v-if="game.eliminatedPlayers.length > 0">
      <Separator class="my-2" />
      <div>
        <p class="text-xs text-muted-foreground mb-2">
          Вибули ({{ game.eliminatedPlayers.length }})
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <PlayerCard
            v-for="player in game.eliminatedPlayers"
            :key="player.id"
            :player="player"
            :is-current-turn="false"
            :is-me="player.id === game.playerId"
          />
        </div>
      </div>
    </template>
  </div>
</template>
