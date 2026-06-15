import Svg, { Circle, G, Path } from 'react-native-svg'

type FullBodyFigureProps = {
  size?: number
  color?: string
}

export function FullBodyFigure({
  size = 72,
  color = 'rgba(255, 255, 255, 0.16)',
}: FullBodyFigureProps) {
  return (
    <Svg width={size} height={size} viewBox="0 -0.6 14 15">
      <G fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
        <Circle cx={7} cy={2.45} r={1.85} />
        <Path d="M10.5 9.2a3.5 3.5 0 0 0-7 0v1.5H5l.5 3.8h3l.5-3.8h1.5Z" />
      </G>
    </Svg>
  )
}
