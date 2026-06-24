#!/usr/bin/env node
/**
 * Builds per-word hints for Forme a Palavra from Wiktionary (pt).
 * Caches results in formTheWordHints.json — safe to re-run (skips cached words).
 *
 * Run: node app_cidades/scripts/data/fetchFormTheWordHints.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const DATA_DIR = __dirname
const CACHE_PATH = path.join(DATA_DIR, 'formTheWordHints.json')
const SOURCE_PATH = path.join(DATA_DIR, 'formTheWordSource.js')
const FREQ_PATH = path.join(DATA_DIR, 'pt_50k.txt')
const LEXICON_PATH = path.join(DATA_DIR, 'pt_lexico.txt')

const FREQ_URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pt/pt_50k.txt'
const LEXICON_URL = 'https://raw.githubusercontent.com/fserb/pt-br/master/lexico'

const REQUEST_DELAY_MS = 150
const MAX_HINT_LENGTH = 88
const GENERIC_HINT_PATTERN = /^(Palavra de |Termo com |Termo de |Ação ou processo)/

function isGenericHint(hint) {
  return !hint || GENERIC_HINT_PATTERN.test(hint)
}

const { CURATED_HINTS } = require('./formTheWordSeedHints')

function ensureDataFile(filePath, url) {
  if (fs.existsSync(filePath)) return
  console.log(`Downloading ${url} ...`)
  execSync(`curl -fsSL "${url}" -o "${filePath}"`, { stdio: 'inherit' })
}

function normalize(word) {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cleanWikitext(value) {
  let text = value
  text = text.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
  text = text.replace(/<ref[^/]*\/>/gi, '')
  text = text.replace(/\{\{[^}]+\}\}/g, '')
  text = text.replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, '$1')
  text = text.replace(/'''+/g, '')
  text = text.replace(/''/g, '')
  text = text.replace(/<[^>]+>/g, '')
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

function shortenHint(text) {
  let hint = cleanWikitext(text)
  hint = hint.replace(/^[^:]+:\s*/, '')
  hint = hint.replace(/\([^)]*\)/g, '').trim()
  hint = hint.replace(/\s+/g, ' ').trim()

  if (!hint) return null

  const sentence = hint.split(/[.;]/)[0].trim()
  hint = sentence || hint

  if (hint.length > MAX_HINT_LENGTH) {
    const cut = hint.slice(0, MAX_HINT_LENGTH - 1)
    const lastSpace = cut.lastIndexOf(' ')
    hint = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + '…'
  }

  if (hint.length < 8) return null
  return hint.charAt(0).toUpperCase() + hint.slice(1)
}

function extractDefinitions(wikitext, sections) {
  const lines = wikitext.split('\n')
  const definitions = []

  for (const section of sections) {
    let inSection = false

    for (const line of lines) {
      if (/^==/.test(line)) {
        inSection = line.toLowerCase().includes(section)
        continue
      }

      if (!inSection) continue
      if (!/^#\s*/.test(line)) continue

      const definition = shortenHint(line.replace(/^#\s*/, ''))
      if (definition) definitions.push(definition)
    }
  }

  return definitions
}

function parseWiktionaryHint(wikitext) {
  const preferredSections = ['substantivo', 'adjetivo', 'verbo', 'advérbio', 'adverbio']
  const definitions = extractDefinitions(wikitext, preferredSections)
  if (definitions.length > 0) return definitions[0]

  for (const line of wikitext.split('\n')) {
    if (!/^#\s*/.test(line)) continue
    const definition = shortenHint(line.replace(/^#\s*/, ''))
    if (definition) return definition
  }

  return null
}

async function fetchWiktionaryHint(word, attempt = 1) {
  const titles = [word, word.charAt(0).toUpperCase() + word.slice(1), word.toLowerCase()]
  const uniqueTitles = [...new Set(titles)]

  for (const title of uniqueTitles) {
    const url = `https://pt.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&format=json&origin=*`

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'TelefarmedFormTheWord/1.0 (educational game)' },
      })

      if (!response.ok) continue

      const payload = await response.json()
      const wikitext = payload?.parse?.wikitext?.['*']
      if (!wikitext) continue

      const hint = parseWiktionaryHint(wikitext)
      if (hint) return hint
    } catch {
      if (attempt < 3) {
        await sleep(REQUEST_DELAY_MS * attempt)
        return fetchWiktionaryHint(word, attempt + 1)
      }
    }
  }

  return null
}

function loadWordList() {
  if (fs.existsSync(SOURCE_PATH)) {
    delete require.cache[require.resolve('./formTheWordSource')]
    const { WORD_ENTRIES } = require('./formTheWordSource')
    return [...new Set(WORD_ENTRIES.map((entry) => entry.word))]
  }

  ensureDataFile(FREQ_PATH, FREQ_URL)
  ensureDataFile(LEXICON_PATH, LEXICON_URL)

  const lexiconLines = fs.readFileSync(LEXICON_PATH, 'utf8').split('\n').filter(Boolean)
  return lexiconLines
    .map((line) => line.trim())
    .filter((word) => word.length >= 3 && /^[A-Za-zÀ-ÿ]+$/.test(word))
    .slice(0, 3200)
}

function fallbackHint(word) {
  const key = normalize(word)
  const length = [...word].length
  const hasAccent = word !== key

  if (hasAccent && word.endsWith('ção')) {
    const stem = word.slice(0, -4)
    return `Processo ou resultado de ${stem.toLowerCase()}`
  }
  if (hasAccent && word.endsWith('dade')) {
    const stem = word.slice(0, -4)
    return `Qualidade ou estado de ${stem.toLowerCase()}`
  }
  if (word.endsWith('mente')) {
    const stem = word.slice(0, -5)
    return `De modo ${stem.toLowerCase()}`
  }

  const first = word.charAt(0).toUpperCase()
  const last = word.charAt(word.length - 1).toLowerCase()
  return `Substantivo em português que começa com ${first} e termina em ${last}`
}

async function main() {
  const cache = fs.existsSync(CACHE_PATH)
    ? JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))
    : {}

  for (const [key, hint] of Object.entries(CURATED_HINTS)) {
    cache[normalize(key)] = hint
  }

  const words = loadWordList()
  let fetched = 0
  let skipped = 0

  console.log(`Processing ${words.length} words (${Object.keys(cache).length} cached hints)...`)

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index]
    const key = normalize(word)

    if (cache[key] && !isGenericHint(cache[key])) {
      skipped += 1
      continue
    }

    let hint = CURATED_HINTS[key] ?? CURATED_HINTS[word.toLowerCase()] ?? null

    if (!hint) {
      try {
        hint = await fetchWiktionaryHint(word)
        await sleep(REQUEST_DELAY_MS)
      } catch {
        hint = null
      }
    }

    if (!hint) {
      hint = fallbackHint(word)
    }

    cache[key] = hint
    fetched += 1

    if (fetched % 25 === 0) {
      fs.writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8')
      console.log(`  ${index + 1}/${words.length} — saved (${fetched} new, ${skipped} skipped)`)
    }
  }

  fs.writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8')
  console.log(`Done. ${Object.keys(cache).length} hints in ${CACHE_PATH}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
