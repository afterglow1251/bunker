<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  class?: string
  size?: 'default' | 'sm' | 'lg'
}>(), {
  size: 'default',
})
</script>

<template>
  <span
    data-slot="avatar"
    :data-size="size"
    :class="cn(
      'group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none data-[size=lg]:size-10 data-[size=sm]:size-6',
      props.class
    )"
  >
    <slot />
  </span>
</template>
