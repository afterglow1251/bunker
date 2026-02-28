<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'

const props = defineProps<{ code: string }>()

const copied = ref(false)

async function handleCopy() {
  try {
    const url = `${window.location.origin}/lobby/${props.code}`
    await navigator.clipboard.writeText(url)
    copied.value = true
    toast.success('Посилання скопійовано!')
    setTimeout(() => (copied.value = false), 500)
  } catch {
    toast.error('Не вдалося скопіювати')
  }
}
</script>

<template>
  <button
    :class="[
      'w-full rounded-lg bg-secondary border px-3 py-2 font-mono text-lg font-bold tracking-widest text-center transition-colors cursor-pointer',
      copied ? 'border-emerald-500/50 text-emerald-400' : 'border-border'
    ]"
    @click="handleCopy"
  >
    <span v-for="(char, i) in code.split('')" :key="i" class="inline-block">{{ char }}</span>
  </button>
</template>
