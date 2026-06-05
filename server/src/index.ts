import { createApp } from './app.js'
import { env } from './config/env.js'

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`[ssp-server] listening on http://localhost:${env.PORT}`)
  console.log(`[ssp-server] auth provider: ${env.AUTH_PROVIDER}`)
  console.log(`[ssp-server] allowed origins: ${env.CORS_ORIGINS.join(', ')}`)
})
