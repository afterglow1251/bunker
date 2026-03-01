<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Skull } from 'lucide-vue-next'
import { TRAIT_LABELS, TRAIT_TYPES } from '../../../shared'
import type { PlayerTraits } from '../../../shared'
import { useGameStore } from '@/stores/game'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Separator from '@/components/ui/Separator.vue'

const props = defineProps<{
  playerId: string
  allTraits: PlayerTraits
  actionCardName: string
}>()

const game = useGameStore()
const isVisible = ref(false)
const showTraits = ref(false)

const player = game.room?.players.find(p => p.id === props.playerId)
const nickname = player?.nickname ?? 'Гравець'

onMounted(() => {
  setTimeout(() => (isVisible.value = true), 100)
  setTimeout(() => (showTraits.value = true), 600)
})
</script>

<template>
  <div class="flex items-center justify-center min-h-[50vh] px-4 relative">
    <!-- Red glow background -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-900/15 rounded-full blur-[100px] animate-pulse" />
    </div>

    <div
      :class="[
        'w-full max-w-md transition-all duration-700 relative z-10',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      ]"
    >
      <Card class="border-2 border-red-900/50 bg-red-950/20 backdrop-blur-sm border-glow-red">
        <CardHeader class="text-center pb-2">
          <div class="flex justify-center mb-3">
            <div class="rounded-full bg-red-900/20 p-4 border border-red-900/30 shadow-[0_0_20px_rgba(220,38,38,0.2)] animate-pulse">
              <Skull class="size-10 text-red-400" />
            </div>
          </div>
          <CardTitle class="text-xl text-red-400 text-glow-red">
            {{ nickname }} вибуває
          </CardTitle>
        </CardHeader>

        <CardContent class="flex flex-col gap-3">
          <Separator class="bg-red-900/30" />

          <p class="text-xs text-muted-foreground text-center">
            Усі характеристики гравця:
          </p>

          <div class="flex flex-col gap-2">
            <div
              v-for="(traitType, index) in TRAIT_TYPES"
              :key="traitType"
              :class="[
                'flex items-center justify-between py-1 transition-all duration-500',
                showTraits ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
              ]"
              :style="{ transitionDelay: `${index * 100}ms` }"
            >
              <span class="text-sm text-muted-foreground">
                {{ TRAIT_LABELS[traitType] }}
              </span>
              <Badge variant="secondary" class="text-xs bg-red-950/40 text-red-300/80 border border-red-900/20">
                {{ String(allTraits[traitType as keyof PlayerTraits]) }}
              </Badge>
            </div>
          </div>

          <Separator class="bg-red-900/30" />

          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">
              Карта дії
            </span>
            <Badge variant="outline" class="text-xs border-red-900/30 text-red-300/80">
              {{ actionCardName || '—' }}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
