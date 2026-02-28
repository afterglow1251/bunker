<script setup lang="ts">
import { ref, computed } from 'vue'
import { Vote, CheckCircle2, SkipForward } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { useTimer } from '@/composables/useTimer'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Progress from '@/components/ui/Progress.vue'

const game = useGameStore()
const { formatted, timer } = useTimer()
const myVote = ref<string | null>(null)

const votes = computed(() => game.room?.votes ?? {})
const totalVotes = computed(() => Object.values(votes.value).reduce((a, b) => a + b, 0))

const isRevote = computed(() => (game.room as any)?.revoteTargets !== null && game.revoteTargets !== null)

const candidates = computed(() => {
  // Voting is always open — can vote for any alive player (including self per rules)
  return game.alivePlayers
})

const canPass = computed(() =>
  game.currentRound === 1 && !isRevote.value
)

const maxTime = computed(() => game.room?.settings.votingTime ?? 15)
const progressValue = computed(() => maxTime.value > 0 ? (timer.value / maxTime.value) * 100 : 0)

function handleVote(targetPlayerId: string) {
  myVote.value = targetPlayerId
  game.send({ type: 'CAST_VOTE', payload: { targetPlayerId } })
}

function handlePass() {
  myVote.value = '__PASS__'
  game.send({ type: 'CAST_VOTE_PASS', payload: {} })
}
</script>

<template>
  <Card class="border-amber-900/30 bg-card/80 backdrop-blur-sm">
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-base flex items-center gap-2">
          <Vote class="size-4 text-amber-500" />
          Фаза голосування
        </CardTitle>
        <div class="flex items-center gap-2">
          <span class="text-sm font-mono text-muted-foreground">
            {{ formatted }}
          </span>
        </div>
      </div>
      <Progress :value="progressValue" class="h-1 mt-2" />
    </CardHeader>

    <CardContent class="flex flex-col gap-2">
      <p v-if="isRevote" class="text-xs text-amber-400 mb-1">
        Переголосування
      </p>

      <p v-if="game.pendingDoubleElimination" class="text-xs text-red-400 mb-1">
        Подвійне вигнання! Цього раунду вибувають двоє.
      </p>

      <Button
        v-for="player in candidates"
        :key="player.id"
        :variant="myVote === player.id ? 'default' : 'outline'"
        class="w-full justify-between h-auto py-2.5 px-3"
        @click="handleVote(player.id)"
      >
        <div class="flex items-center gap-2">
          <CheckCircle2 v-if="myVote === player.id" class="size-4 text-emerald-400" />
          <span class="text-sm font-medium">{{ player.nickname }}</span>
        </div>
        <Badge variant="secondary" class="text-xs">
          {{ votes[player.id] ?? 0 }} {{ (votes[player.id] ?? 0) === 1 ? 'голос' : 'голосів' }}
        </Badge>
      </Button>

      <Button
        v-if="canPass"
        :variant="myVote === '__PASS__' ? 'default' : 'outline'"
        class="w-full justify-between h-auto py-2.5 px-3 border-dashed"
        @click="handlePass"
      >
        <div class="flex items-center gap-2">
          <SkipForward v-if="myVote !== '__PASS__'" class="size-4 text-muted-foreground" />
          <CheckCircle2 v-else class="size-4 text-emerald-400" />
          <span class="text-sm font-medium">Пропустити голосування</span>
        </div>
        <Badge variant="secondary" class="text-xs">
          {{ votes['__PASS__'] ?? 0 }}
        </Badge>
      </Button>

      <p v-if="myVote" class="text-xs text-muted-foreground text-center mt-2">
        Ви проголосували. Можете змінити голос до кінця таймера.
      </p>
      <p v-else class="text-xs text-red-400/70 text-center mt-2">
        Якщо не проголосуєте — голос піде проти вас!
      </p>
    </CardContent>
  </Card>
</template>
