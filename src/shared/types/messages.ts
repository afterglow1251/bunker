import type { TraitType, ActionCard } from './cards'
import type { Player, Room, RoomSettings, GamePhase, GameOverData } from './game'

// Client → Server
export type ClientMessage =
  | { type: 'JOIN_ROOM'; payload: { roomCode: string; nickname: string; clientId: string } }
  | { type: 'START_GAME'; payload: Record<string, never> }
  | { type: 'REVEAL_TRAIT'; payload: { traitType: TraitType } }
  | { type: 'CAST_VOTE'; payload: { targetPlayerId: string } }
  | { type: 'CAST_VOTE_PASS'; payload: Record<string, never> }
  | { type: 'USE_ACTION_CARD'; payload: { cardId: string; targetPlayerId?: string; traitType?: TraitType } }
  | { type: 'KICK_PLAYER'; payload: { playerId: string } }
  | { type: 'UPDATE_SETTINGS'; payload: { settings: Partial<RoomSettings> } }
  | { type: 'SKIP_SPEECH'; payload: Record<string, never> }
  | { type: 'TRANSFER_HOST'; payload: { newHostId: string } }

// Server → Client
export type ServerMessage =
  | { type: 'JOINED'; payload: { player: Player; room: ClientRoom } }
  | { type: 'PLAYER_JOINED'; payload: { player: PublicPlayer } }
  | { type: 'PLAYER_LEFT'; payload: { playerId: string } }
  | { type: 'GAME_STARTED'; payload: { catastrophe: string; bunkerDescription: string; yourTraits?: Player['traits']; yourActionCard?: ActionCard; playerOrder: string[]; allPlayersData?: Array<{ id: string; nickname: string; traits: Player['traits']; actionCard: ActionCard }> } }
  | { type: 'ROUND_STARTED'; payload: { roundNumber: number; currentPlayerId: string; traitsToReveal: number } }
  | { type: 'TRAIT_REVEALED'; payload: { playerId: string; traitType: TraitType; value: string | number } }
  | { type: 'DISCUSSION_PHASE'; payload: { timeLimit: number } }
  | { type: 'VOTING_PHASE'; payload: { timeLimit: number; candidates?: string[] } }
  | { type: 'VOTE_UPDATE'; payload: { votes: Record<string, number> } }
  | { type: 'PLAYER_ELIMINATED'; payload: { playerId: string; allTraits: Player['traits']; actionCard: ActionCard; reason?: 'supermajority' | 'vote' | 'tie' } }
  | { type: 'TURN_CHANGED'; payload: { currentPlayerId: string } }
  | { type: 'ACTION_CARD_USED'; payload: { playerId: string; card: ActionCard; result?: ActionCardResult } }
  | { type: 'GAME_OVER'; payload: GameOverData }
  | { type: 'TIMER_TICK'; payload: { secondsRemaining: number } }
  | { type: 'SETTINGS_UPDATED'; payload: { settings: RoomSettings } }
  | { type: 'SPEECH_PHASE'; payload: {
      phase: 'accusation' | 'justification' | 'farewell'
      speakerId: string; timeLimit: number
      speakerIndex: number; totalSpeakers: number
    }}
  | { type: 'SPEECH_ENDED'; payload: { speakerId: string } }
  | { type: 'VOTE_PASS_RESULT'; payload: { passed: boolean } }
  | { type: 'ERROR'; payload: { message: string } }
  | { type: 'HOST_CHANGED'; payload: { newHostId: string } }
  | { type: 'PLAYER_RECONNECTED'; payload: { playerId: string } }
  | { type: 'PLAYER_DISCONNECTED'; payload: { playerId: string } }

export interface PublicPlayer {
  id: string
  nickname: string
  isHost: boolean
  isAlive: boolean
  isConnected: boolean
  revealedTraits: Record<string, string | number>
}

export interface ClientRoom {
  code: string
  hostId: string
  players: PublicPlayer[]
  settings: RoomSettings
  phase: GamePhase
  catastrophe: string | null
  bunkerDescription: string | null
  currentRound: number
  currentTurnPlayerId: string | null
  votes: Record<string, number>
  revoteTargets: string[] | null
  eliminatedIds: string[]
  traitsToRevealThisRound: number
  pendingDoubleElimination: boolean
}

export interface ActionCardResult {
  type: string
  message: string
  revealedTrait?: { playerId: string; traitType: TraitType; value: string | number }
  newTrait?: { traitType: TraitType; value: string | number }
}
