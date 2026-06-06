/**
 * Public surface of the data layer.
 *
 * - `client/`   — raw HTTP clients (Laravel ESS API + legacy direct-BC OData)
 * - `mock/`     — legacy dev fixtures (not used by the portal UI)
 * - `endpoints/`— typed, domain-grouped API functions used throughout the app
 *
 * Prefer importing from `@/api/endpoints/<domain>` so call sites stay
 * narrowly-scoped and tree-shaking works well.
 */
export * from './client'
export * from './endpoints'
