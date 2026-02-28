<script setup lang="ts">
import { computed } from 'vue'
import { MessageCircle } from 'lucide-vue-next'
import { useTimer } from '@/composables/useTimer'
import { useGameStore } from '@/stores/game'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Progress from '@/components/ui/Progress.vue'

const { formatted, timer } = useTimer()
const game = useGameStore()

const maxTime = computed(() => game.room?.settings.discussionTime ?? 120)
const progressValue = computed(() => maxTime.value > 0 ? (timer.value / maxTime.value) * 100 : 0)
const isLow = computed(() => timer.value <= 10)
</script>

<template>
  <Card class="border-amber-900/30 bg-card/80 backdrop-blur-sm py-0">
    <CardContent class="p-4">
      <div class="flex flex-col items-center gap-3">
        <div class="flex items-center gap-2">
          <MessageCircle class="size-5 text-amber-500" />
          <span class="text-sm font-medium text-muted-foreground">
            Обговорення
          </span>
        </div>

        <div
          :class="[
            'text-4xl font-bold font-mono tabular-nums',
            isLow ? 'text-red-400 animate-pulse' : 'text-foreground'
          ]"
        >
          {{ formatted }}
        </div>

        <Progress
          :value="progressValue"
          :class="['h-2 w-full', isLow ? '[&>[data-slot=progress-indicator]]:bg-red-500' : '']"
        />
      </div>
    </CardContent>
  </Card>
</template>
