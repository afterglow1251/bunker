<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { Shield, Radiation, Home, RotateCcw, Skull, Heart } from 'lucide-vue-next'
import { TRAIT_LABELS } from '../../shared'
import type { Player } from '../../shared'
import { useGameStore } from '@/stores/game'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import Separator from '@/components/ui/Separator.vue'

const router = useRouter()
const game = useGameStore()
watch(() => game.gameOverData, (data) => {
  if (!data) {
    router.replace('/')
  }
}, { immediate: true })

function handleGoHome() {
  game.reset()
  router.push('/')
}

function handlePlayAgain() {
  game.reset()
  router.push('/')
}

function getTraitEntries(player: Player): [string, string | number][] {
  return Object.entries(player.traits) as [string, string | number][]
}
</script>

<template>
  <div v-if="game.gameOverData" class="min-h-screen bg-background relative overflow-hidden bg-noise">
    <!-- Background -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.04)_0%,transparent_70%)]" />
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-amber-900/5 rounded-full blur-[120px]" />
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-950/8 rounded-full blur-[100px]" />
    </div>

    <div class="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <!-- Header -->
      <div class="flex flex-col items-center gap-3 mb-8 text-center">
        <div class="flex items-center gap-3">
          <span class="text-3xl text-amber-500/60 animate-flicker select-none">☢</span>
          <Shield class="size-10 text-amber-500/80" />
          <span class="text-3xl text-amber-500/60 animate-flicker select-none">☢</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-[0.1em] uppercase text-glow text-foreground">
          Результати гри
        </h1>
      </div>

      <!-- Catastrophe & Bunker -->
      <Card class="mb-6 border-amber-900/30 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle class="text-lg text-amber-500 text-glow">Катастрофа</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-foreground mb-4">{{ game.gameOverData.catastrophe }}</p>
          <Separator class="my-4 bg-amber-900/20" />
          <h4 class="text-sm font-semibold text-amber-500/60 mb-2">Опис бункера</h4>
          <p class="text-foreground">{{ game.gameOverData.bunkerDescription }}</p>
        </CardContent>
      </Card>

      <!-- Survivors -->
      <Card class="mb-6 border-emerald-800/30 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div class="flex items-center gap-2">
            <Heart class="size-5 text-emerald-500" />
            <CardTitle class="text-lg text-emerald-400">ВИЖИЛИ</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p v-if="game.gameOverData.survivors.length === 0" class="text-sm text-muted-foreground">
            Ніхто не вижив
          </p>
          <div v-else class="flex flex-col gap-4">
            <div
              v-for="player in game.gameOverData.survivors"
              :key="player.id"
              class="rounded-lg border p-4 border-emerald-800/20 bg-emerald-950/10"
            >
              <div class="flex items-center gap-2 mb-3">
                <span class="font-semibold text-emerald-400">{{ player.nickname }}</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div v-for="[key, value] in getTraitEntries(player)" :key="key" class="flex items-start gap-2 text-sm">
                  <span class="text-muted-foreground shrink-0">{{ TRAIT_LABELS[key] ?? key }}:</span>
                  <span class="text-foreground">{{ String(value) }}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Eliminated -->
      <Card class="mb-8 border-red-900/30 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div class="flex items-center gap-2">
            <Skull class="size-5 text-red-500" />
            <CardTitle class="text-lg text-red-400">ВИБУЛИ</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p v-if="game.gameOverData.eliminated.length === 0" class="text-sm text-muted-foreground">
            Ніхто не вибув
          </p>
          <div v-else class="flex flex-col gap-4">
            <div
              v-for="(player, index) in game.gameOverData.eliminated"
              :key="player.id"
              class="rounded-lg border p-4 border-red-900/20 bg-red-950/10"
            >
              <div class="flex items-center gap-2 mb-3">
                <Badge variant="outline" class="text-[10px] text-red-400/60 border-red-900/20">
                  #{{ index + 1 }}
                </Badge>
                <span class="font-semibold text-red-300/80">{{ player.nickname }}</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div v-for="[key, value] in getTraitEntries(player)" :key="key" class="flex items-start gap-2 text-sm">
                  <span class="text-muted-foreground shrink-0">{{ TRAIT_LABELS[key] ?? key }}:</span>
                  <span class="text-foreground">{{ String(value) }}</span>
                </div>
              </div>
              <div v-if="player.actionCard" class="mt-3 pt-3 border-t border-red-900/15">
                <div class="flex items-start gap-2 text-sm">
                  <span class="text-muted-foreground shrink-0">Карта дії:</span>
                  <span class="text-foreground">{{ player.actionCard.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button variant="outline" class="w-full sm:w-auto" @click="handleGoHome">
          <Home class="size-4" />
          На головну
        </Button>
        <Button class="w-full sm:w-auto" @click="handlePlayAgain">
          <RotateCcw class="size-4" />
          Грати знову
        </Button>
      </div>
    </div>
  </div>
</template>
