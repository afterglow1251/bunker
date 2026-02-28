import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
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

// Serve static files + SPA fallback in production
if (hasClientBuild) {
  const indexHtml = join(clientDir, 'index.html')

  app.get('*', ({ path }) => {
    // Try to serve the static file first
    const filePath = join(clientDir, path)
    if (path !== '/' && existsSync(filePath)) {
      return Bun.file(filePath)
    }
    // SPA fallback — return index.html for all other routes
    return Bun.file(indexHtml)
  })
}

app.listen(config.port)

console.log(`[Bunker] Server running on http://localhost:${config.port}`)
if (hasClientBuild) {
  console.log(`[Bunker] Serving static files from ${clientDir}`)
}
