/**
 * "Our backend" authentication module (way #2).
 * Local user table + login logic live in this folder (see ./store).
 */
export { LocalAuthProvider, toAuthUser } from './localProvider.js'
export { userStore } from './store/index.js'
export type { UserRepository } from './store/userRepository.js'
