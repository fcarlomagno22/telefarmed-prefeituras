import type { ActiveMindPlayDifficulty } from '../types/activeMind'
import type { CalculationsEntry, CalculationsSession } from '../types/calculations'

type CalculationsBank = {
  calculos: CalculationsEntry[]
}

const calculationsBankCache: Partial<Record<ActiveMindPlayDifficulty, CalculationsBank>> = {}

/** Lazy require por dificuldade — evita carregar os 3 bancos (~2.2MB) de uma vez. */
function getCalculationsBank(difficulty: ActiveMindPlayDifficulty): CalculationsBank {
  const cached = calculationsBankCache[difficulty]
  if (cached) return cached

  let bank: CalculationsBank
  switch (difficulty) {
    case 'facil':
      bank = require('../../assets/calculos_faceis_telefarmed_5000.json')
      break
    case 'medio':
      bank = require('../../assets/calculos_medios_telefarmed_5000.json')
      break
    case 'dificil':
      bank = require('../../assets/calculos_dificeis_telefarmed_5000.json')
      break
    default: {
      const _exhaustive: never = difficulty
      throw new Error(`Dificuldade de cálculos inválida: ${_exhaustive}`)
    }
  }

  calculationsBankCache[difficulty] = bank
  return bank
}

export const MAX_CALCULATIONS_ANSWER_LENGTH = 6

function getCalculationsEntries(difficulty: ActiveMindPlayDifficulty): CalculationsEntry[] {
  return getCalculationsBank(difficulty).calculos ?? []
}

function pickRandomEntry(difficulty: ActiveMindPlayDifficulty, excludeId?: string): CalculationsEntry {
  const entries = getCalculationsEntries(difficulty)
  if (entries.length === 0) {
    throw new Error(`Nenhum cálculo encontrado para o nível ${difficulty}.`)
  }

  const pool = excludeId ? entries.filter((entry) => entry.id !== excludeId) : entries
  const source = pool.length > 0 ? pool : entries
  const index = Math.floor(Math.random() * source.length)
  return source[index]
}

export function createCalculationsSession(
  difficulty: ActiveMindPlayDifficulty,
  excludeId?: string,
): CalculationsSession {
  const entry = pickRandomEntry(difficulty, excludeId)

  return {
    puzzleId: entry.id,
    difficulty,
    pergunta: entry.pergunta,
    resposta: entry.resposta,
    tipo: entry.tipo,
    answer: '',
  }
}

export function appendCalculationsDigit(session: CalculationsSession, digit: number): CalculationsSession {
  if (session.answer.length >= MAX_CALCULATIONS_ANSWER_LENGTH) {
    return session
  }

  return {
    ...session,
    answer: `${session.answer}${digit}`,
  }
}

export function removeLastCalculationsDigit(session: CalculationsSession): CalculationsSession {
  if (!session.answer) return session

  return {
    ...session,
    answer: session.answer.slice(0, -1),
  }
}

export function clearCalculationsAnswer(session: CalculationsSession): CalculationsSession {
  return {
    ...session,
    answer: '',
  }
}

export function isCalculationsAnswerReady(session: CalculationsSession): boolean {
  return session.answer.length > 0
}

export function getCalculationsExpectedAnswerLength(session: CalculationsSession): number {
  return String(session.resposta).length
}

export function isCalculationsAnswerComplete(session: CalculationsSession): boolean {
  if (!isCalculationsAnswerReady(session)) return false
  return session.answer.length === getCalculationsExpectedAnswerLength(session)
}

export function isCalculationsCorrect(session: CalculationsSession): boolean {
  if (!isCalculationsAnswerReady(session)) return false
  return Number(session.answer) === session.resposta
}
