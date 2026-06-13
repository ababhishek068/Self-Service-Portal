import { createApp } from './app.js'
import { env } from './config/env.js'

const app = createApp()

app.listen(env.PORT, env.HOST, () => {
  console.log(`[ssp-server] listening on http://${env.HOST}:${env.PORT}`)
  console.log(`[ssp-server] auth provider: ${env.AUTH_PROVIDER}`)
  console.log(`[ssp-server] allowed origins: ${env.CORS_ORIGINS.join(', ')}`)
})
