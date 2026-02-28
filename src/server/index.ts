import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'
import { config } from './config'
import { apiRoutes } from './routes/api'
import { wsHandler } from './ws/handler'
import { existsSync } from 'fs'
import { join } from 'path'

const clientDir = join(import.meta.dir, '../../dist/client')
const hasClientBuild = existsSync(clientDir)

const app = new Elysia()
  .use(cors())
  .use(apiRoutes)
  .use(wsHandler)

// Serve static files in production
if (hasClientBuild) {
  app.use(staticPlugin({ assets: clientDir, prefix: '/' }))

  // SPA fallback — serve index.html for non-API/non-WS routes
  app.get('*', () => Bun.file(join(clientDir, 'index.html')))
}

app.listen(config.port)

console.log(`[Bunker] Server running on http://localhost:${config.port}`)
if (hasClientBuild) {
  console.log(`[Bunker] Serving static files from ${clientDir}`)
}
