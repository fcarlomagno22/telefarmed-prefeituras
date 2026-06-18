import { brand } from '../config/brand'

function normalizeHex(hex: string): string {
  const trimmed = hex.trim().replace('#', '')
  if (trimmed.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return brand.primaryColor.replace('#', '')
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
  return `#${[nextR, nextG, nextB].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function mixHex(hex: string, mixWith: string, weight: number): string {
  const a = hexToRgb(hex)
  const b = hexToRgb(mixWith)
  const t = Math.min(1, Math.max(0, weight))
  const r = Math.round(a.r * (1 - t) + b.r * t)
  const g = Math.round(a.g * (1 - t) + b.g * t)
  const blue = Math.round(a.b * (1 - t) + b.b * t)
  return `#${[r, g, blue].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function buildBrandCssVariables(primaryColor: string): Record<string, string> {
  const primary = `#${normalizeHex(primaryColor)}`
  const hover = shadeHex(primary, -20)
  const gradientMid = lightenBrandHex(primary, 18)
  const gradientEnd = lightenBrandHex(primary, 35)
  const hoverStart = shadeHex(primary, -12)
  const hoverMid = lightenBrandHex(hoverStart, 15)
  const hoverEnd = lightenBrandHex(hoverStart, 28)

  return {
    '--brand-primary': primary,
    '--brand-primary-hover': hover,
    '--brand-primary-light': `${primary}1a`,
    '--brand-primary-muted': mixHex(primary, '#ffffff', 0.94),
    '--brand-primary-muted-strong': mixHex(primary, '#ffffff', 0.88),
    '--brand-primary-border': mixHex(primary, '#ffffff', 0.82),
    '--brand-primary-gradient-start': primary,
    '--brand-primary-gradient-mid': gradientMid,
    '--brand-primary-gradient-end': gradientEnd,
    '--brand-primary-gradient-hover-start': hoverStart,
    '--brand-primary-gradient-hover-mid': hoverMid,
    '--brand-primary-gradient-hover-end': hoverEnd,
    '--brand-primary-gradient': `linear-gradient(135deg, ${primary} 0%, ${gradientMid} 50%, ${gradientEnd} 100%)`,
    '--brand-primary-gradient-hover': `linear-gradient(135deg, ${hoverStart} 0%, ${hoverMid} 50%, ${hoverEnd} 100%)`,
    '--brand-primary-shadow-sm': `0 4px 14px ${hexToRgba(primary, 0.35)}`,
    '--brand-primary-shadow-md': `0 8px 24px ${hexToRgba(primary, 0.35)}`,
    '--brand-primary-shadow-lg': `0 12px 32px ${hexToRgba(primary, 0.38)}`,
    '--brand-primary-focus-ring': `0 0 0 3px ${hexToRgba(primary, 0.12)}`,
  }
}

function lightenBrandHex(hex: string, percent: number): string {
  return mixHex(hex, '#ffffff', percent / 100)
}

export function applyBrandCssVariables(primaryColor?: string | null): void {
  if (typeof document === 'undefined') return
  const vars = buildBrandCssVariables(primaryColor?.trim() || brand.primaryColor)
  const root = document.documentElement
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
}
