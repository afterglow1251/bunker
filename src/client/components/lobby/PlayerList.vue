<script setup lang="ts">
import { computed, ref } from 'vue'
import { X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useGameStore } from '@/stores/game'
import Dialog from '@/components/ui/Dialog.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import Button from '@/components/ui/Button.vue'

const game = useGameStore()

const players = computed(() => game.room?.players ?? [])

const transferTarget = ref<{ id: string; nickname: string } | null>(null)
const transferDialogOpen = ref(false)

function handleKick(targetId: string) {
  game.send({ type: 'KICK_PLAYER', payload: { playerId: targetId } })
}

function openTransferDialog(playerId: string, nickname: string) {
  transferTarget.value = { id: playerId, nickname }
  transferDialogOpen.value = true
}

function confirmTransfer() {
  if (!transferTarget.value) return
  const nickname = transferTarget.value.nickname
  game.send({ type: 'TRANSFER_HOST', payload: { newHostId: transferTarget.value.id } })
  transferDialogOpen.value = false
  toast(`${nickname} тепер ведучий`)
  transferTarget.value = null
}
</script>

<template>
  <div class="space-y-1 min-h-[52px]">
    <div
      v-for="player in players"
      :key="player.id"
      class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm bg-amber-950/20 border border-amber-900/15 font-medium"
    >
      <span class="truncate">
        {{ player.nickname }}
      </span>
      <span v-if="player.isHost" class="text-[10px] ml-auto text-glow">&#x1F451;</span>
      <button
        v-if="game.isHost && !player.isHost && player.id !== game.playerId"
        class="text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer text-xs"
        :aria-label="`Передати коронку ${player.nickname}`"
        @click="openTransferDialog(player.id, player.nickname)"
      >
        &#x1F451;
      </button>
      <button
        v-if="game.isHost && !player.isHost && player.id !== game.playerId"
        class="ml-auto text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
        :aria-label="`Вигнати ${player.nickname}`"
        @click="handleKick(player.id)"
      >
        <X class="size-3.5" />
      </button>
    </div>

    <p v-if="players.length === 0" class="text-sm text-muted-foreground text-center py-4 font-mono">
      Очікування гравців...
    </p>

    <!-- Transfer host confirmation dialog -->
    <Dialog :open="transferDialogOpen" @update:open="transferDialogOpen = $event">
      <DialogHeader>
        <DialogTitle>Передати коронку</DialogTitle>
      </DialogHeader>
      <p class="text-sm text-muted-foreground">
        Передати коронку <strong class="text-amber-500">{{ transferTarget?.nickname }}</strong>? Ви станете гравцем.
      </p>
      <div class="flex justify-end gap-2 mt-4">
        <Button variant="outline" size="sm" @click="transferDialogOpen = false">
          Скасувати
        </Button>
        <Button size="sm" @click="confirmTransfer">
          Передати
        </Button>
      </div>
    </Dialog>
  </div>
</template>
