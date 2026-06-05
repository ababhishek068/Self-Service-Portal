import { createApp } from '../dist/app.js'

/**
 * Vercel serverless entry point.
 *
 * This file stays as plain JavaScript because it imports the compiled backend
 * from `dist/`; TypeScript would otherwise require declaration files for that
 * generated output during Vercel's function analysis.
 */
export default createApp()
