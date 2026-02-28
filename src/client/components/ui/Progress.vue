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
    :class="cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', props.class)"
  >
    <div
      data-slot="progress-indicator"
      class="bg-primary h-full w-full flex-1 transition-all"
      :style="{ transform }"
    />
  </div>
</template>
