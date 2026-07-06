#!/usr/bin/env node
/**
 * Substitui tokens de superfície do tema escuro por colors.* (tema claro fixo).
 * Idempotente: não altera linhas que já usam colors.backgroundElevated etc.
 */
import fs from 'node:fs'
import path from 'node:path'

const SRC = path.resolve(import.meta.dirname, '../src')

const REPLACEMENTS = [
  [/backgroundColor: 'rgba\(10, 10, 12, 0\.99\)'/g, 'backgroundColor: colors.backgroundElevated'],
  [/backgroundColor: 'rgba\(10, 10, 12, 0\.96\)'/g, 'backgroundColor: colors.backgroundElevated'],
  [/backgroundColor: 'rgba\(10, 10, 12, 0\.92\)'/g, 'backgroundColor: colors.backgroundElevated'],
  [/backgroundColor: 'rgba\(10, 10, 12, 0\.35\)'/g, "backgroundColor: 'rgba(255, 255, 255, 0.55)'"],
  [/backgroundColor: 'rgba\(10, 10, 12, 0\.3\)'/g, "backgroundColor: 'rgba(255, 255, 255, 0.5)'"],
  [/backgroundColor: 'rgba\(10, 10, 12, 0\.25\)'/g, "backgroundColor: 'rgba(255, 255, 255, 0.45)'"],
  [/backgroundColor: 'rgba\(10, 10, 12, 0\.2\)'/g, "backgroundColor: 'rgba(255, 255, 255, 0.4)'"],
  [/backgroundColor: 'rgba\(10, 10, 12, 0\.18\)'/g, "backgroundColor: 'rgba(255, 255, 255, 0.38)'"],
  [/backgroundColor: 'rgba\(10, 10, 12, 0\.72\)'/g, 'backgroundColor: colors.backgroundElevated'],
  [/backgroundColor: 'rgba\(24, 24, 32, 0\.99\)'/g, 'backgroundColor: colors.backgroundElevated'],
  [/backgroundColor: 'rgba\(255, 255, 255, 0\.02\)'/g, 'backgroundColor: colors.surface'],
  [/backgroundColor: 'rgba\(255, 255, 255, 0\.03\)'/g, 'backgroundColor: colors.backgroundElevated'],
  [/backgroundColor: 'rgba\(255, 255, 255, 0\.04\)'/g, 'backgroundColor: colors.backgroundElevated'],
  [/backgroundColor: 'rgba\(255, 255, 255, 0\.05\)'/g, 'backgroundColor: colors.surface'],
  [/backgroundColor: 'rgba\(255, 255, 255, 0\.06\)'/g, 'backgroundColor: colors.surface'],
  [/backgroundColor: 'rgba\(255, 255, 255, 0\.07\)'/g, 'backgroundColor: colors.surface'],
  [/backgroundColor: 'rgba\(255, 255, 255, 0\.08\)'/g, 'backgroundColor: colors.surface'],
  [/borderColor: 'rgba\(255, 255, 255, 0\.05\)'/g, 'borderColor: colors.surfaceBorder'],
  [/borderColor: 'rgba\(255, 255, 255, 0\.06\)'/g, 'borderColor: colors.surfaceBorder'],
  [/borderColor: 'rgba\(255, 255, 255, 0\.08\)'/g, 'borderColor: colors.surfaceBorder'],
  [/borderColor: 'rgba\(255, 255, 255, 0\.1\)'/g, 'borderColor: colors.surfaceBorder'],
  [/borderColor: 'rgba\(255, 255, 255, 0\.12\)'/g, 'borderColor: colors.surfaceBorder'],
  [/borderTopColor: 'rgba\(255, 255, 255, 0\.05\)'/g, 'borderTopColor: colors.surfaceBorder'],
  [/borderTopColor: 'rgba\(255, 255, 255, 0\.06\)'/g, 'borderTopColor: colors.surfaceBorder'],
  [/borderTopColor: 'rgba\(255, 255, 255, 0\.08\)'/g, 'borderTopColor: colors.surfaceBorder'],
  [/borderBottomColor: 'rgba\(255, 255, 255, 0\.05\)'/g, 'borderBottomColor: colors.surfaceBorder'],
  [/borderBottomColor: 'rgba\(255, 255, 255, 0\.06\)'/g, 'borderBottomColor: colors.surfaceBorder'],
  [/borderBottomColor: 'rgba\(255, 255, 255, 0\.08\)'/g, 'borderBottomColor: colors.surfaceBorder'],
  [/borderLeftColor: 'rgba\(255, 255, 255, 0\.08\)'/g, 'borderLeftColor: colors.surfaceBorder'],
  [/borderRightColor: 'rgba\(255, 255, 255, 0\.08\)'/g, 'borderRightColor: colors.surfaceBorder'],
  [/'rgba\(245, 245, 247, 0\.85\)'/g, "'transparent'"],
  [/colors=\{\['rgba\(10, 10, 12, 0\.92\)', 'rgba\(10, 10, 12, 0\.75\)', 'rgba\(10, 10, 12, 0\)'\]\}/g,
    "colors={[themeColors.screenOverlay[0], 'transparent', 'transparent']}"],
  [/color: '#86efac'/g, "color: '#15803d'"],
  [/color: '#fde68a'/g, "color: '#d97706'"],
  [/color: '#fca5a5'/g, "color: '#b91c1c'"],
  [/color: '#fbcfe8'/g, "color: '#be185d'"],
  [/color: '#bfdbfe'/g, "color: '#1d4ed8'"],
  [/color: '#93c5fd'/g, "color: '#2563eb'"],
  [/color: '#fdba74'/g, "color: '#ea580c'"],
]

