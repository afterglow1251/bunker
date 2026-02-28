<script setup lang="ts">
import { computed } from 'vue'
import { WifiOff } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { TRAIT_LABELS, TRAIT_TYPES } from '../../../shared'
import type { PublicPlayer } from '../../../shared'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Avatar from '@/components/ui/Avatar.vue'
import AvatarFallback from '@/components/ui/AvatarFallback.vue'
import Badge from '@/components/ui/Badge.vue'

const props = defineProps<{
  player: PublicPlayer
  isCurrentTurn: boolean
  isMe: boolean
}>()

const isEliminated = computed(() => !props.player.isAlive)
const isDisconnected = computed(() => !props.player.isConnected)
</script>

<template>
  <Card
    :class="cn(
      'relative transition-all duration-300 py-3',
      isCurrentTurn && 'border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
      isMe && 'border-blue-500/40',
      isEliminated && 'opacity-50 grayscale',
      isDisconnected && !isEliminated && 'border-dashed',
    )"
  >
    <CardContent class="p-3">
      <div class="flex items-start gap-3">
        <!-- Avatar -->
        <div class="relative">
          <Avatar size="lg">
            <AvatarFallback
              :class="cn(
                'text-sm font-bold',
                isCurrentTurn && 'bg-amber-500/20 text-amber-400',
                isMe && !isCurrentTurn && 'bg-blue-500/20 text-blue-400',
              )"
            >
              {{ player.nickname.charAt(0).toUpperCase() }}
            </AvatarFallback>
          </Avatar>
          <div v-if="isDisconnected" class="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
            <WifiOff class="size-3 text-red-400" />
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1.5">
            <span
              :class="cn(
                'text-sm font-semibold truncate',
                isEliminated && 'line-through text-muted-foreground',
              )"
            >
              {{ player.nickname }}
            </span>
            <Badge v-if="isMe" variant="outline" class="text-[10px] px-1.5 py-0">
              Ви
            </Badge>
            <span v-if="isCurrentTurn" class="size-2 rounded-full bg-amber-500 animate-pulse" />
          </div>

          <!-- Traits -->
          <div class="flex flex-wrap gap-1">
            <Badge
              v-for="traitType in TRAIT_TYPES"
              :key="traitType"
              :variant="player.revealedTraits[traitType] !== undefined ? 'secondary' : 'outline'"
              :class="cn(
                'text-[10px] py-0',
                player.revealedTraits[traitType] === undefined && 'text-muted-foreground/50 border-dashed',
              )"
            >
              {{ player.revealedTraits[traitType] !== undefined
                ? `${TRAIT_LABELS[traitType]}: ${player.revealedTraits[traitType]}`
                : `${TRAIT_LABELS[traitType]}: ???` }}
            </Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
