<script setup lang="ts">
import { ref, onMounted } from 'vue'

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
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/15 rounded-full blur-[120px] animate-pulse" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-900/10 rounded-full blur-[80px]" />
    </div>

    <div
      :class="[
        'relative z-10 flex flex-col items-center gap-8 transition-all duration-1000',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
      ]"
    >
      <!-- Radiation symbol with glow -->
      <div class="flex items-center gap-4">
        <span class="text-5xl text-red-500/60 animate-pulse select-none">☢</span>
        <span class="text-7xl sm:text-8xl text-red-500 animate-flicker text-glow-red select-none">☢</span>
        <span class="text-5xl text-red-500/60 animate-pulse select-none">☢</span>
      </div>

      <!-- Heading -->
      <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold text-red-500 tracking-[0.15em] text-center animate-flicker text-glow-red uppercase">
        УВАГА! КАТАСТРОФА!
      </h1>

      <!-- Catastrophe text -->
      <div
        :class="[
          'max-w-2xl transition-all duration-1000 delay-300',
          showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        ]"
      >
        <div class="rounded-xl border-2 border-red-900/50 bg-red-950/30 p-6 sm:p-8 backdrop-blur-sm border-glow-red">
          <p class="text-xl sm:text-2xl md:text-3xl text-center text-foreground leading-relaxed font-semibold">
            {{ catastrophe }}
          </p>
        </div>
      </div>

      <!-- Subtle indicator -->
      <p class="text-sm text-red-400/50 animate-pulse mt-4 font-mono">
        &gt; Завантаження даних бункера... _
      </p>
    </div>
  </div>
</template>
