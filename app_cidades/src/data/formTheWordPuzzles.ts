import type { ActiveMindPlayDifficulty } from '../types/activeMind'
import type { FormTheWordSession, FormTheWordWordEntry } from '../types/formTheWord'
import {
  isFormTheWordAnswerCorrect,
  normalizeWordAnswer,
  shuffleChunks,
  splitWordIntoScrambleChunks,
} from '../utils/formTheWordChunks'

type RawFormTheWordEntry =
  | string
  | {
      palavra?: string
      dica?: string
      word?: string
      hint?: string
    }

const FORM_THE_WORD_LISTS: Record<ActiveMindPlayDifficulty, RawFormTheWordEntry[]> = {
  facil: require('../../assets/palavras-faceis.json'),
  medio: require('../../assets/palavras-medias.json'),
  dificil: require('../../assets/palavras-dificeis.json'),
}

function capitalizeWord(word: string): string {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function buildPuzzleId(difficulty: ActiveMindPlayDifficulty, word: string): string {
  return `${difficulty}-${normalizeWordAnswer(word)}`
}

function scrambleChunks(chunks: readonly string[]): string[] {
  if (chunks.length <= 1) return [...chunks]

  let scrambled = shuffleChunks(chunks)
  let guard = 0

  while (scrambled.join('') === chunks.join('') && guard < 12) {
    scrambled = shuffleChunks(chunks)
    guard += 1
  }

  return scrambled
}

function parseFormTheWordEntry(entry: RawFormTheWordEntry): FormTheWordWordEntry | null {
  if (typeof entry === 'string') {
    const word = entry.trim()
    return word ? { word, hint: '' } : null
  }

  const word = String(entry.palavra ?? entry.word ?? '').trim()
  if (!word) return null

  const hint = String(entry.dica ?? entry.hint ?? '').trim()
  return { word, hint }
}

function getWordEntries(difficulty: ActiveMindPlayDifficulty): FormTheWordWordEntry[] {
  const raw = FORM_THE_WORD_LISTS[difficulty] ?? []
  const seen = new Set<string>()
  const entries: FormTheWordWordEntry[] = []

  for (const item of raw) {
    const parsed = parseFormTheWordEntry(item)
    if (!parsed) continue

    const key = normalizeWordAnswer(parsed.word)
    if (seen.has(key)) continue

    seen.add(key)
    entries.push(parsed)
  }

  return entries
}

function pickRandomEntry(difficulty: ActiveMindPlayDifficulty, excludeId?: string): FormTheWordWordEntry {
  const entries = getWordEntries(difficulty)
  const candidates = excludeId
    ? entries.filter((entry) => buildPuzzleId(difficulty, entry.word) !== excludeId)
    : entries

  const pool = candidates.length > 0 ? candidates : entries
  const index = Math.floor(Math.random() * pool.length)
  return pool[index]
}

export function createFormTheWordSession(
  difficulty: ActiveMindPlayDifficulty,
  excludeId?: string,
): FormTheWordSession {
  const entry = pickRandomEntry(difficulty, excludeId)
  const displayWord = capitalizeWord(entry.word)
  const chunks = splitWordIntoScrambleChunks(displayWord)

  return {
    puzzleId: buildPuzzleId(difficulty, displayWord),
    difficulty,
    word: displayWord,
    hint: entry.hint,
    chunks,
    scrambled: scrambleChunks(chunks),
    answer: [],
    usedPoolIndexes: new Set<number>(),
  }
}

export function getFormTheWordTargetChunks(session: FormTheWordSession): string[] {
  return [...session.chunks]
}

export function canAddFormTheWordChunk(session: FormTheWordSession, poolIndex: number): boolean {
  if (session.usedPoolIndexes.has(poolIndex)) return false
  return session.answer.length < session.chunks.length
}

export function addFormTheWordChunk(session: FormTheWordSession, poolIndex: number): FormTheWordSession {
  if (!canAddFormTheWordChunk(session, poolIndex)) return session

  const nextUsed = new Set(session.usedPoolIndexes)
  nextUsed.add(poolIndex)

  return {
    ...session,
    answer: [
      ...session.answer,
      {
        poolIndex,
        chunk: session.scrambled[poolIndex],
      },
    ],
    usedPoolIndexes: nextUsed,
  }
}

export function removeLastFormTheWordChunk(session: FormTheWordSession): FormTheWordSession {
  if (session.answer.length === 0) return session

  const nextAnswer = session.answer.slice(0, -1)
  const nextUsed = new Set<number>()
  for (const slot of nextAnswer) {
    nextUsed.add(slot.poolIndex)
  }

  return {
    ...session,
    answer: nextAnswer,
    usedPoolIndexes: nextUsed,
  }
}

export function isFormTheWordAnswerComplete(session: FormTheWordSession): boolean {
  return session.answer.length === session.chunks.length
}

export function isFormTheWordSolved(session: FormTheWordSession): boolean {
  if (!isFormTheWordAnswerComplete(session)) return false
  return isFormTheWordAnswerCorrect(
    session.word,
    session.answer.map((slot) => slot.chunk),
  )
}

export function revealNextFormTheWordChunk(session: FormTheWordSession): FormTheWordSession {
  const nextIndex = session.answer.length
  if (nextIndex >= session.chunks.length) return session

  const targetChunk = session.chunks[nextIndex]
  const poolIndex = session.scrambled.findIndex(
    (chunk, index) => !session.usedPoolIndexes.has(index) && chunk === targetChunk,
  )

  if (poolIndex === -1) return session
  return addFormTheWordChunk(session, poolIndex)
}

export function revealAllFormTheWordChunks(session: FormTheWordSession): FormTheWordSession {
  let nextSession = session

  while (nextSession.answer.length < session.chunks.length) {
    const previousLength = nextSession.answer.length
    nextSession = revealNextFormTheWordChunk(nextSession)
    if (nextSession.answer.length === previousLength) break
  }

  return nextSession
}

export function countRevealableFormTheWordChunks(session: FormTheWordSession): number {
  return Math.max(0, session.chunks.length - session.answer.length)
}

export function hasRevealableFormTheWordChunks(session: FormTheWordSession): boolean {
  return countRevealableFormTheWordChunks(session) > 0
}
