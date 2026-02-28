import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  PublicPlayer, ClientRoom, RoomSettings, GamePhase,
  ActionCard, PlayerTraits, TraitType, GameOverData,
  ServerMessage,
} from '../../shared'
import { clientId, nickname } from './auth'
import * as ws from '../services/ws'

export const useGameStore = defineStore('game', () => {
  // ── state ──
  const room = ref<ClientRoom | null>(null)
  const myTraits = ref<PlayerTraits | null>(null)
  const myActionCard = ref<ActionCard | null>(null)
  const catastrophe = ref<string | null>(null)
  const bunkerDescription = ref<string | null>(null)
  const currentRound = ref(0)
  const currentTurnPlayerId = ref<string | null>(null)
  const timer = ref(0)
  const phase = ref<GamePhase>('lobby')
  const revoteTargets = ref<string[] | null>(null)
  const gameOverData = ref<GameOverData | null>(null)
  const isConnected = ref(false)
  const playerId = ref<string | null>(null)
  const roomCode = ref<string | null>(null)
  const traitsToRevealThisRound = ref(1)
  const speechPhase = ref<'accusation' | 'justification' | 'farewell' | null>(null)
  const speechSpeakerId = ref<string | null>(null)
  const speechSpeakerIndex = ref(0)
  const speechTotalSpeakers = ref(0)
  const pendingDoubleElimination = ref(false)

  // ── computed ──
  const isHost = computed(() => room.value?.hostId === playerId.value)
  const isMyTurn = computed(() => currentTurnPlayerId.value === playerId.value)
  const myPlayer = computed(() => room.value?.players.find(p => p.id === playerId.value))
  const alivePlayers = computed(() => room.value?.players.filter(p => p.isAlive) ?? [])
  const eliminatedPlayers = computed(() => room.value?.players.filter(p => !p.isAlive) ?? [])

  // ── message handler ──
  function handleMessage(msg: ServerMessage) {
    switch (msg.type) {
      case 'JOINED':
        playerId.value = msg.payload.player.id
        roomCode.value = msg.payload.room.code
        room.value = msg.payload.room
        phase.value = msg.payload.room.phase

        // Restore personal state if reconnecting mid-game
        if (msg.payload.player.traits && msg.payload.room.phase !== 'lobby') {
          myTraits.value = msg.payload.player.traits
          myActionCard.value = msg.payload.player.actionCard
          catastrophe.value = msg.payload.room.catastrophe
          bunkerDescription.value = msg.payload.room.bunkerDescription
          currentRound.value = msg.payload.room.currentRound
          currentTurnPlayerId.value = msg.payload.room.currentTurnPlayerId
        }

        // Set reconnect info for auto-rejoin
        ws.setReconnectInfo({
          roomCode: msg.payload.room.code,
          clientId: clientId.value,
          nickname: nickname.value,
        })
        break

      case 'PLAYER_JOINED':
        if (room.value) {
          const exists = room.value.players.some(p => p.id === msg.payload.player.id)
          if (!exists) {
            room.value = { ...room.value, players: [...room.value.players, msg.payload.player] }
          }
        }
        break

      case 'PLAYER_LEFT':
        if (room.value) {
          room.value = {
            ...room.value,
            players: room.value.players.filter(p => p.id !== msg.payload.playerId),
          }
        }
        break

      case 'GAME_STARTED':
        catastrophe.value = msg.payload.catastrophe
        bunkerDescription.value = msg.payload.bunkerDescription
        myTraits.value = msg.payload.yourTraits
        myActionCard.value = msg.payload.yourActionCard
        phase.value = 'catastrophe_reveal'
        break

      case 'ROUND_STARTED':
        currentRound.value = msg.payload.roundNumber
        currentTurnPlayerId.value = msg.payload.currentPlayerId
        traitsToRevealThisRound.value = msg.payload.traitsToReveal
        phase.value = 'trait_reveal'
        revoteTargets.value = null
        speechPhase.value = null
        speechSpeakerId.value = null
        if (room.value) {
          room.value = { ...room.value, votes: {} }
        }
        break

      case 'TRAIT_REVEALED':
        if (room.value) {
          room.value = {
            ...room.value,
            players: room.value.players.map(p =>
              p.id === msg.payload.playerId
                ? { ...p, revealedTraits: { ...p.revealedTraits, [msg.payload.traitType]: msg.payload.value } }
                : p
            ),
          }
        }
        break

      case 'DISCUSSION_PHASE':
        phase.value = 'discussion'
        timer.value = msg.payload.timeLimit
        break

      case 'VOTING_PHASE':
        phase.value = 'voting'
        timer.value = msg.payload.timeLimit
        if (msg.payload.candidates) {
          revoteTargets.value = msg.payload.candidates
        }
        break

      case 'VOTE_UPDATE':
        if (room.value) {
          room.value = { ...room.value, votes: msg.payload.votes }
        }
        break

      case 'PLAYER_ELIMINATED': {
        if (room.value) {
          const revealedTraits: Record<string, string | number> = {}
          for (const [key, value] of Object.entries(msg.payload.allTraits)) {
            revealedTraits[key] = value
          }
          phase.value = 'elimination'
          room.value = {
            ...room.value,
            players: room.value.players.map(p =>
              p.id === msg.payload.playerId
                ? { ...p, isAlive: false, revealedTraits }
                : p
            ),
            eliminatedIds: [...room.value.eliminatedIds, msg.payload.playerId],
          }
        }
        break
      }

      case 'TURN_CHANGED':
        currentTurnPlayerId.value = msg.payload.currentPlayerId
        break

      case 'ACTION_CARD_USED':
        if (msg.payload.result?.newTrait) {
          if (myTraits.value) {
            myTraits.value = { ...myTraits.value, [msg.payload.result.newTrait.traitType]: msg.payload.result.newTrait.value }
          }
        }
        if (msg.payload.playerId === playerId.value && myActionCard.value) {
          myActionCard.value = { ...myActionCard.value, used: true }
        }
        break

      case 'CHAT_MESSAGE':
        // Handled by chat store
        break

      case 'GAME_OVER':
        gameOverData.value = msg.payload
        phase.value = 'game_over'
        break

      case 'TIMER_TICK':
        timer.value = msg.payload.secondsRemaining
        break

      case 'SETTINGS_UPDATED':
        if (room.value) {
          room.value = { ...room.value, settings: msg.payload.settings }
        }
        break

      case 'HOST_CHANGED':
        if (room.value) {
          room.value = {
            ...room.value,
            hostId: msg.payload.newHostId,
            players: room.value.players.map(p => ({ ...p, isHost: p.id === msg.payload.newHostId })),
          }
        }
        break

      case 'PLAYER_RECONNECTED':
        if (room.value) {
          room.value = {
            ...room.value,
            players: room.value.players.map(p =>
              p.id === msg.payload.playerId ? { ...p, isConnected: true } : p
            ),
          }
        }
        break

      case 'PLAYER_DISCONNECTED':
        if (room.value) {
          room.value = {
            ...room.value,
            players: room.value.players.map(p =>
              p.id === msg.payload.playerId ? { ...p, isConnected: false } : p
            ),
          }
        }
        break

      case 'SPEECH_PHASE':
        phase.value = msg.payload.phase === 'accusation'
          ? 'accusation_speech'
          : msg.payload.phase === 'justification'
            ? 'justification_speech'
            : 'farewell_speech'
        speechPhase.value = msg.payload.phase
        speechSpeakerId.value = msg.payload.speakerId
        speechSpeakerIndex.value = msg.payload.speakerIndex
        speechTotalSpeakers.value = msg.payload.totalSpeakers
        timer.value = msg.payload.timeLimit
        break

      case 'SPEECH_ENDED':
        speechSpeakerId.value = null
        break

      case 'VOTE_PASS_RESULT':
        if (msg.payload.passed) {
          pendingDoubleElimination.value = true
        }
        break

      case 'ERROR':
        // Handled by individual components
        break
    }
  }

  // ── actions ──
  function send(msg: Parameters<typeof ws.send>[0]) {
    ws.send(msg)
  }

  function reset() {
    room.value = null
    myTraits.value = null
    myActionCard.value = null
    catastrophe.value = null
    bunkerDescription.value = null
    currentRound.value = 0
    currentTurnPlayerId.value = null
    timer.value = 0
    phase.value = 'lobby'
    revoteTargets.value = null
    gameOverData.value = null
    playerId.value = null
    roomCode.value = null
    traitsToRevealThisRound.value = 1
    speechPhase.value = null
    speechSpeakerId.value = null
    speechSpeakerIndex.value = 0
    speechTotalSpeakers.value = 0
    pendingDoubleElimination.value = false
    ws.setReconnectInfo(null)
  }

  return {
    // state
    room, myTraits, myActionCard, catastrophe, bunkerDescription,
    currentRound, currentTurnPlayerId, timer, phase,
    revoteTargets, gameOverData, isConnected, playerId, roomCode,
    traitsToRevealThisRound, speechPhase, speechSpeakerId,
    speechSpeakerIndex, speechTotalSpeakers, pendingDoubleElimination,
    // computed
    isHost, isMyTurn, myPlayer, alivePlayers, eliminatedPlayers,
    // actions
    handleMessage, send, reset,
  }
})
