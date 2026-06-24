import { useRef } from 'react'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'

type BibleGradientHeartProps = {
  size?: number
}

export function BibleGradientHeart({ size = 22 }: BibleGradientHeartProps) {
  const gradientId = useRef(`bibleHeart-${Math.random().toString(36).slice(2, 9)}`).current

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id={gradientId} x1="12" y1="3" x2="12" y2="22">
          <Stop offset="0" stopColor="#fca5a5" />
          <Stop offset="0.55" stopColor="#ef4444" />
          <Stop offset="1" stopColor="#b91c1c" />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={`url(#${gradientId})`}
      />
    </Svg>
  )
}
