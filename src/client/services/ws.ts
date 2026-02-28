import type { ClientMessage, ServerMessage } from '../../shared'

type MessageHandler = (msg: ServerMessage) => void

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
const handlers = new Set<MessageHandler>()
let reconnectInfo: { roomCode: string; clientId: string; nickname: string } | null = null
let pendingMessages: ClientMessage[] = []

function doConnect(onOpen?: () => void) {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    if (ws.readyState === WebSocket.OPEN) {
      onOpen?.()
      flushPending()
    }
    return
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const url = `${protocol}//${window.location.host}/ws`
  ws = new WebSocket(url)

  ws.onopen = () => {
    onOpen?.()
    // Auto-rejoin if we have reconnect info
    if (reconnectInfo) {
      send({
        type: 'JOIN_ROOM',
        payload: {
          roomCode: reconnectInfo.roomCode,
          clientId: reconnectInfo.clientId,
          nickname: reconnectInfo.nickname,
        },
      })
    }
    flushPending()
  }

  ws.onmessage = (event) => {
    try {
      const msg: ServerMessage = JSON.parse(event.data)
      for (const handler of handlers) {
        handler(msg)
      }
    } catch {}
  }

  ws.onclose = () => {
    ws = null
    reconnectTimer = setTimeout(() => {
      doConnect()
    }, 2000)
  }

  ws.onerror = () => {
    ws?.close()
  }
}

function flushPending() {
  for (const msg of pendingMessages) {
    ws?.send(JSON.stringify(msg))
  }
  pendingMessages = []
}

export function connect(onOpen?: () => void) {
  doConnect(onOpen)
}

export function send(msg: ClientMessage) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  } else {
    pendingMessages.push(msg)
  }
}

export function addMessageHandler(handler: MessageHandler) {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

export function setReconnectInfo(info: { roomCode: string; clientId: string; nickname: string } | null) {
  reconnectInfo = info
}

export function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  pendingMessages = []
  reconnectInfo = null
  ws?.close()
  ws = null
}

export function isConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN
}
