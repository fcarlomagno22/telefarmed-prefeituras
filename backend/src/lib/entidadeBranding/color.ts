/** Cor padrão da plataforma quando a entidade não define cor_primaria nem logo_hue útil. */
export const DEFAULT_PLATFORM_PRIMARY_COLOR = '#ff6b00'

function clampHue(hue: number): number {
  const normalized = hue % 360
  return normalized < 0 ? normalized + 360 : normalized
}

/** Converte matiz (0–359) em hex vibrante — mesma regra usada nos avatares do admin. */
export function logoHueToHex(hue: number): string {
  return hslToHex(clampHue(hue), 85, 50)
}

function hslToHex(h: number, s: number, l: number): string {
  const saturation = s / 100
  const lightness = l / 100

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lightness - chroma / 2

  let r = 0
  let g = 0
  let b = 0

  if (h < 60) {
    r = chroma
    g = x
  } else if (h < 120) {
    r = x
    g = chroma
  } else if (h < 180) {
    g = chroma
    b = x
  } else if (h < 240) {
    g = x
    b = chroma
  } else if (h < 300) {
    r = x
    b = chroma
  } else {
    r = chroma
    b = x
  }

  return `#${[r + m, g + m, b + m]
    .map((channel) =>
      Math.round(channel * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

export function normalizeCorPrimariaHex(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (!HEX_COLOR_REGEX.test(trimmed)) return null
  return trimmed.toLowerCase()
}

export function resolveCorPrimaria(input: {
  corPrimaria: string | null | undefined
  logoHue: number | null | undefined
}): string {
  const explicit = normalizeCorPrimariaHex(input.corPrimaria ?? null)
  if (explicit) return explicit

  if (typeof input.logoHue === 'number' && Number.isFinite(input.logoHue)) {
    return logoHueToHex(input.logoHue)
  }

  return DEFAULT_PLATFORM_PRIMARY_COLOR
}
