<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { TRAIT_TYPES, TRAIT_LABELS } from '../../../shared'

const game = useGameStore()

const players = computed(() => {
  if (!game.allPlayersData || !game.room) return []
  return game.allPlayersData.map(pd => {
    const roomPlayer = game.room!.players.find(p => p.id === pd.id)
    return {
      ...pd,
      isAlive: roomPlayer?.isAlive ?? true,
      revealedTraits: roomPlayer?.revealedTraits ?? {},
    }
  })
})
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="px-4 pt-4 pb-2">
      <h3 class="text-amber-500 font-semibold">Панель ведучого</h3>
      <p class="text-xs text-muted-foreground mt-1">Всі характеристики гравців</p>
    </div>

    <div class="flex-1 overflow-auto px-4 pb-4">
      <table class="w-full text-sm border-collapse min-w-[600px]">
        <thead>
          <tr class="border-b border-amber-900/20">
            <th class="text-left py-2 pr-3 text-amber-500/60 font-medium sticky left-0 bg-background">#</th>
            <th class="text-left py-2 pr-3 text-amber-500/60 font-medium sticky left-6 bg-background">Гравець</th>
            <th
              v-for="trait in TRAIT_TYPES"
              :key="trait"
              class="text-left py-2 px-2 text-amber-500/60 font-medium whitespace-nowrap"
            >
              {{ TRAIT_LABELS[trait] }}
            </th>
            <th class="text-left py-2 px-2 text-amber-500/60 font-medium whitespace-nowrap">Спец. картка</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(player, idx) in players"
            :key="player.id"
            class="border-b border-amber-900/10"
            :class="{ 'line-through opacity-40': !player.isAlive }"
          >
            <td class="py-2 pr-3 text-muted-foreground sticky left-0 bg-background">{{ idx + 1 }}</td>
            <td class="py-2 pr-3 font-medium whitespace-nowrap sticky left-6 bg-background text-foreground">{{ player.nickname }}</td>
            <td
              v-for="trait in TRAIT_TYPES"
              :key="trait"
              class="py-2 px-2 whitespace-nowrap"
              :class="player.revealedTraits[trait] !== undefined ? 'text-amber-400/80' : 'text-muted-foreground/40'"
            >
              {{ player.traits[trait] }}
            </td>
            <td
              class="py-2 px-2 whitespace-nowrap"
              :class="player.isAlive ? 'text-muted-foreground/40' : 'text-foreground'"
            >
              {{ player.actionCard.name }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
