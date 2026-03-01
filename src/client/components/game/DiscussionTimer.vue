<script setup lang="ts">
import { computed } from 'vue'
import { MessageCircle, Clock, XCircle, SkipForward } from 'lucide-vue-next'
import { useTimer } from '@/composables/useTimer'
import { useGameStore } from '@/stores/game'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Progress from '@/components/ui/Progress.vue'
import Button from '@/components/ui/Button.vue'

const { formatted, timer } = useTimer()
const game = useGameStore()

const maxTime = computed(() => game.room?.settings.discussionTime ?? 120)
const progressValue = computed(() => maxTime.value > 0 ? (timer.value / maxTime.value) * 100 : 0)
const isLow = computed(() => !game.timerCancelled && timer.value <= 10)

function endDiscussion() {
  game.send({ type: 'END_DISCUSSION', payload: {} })
}

function addTime() {
  game.send({ type: 'ADD_DISCUSSION_TIME', payload: { seconds: 60 } })
}

function cancelTimer() {
  game.send({ type: 'CANCEL_DISCUSSION_TIMER', payload: {} })
}
</script>

<template>
  <Card class="border-amber-900/30 bg-card/80 backdrop-blur-sm py-0">
    <CardContent class="p-4">
      <div class="flex flex-col items-center gap-3">
        <div class="flex items-center gap-2">
          <MessageCircle :class="['size-5', isLow ? 'text-red-500' : 'text-amber-500']" />
          <span class="text-sm font-medium text-muted-foreground">
            {{ game.timerCancelled ? 'Вільне обговорення' : 'Обговорення' }}
          </span>
        </div>

        <template v-if="!game.timerCancelled">
          <div
            :class="[
              'text-4xl font-bold font-mono tabular-nums',
              isLow ? 'text-red-400 animate-pulse text-glow-red' : 'text-amber-500 text-glow'
            ]"
          >
            {{ formatted }}
          </div>

          <Progress
            :value="progressValue"
            :class="['h-2 w-full', isLow ? '[&>[data-slot=progress-indicator]]:bg-red-500' : '']"
          />
        </template>

        <template v-else>
          <div class="text-2xl font-bold text-amber-500/70 text-glow">
            &infin;
          </div>
        </template>

        <!-- Host controls -->
        <div v-if="game.isHost" class="flex flex-wrap items-center justify-center gap-2 w-full pt-1">
          <Button
            v-if="!game.timerCancelled"
            variant="outline" size="xs"
            @click="addTime"
          >
            <Clock class="size-3" />
            +1 хв
          </Button>
          <Button
            v-if="!game.timerCancelled"
            variant="outline" size="xs"
            @click="cancelTimer"
          >
            <XCircle class="size-3" />
            Без таймера
          </Button>
          <Button
            variant="outline" size="xs"
            @click="endDiscussion"
          >
            <SkipForward class="size-3" />
            Завершити
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
