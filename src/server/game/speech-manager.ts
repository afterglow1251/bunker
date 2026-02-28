import type { Room } from '../../shared'
import type { ServerMessage } from '../../shared'
import { timerManager } from './timer-manager'

type BroadcastFn = (roomCode: string, message: ServerMessage, excludeId?: string) => void

let broadcast: BroadcastFn = () => {}

export type SpeechType = 'accusation' | 'justification' | 'farewell'

interface SpeechRound {
  speakers: string[]
  currentIndex: number
  type: SpeechType
  timePerSpeaker: number
  onComplete: () => void
}

const activeSpeechRounds = new Map<string, SpeechRound>()

export const speechManager = {
  setBroadcast(fn: BroadcastFn) { broadcast = fn },

  startSpeechRound(
    room: Room,
    speakers: string[],
    type: SpeechType,
    timePerSpeaker: number,
    onComplete: () => void,
  ) {
    if (speakers.length === 0) {
      onComplete()
      return
    }

    const sr: SpeechRound = {
      speakers,
      currentIndex: 0,
      type,
      timePerSpeaker,
      onComplete,
    }

    activeSpeechRounds.set(room.code, sr)
    this.startNextSpeaker(room)
  },

  startNextSpeaker(room: Room) {
    const sr = activeSpeechRounds.get(room.code)
    if (!sr) return

    if (sr.currentIndex >= sr.speakers.length) {
      activeSpeechRounds.delete(room.code)
      sr.onComplete()
      return
    }

    const speakerId = sr.speakers[sr.currentIndex]

    broadcast(room.code, {
      type: 'SPEECH_PHASE',
      payload: {
        phase: sr.type,
        speakerId,
        timeLimit: sr.timePerSpeaker,
        speakerIndex: sr.currentIndex + 1,
        totalSpeakers: sr.speakers.length,
      },
    })

    timerManager.start(
      room.code,
      sr.timePerSpeaker,
      (remaining) => {
        broadcast(room.code, { type: 'TIMER_TICK', payload: { secondsRemaining: remaining } })
      },
      () => {
        this.endCurrentSpeech(room)
      },
    )
  },

  endCurrentSpeech(room: Room) {
    const sr = activeSpeechRounds.get(room.code)
    if (!sr) return

    const speakerId = sr.speakers[sr.currentIndex]
    broadcast(room.code, { type: 'SPEECH_ENDED', payload: { speakerId } })

    sr.currentIndex++
    this.startNextSpeaker(room)
  },

  skipCurrent(room: Room) {
    timerManager.clear(room.code)
    this.endCurrentSpeech(room)
  },

  isActive(roomCode: string): boolean {
    return activeSpeechRounds.has(roomCode)
  },

  clear(roomCode: string) {
    activeSpeechRounds.delete(roomCode)
    timerManager.clear(roomCode)
  },
}
