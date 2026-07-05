import { useCallback, useRef } from 'react'
import { Pressable, type PressableProps } from 'react-native'

type LongPressableProps = PressableProps & {
  delayLongPress?: number
}

export function LongPressable({
  onPress,
  onLongPress,
  delayLongPress = 400,
  ...rest
}: LongPressableProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFiredRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handlePressIn = useCallback(() => {
    if (!onLongPress) return

    longPressFiredRef.current = false
    clearTimer()
    timerRef.current = setTimeout(() => {
      longPressFiredRef.current = true
      onLongPress?.()
    }, delayLongPress)
  }, [clearTimer, delayLongPress, onLongPress])

  const handlePressOut = useCallback(() => {
    clearTimer()
  }, [clearTimer])

  const handlePress = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      if (longPressFiredRef.current) {
        longPressFiredRef.current = false
        return
      }

      onPress?.(event)
    },
    [onPress],
  )

  return (
    <Pressable
      {...rest}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    />
  )
}
