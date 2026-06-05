import { createApp } from '../dist/app.js'

/**
 * Vercel serverless entry point.
 *
 * On Vercel there is no long-running `app.listen()` — instead Vercel invokes
 * this default export for every incoming request. An Express app is itself a
 * `(req, res)` handler, so exporting it is all that's needed.
 *
 * We import the COMPILED app from `../dist` (produced by `npm run build`) so the
 * function bundle contains plain JS with resolvable imports.
 */
export default createApp()
