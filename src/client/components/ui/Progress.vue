<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  value?: number
  class?: string
}>(), {
  value: 0,
})

const transform = computed(() => `translateX(-${100 - (props.value || 0)}%)`)
</script>

<template>
  <div
    data-slot="progress"
    role="progressbar"
    :aria-valuenow="value"
    :class="cn('bg-amber-950/30 relative h-2 w-full overflow-hidden rounded-full', props.class)"
  >
    <div
      data-slot="progress-indicator"
      class="bg-gradient-to-r from-amber-600 to-amber-500 h-full w-full flex-1 transition-all shadow-[0_0_6px_rgba(217,119,6,0.4)]"
      :style="{ transform }"
    />
  </div>
</template>
