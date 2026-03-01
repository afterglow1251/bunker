<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Radiation, TableProperties } from 'lucide-vue-next'
import type { PlayerTraits } from '../../shared'
import { useWebSocket } from '@/composables/useWebSocket'
import { useGameStore } from '@/stores/game'
import { useTimer } from '@/composables/useTimer'
import Button from '@/components/ui/Button.vue'
import Sheet from '@/components/ui/Sheet.vue'
import CatastropheReveal from '@/components/game/CatastropheReveal.vue'
import BunkerInfo from '@/components/game/BunkerInfo.vue'
import PlayerCircle from '@/components/game/PlayerCircle.vue'
import TraitReveal from '@/components/game/TraitReveal.vue'
import VotingPanel from '@/components/game/VotingPanel.vue'
import EliminationReveal from '@/components/game/EliminationReveal.vue'
import ActionCardModal from '@/components/game/ActionCardModal.vue'
import DiscussionTimer from '@/components/game/DiscussionTimer.vue'
import RoundIndicator from '@/components/game/RoundIndicator.vue'
import SpeechTimer from '@/components/game/SpeechTimer.vue'
import HostPanel from '@/components/game/HostPanel.vue'

const router = useRouter()
useWebSocket()
const game = useGameStore()
const { formatted } = useTimer()

const hostPanelOpen = ref(false)

const eliminationData = ref<{
  playerId: string
  allTraits: PlayerTraits
  actionCardName: string
} | null>(null)

// Redirect to home if no room
watch(() => game.room, (room) => {
  if (!room) {
    router.replace('/')
  }
}, { immediate: true })

// Navigate to results on game_over
watch(() => game.phase, (phase) => {
  if (phase === 'game_over' && game.roomCode) {
    setTimeout(() => {
      router.replace(`/results/${game.roomCode}`)
    }, 500)
  }
})

// Track elimination data
watch(() => game.phase, (phase) => {
  if (phase === 'elimination' && game.room) {
    const lastElimId = game.room.eliminatedIds[game.room.eliminatedIds.length - 1]
    if (lastElimId) {
      const player = game.room.players.find(p => p.id === lastElimId)
      if (player) {
        const traits = player.revealedTraits as unknown as PlayerTraits
        eliminationData.value = {
          playerId: lastElimId,
          allTraits: traits,
          actionCardName: '',
        }
      }
    }
  }
})

const showBunkerInfo = computed(() =>
  game.phase !== 'catastrophe_reveal' && game.phase !== 'lobby' && game.bunkerDescription
)
const showTopBar = computed(() =>
  game.phase !== 'catastrophe_reveal' && game.phase !== 'lobby'
)
const showTimer = computed(() =>
  game.phase === 'discussion' || game.phase === 'voting'
  || game.phase === 'accusation_speech' || game.phase === 'justification_speech'
  || game.phase === 'farewell_speech'
)

const isSpeechPhase = computed(() =>
  game.phase === 'accusation_speech' || game.phase === 'justification_speech'
  || game.phase === 'farewell_speech'
)
</script>

<template>
  <div v-if="game.room" class="min-h-screen bg-background relative overflow-hidden bg-noise">
    <!-- Background decorative elements -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.04)_0%,transparent_70%)]" />
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-amber-900/5 rounded-full blur-[120px]" />
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-950/8 rounded-full blur-[100px]" />
    </div>

    <div class="relative z-10 flex flex-col min-h-screen">
      <!-- Top bar -->
      <header v-if="showTopBar" class="sticky top-0 z-20 bg-background/85 backdrop-blur-md border-b border-amber-900/20 px-4 py-2">
        <div class="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div class="flex items-center gap-3">
            <Radiation class="size-5 text-amber-500/80 animate-flicker" />
            <RoundIndicator :round="game.currentRound" />
          </div>
          <div class="flex items-center gap-2">
            <span v-if="showTimer" class="text-sm font-mono text-amber-500/70">
              {{ formatted }}
            </span>
          </div>
        </div>
        <!-- Bunker info - collapsible -->
        <div v-if="showBunkerInfo" class="max-w-5xl mx-auto mt-2">
          <BunkerInfo :description="game.bunkerDescription!" />
        </div>
      </header>

      <!-- Main content area -->
      <main class="flex-1 px-4 py-4 max-w-5xl mx-auto w-full">
        <!-- Catastrophe reveal -->
        <CatastropheReveal
          v-if="game.phase === 'catastrophe_reveal' && game.catastrophe"
          :catastrophe="game.catastrophe"
        />

        <!-- Trait reveal phase -->
        <div v-if="game.phase === 'trait_reveal'" class="flex flex-col lg:flex-row gap-4">
          <div class="flex-1">
            <PlayerCircle />
          </div>
          <div v-if="game.isMyTurn && game.myPlayer?.isAlive" class="lg:w-80 lg:shrink-0">
            <TraitReveal />
          </div>
        </div>

        <!-- Discussion phase -->
        <div v-if="game.phase === 'discussion'" class="flex flex-col gap-4">
          <DiscussionTimer />
          <PlayerCircle />
        </div>

        <!-- Speech phases (accusation, justification, farewell) -->
        <div v-if="isSpeechPhase" class="flex flex-col gap-4">
          <SpeechTimer />
          <PlayerCircle />
        </div>

        <!-- Voting phase -->
        <div v-if="game.phase === 'voting'" class="flex flex-col lg:flex-row gap-4">
          <div class="flex-1">
            <PlayerCircle />
          </div>
          <div v-if="!game.isHost" class="lg:w-80 lg:shrink-0">
            <VotingPanel />
          </div>
        </div>

        <!-- Vote resolution -->
        <div v-if="game.phase === 'vote_resolution'" class="flex flex-col gap-4 items-center justify-center min-h-[50vh]">
          <PlayerCircle />
          <p class="text-amber-500/50 animate-pulse font-mono">
            &gt; Підрахунок голосів... _
          </p>
        </div>

        <!-- Elimination phase -->
        <EliminationReveal
          v-if="game.phase === 'elimination' && eliminationData"
          :player-id="eliminationData.playerId"
          :all-traits="eliminationData.allTraits"
          :action-card-name="eliminationData.actionCardName"
        />
      </main>

      <!-- Bottom bar -->
      <footer v-if="showTopBar" class="sticky bottom-0 z-20 bg-background/85 backdrop-blur-md border-t border-amber-900/20 px-4 py-2">
        <div class="max-w-5xl mx-auto flex items-center justify-between">
          <ActionCardModal v-if="!game.isHost" />

          <div class="flex items-center gap-2">
            <Sheet v-if="game.isHost && game.allPlayersData" :open="hostPanelOpen" @update:open="hostPanelOpen = $event" side="bottom" content-class="p-0 flex flex-col max-h-[70vh]">
              <template #trigger>
                <Button variant="outline" size="sm" class="gap-2" @click="hostPanelOpen = true">
                  <TableProperties class="size-4" />
                  <span class="hidden sm:inline">Панель</span>
                </Button>
              </template>
              <HostPanel />
            </Sheet>
          </div>

        </div>
      </footer>
    </div>
  </div>
</template>
