import { MaterialCommunityIcons } from '@expo/vector-icons'
import Svg, { Path, Rect } from 'react-native-svg'
import type { ActiveMindGameIconId } from '../../types/activeMind'

type ActiveMindGameIconProps = {
  icon: ActiveMindGameIconId
  size?: number
  color?: string
}

const CROSSWORD_PATH = 'M9 22v-6h6v6zm-7-7V9h6v6zm7 0V9h6v6zm7 0V9h6v6zm0-7V2h6v6z'

const SUDOKU_PATH =
  'M11.25 12.75H0V21a3 3 0 0 0 3 3h8.25Zm0-1.5V0H3a3 3 0 0 0-3 3v8.25ZM3.87 4.33l2.31-1.16a.79.79 0 0 1 .73 0a.75.75 0 0 1 .35.64v5a.75.75 0 0 1-1.5 0V5.06l-1.22.61a.75.75 0 0 1-1-.34a.74.74 0 0 1 .33-1m8.88 8.42V24H21a3 3 0 0 0 3-3v-8.25ZM21.09 21a.75.75 0 0 1-1.5 0v-1.34h-3.53a.74.74 0 0 1-.75-.75V16a.75.75 0 1 1 1.5 0v2.19h2.78V16a.75.75 0 0 1 1.5 0Zm-8.34-9.75H24V3a3 3 0 0 0-3-3h-8.25Zm3.56-8.16h4.44a.75.75 0 0 1 .66.4a.74.74 0 0 1 0 .77l-3.41 5a.73.73 0 0 1-.62.33a.8.8 0 0 1-.38-.12a.76.76 0 0 1-.21-1l2.56-3.84h-3a.75.75 0 0 1 0-1.5Z'

const FLOW_SEQUENCE_PATH =
  'M20 23h-8.1c0-.4-.2-.7-.4-1L22 11.5c.6.4 1.3.6 2 .6c2.2 0 4-1.8 4-4s-1.8-4-4-4s-3.4 1.3-3.9 3H13v2h7.1c0 .4.2.7.4 1L10 20.6c-.6-.4-1.3-.6-2-.6c-2.2 0-4 1.8-4 4s1.8 4 4 4s3.4-1.3 3.9-3H20v3h8v-8h-8zm4-17c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2M8 26c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2m14-4h4v4h-4zM4 12V4l7 4z'

const WORD_SEARCH_PATH =
  'M9 19.49V35c0 2.21 1.79 4 4 4h15.51M19.49 9H35c2.21 0 4 1.79 4 4v15.51m-13.77 3.265v-7.5h2.455c1.388 0 2.514 1.127 2.514 2.518s-1.126 2.52-2.514 2.52H25.23m2.455-.001l2.455 2.461M16.5 9.824l-1.875 7.5l-1.875-7.5l-1.875 7.5L9 9.824M33.71 39v-7.5h1.687a3.28 3.28 0 0 1 3.281 3.281v.938A3.28 3.28 0 0 1 35.398 39z'

const MATERIAL_ICON_MAP = {
  'format-letter-case': 'format-letter-case',
  'calculator-variant': 'calculator-variant',
} as const satisfies Record<
  Extract<ActiveMindGameIconId, 'format-letter-case' | 'calculator-variant'>,
  keyof typeof MaterialCommunityIcons.glyphMap
>

export function ActiveMindGameIcon({ icon, size = 28, color = '#fff' }: ActiveMindGameIconProps) {
  if (icon === 'crossword') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d={CROSSWORD_PATH} fill={color} />
      </Svg>
    )
  }

  if (icon === 'sudoku') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d={SUDOKU_PATH} fill={color} />
      </Svg>
    )
  }

  if (icon === 'flow-sequence') {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path d={FLOW_SEQUENCE_PATH} fill={color} />
      </Svg>
    )
  }

  if (icon === 'word-search') {
    const strokeWidth = 1.5

    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Rect
          x={16.582}
          y={0.91}
          width={14.836}
          height={46.181}
          rx={7.418}
          ry={7.418}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="rotate(-45 24 24)"
        />
        <Path
          d={WORD_SEARCH_PATH}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Rect
          x={17.654}
          y={16.775}
          width={4.969}
          height={7.5}
          rx={2.484}
          ry={2.484}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    )
  }

  return (
    <MaterialCommunityIcons name={MATERIAL_ICON_MAP[icon]} size={size} color={color} />
  )
}
