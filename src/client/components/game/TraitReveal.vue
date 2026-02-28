<script setup lang="ts">
import { computed } from 'vue'
import { Eye, EyeOff, Check, Lock } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { TRAIT_LABELS, TRAIT_TYPES } from '../../../shared'
import type { TraitType } from '../../../shared'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'

const game = useGameStore()

const canReveal = computed(() => game.isMyTurn && game.phase === 'trait_reveal')
const revealedTraitTypes = computed(() => Object.keys(game.myPlayer?.revealedTraits ?? {}))

// Count how many traits have been revealed this turn (client-side tracking)
const traitsRevealedThisTurn = computed(() => {
  // We track this by counting revealed traits minus what was already revealed
  // This is approximate — the server is the authority
  return 0 // The server controls turn advance
})

const traitsNeeded = computed(() => game.traitsToRevealThisRound)

// In round 1, first trait must be profession
const mustRevealProfession = computed(() =>
  game.currentRound === 1 && !revealedTraitTypes.value.includes('profession')
)

function isTraitDisabled(traitType: string): boolean {
  if (!canReveal.value) return true
  if (revealedTraitTypes.value.includes(traitType)) return true
  // In round 1, if profession not yet revealed, only profession is allowed
  if (mustRevealProfession.value && traitType !== 'profession') return true
  return false
}

function handleReveal(traitType: TraitType) {
  game.send({ type: 'REVEAL_TRAIT', payload: { traitType } })
}
</script>

<template>
  <Card v-if="game.myTraits && game.myPlayer" class="border-amber-900/30 bg-card/80 backdrop-blur-sm">
    <CardHeader class="pb-2">
      <CardTitle class="text-base flex items-center gap-2">
        <Eye class="size-4 text-amber-500" />
        <template v-if="canReveal">
          Оберіть характеристику
          <Badge variant="outline" class="ml-1 text-xs">
            {{ traitsNeeded }} шт.
          </Badge>
        </template>
        <template v-else>
          Ваші характеристики
        </template>
      </CardTitle>
      <p v-if="mustRevealProfession && canReveal" class="text-xs text-amber-400 mt-1">
        Першою потрібно розкрити професію
      </p>
    </CardHeader>
    <CardContent class="flex flex-col gap-2">
      <Button
        v-for="traitType in TRAIT_TYPES"
        :key="traitType"
        :variant="revealedTraitTypes.includes(traitType) ? 'secondary' : 'outline'"
        class="w-full justify-between h-auto py-2.5 px-3"
        :disabled="isTraitDisabled(traitType)"
        @click="handleReveal(traitType as TraitType)"
      >
        <div class="flex items-center gap-2">
          <Check v-if="revealedTraitTypes.includes(traitType)" class="size-4 text-emerald-500" />
          <Lock v-else-if="mustRevealProfession && traitType !== 'profession' && canReveal" class="size-4 text-muted-foreground/50" />
          <EyeOff v-else class="size-4 text-muted-foreground" />
          <span class="text-sm font-medium">
            {{ TRAIT_LABELS[traitType] }}
          </span>
        </div>
        <Badge
          :variant="revealedTraitTypes.includes(traitType) ? 'default' : 'outline'"
          class="text-xs"
        >
          {{ String(game.myTraits[traitType as keyof typeof game.myTraits]) }}
        </Badge>
      </Button>
    </CardContent>
  </Card>
</template>
