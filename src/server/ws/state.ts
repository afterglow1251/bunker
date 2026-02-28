import type { ServerWebSocket } from 'bun'

// WebSocket → clientId
export const wsToClientId = new Map<ServerWebSocket<any>, string>()

// clientId → roomCode
export const clientToRoom = new Map<string, string>()

// clientId → disconnect timer
export const pendingDisconnects = new Map<string, ReturnType<typeof setTimeout>>()
