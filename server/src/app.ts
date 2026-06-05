import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  )
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', authProvider: env.AUTH_PROVIDER, time: new Date().toISOString() })
  })

  app.use('/api/auth', authRoutes)

  app.use((_req, res) => {
    res.status(404).json({ message: 'Not found' })
  })

  app.use(errorHandler)

  return app
}
