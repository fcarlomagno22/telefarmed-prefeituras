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
  return (
    <Pressable
      {...rest}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={onLongPress ? delayLongPress : undefined}
      cancelable={onLongPress ? false : undefined}
    />
  )
}
