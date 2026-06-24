import { Modal, ModalProps, Platform, StyleSheet, View } from 'react-native'
import { AndroidNavBarUnderlay } from './AndroidNavBarUnderlay'
import { colors } from '../theme/colors'

type AppModalProps = ModalProps & {
  navBarUnderlayColor?: string
}

export function AppModal({
  children,
  visible,
  navBarUnderlayColor = colors.background,
  transparent = true,
  statusBarTranslucent,
  navigationBarTranslucent,
  ...rest
}: AppModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={transparent}
      statusBarTranslucent={statusBarTranslucent ?? Platform.OS === 'android'}
      navigationBarTranslucent={navigationBarTranslucent ?? Platform.OS === 'android'}
      {...rest}
    >
      <View style={[styles.host, transparent && styles.hostTransparent]}>
        <View style={styles.content}>{children}</View>
        <AndroidNavBarUnderlay color={navBarUnderlayColor} />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hostTransparent: {
    backgroundColor: 'transparent',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
})
