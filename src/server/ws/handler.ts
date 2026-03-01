import { Elysia } from 'elysia'
import type { ClientMessage, PublicPlayer, ClientRoom } from '../../shared'
import { roomManager } from '../game/room-manager'
import { gameEngine } from '../game/game-engine'
import { wsConnections } from './broadcast'
import { wsToClientId, clientToRoom, pendingDisconnects } from './state'
import type { Room, Player } from '../../shared'

function toPublicPlayer(player: Player): PublicPlayer {
  const revealedTraits: Record<string, string | number> = {}
  for (const traitType of player.revealedTraits) {
    revealedTraits[traitType] = traitType === 'age' ? player.traits.age : player.traits[traitType]
  }
  return {
    id: player.id,
    nickname: player.nickname,
    isHost: player.isHost,
    isAlive: player.isAlive,
    isConnected: player.isConnected,
    revealedTraits,
  }
}

function toClientRoom(room: Room): ClientRoom {
  const voteCounts: Record<string, number> = {}
  for (const targetId of Object.values(room.votes)) {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1
  }

  return {
    code: room.code,
    hostId: room.hostId,
    players: room.players.map(toPublicPlayer),
    settings: room.settings,
    phase: room.phase,
    catastrophe: room.catastrophe,
    bunkerDescription: room.bunkerDescription,
    currentRound: room.currentRound,
    currentTurnPlayerId: room.currentTurnPlayerId,
    votes: voteCounts,
    revoteTargets: room.revoteTargets,
    eliminatedIds: room.eliminatedIds,
    traitsToRevealThisRound: room.traitsToRevealThisRound,
    pendingDoubleElimination: room.pendingDoubleElimination,
  }
}

// Initialize game engine callbacks
gameEngine.setBroadcast((roomCode, message, excludeId) => {
  wsConnections.broadcastToRoom(roomCode, message, excludeId)
})
gameEngine.setSend((playerId, message) => {
  wsConnections.sendTo(playerId, message)
})

