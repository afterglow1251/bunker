<script setup lang="ts">
import { Target } from 'lucide-vue-next'
import Badge from '@/components/ui/Badge.vue'

defineProps<{ round: number }>()
</script>

<template>
  <Badge variant="outline" class="gap-1.5 px-2.5 py-1 text-xs">
    <Target class="size-3 text-amber-500" />
    Раунд {{ round }}
  </Badge>
</template>
