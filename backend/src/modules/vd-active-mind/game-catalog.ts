import { VdActiveMindError } from './errors.js'

/**
 * Allowlist de jogos do Ativa Mente — espelha ACTIVE_MIND_GAMES em
 * app_cidades/src/config/activeMindGames.ts (campo `id`).
 */
export const ACTIVE_MIND_GAME_IDS = [
  'form-the-word',
  'calculations',
  'logic-sequence',
  'sudoku',
  'crosswords',
  'word-search',
] as const

export type ActiveMindGameId = (typeof ACTIVE_MIND_GAME_IDS)[number]

const GAME_ID_SET = new Set<string>(ACTIVE_MIND_GAME_IDS)

export function isValidActiveMindGameId(id: string): id is ActiveMindGameId {
  return GAME_ID_SET.has(id)
}

export function assertActiveMindGameId(gameId: string): ActiveMindGameId {
  const normalized = gameId.trim()
  if (!isValidActiveMindGameId(normalized)) {
    throw new VdActiveMindError(
      'Jogo inválido ou não disponível no catálogo.',
      'INVALID_DATA',
      400,
    )
  }

  return normalized
}