export const wsHandler = new Elysia()
  .ws('/ws', {
    body: undefined as unknown as ClientMessage,
    open(ws) {
      // Client sends JOIN_ROOM as first message
    },
    message(ws, rawData) {
      let msg: ClientMessage
      try {
        msg = typeof rawData === 'string' ? JSON.parse(rawData) : rawData as ClientMessage
      } catch {
        ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Невірний формат повідомлення' } }))
        return
      }

      const data = ws.data as { playerId?: string; roomCode?: string; clientId?: string }

      switch (msg.type) {
        case 'JOIN_ROOM': {
          const { roomCode, nickname, clientId } = msg.payload
          if (!nickname || nickname.trim().length === 0) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Введіть нікнейм' } }))
            return
          }
          if (!roomCode) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Введіть код кімнати' } }))
            return
          }
          if (!clientId) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Відсутній clientId' } }))
            return
          }

          const result = roomManager.joinRoom(roomCode.toUpperCase(), nickname.trim(), clientId)
          if (!result) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Кімната не знайдена, повна або гра вже почалася' } }))
            return
          }

          data.playerId = result.player.id
          data.roomCode = result.room.code
          data.clientId = clientId

          // Store in state maps
          wsToClientId.set(ws.raw as any, clientId)
          clientToRoom.set(clientId, result.room.code)

          wsConnections.add(result.player.id, result.room.code, ws.raw as any)

          // Cancel pending disconnect timer if reconnecting
          if (pendingDisconnects.has(clientId)) {
            clearTimeout(pendingDisconnects.get(clientId)!)
            pendingDisconnects.delete(clientId)
          }

          if (result.reconnected) {
            // Send full state to reconnecting player
            ws.send(JSON.stringify({
              type: 'JOINED',
              payload: {
                player: result.player,
                room: toClientRoom(result.room),
              },
            }))

            // If host reconnects mid-game, send allPlayersData
            if (result.player.isHost && result.room.phase !== 'lobby') {
              const allPlayersData = result.room.players.map(p => ({
                id: p.id, nickname: p.nickname, traits: p.traits, actionCard: p.actionCard,
              }))
              ws.send(JSON.stringify({
                type: 'GAME_STARTED',
                payload: {
                  catastrophe: result.room.catastrophe ?? '',
                  bunkerDescription: result.room.bunkerDescription ?? '',
                  playerOrder: result.room.players.map(p => p.id),
                  allPlayersData,
                },
              }))
            }

            // Notify others of reconnection
            wsConnections.broadcastToRoom(result.room.code, {
              type: 'PLAYER_RECONNECTED',
              payload: { playerId: result.player.id },
            }, result.player.id)
          } else {
            // New player
            ws.send(JSON.stringify({
              type: 'JOINED',
              payload: {
                player: result.player,
                room: toClientRoom(result.room),
              },
            }))

            // Notify others
            wsConnections.broadcastToRoom(result.room.code, {
              type: 'PLAYER_JOINED',
              payload: { player: toPublicPlayer(result.player) },
            }, result.player.id)
          }
          break
        }

        case 'START_GAME': {
          if (!data.playerId || !data.roomCode) return
          const room = roomManager.getRoom(data.roomCode)
          if (!room) return
          if (room.hostId !== data.playerId) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Тільки хост може почати гру' } }))
            return
          }
          if (!gameEngine.startGame(room)) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Потрібно мінімум 4 гравці' } }))
          }
          break
        }

        case 'REVEAL_TRAIT': {
          if (!data.playerId || !data.roomCode) return
          const room = roomManager.getRoom(data.roomCode)
          if (!room) return
          if (!gameEngine.revealTrait(room, data.playerId, msg.payload.traitType)) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Не можна розкрити цю характеристику зараз' } }))
          }
          break
        }

        case 'CAST_VOTE': {
          if (!data.playerId || !data.roomCode) return
          const room = roomManager.getRoom(data.roomCode)
          if (!room) return
          if (!gameEngine.castVote(room, data.playerId, msg.payload.targetPlayerId)) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Не можна проголосувати' } }))
          }
          break
        }

        case 'CAST_VOTE_PASS': {
          if (!data.playerId || !data.roomCode) return
          const room = roomManager.getRoom(data.roomCode)
          if (!room) return
          if (!gameEngine.castVotePass(room, data.playerId)) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Не можна пропустити голосування' } }))
          }
          break
        }

        case 'SKIP_SPEECH': {
          if (!data.playerId || !data.roomCode) return
          const room = roomManager.getRoom(data.roomCode)
          if (!room) return
          if (!gameEngine.skipSpeech(room, data.playerId)) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Не можна пропустити промову' } }))
          }
          break
        }


        case 'USE_ACTION_CARD': {
          if (!data.playerId || !data.roomCode) return
          const room = roomManager.getRoom(data.roomCode)
          if (!room) return
          if (!gameEngine.useActionCard(room, data.playerId, msg.payload.cardId, msg.payload.targetPlayerId, msg.payload.traitType)) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Не можна використати спецкарту зараз' } }))
          }
          break
        }

        case 'KICK_PLAYER': {
          if (!data.playerId || !data.roomCode) return
          if (roomManager.kickPlayer(data.roomCode, data.playerId, msg.payload.playerId)) {
            wsConnections.broadcastToRoom(data.roomCode, {
              type: 'PLAYER_LEFT',
              payload: { playerId: msg.payload.playerId },
            })
            // Close the kicked player's connection
            const kickedWs = wsConnections.get(msg.payload.playerId)
            if (kickedWs) {
              kickedWs.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Вас вигнали з кімнати' } }))
              kickedWs.close()
            }
            wsConnections.remove(msg.payload.playerId, data.roomCode)
          }
          break
        }

        case 'TRANSFER_HOST': {
          if (!data.playerId || !data.roomCode) return
          if (roomManager.transferHost(data.roomCode, data.playerId, msg.payload.newHostId)) {
            wsConnections.broadcastToRoom(data.roomCode, {
              type: 'HOST_CHANGED',
              payload: { newHostId: msg.payload.newHostId },
            })
          }
          break
        }

        case 'UPDATE_SETTINGS': {
          if (!data.playerId || !data.roomCode) return
          if (roomManager.updateSettings(data.roomCode, data.playerId, msg.payload.settings)) {
            const room = roomManager.getRoom(data.roomCode)
            if (room) {
              wsConnections.broadcastToRoom(data.roomCode, {
                type: 'SETTINGS_UPDATED',
                payload: { settings: room.settings },
              })
            }
          }
          break
        }
      }
    },
    close(ws) {
      const data = ws.data as { playerId?: string; roomCode?: string; clientId?: string }
      if (!data.playerId || !data.roomCode) return

      const room = roomManager.getRoom(data.roomCode)
      if (!room) return

      const clientId = data.clientId
      const playerId = data.playerId
      const roomCode = data.roomCode

      // Remove WS from connections immediately
      wsConnections.remove(playerId, roomCode)
      if (clientId) {
        wsToClientId.delete(ws.raw as any)
      }

      // Mark player as disconnected
      roomManager.disconnectPlayer(playerId)

      // Determine grace period based on phase
      const gracePeriodMs = room.phase === 'lobby' ? 10_000 : 120_000

      // Notify others of disconnection
      wsConnections.broadcastToRoom(roomCode, {
        type: 'PLAYER_DISCONNECTED',
        payload: { playerId },
      })

      // Handle game-specific disconnect logic (skip turn, etc.)
      if (room.phase !== 'lobby') {
        gameEngine.handleDisconnect(room, playerId)
      }

      // Set grace period timer
      const disconnectKey = clientId || playerId
      const timer = setTimeout(() => {
        pendingDisconnects.delete(disconnectKey)
        const r = roomManager.getRoom(roomCode)
        if (!r) return
        const player = r.players.find(p => p.id === playerId)
        if (!player || player.isConnected) return

        if (r.phase === 'lobby') {
          // Remove from lobby after grace period
          const result = roomManager.removePlayer(playerId)
          if (result) {
            wsConnections.broadcastToRoom(roomCode, {
              type: 'PLAYER_LEFT',
              payload: { playerId },
            })
            if (result.wasHost) {
              wsConnections.broadcastToRoom(roomCode, {
                type: 'HOST_CHANGED',
                payload: { newHostId: result.room.hostId },
              })
            }
          }
        } else if (player.isAlive && !player.isHost) {
          // Auto-eliminate after grace period during game
          gameEngine.eliminatePlayer(r, playerId)
        }
      }, gracePeriodMs)

      pendingDisconnects.set(disconnectKey, timer)
    },
  })
