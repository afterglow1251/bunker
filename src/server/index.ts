import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { config } from './config'
import { apiRoutes } from './routes/api'
import { wsHandler } from './ws/handler'

const app = new Elysia()
  .use(cors())
  .use(apiRoutes)
  .use(wsHandler)
  .listen(config.port)

console.log(`[Bunker] Server running on http://localhost:${config.port}`)