const LOCK_OVERLAY_SCRIM = "backgroundColor: 'rgba(255, 255, 255, 0.78)'"

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      if (name === 'node_modules') continue
      walk(full, out)
    } else if (/\.(tsx?|ts)$/.test(name)) {
      out.push(full)
    }
  }
  return out
}

function ensureColorsImport(content, filePath) {
  if (!content.includes('colors.')) return content
  if (/from ['"].*theme\/colors['"]/.test(content)) return content

  const rel = path.relative(path.dirname(filePath), path.join(SRC, 'theme/colors')).replace(/\\/g, '/')
  const importPath = rel.startsWith('.') ? rel : `./${rel}`
  const importLine = `import { colors } from '${importPath.replace(/\.ts$/, '')}'\n`

  const match = content.match(/^import .+\n/m)
  if (match) {
    const idx = content.indexOf(match[0]) + match[0].length
    return content.slice(0, idx) + importLine + content.slice(idx)
  }
  return importLine + content
}

function ensureThemeColorsImport(content, filePath) {
  if (!content.includes('themeColors.')) return content
  if (/from ['"].*ThemeContext['"]/.test(content)) return content

  const rel = path.relative(path.dirname(filePath), path.join(SRC, 'contexts/ThemeContext')).replace(/\\/g, '/')
  const importPath = rel.startsWith('.') ? rel : `./${rel}`
  const importLine = `import { useTheme } from '${importPath.replace(/\.tsx?$/, '')}'\n`
  // Can't auto-add hook — skip files needing themeColors without import
  return content
}

let changedFiles = 0
let totalReplacements = 0

for (const file of walk(SRC)) {
  if (file.includes('theme/palettes.ts') || file.includes('theme/colors.ts')) continue

  let content = fs.readFileSync(file, 'utf8')
  const original = content

  for (const [pattern, replacement] of REPLACEMENTS) {
    const before = content
    content = content.replace(pattern, replacement)
    if (content !== before) {
      totalReplacements += (before.match(pattern) ?? []).length
    }
  }

  // Tela bloqueada: scrim claro semitransparente (não preto sólido)
  if (file.endsWith('RunWalkActivityLockOverlay.tsx')) {
    content = content.replace(
      /backgroundColor: 'rgba\(10, 10, 12, 0\.94\)'/,
      LOCK_OVERLAY_SCRIM,
    )
  } else {
    content = content.replace(
      /backgroundColor: 'rgba\(10, 10, 12, 0\.94\)'/g,
      'backgroundColor: colors.backgroundElevated',
    )
  }

  if (file.endsWith('RunWalkActivityLockOverlay.tsx')) {
    content = content.replace(
      /borderColor: 'rgba\(255, 255, 255, 0\.12\)'/,
      'borderColor: colors.surfaceBorder',
    )
    content = content.replace(
      /backgroundColor: 'rgba\(255, 255, 255, 0\.05\)'/,
      'backgroundColor: colors.surface',
    )
    content = content.replace(
      /backgroundColor: 'rgba\(34, 197, 94, 0\.28\)'/,
      "backgroundColor: 'rgba(34, 197, 94, 0.35)'",
    )
  }

  if (content !== original) {
    content = ensureColorsImport(content, file)
    fs.writeFileSync(file, content)
    changedFiles += 1
  }
}

console.log(`migrateLightSurfaces: ${changedFiles} files, ~${totalReplacements} replacements`)
