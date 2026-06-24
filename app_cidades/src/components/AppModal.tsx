import { Modal, ModalProps, Platform, StyleSheet, View } from 'react-native'
import { colors } from '../theme/colors'

type AppModalProps = ModalProps & {
  /** Mantido por compatibilidade; a safe area inferior fica sempre transparente. */
  navBarUnderlayColor?: string
}

export function AppModal({
  children,
  visible,
  navBarUnderlayColor: _navBarUnderlayColor,
  transparent = true,
  statusBarTranslucent,
  navigationBarTranslucent,
  ...rest
}: AppModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={transparent}
      statusBarTranslucent={
        statusBarTranslucent ?? Platform.OS === 'android'
      }
      navigationBarTranslucent={navigationBarTranslucent ?? true}
      {...rest}
    >
      <View style={[styles.host, transparent && styles.hostTransparent]}>
        <View style={styles.content}>{children}</View>
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
