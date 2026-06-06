import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import portalRoutes from './routes/portal.js'

export function createApp() {
  const app = express()

  // When CORS_ORIGINS contains "*", reflect whatever origin called us (a literal
  // "*" string in a list never matches a real origin, and a wildcard can't be
  // combined with credentials). Otherwise allow only the configured origins.
  const allowAllOrigins = env.CORS_ORIGINS.includes('*')

  app.use(
    cors({
      origin: allowAllOrigins ? true : env.CORS_ORIGINS,
      credentials: true,
    }),
  )
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', authProvider: env.AUTH_PROVIDER, time: new Date().toISOString() })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api', portalRoutes)

  app.use((_req, res) => {
    res.status(404).json({ message: 'Not found' })
  })

  app.use(errorHandler)

  return app
}
