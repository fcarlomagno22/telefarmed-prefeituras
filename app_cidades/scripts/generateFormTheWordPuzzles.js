#!/usr/bin/env node
/**
 * Generates Forme a Palavra puzzle banks (1000 per difficulty).
 * Run: node app_cidades/scripts/generateFormTheWordPuzzles.js
 */

const fs = require('fs')
const path = require('path')

const OUTPUT_DIR = path.join(__dirname, '../content/activeMind/formTheWord')
const PUZZLES_PER_DIFFICULTY = 1000

const { WORD_ENTRIES } = require('./data/formTheWordSource')

function splitWordIntoScrambleChunks(word) {
  if (!word) return []
  return Array.from(word)
}

function shuffle(values) {
  const array = [...values]
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[array[index], array[swapIndex]] = [array[swapIndex], array[index]]
  }
  return array
}

function scrambleChunks(chunks) {
  let scrambled = shuffle(chunks)
  let guard = 0

  while (scrambled.join('') === chunks.join('') && guard < 12) {
    scrambled = shuffle(chunks)
    guard += 1
  }

  return scrambled
}

function classifyDifficulty(word) {
  const length = [...word].length
  const hasAccent = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(word)

  if (length <= 4) return 'facil'
  if (length <= 5 && !hasAccent) return 'facil'
  if (length <= 7 && !hasAccent) return 'medio'
  if (length <= 8 && hasAccent && length <= 7) return 'medio'
  if (length <= 8) return 'medio'
  return 'dificil'
}

function capitalizeWord(word) {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function buildPuzzlePools() {
  const pools = {
    facil: [],
    medio: [],
    dificil: [],
  }

  const seen = {
    facil: new Set(),
    medio: new Set(),
    dificil: new Set(),
  }

  for (const entry of WORD_ENTRIES) {
    const normalized = entry.word.trim().toLowerCase()
    if (!normalized || normalized.length < 3 || /\s/.test(normalized)) continue

    const difficulty = entry.difficulty ?? classifyDifficulty(normalized)
    if (!pools[difficulty]) continue
    if (seen[difficulty].has(normalized)) continue

    seen[difficulty].add(normalized)
    pools[difficulty].push({
      word: capitalizeWord(normalized),
      hint: entry.hint,
    })
  }

  return pools
}

function padPool(pool, difficulty, allEntries) {
  if (pool.length >= PUZZLES_PER_DIFFICULTY) {
    return pool.slice(0, PUZZLES_PER_DIFFICULTY)
  }

  const seen = new Set(pool.map((entry) => entry.word.toLowerCase()))
  const fallback = allEntries.filter((entry) => {
    const normalized = entry.word.trim().toLowerCase()
    const entryDifficulty = entry.difficulty ?? classifyDifficulty(normalized)
    return entryDifficulty === difficulty && !seen.has(normalized)
  })

  for (const entry of fallback) {
    if (pool.length >= PUZZLES_PER_DIFFICULTY) break
    const normalized = entry.word.trim().toLowerCase()
    if (seen.has(normalized)) continue
    seen.add(normalized)
    pool.push({
      word: capitalizeWord(normalized),
      hint: entry.hint,
    })
  }

  return pool.slice(0, PUZZLES_PER_DIFFICULTY)
}

function writeBank(difficulty, entries) {
  const puzzles = entries.map((entry, index) => {
    const chunks = splitWordIntoScrambleChunks(entry.word)
  const scrambled = scrambleChunks(chunks)

    return {
      id: `${difficulty}-${String(index + 1).padStart(4, '0')}`,
      word: entry.word,
      hint: entry.hint,
      chunks,
      scrambled,
    }
  })

  const bank = {
    version: 1,
    difficulty,
    count: puzzles.length,
    puzzles,
  }

  const outputPath = path.join(OUTPUT_DIR, `palavras_${difficulty}.json`)
  fs.writeFileSync(outputPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${puzzles.length} puzzles to ${outputPath}`)
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const pools = buildPuzzlePools()

  for (const difficulty of ['facil', 'medio', 'dificil']) {
    const padded = padPool(pools[difficulty], difficulty, WORD_ENTRIES)
    if (padded.length < PUZZLES_PER_DIFFICULTY) {
      console.error(
        `Warning: only ${padded.length} unique words for ${difficulty} (target ${PUZZLES_PER_DIFFICULTY})`,
      )
    }
    writeBank(difficulty, padded)
  }
}

main()
