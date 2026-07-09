import type { ActiveMindPlayDifficulty } from '../types/activeMind'
import type {
  LogicSequenceItem,
  LogicSequenceItemType,
  LogicSequenceSession,
} from '../types/logicSequence'

type LogicSequenceEntry = {
  id: string
  nivel: string
  tipo: LogicSequenceItemType
  subtipo: string
  enunciado: string
  sequencia: LogicSequenceItem[]
  resposta: LogicSequenceItem
  opcoes: LogicSequenceItem[]
  regra: string
}

type LogicSequenceBank = {
  sequencias: LogicSequenceEntry[]
}

const logicSequenceBankCache: Partial<Record<ActiveMindPlayDifficulty, LogicSequenceBank>> = {}

/** Lazy require por dificuldade — evita carregar os 3 bancos (~7MB) de uma vez. */
function getLogicSequenceBank(difficulty: ActiveMindPlayDifficulty): LogicSequenceBank {
  const cached = logicSequenceBankCache[difficulty]
  if (cached) return cached

  let bank: LogicSequenceBank
  switch (difficulty) {
    case 'facil':
      bank = require('../../assets/sequencia_logica_facil_telefarmed_5000.json')
      break
    case 'medio':
      bank = require('../../assets/sequencia_logica_medio_telefarmed_5000.json')
      break
    case 'dificil':
      bank = require('../../assets/sequencia_logica_dificil_telefarmed_5000.json')
      break
    default: {
      const _exhaustive: never = difficulty
      throw new Error(`Dificuldade de sequência lógica inválida: ${_exhaustive}`)
    }
  }

  logicSequenceBankCache[difficulty] = bank
  return bank
}

function getLogicSequenceEntries(difficulty: ActiveMindPlayDifficulty): LogicSequenceEntry[] {
  return getLogicSequenceBank(difficulty).sequencias ?? []
}

function shuffleOptions<T>(items: readonly T[]): T[] {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swapIndex]!
    copy[swapIndex] = current!
  }

  return copy
}

function pickRandomEntry(difficulty: ActiveMindPlayDifficulty, excludeId?: string): LogicSequenceEntry {
  const entries = getLogicSequenceEntries(difficulty)
  if (entries.length === 0) {
    throw new Error(`Nenhuma sequência encontrada para o nível ${difficulty}.`)
  }

  const pool = excludeId ? entries.filter((entry) => entry.id !== excludeId) : entries
  const source = pool.length > 0 ? pool : entries
  const index = Math.floor(Math.random() * source.length)
  return source[index]
}

export function normalizeLogicSequenceItem(item: LogicSequenceItem): string {
  return String(item)
}

export function areLogicSequenceItemsEqual(
  left: LogicSequenceItem,
  right: LogicSequenceItem,
): boolean {
  return normalizeLogicSequenceItem(left) === normalizeLogicSequenceItem(right)
}

export function createLogicSequenceSession(
  difficulty: ActiveMindPlayDifficulty,
  excludeId?: string,
): LogicSequenceSession {
  const entry = pickRandomEntry(difficulty, excludeId)

  return {
    puzzleId: entry.id,
    difficulty,
    enunciado: entry.enunciado,
    tipo: entry.tipo,
    sequencia: [...entry.sequencia],
    resposta: entry.resposta,
    opcoes: shuffleOptions(entry.opcoes),
    selectedOption: null,
  }
}

export function setLogicSequenceSelectedOption(
  session: LogicSequenceSession,
  option: LogicSequenceItem,
): LogicSequenceSession {
  return {
    ...session,
    selectedOption: option,
  }
}

export function clearLogicSequenceSelectedOption(session: LogicSequenceSession): LogicSequenceSession {
  return {
    ...session,
    selectedOption: null,
  }
}

export function isLogicSequenceAnswerReady(session: LogicSequenceSession): boolean {
  return session.selectedOption != null
}

export function isLogicSequenceCorrect(session: LogicSequenceSession): boolean {
  if (session.selectedOption == null) return false
  return areLogicSequenceItemsEqual(session.selectedOption, session.resposta)
}

export function getLogicSequenceTypeLabel(tipo: LogicSequenceItemType): string {
  if (tipo === 'numero') return 'Números'
  if (tipo === 'forma') return 'Formas'
  return 'Símbolos'
}
