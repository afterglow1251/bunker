<script setup lang="ts">
import { DialogTitle } from 'reka-ui'
import { cn } from '@/lib/utils'

defineProps<{ class?: string }>()
</script>

<template>
  <DialogTitle data-slot="dialog-title" :class="cn('text-lg leading-none font-semibold', $props.class)">
    <slot />
  </DialogTitle>
</template>
