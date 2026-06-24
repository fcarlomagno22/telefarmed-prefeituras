#!/usr/bin/env node
/**
 * Generates Sudoku puzzle banks (1000+ per difficulty).
 * Run: node app_cidades/scripts/generateSudokuPuzzles.js
 */

const fs = require('fs')
const path = require('path')

const OUTPUT_DIR = path.join(__dirname, '../content/activeMind/sudoku')
const PUZZLES_PER_DIFFICULTY = 1000

const DIFFICULTY_CONFIG = {
  facil: { label: 'facil', minGivens: 43, maxGivens: 48 },
  medio: { label: 'medio', minGivens: 33, maxGivens: 39 },
  dificil: { label: 'dificil', minGivens: 26, maxGivens: 32 },
}

function shuffle(values) {
  const array = [...values]
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[array[index], array[swapIndex]] = [array[swapIndex], array[index]]
  }
  return array
}

function cloneGrid(grid) {
  return [...grid]
}

function gridToString(grid) {
  return grid.map((value) => String(value)).join('')
}

function countGivens(grid) {
  return grid.filter((value) => value !== 0).length
}

function isValidPlacement(grid, row, col, num) {
  for (let index = 0; index < 9; index += 1) {
    if (grid[row * 9 + index] === num) return false
    if (grid[index * 9 + col] === num) return false
  }

  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3

  for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
    for (let colOffset = 0; colOffset < 3; colOffset += 1) {
      const cell = grid[(boxRow + rowOffset) * 9 + (boxCol + colOffset)]
      if (cell === num) return false
    }
  }

  return true
}

function fillGrid(grid) {
  for (let index = 0; index < 81; index += 1) {
    if (grid[index] !== 0) continue

    const row = Math.floor(index / 9)
    const col = index % 9

    for (const num of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (!isValidPlacement(grid, row, col, num)) continue
      grid[index] = num
      if (fillGrid(grid)) return true
      grid[index] = 0
    }

    return false
  }

  return true
}

function generateSolvedGrid() {
  const grid = new Array(81).fill(0)
  fillGrid(grid)
  return grid
}

function countSolutions(grid, limit = 2) {
  const working = cloneGrid(grid)
  let solutions = 0

  function backtrack() {
    if (solutions >= limit) return

    let emptyIndex = -1
    for (let index = 0; index < 81; index += 1) {
      if (working[index] === 0) {
        emptyIndex = index
        break
      }
    }

    if (emptyIndex === -1) {
      solutions += 1
      return
    }

    const row = Math.floor(emptyIndex / 9)
    const col = emptyIndex % 9

    for (let num = 1; num <= 9; num += 1) {
      if (!isValidPlacement(working, row, col, num)) continue
      working[emptyIndex] = num
      backtrack()
      if (solutions >= limit) return
      working[emptyIndex] = 0
    }
  }

  backtrack()
  return solutions
}

function carvePuzzle(solution, targetGivens) {
  const puzzle = cloneGrid(solution)
  const positions = shuffle([...Array(81).keys()])

  for (const position of positions) {
    if (countGivens(puzzle) <= targetGivens) break

    const backup = puzzle[position]
    if (backup === 0) continue

    puzzle[position] = 0
    const solutions = countSolutions(puzzle, 2)
    if (solutions !== 1) {
      puzzle[position] = backup
    }
  }

  return puzzle
}

function generatePuzzle(difficultyKey) {
  const config = DIFFICULTY_CONFIG[difficultyKey]
  const targetGivens =
    config.minGivens +
    Math.floor(Math.random() * (config.maxGivens - config.minGivens + 1))

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const solution = generateSolvedGrid()
    const puzzle = carvePuzzle(solution, targetGivens)
    const givens = countGivens(puzzle)

    if (givens < config.minGivens || givens > config.maxGivens) continue
    if (countSolutions(puzzle, 2) !== 1) continue

    return {
      puzzle: gridToString(puzzle),
      solution: gridToString(solution),
      givens,
    }
  }

  throw new Error(`Failed to generate ${difficultyKey} puzzle`)
}

function generateBank(difficultyKey) {
  const config = DIFFICULTY_CONFIG[difficultyKey]
  const puzzles = []
  const signatures = new Set()

  while (puzzles.length < PUZZLES_PER_DIFFICULTY) {
    const generated = generatePuzzle(difficultyKey)
    if (signatures.has(generated.puzzle)) continue

    signatures.add(generated.puzzle)
    puzzles.push({
      id: `${config.label}-${String(puzzles.length + 1).padStart(4, '0')}`,
      puzzle: generated.puzzle,
      solution: generated.solution,
      givens: generated.givens,
    })

    if (puzzles.length % 100 === 0) {
      process.stdout.write(`  ${difficultyKey}: ${puzzles.length}/${PUZZLES_PER_DIFFICULTY}\n`)
    }
  }

  return {
    version: 1,
    difficulty: config.label,
    count: puzzles.length,
    puzzles,
  }
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  for (const difficultyKey of Object.keys(DIFFICULTY_CONFIG)) {
    process.stdout.write(`Generating ${difficultyKey}...\n`)
    const bank = generateBank(difficultyKey)
    const outputPath = path.join(OUTPUT_DIR, `sudoku_${difficultyKey}.json`)

    fs.writeFileSync(outputPath, `${JSON.stringify(bank)}\n`, 'utf8')
    process.stdout.write(`Saved ${bank.count} puzzles to ${outputPath}\n`)
  }
}

main()
