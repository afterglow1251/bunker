<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { Loader2, Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { useWebSocket } from '@/composables/useWebSocket'
import { useGameStore } from '@/stores/game'
import { clientId, nickname as storedNickname, setNickname as saveNickname } from '@/stores/auth'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const router = useRouter()
const route = useRoute()
useWebSocket()
const game = useGameStore()
const { theme, toggle: toggleTheme } = useTheme()

const nicknameInput = ref(storedNickname.value)
const roomCode = ref('')
const showJoin = ref(false)
const isLoading = ref(false)
const error = ref('')

// Pre-fill room code from ?code= query param (e.g. redirect from /lobby/:code without nickname)
onMounted(() => {
  const code = route.query.code as string | undefined
  if (code) {
    roomCode.value = code.toUpperCase()
    showJoin.value = true
  }
})

watch(() => game.room, (room) => {
  if (isLoading.value && room) {
    isLoading.value = false
    router.push(`/lobby/${room.code}`)
  }
})

function validateNickname(): boolean {
  const name = nicknameInput.value.trim()
  if (!name) {
    error.value = 'Як тебе звати? :)'
    return false
  }
  if (name.length < 2 || name.length > 12) {
    error.value = name.length < 2 ? 'Мінімум 2 символи' : 'Максимум 12 символів'
    return false
  }
  return true
}

async function handleCreate() {
  if (!validateNickname()) return
  isLoading.value = true
  const name = nicknameInput.value.trim()
  saveNickname(name)
  try {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: name }),
    })
    if (!res.ok) throw new Error('Не вдалося створити кімнату')
    const { roomCode: code } = await res.json()
    game.send({ type: 'JOIN_ROOM', payload: { roomCode: code, nickname: name, clientId: clientId.value } })
    router.push(`/lobby/${code}`)
  } catch {
    toast.error('Не вдалося створити кімнату')
  } finally {
    isLoading.value = false
  }
}

function handleJoin() {
  if (!validateNickname()) return
  if (roomCode.value.length !== 5) {
    error.value = 'Введи код кімнати'
    return
  }
  const name = nicknameInput.value.trim()
  saveNickname(name)
  isLoading.value = true
  game.send({ type: 'JOIN_ROOM', payload: { roomCode: roomCode.value, nickname: name, clientId: clientId.value } })
  setTimeout(() => {
    if (isLoading.value) {
      toast.error('Не вдалося приєднатися. Перевір код кімнати.')
      isLoading.value = false
    }
  }, 5000)
}

function onRoomCodeInput(val: string) {
  roomCode.value = val.toUpperCase().replace(/[^A-Z0-9]/g, '')
  error.value = ''
}
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center justify-center p-4 relative">
    <Button variant="ghost" size="icon" class="absolute top-4 right-4" @click="toggleTheme">
      <Sun v-if="theme === 'dark'" class="size-5" />
      <Moon v-else class="size-5" />
    </Button>

    <div class="w-full max-w-sm space-y-8">
      <div class="text-center">
        <div class="text-8xl mb-3 inline-block">🏚️</div>
        <h1 class="text-5xl font-extrabold mb-1.5">Бункер</h1>
        <p class="inline-block rounded-full px-4 py-1.5 text-muted-foreground text-sm bg-secondary border border-border">
          хто виживе після катастрофи?
        </p>
      </div>

      <Card class="gap-4 p-5">
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs text-muted-foreground">твій нікнейм</label>
            <span
              :class="[
                'text-xs tabular-nums',
                nicknameInput.length < 2 || nicknameInput.length > 12 ? 'text-destructive' : 'text-muted-foreground'
              ]"
            >
              {{ nicknameInput.length }}/12
            </span>
          </div>
          <Input
            :model-value="nicknameInput"
            @update:model-value="(v: string) => { nicknameInput = v; error = '' }"
            placeholder="напиши ім'я..."
            :max-length="12"
            :disabled="isLoading"
          />
        </div>

        <p v-if="error" class="text-xs text-destructive">{{ error }}</p>

        <Button class="w-full" size="lg" :disabled="isLoading" @click="handleCreate">
          <Loader2 v-if="isLoading && !showJoin" class="animate-spin size-4 mr-2" />
          створити кімнату 🏠
        </Button>

        <div class="h-10">
          <div v-if="showJoin" class="flex gap-2 h-full">
            <Input
              :model-value="roomCode"
              @update:model-value="onRoomCodeInput"
              placeholder="КОД"
              :max-length="5"
              :disabled="isLoading"
              class="!h-full font-mono tracking-widest text-center text-lg"
            />
            <Button class="!h-full" :disabled="isLoading" @click="handleJoin">
              <Loader2 v-if="isLoading && showJoin" class="animate-spin size-4" />
              <span v-else>→</span>
            </Button>
          </div>
          <Button v-else class="w-full !h-full" variant="outline" @click="showJoin = true">
            приєднатися по коду
          </Button>
        </div>
      </Card>

      <p class="text-center text-xs text-muted-foreground">
        збери друзів, отримай характеристики
        <br />
        і переконай що ти вартий бункера! 🏚️
      </p>
    </div>
  </div>
</template>
