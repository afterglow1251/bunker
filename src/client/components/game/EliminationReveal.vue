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

const player = game.room?.players.find(p => p.id === props.playerId)
const nickname = player?.nickname ?? 'Гравець'

onMounted(() => {
  setTimeout(() => (isVisible.value = true), 100)
})
</script>

<template>
  <div class="flex items-center justify-center min-h-[50vh] px-4">
    <div
      :class="[
        'w-full max-w-md transition-all duration-700',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      ]"
    >
      <Card class="border-2 border-red-900/60 bg-red-950/20 backdrop-blur-sm">
        <CardHeader class="text-center pb-2">
          <div class="flex justify-center mb-3">
            <div class="rounded-full bg-red-900/30 p-4">
              <Skull class="size-10 text-red-400" />
            </div>
          </div>
          <CardTitle class="text-xl text-red-400">
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
              v-for="traitType in TRAIT_TYPES"
              :key="traitType"
              class="flex items-center justify-between py-1"
            >
              <span class="text-sm text-muted-foreground">
                {{ TRAIT_LABELS[traitType] }}
              </span>
              <Badge variant="secondary" class="text-xs">
                {{ String(allTraits[traitType as keyof PlayerTraits]) }}
              </Badge>
            </div>
          </div>

          <Separator class="bg-red-900/30" />

          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">
              Карта дії
            </span>
            <Badge variant="outline" class="text-xs">
              {{ actionCardName || '—' }}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
