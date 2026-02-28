<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'

defineProps<{ catastrophe: string }>()

const isVisible = ref(false)
const showText = ref(false)

onMounted(() => {
  setTimeout(() => (isVisible.value = true), 100)
  setTimeout(() => (showText.value = true), 800)
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] px-4">
    <!-- Pulsing background glow -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900/20 rounded-full blur-3xl animate-pulse" />
    </div>

    <div
      :class="[
        'relative z-10 flex flex-col items-center gap-8 transition-all duration-1000',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
      ]"
    >
      <!-- Warning icon -->
      <div class="flex items-center gap-3 animate-bounce">
        <AlertTriangle class="size-10 text-red-500" />
        <AlertTriangle class="size-14 text-red-400" />
        <AlertTriangle class="size-10 text-red-500" />
      </div>

      <!-- Heading -->
      <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold text-red-500 tracking-wider text-center animate-pulse">
        УВАГА! КАТАСТРОФА!
      </h1>

      <!-- Catastrophe text -->
      <div
        :class="[
          'max-w-2xl transition-all duration-1000 delay-300',
          showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        ]"
      >
        <div class="rounded-xl border-2 border-red-900/50 bg-red-950/30 p-6 sm:p-8 backdrop-blur-sm">
          <p class="text-lg sm:text-xl md:text-2xl text-center text-foreground leading-relaxed">
            {{ catastrophe }}
          </p>
        </div>
      </div>

      <!-- Subtle indicator -->
      <p class="text-sm text-muted-foreground animate-pulse mt-4">
        Зачекайте...
      </p>
    </div>
  </div>
</template>
