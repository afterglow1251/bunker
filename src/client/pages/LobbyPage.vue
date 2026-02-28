<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft, Play, Settings, Users } from 'lucide-vue-next'
import { MIN_PLAYERS, MAX_PLAYERS } from '../../shared'
import { useWebSocket } from '@/composables/useWebSocket'
import { useGameStore } from '@/stores/game'
import { clientId, nickname } from '@/stores/auth'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Separator from '@/components/ui/Separator.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import PlayerList from '@/components/lobby/PlayerList.vue'
import RoomCodeDisplay from '@/components/lobby/RoomCodeDisplay.vue'
import GameSettings from '@/components/lobby/GameSettings.vue'

const router = useRouter()
const route = useRoute()
useWebSocket()
const game = useGameStore()

const urlRoomCode = computed(() => route.params.roomCode as string | undefined)
const playerCount = computed(() => game.room?.players.length ?? 0)
const code = computed(() => urlRoomCode.value ?? game.roomCode ?? '')

// Auto-join if navigated to /lobby/:roomCode
watch(
  [() => game.isConnected, urlRoomCode, () => game.roomCode],
  ([connected, urlCode, connCode]) => {
    if (!urlCode) return
    if (connCode === urlCode) return
    if (!nickname.value) {
      router.replace('/')
      return
    }
    game.send({
      type: 'JOIN_ROOM',
      payload: { roomCode: urlCode, nickname: nickname.value, clientId: clientId.value },
    })
  },
  { immediate: true }
)


// Navigate to game when it starts
watch(() => game.phase, (phase) => {
  if (phase === 'catastrophe_reveal' && game.roomCode) {
    router.push(`/game/${game.roomCode}`)
  }
})
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center p-4">
    <div class="w-full max-w-sm space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <button
          class="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="назад"
          @click="router.push('/')"
        >
          <ChevronLeft class="size-5" />
        </button>
        <div class="flex items-center gap-2">
          <Dialog>
            <template #trigger>
              <button class="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <Settings class="size-5" />
              </button>
            </template>
            <DialogHeader>
              <DialogTitle>Налаштування гри</DialogTitle>
            </DialogHeader>
            <RoomCodeDisplay :code="code" />
            <Separator />
            <GameSettings />
          </Dialog>
          <Badge variant="outline" class="gap-1.5">
            <Users class="size-3" />
            {{ playerCount }} / {{ MAX_PLAYERS }}
          </Badge>
        </div>
      </div>

      <!-- Player list -->
      <PlayerList />

      <!-- Start game -->
      <Button
        v-if="game.isHost"
        size="lg"
        class="w-full"
        :disabled="playerCount < MIN_PLAYERS"
        @click="game.send({ type: 'START_GAME', payload: {} })"
      >
        почати гру
      </Button>

      <p v-if="game.isHost && playerCount < MIN_PLAYERS" class="text-xs text-muted-foreground text-center">
        мінімум {{ MIN_PLAYERS }} гравців
      </p>

      <p v-if="!game.isHost" class="text-xs text-muted-foreground text-center">
        Очікуємо початку гри...
      </p>
    </div>
  </div>
</template>
