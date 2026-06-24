import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'

type AndroidNavBarUnderlayProps = {
  color?: string
}

export function AndroidNavBarUnderlay({
  color = colors.background,
}: AndroidNavBarUnderlayProps) {
  const insets = useSafeAreaInsets()

  if (Platform.OS !== 'android' || insets.bottom <= 0) {
    return null
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.underlay, { height: insets.bottom, backgroundColor: color }]}
    />
  )
}

const styles = StyleSheet.create({
  underlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 10,
  },
})
