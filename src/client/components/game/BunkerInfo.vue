<script setup lang="ts">
import { ref } from 'vue'
import { Shield, ChevronDown, ChevronUp } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'

defineProps<{ description: string }>()

const isExpanded = ref(false)
</script>

<template>
  <Card class="border-amber-900/20 bg-card/80 backdrop-blur-sm py-0">
    <CardContent class="p-3">
      <Button
        variant="ghost"
        size="sm"
        class="w-full justify-between text-left h-auto py-1"
        @click="isExpanded = !isExpanded"
      >
        <span class="flex items-center gap-2 text-sm font-medium">
          <Shield class="size-4 text-amber-500" />
          <span class="text-amber-500/80">Бункер</span>
        </span>
        <ChevronUp v-if="isExpanded" class="size-4 text-amber-500/50" />
        <ChevronDown v-else class="size-4 text-amber-500/50" />
      </Button>

      <div v-if="isExpanded" class="mt-2 px-2 pb-1">
        <p class="text-sm text-muted-foreground leading-relaxed">
          {{ description }}
        </p>
      </div>
    </CardContent>
  </Card>
</template>
