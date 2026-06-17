import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

type StarSpec = {
  top: `${number}%`
  left: `${number}%`
  size: number
  delay: number
  duration: number
  minOpacity: number
  maxOpacity: number
  color: string
}

const STARFIELD: StarSpec[] = [
  { top: '6%', left: '8%', size: 3, delay: 0, duration: 2200, minOpacity: 0.12, maxOpacity: 0.95, color: '#ffffff' },
  { top: '10%', left: '24%', size: 2, delay: 400, duration: 1800, minOpacity: 0.1, maxOpacity: 0.7, color: '#e0e7ff' },
  { top: '14%', left: '52%', size: 4, delay: 120, duration: 2600, minOpacity: 0.15, maxOpacity: 1, color: '#ffffff' },
  { top: '8%', left: '71%', size: 2, delay: 680, duration: 2000, minOpacity: 0.08, maxOpacity: 0.65, color: '#c7d2fe' },
  { top: '18%', left: '88%', size: 3, delay: 920, duration: 2400, minOpacity: 0.12, maxOpacity: 0.85, color: '#ffffff' },
  { top: '22%', left: '14%', size: 2, delay: 300, duration: 1900, minOpacity: 0.1, maxOpacity: 0.75, color: '#ddd6fe' },
  { top: '28%', left: '38%', size: 3, delay: 760, duration: 2100, minOpacity: 0.14, maxOpacity: 0.9, color: '#ffffff' },
  { top: '24%', left: '63%', size: 2, delay: 1100, duration: 1700, minOpacity: 0.08, maxOpacity: 0.6, color: '#e0e7ff' },
  { top: '31%', left: '82%', size: 4, delay: 540, duration: 2800, minOpacity: 0.16, maxOpacity: 1, color: '#ffffff' },
  { top: '36%', left: '6%', size: 2, delay: 880, duration: 2000, minOpacity: 0.1, maxOpacity: 0.7, color: '#c7d2fe' },
  { top: '42%', left: '28%', size: 3, delay: 200, duration: 2300, minOpacity: 0.12, maxOpacity: 0.88, color: '#ffffff' },
  { top: '39%', left: '47%', size: 2, delay: 1320, duration: 1600, minOpacity: 0.08, maxOpacity: 0.55, color: '#e0e7ff' },
  { top: '45%', left: '74%', size: 3, delay: 620, duration: 2500, minOpacity: 0.14, maxOpacity: 0.92, color: '#ffffff' },
  { top: '48%', left: '91%', size: 2, delay: 980, duration: 1850, minOpacity: 0.1, maxOpacity: 0.68, color: '#ddd6fe' },
  { top: '54%', left: '18%', size: 4, delay: 440, duration: 2700, minOpacity: 0.15, maxOpacity: 1, color: '#ffffff' },
  { top: '58%', left: '56%', size: 2, delay: 1180, duration: 1950, minOpacity: 0.08, maxOpacity: 0.62, color: '#c7d2fe' },
  { top: '61%', left: '34%', size: 3, delay: 260, duration: 2200, minOpacity: 0.12, maxOpacity: 0.86, color: '#ffffff' },
  { top: '66%', left: '79%', size: 2, delay: 840, duration: 1750, minOpacity: 0.1, maxOpacity: 0.72, color: '#e0e7ff' },
  { top: '70%', left: '10%', size: 3, delay: 1040, duration: 2400, minOpacity: 0.12, maxOpacity: 0.9, color: '#ffffff' },
  { top: '74%', left: '44%', size: 2, delay: 520, duration: 1900, minOpacity: 0.08, maxOpacity: 0.58, color: '#ddd6fe' },
  { top: '78%', left: '67%', size: 4, delay: 140, duration: 2600, minOpacity: 0.16, maxOpacity: 1, color: '#ffffff' },
  { top: '82%', left: '86%', size: 2, delay: 720, duration: 2100, minOpacity: 0.1, maxOpacity: 0.74, color: '#c7d2fe' },
  { top: '86%', left: '22%', size: 3, delay: 960, duration: 2300, minOpacity: 0.12, maxOpacity: 0.88, color: '#ffffff' },
  { top: '90%', left: '58%', size: 2, delay: 360, duration: 1800, minOpacity: 0.08, maxOpacity: 0.64, color: '#e0e7ff' },
  { top: '52%', left: '92%', size: 3, delay: 1280, duration: 2050, minOpacity: 0.14, maxOpacity: 0.82, color: '#ffffff' },
  { top: '33%', left: '96%', size: 2, delay: 580, duration: 1700, minOpacity: 0.1, maxOpacity: 0.66, color: '#ddd6fe' },
  { top: '64%', left: '3%', size: 2, delay: 1120, duration: 1950, minOpacity: 0.08, maxOpacity: 0.6, color: '#c7d2fe' },
  { top: '16%', left: '41%', size: 2, delay: 780, duration: 2200, minOpacity: 0.1, maxOpacity: 0.76, color: '#ffffff' },
  { top: '72%', left: '52%', size: 3, delay: 160, duration: 2500, minOpacity: 0.12, maxOpacity: 0.94, color: '#e0e7ff' },
  { top: '44%', left: '12%', size: 2, delay: 1240, duration: 1850, minOpacity: 0.08, maxOpacity: 0.56, color: '#ffffff' },
]

function TwinkleStar({ star, active }: { star: StarSpec; active: boolean }) {
  const opacity = useRef(new Animated.Value(star.minOpacity)).current

  useEffect(() => {
    if (!active) {
      opacity.setValue(star.minOpacity)
      return
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(star.delay),
        Animated.timing(opacity, {
          toValue: star.maxOpacity,
          duration: star.duration / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: star.minOpacity,
          duration: star.duration / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )

    animation.start()
    return () => animation.stop()
  }, [active, opacity, star.delay, star.duration, star.maxOpacity, star.minOpacity])

  const glow = star.size >= 3

  return (
    <Animated.View
      style={[
        styles.star,
        {
          top: star.top,
          left: star.left,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          backgroundColor: star.color,
          opacity,
          shadowColor: star.color,
          shadowOpacity: glow ? 0.95 : 0.55,
          shadowRadius: glow ? 6 : 3,
        },
      ]}
    />
  )
}

type SleepTimeStarfieldProps = {
  active?: boolean
}

export function SleepTimeStarfield({ active = true }: SleepTimeStarfieldProps) {
  return (
    <View style={styles.layer} pointerEvents="none">
      {STARFIELD.map((star) => (
        <TwinkleStar key={`${star.top}-${star.left}-${star.size}`} star={star} active={active} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
})
