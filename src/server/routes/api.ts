import { Elysia } from 'elysia'
import { roomManager } from '../game/room-manager'

export const apiRoutes = new Elysia({ prefix: '/api' })
  .post('/rooms', () => {
    const { room } = roomManager.createRoom()
    return { roomCode: room.code }
  })
  .get('/rooms/:code', ({ params }) => {
    const info = roomManager.getRoomPublicInfo(params.code.toUpperCase())
    if (!info) {
      return { error: 'Кімната не знайдена' }
    }
    return info
  })
