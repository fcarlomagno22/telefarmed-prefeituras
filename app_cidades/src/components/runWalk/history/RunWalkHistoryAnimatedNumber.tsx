import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Text, type StyleProp, type TextStyle } from 'react-native'

type RunWalkHistoryAnimatedNumberProps = {
  value: number
  formatter: (value: number) => string
  style?: StyleProp<TextStyle>
  duration?: number
  animate?: boolean
  preserveFinal?: boolean
}

export function RunWalkHistoryAnimatedNumber({
  value,
  formatter,
  style,
  duration = 1400,
  animate = true,
  preserveFinal = true,
}: RunWalkHistoryAnimatedNumberProps) {
  const animated = useRef(new Animated.Value(0)).current
  const [display, setDisplay] = useState(preserveFinal ? value : 0)

  useEffect(() => {
    if (!animate) {
      animated.stopAnimation()

      if (preserveFinal) {
        animated.setValue(value)
        setDisplay(value)
        return
      }

      animated.setValue(0)
      setDisplay(0)
      return
    }

    animated.stopAnimation()
    animated.setValue(0)
    setDisplay(0)

    const animation = Animated.timing(animated, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    })

    const listenerId = animated.addListener(({ value: nextValue }) => {
      setDisplay(nextValue)
    })

    animation.start()

    return () => {
      animation.stop()
      animated.removeListener(listenerId)
    }
  }, [animate, animated, duration, preserveFinal, value])

  return <Text style={style}>{formatter(display)}</Text>
}
