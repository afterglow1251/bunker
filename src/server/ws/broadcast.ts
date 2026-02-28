import type { ServerMessage } from '../../shared'
import type { ServerWebSocket } from 'bun'

// playerId -> WebSocket
const connections = new Map<string, ServerWebSocket<{ playerId: string; roomCode: string }>>()

// roomCode -> Set<playerId>
const roomMembers = new Map<string, Set<string>>()

export const wsConnections = {
  add(playerId: string, roomCode: string, ws: ServerWebSocket<{ playerId: string; roomCode: string }>) {
    connections.set(playerId, ws)
    if (!roomMembers.has(roomCode)) {
      roomMembers.set(roomCode, new Set())
    }
    roomMembers.get(roomCode)!.add(playerId)
  },

  remove(playerId: string, roomCode: string) {
    connections.delete(playerId)
    roomMembers.get(roomCode)?.delete(playerId)
    if (roomMembers.get(roomCode)?.size === 0) {
      roomMembers.delete(roomCode)
    }
  },

  get(playerId: string) {
    return connections.get(playerId)
  },

  broadcastToRoom(roomCode: string, message: ServerMessage, excludePlayerId?: string) {
    const members = roomMembers.get(roomCode)
    if (!members) return

    const data = JSON.stringify(message)
    for (const playerId of members) {
      if (playerId === excludePlayerId) continue
      const ws = connections.get(playerId)
      if (ws) {
        try { ws.send(data) } catch {}
      }
    }
  },

  sendTo(playerId: string, message: ServerMessage) {
    const ws = connections.get(playerId)
    if (ws) {
      try { ws.send(JSON.stringify(message)) } catch {}
    }
  },
}
