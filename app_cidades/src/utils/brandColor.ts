import { DEFAULT_PRIMARY_COLOR } from '../config/fallbackBranding'

function normalizeHex(hex: string): string {
  const trimmed = hex.trim().replace('#', '')
  if (trimmed.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return DEFAULT_PRIMARY_COLOR.replace('#', '')
  }
  return trimmed.toLowerCase()
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex)
  const num = parseInt(normalized, 16)
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  }
}

export function shadeHex(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex)
  const nextR = Math.min(255, Math.max(0, r + percent))
  const nextG = Math.min(255, Math.max(0, g + percent))
  const nextB = Math.min(255, Math.max(0, b + percent))
  return `#${[nextR, nextG, nextB].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function normalizePrimaryColor(value: string | null | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return DEFAULT_PRIMARY_COLOR
  return trimmed.startsWith('#') ? trimmed : `#${normalizeHex(trimmed)}`
}
