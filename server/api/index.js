/** Cached Express app — created once per serverless instance. */
let appPromise = null

function getApp() {
  if (!appPromise) {
    appPromise = import('../dist/app.js')
      .then((mod) => mod.createApp())
      .catch((err) => {
        appPromise = null
        throw err
      })
  }
  return appPromise
}

/**
 * Vercel serverless entry point.
 *
 * Express apps are valid `(req, res)` handlers. We lazy-load the compiled app
 * from `dist/` so build output is ready and startup errors return a readable
 * JSON response instead of a blank FUNCTION_INVOCATION_FAILED page.
 */
export default async function handler(req, res) {
  try {
    const app = await getApp()
    return app(req, res)
  } catch (err) {
    console.error('[ssp-server] failed to start:', err)
    res.status(500).json({
      message: 'Server failed to start',
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
