<script setup lang="ts">
import { DialogDescription } from 'reka-ui'
import { cn } from '@/lib/utils'

defineProps<{ class?: string }>()
</script>

<template>
  <DialogDescription data-slot="dialog-description" :class="cn('text-muted-foreground text-sm', $props.class)">
    <slot />
  </DialogDescription>
</template>
