import type { PlayerTraits, ActionCard, TraitType } from './cards'

export type GamePhase =
  | 'lobby'
  | 'catastrophe_reveal'
  | 'round_start'
  | 'trait_reveal'
  | 'discussion'
  | 'accusation_speech'
  | 'voting'
  | 'vote_resolution'
  | 'justification_speech'
  | 'elimination'
  | 'farewell_speech'
  | 'game_over'

export interface Player {
  id: string
  nickname: string
  isHost: boolean
  isAlive: boolean
  isConnected: boolean
  traits: PlayerTraits
  revealedTraits: TraitType[]
  actionCard: ActionCard
  traitsRevealedThisRound: number
  isImmune: boolean
  hasDoubleVote: boolean
}

export interface RoomSettings {
  discussionTime: number
  votingTime: number
}

export interface Room {
  code: string
  hostId: string
  players: Player[]
  settings: RoomSettings
  phase: GamePhase
  catastrophe: string | null
  bunkerDescription: string | null
  currentRound: number
  currentTurnPlayerId: string | null
  votes: Record<string, string>  // voterId -> targetId
  revoteTargets: string[] | null
  eliminatedIds: string[]
  survivorCount: number
  initialPlayerCount: number
  traitsToRevealThisRound: number
  turnOrderReversed: boolean
  justifiedThisRound: string[]
  pendingDoubleElimination: boolean
  votePassUsed: boolean
  eliminationsThisRound: number
  eliminationsRequiredThisRound: number
  revoteCount: number
}

export interface GameOverData {
  survivors: Player[]
  eliminated: Player[]
  catastrophe: string
  bunkerDescription: string
}
