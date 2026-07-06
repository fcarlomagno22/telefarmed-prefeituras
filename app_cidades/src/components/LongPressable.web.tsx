import { useCallback } from 'react'
import { type PressableProps, type ViewStyle } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'

type LongPressableProps = PressableProps & {
  delayLongPress?: number
}

export function LongPressable({
  onPress,
  onLongPress,
  delayLongPress = 400,
  style,
  ...rest
}: LongPressableProps) {
  const resolvedStyle = useCallback(
    (state: { pressed: boolean }) => {
      const baseStyle = typeof style === 'function' ? style(state) : style

      if (!onLongPress) {
        return baseStyle
      }

      return [
        baseStyle,
        {
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        } as ViewStyle,
      ]
    },
    [onLongPress, style],
  )

  const handleContextMenu = useCallback(
    (event: { preventDefault: () => void }) => {
      if (onLongPress) {
        event.preventDefault()
      }
    },
    [onLongPress],
  )

  return (
    <Pressable
      {...rest}
      style={resolvedStyle}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={onLongPress ? delayLongPress : undefined}
      cancelable={onLongPress ? false : undefined}
      // @ts-expect-error RN web context menu
      onContextMenu={handleContextMenu}
    />
  )
}
