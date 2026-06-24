import { Platform, type TextStyle, type ViewStyle } from 'react-native'

export const BIBLE_HIGHLIGHT_COLORS = [
  {
    id: 'yellow',
    label: 'Amarelo',
    neon: '#FFF200',
    bg: 'rgba(255, 242, 0, 0.22)',
    border: '#FFF200',
    glow: '#FFF200',
  },
  {
    id: 'orange',
    label: 'Laranja',
    neon: '#FF7A00',
    bg: 'rgba(255, 122, 0, 0.22)',
    border: '#FF9500',
    glow: '#FF9500',
  },
  {
    id: 'blue',
    label: 'Azul',
    neon: '#00E5FF',
    bg: 'rgba(0, 229, 255, 0.2)',
    border: '#00F0FF',
    glow: '#00F0FF',
  },
  {
    id: 'green',
    label: 'Verde',
    neon: '#00FF88',
    bg: 'rgba(0, 255, 136, 0.2)',
    border: '#39FF14',
    glow: '#39FF14',
  },
  {
    id: 'purple',
    label: 'Roxo',
    neon: '#D400FF',
    bg: 'rgba(212, 0, 255, 0.2)',
    border: '#E040FF',
    glow: '#E040FF',
  },
  {
    id: 'pink',
    label: 'Rosa',
    neon: '#FF0099',
    bg: 'rgba(255, 0, 153, 0.2)',
    border: '#FF33AA',
    glow: '#FF33AA',
  },
] as const

export type BibleHighlightColor = (typeof BIBLE_HIGHLIGHT_COLORS)[number]
export type BibleHighlightColorId = BibleHighlightColor['id']

export type BibleVerseHighlight = {
  id: string
  bookAbbrev: string
  chapter: number
  verse: number
  start: number
  end: number
  colorId: BibleHighlightColorId
  comment?: string
  updatedAt: string
}

export function getBibleHighlightColor(colorId: BibleHighlightColorId): BibleHighlightColor {
  return BIBLE_HIGHLIGHT_COLORS.find((color) => color.id === colorId) ?? BIBLE_HIGHLIGHT_COLORS[0]
}

export function getBibleHighlightNeonContainerStyle(color: BibleHighlightColor): ViewStyle {
  return {
    backgroundColor: color.bg,
    borderColor: color.border,
    borderWidth: 1.5,
    borderRadius: 6,
  }
}

export function getBibleHighlightNeonGlowStyle(color: BibleHighlightColor): ViewStyle {
  return {
    shadowColor: color.glow,
    shadowOpacity: 0.95,
    shadowRadius: Platform.OS === 'ios' ? 12 : 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    borderRadius: 8,
  }
}

export function getBibleHighlightNeonLabelStyle(): TextStyle {
  return {
    color: '#FFFFFF',
  }
}

export function getBibleHighlightNeonSwatchStyle(
  color: BibleHighlightColor,
  active = false,
): ViewStyle {
  return {
    backgroundColor: color.bg,
    borderColor: color.neon,
    shadowColor: color.glow,
    shadowOpacity: active ? 1 : 0.82,
    shadowRadius: active ? 16 : 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: active ? 10 : 6,
  }
}
