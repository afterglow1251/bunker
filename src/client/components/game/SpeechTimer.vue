<script setup lang="ts">
import { computed } from 'vue'
import { Mic, MicOff, SkipForward } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { useTimer } from '@/composables/useTimer'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Progress from '@/components/ui/Progress.vue'

const game = useGameStore()
const { formatted, timer } = useTimer()

const phaseLabel = computed(() => {
  switch (game.speechPhase) {
    case 'accusation': return 'Обвинувальна промова'
    case 'justification': return 'Виправдальна промова'
    case 'farewell': return 'Прощальна промова'
    default: return 'Промова'
  }
})

const speaker = computed(() =>
  game.room?.players.find(p => p.id === game.speechSpeakerId)
)

const isSpeaking = computed(() => game.speechSpeakerId === game.playerId)

const maxTime = computed(() => {
  switch (game.speechPhase) {
    case 'accusation': return 30
    case 'justification': return 30
    case 'farewell': return 15
    default: return 30
  }
})

const progressValue = computed(() =>
  maxTime.value > 0 ? (timer.value / maxTime.value) * 100 : 0
)

function skipSpeech() {
  game.send({ type: 'SKIP_SPEECH', payload: {} })
}
</script>

<template>
  <Card class="border-amber-900/30 bg-card/80 backdrop-blur-sm">
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-base flex items-center gap-2">
          <Mic v-if="speaker" class="size-4 text-amber-500" />
          <MicOff v-else class="size-4 text-muted-foreground" />
          {{ phaseLabel }}
        </CardTitle>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground">
            {{ game.speechSpeakerIndex }}/{{ game.speechTotalSpeakers }}
          </span>
          <span class="text-sm font-mono text-muted-foreground">
            {{ formatted }}
          </span>
        </div>
      </div>
      <Progress :value="progressValue" class="h-1 mt-2" />
    </CardHeader>
    <CardContent>
      <div class="flex items-center justify-between">
        <div>
          <p v-if="speaker" class="text-sm">
            <span class="font-semibold" :class="isSpeaking ? 'text-amber-400' : 'text-foreground'">
              {{ speaker.nickname }}
            </span>
            <span class="text-muted-foreground">
              {{ isSpeaking ? ' — ваша черга говорити' : ' говорить' }}
            </span>
          </p>
          <p v-else class="text-sm text-muted-foreground">
            Очікування...
          </p>
        </div>
        <Button
          v-if="game.isHost && speaker"
          variant="ghost"
          size="sm"
          class="gap-1 text-xs"
          @click="skipSpeech"
        >
          <SkipForward class="size-3" />
          Пропустити
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
