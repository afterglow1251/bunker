import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

export function useTimer() {
  const game = useGameStore()

  const minutes = computed(() => Math.floor(game.timer / 60))
  const seconds = computed(() => game.timer % 60)
  const formatted = computed(() => `${minutes.value}:${String(seconds.value).padStart(2, '0')}`)

  return { timer: computed(() => game.timer), minutes, seconds, formatted }
}
