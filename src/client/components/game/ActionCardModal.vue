<script setup lang="ts">
import { ref, computed } from 'vue'
import { Zap, Sparkles } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useGameStore } from '@/stores/game'
import { TRAIT_LABELS, TRAIT_TYPES } from '../../../shared'
import type { TraitType } from '../../../shared'
import Dialog from '@/components/ui/Dialog.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogDescription from '@/components/ui/DialogDescription.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'

const game = useGameStore()
const open = ref(false)
const selectedPlayer = ref<string | null>(null)
const selectedTrait = ref<TraitType | null>(null)

const myActionCard = computed(() => game.myActionCard)
const isUsed = computed(() => myActionCard.value?.used ?? true)
const cardType = computed(() => myActionCard.value?.type)
const otherPlayers = computed(() => game.alivePlayers.filter(p => p.id !== game.playerId))

const needsPlayer = computed(() => ['peek', 'exchange_with_player', 'reveal_other'].includes(cardType.value ?? ''))
const needsTrait = computed(() => ['swap_trait', 'exchange_with_player'].includes(cardType.value ?? ''))
const isConfirmOnly = computed(() => ['double_vote', 'immunity'].includes(cardType.value ?? ''))

const canSubmit = computed(() => {
  if (isUsed.value) return false
  if (needsPlayer.value && !selectedPlayer.value) return false
  if (needsTrait.value && !selectedTrait.value) return false
  return true
})

function handleUse() {
  if (!canSubmit.value || !myActionCard.value) return

  game.send({
    type: 'USE_ACTION_CARD',
    payload: {
      cardId: myActionCard.value.id,
      ...(selectedPlayer.value ? { targetPlayerId: selectedPlayer.value } : {}),
      ...(selectedTrait.value ? { traitType: selectedTrait.value } : {}),
    },
  })

  toast.success('Карту дії використано!')
  open.value = false
  selectedPlayer.value = null
  selectedTrait.value = null
}

function onOpenChange(v: boolean) {
  open.value = v
  if (!v) {
    selectedPlayer.value = null
    selectedTrait.value = null
  }
}
</script>

<template>
  <template v-if="myActionCard">
    <Dialog :open="open" @update:open="onOpenChange">
      <template #trigger>
        <Button
          variant="outline"
          size="sm"
          :disabled="isUsed"
          class="gap-2"
          @click="open = true"
        >
          <Zap class="size-4 text-amber-500" />
          <span class="hidden sm:inline">Карта дії</span>
          <span v-if="!isUsed" class="size-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_6px_rgba(217,119,6,0.6)]" />
        </Button>
      </template>

      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Sparkles class="size-5 text-amber-500" />
          {{ myActionCard.name }}
        </DialogTitle>
        <DialogDescription>{{ myActionCard.description }}</DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4">
        <Badge v-if="isUsed" variant="secondary" class="w-fit bg-amber-950/30 text-amber-400/60">
          Вже використано
        </Badge>

        <!-- Player selection -->
        <div v-if="needsPlayer && !isUsed" class="flex flex-col gap-2">
          <p class="text-sm font-medium text-amber-500/80">Оберіть гравця:</p>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="player in otherPlayers"
              :key="player.id"
              :variant="selectedPlayer === player.id ? 'default' : 'outline'"
              size="sm"
              :class="selectedPlayer === player.id && 'border-glow'"
              @click="selectedPlayer = player.id"
            >
              {{ player.nickname }}
            </Button>
          </div>
        </div>

        <!-- Trait selection -->
        <div v-if="needsTrait && !isUsed" class="flex flex-col gap-2">
          <p class="text-sm font-medium text-amber-500/80">Оберіть характеристику:</p>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="traitType in TRAIT_TYPES"
              :key="traitType"
              :variant="selectedTrait === traitType ? 'default' : 'outline'"
              size="sm"
              :class="selectedTrait === traitType && 'border-glow'"
              @click="selectedTrait = traitType as TraitType"
            >
              {{ TRAIT_LABELS[traitType] }}
            </Button>
          </div>
        </div>

        <!-- Confirm-only cards -->
        <p v-if="isConfirmOnly && !isUsed" class="text-sm text-muted-foreground">
          Натисніть кнопку нижче, щоб активувати карту.
        </p>
      </div>

      <DialogFooter>
        <Button :disabled="!canSubmit" class="w-full sm:w-auto" @click="handleUse">
          <Zap class="size-4" />
          Використати
        </Button>
      </DialogFooter>
    </Dialog>
  </template>
</template>
