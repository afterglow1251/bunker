import type { Room, Player, RoomSettings } from '../../shared'
import { MIN_PLAYERS, MAX_PLAYERS, DEFAULT_TIMERS } from '../../shared'
import { generateRoomCode } from '../utils/room-code'
import { nanoid } from 'nanoid'

const rooms = new Map<string, Room>()

// playerId -> roomCode
const playerRooms = new Map<string, string>()

// clientId -> playerId (for reconnection)
const clientIdToPlayerId = new Map<string, string>()

export const roomManager = {
  createRoom(): { room: Room } {
    let code: string
    do {
      code = generateRoomCode()
    } while (rooms.has(code))

    const room: Room = {
      code,
      hostId: '',
      players: [],
      settings: {
        discussionTime: DEFAULT_TIMERS.discussion,
        votingTime: DEFAULT_TIMERS.voting,
      },
      phase: 'lobby',
      catastrophe: null,
      bunkerDescription: null,
      currentRound: 0,
      currentTurnPlayerId: null,
      votes: {},
      revoteTargets: null,
      eliminatedIds: [],
      survivorCount: 0,
      initialPlayerCount: 0,
      traitsToRevealThisRound: 1,
      turnOrderReversed: false,
      justifiedThisRound: [],
      pendingDoubleElimination: false,
      votePassUsed: false,
      eliminationsThisRound: 0,
      eliminationsRequiredThisRound: 1,
      revoteCount: 0,
    }

    rooms.set(code, room)
    return { room }
  },

  joinRoom(roomCode: string, nickname: string, clientId: string): { room: Room; player: Player; reconnected: boolean } | null {
    const room = rooms.get(roomCode)
    if (!room) return null

    // Check if this clientId already has a player in this room (reconnection)
    const existingPlayerId = clientIdToPlayerId.get(clientId)
    if (existingPlayerId) {
      const existingPlayer = room.players.find(p => p.id === existingPlayerId)
      if (existingPlayer) {
        existingPlayer.isConnected = true
        return { room, player: existingPlayer, reconnected: true }
      }
    }

    // New player — only allowed in lobby
    if (room.phase !== 'lobby') return null
    if (room.players.length >= MAX_PLAYERS) return null

    const isFirst = room.players.length === 0

    const player: Player = {
      id: nanoid(12),
      nickname,
      isHost: isFirst,
      isAlive: true,
      isConnected: true,
      traits: { profession: '', age: 0, sex: '', health: '', hobby: '', phobia: '', trait: '', baggage: '' },
      revealedTraits: [],
      actionCard: { id: '', type: 'swap_trait', name: '', description: '', used: false },
      traitsRevealedThisRound: 0,
      isImmune: false,
      hasDoubleVote: false,
    }

    room.players.push(player)
    playerRooms.set(player.id, roomCode)
    clientIdToPlayerId.set(clientId, player.id)

    if (isFirst) {
      room.hostId = player.id
    }

    return { room, player, reconnected: false }
  },

  getRoom(code: string): Room | undefined {
    return rooms.get(code)
  },

  getRoomByPlayerId(playerId: string): Room | undefined {
    const code = playerRooms.get(playerId)
    if (!code) return undefined
    return rooms.get(code)
  },

  getPlayer(playerId: string): Player | undefined {
    const room = this.getRoomByPlayerId(playerId)
    if (!room) return undefined
    return room.players.find(p => p.id === playerId)
  },

  removePlayer(playerId: string): { room: Room; wasHost: boolean } | null {
    const code = playerRooms.get(playerId)
    if (!code) return null
    const room = rooms.get(code)
    if (!room) return null

    const playerIndex = room.players.findIndex(p => p.id === playerId)
    if (playerIndex === -1) return null

    const wasHost = room.players[playerIndex].isHost
    room.players.splice(playerIndex, 1)
    room.eliminatedIds = room.eliminatedIds.filter(id => id !== playerId)
    playerRooms.delete(playerId)

    // Clean up clientId mapping
    for (const [cid, pid] of clientIdToPlayerId) {
      if (pid === playerId) {
        clientIdToPlayerId.delete(cid)
        break
      }
    }

    if (room.players.length === 0) {
      rooms.delete(code)
      return null
    }

    // Host migration
    if (wasHost && room.players.length > 0) {
      room.players[0].isHost = true
      room.hostId = room.players[0].id
    }

    return { room, wasHost }
  },

  disconnectPlayer(playerId: string): Room | null {
    const room = this.getRoomByPlayerId(playerId)
    if (!room) return null
    const player = room.players.find(p => p.id === playerId)
    if (!player) return null
    player.isConnected = false
    return room
  },

  reconnectPlayer(playerId: string): Room | null {
    const room = this.getRoomByPlayerId(playerId)
    if (!room) return null
    const player = room.players.find(p => p.id === playerId)
    if (!player) return null
    player.isConnected = true
    return room
  },

  kickPlayer(roomCode: string, hostId: string, targetId: string): boolean {
    const room = rooms.get(roomCode)
    if (!room) return false
    if (room.hostId !== hostId) return false
    if (room.phase !== 'lobby') return false

    const targetIndex = room.players.findIndex(p => p.id === targetId)
    if (targetIndex === -1) return false
    if (room.players[targetIndex].isHost) return false

    room.players.splice(targetIndex, 1)
    playerRooms.delete(targetId)

    // Clean up clientId mapping
    for (const [cid, pid] of clientIdToPlayerId) {
      if (pid === targetId) {
        clientIdToPlayerId.delete(cid)
        break
      }
    }

    return true
  },

  updateSettings(roomCode: string, hostId: string, settings: Partial<RoomSettings>): boolean {
    const room = rooms.get(roomCode)
    if (!room) return false
    if (room.hostId !== hostId) return false
    if (room.phase !== 'lobby') return false

    if (settings.discussionTime !== undefined) {
      room.settings.discussionTime = Math.max(30, Math.min(300, settings.discussionTime))
    }
    if (settings.votingTime !== undefined) {
      room.settings.votingTime = Math.max(15, Math.min(120, settings.votingTime))
    }

    return true
  },

  roomExists(code: string): boolean {
    return rooms.has(code)
  },

  getRoomPublicInfo(code: string) {
    const room = rooms.get(code)
    if (!room) return null
    return {
      code: room.code,
      playerCount: room.players.length,
      maxPlayers: MAX_PLAYERS,
      phase: room.phase,
    }
  },

  getPlayerIdByClientId(clientId: string): string | undefined {
    return clientIdToPlayerId.get(clientId)
  },
}
